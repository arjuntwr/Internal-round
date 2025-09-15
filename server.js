// --- ROBUST API START ---
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { createPublicClient, createWalletClient, defineChain, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import QRCode from "qrcode";

// ---- App setup
const app = express();
app.disable("x-powered-by");

// Security headers
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  contentSecurityPolicy: false,
  hsts: { maxAge: 15552000, includeSubDomains: false, preload: false },
}));

// CORS (default restrict to localhost web dev or env override)
const ALLOW_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8080";
app.use(cors({ origin: [ALLOW_ORIGIN, "http://localhost:8081", "http://127.0.0.1:8080"], credentials: false }));

// Enforce allowed hosts
const ALLOW_HOSTS = (process.env.ALLOW_HOSTS || "localhost,127.0.0.1").split(",").map(s => s.trim().toLowerCase());
app.use((req, res, next) => {
  const host = String(req.headers.host || "").split(":")[0].toLowerCase();
  if (host && !ALLOW_HOSTS.includes(host)) {
    return res.status(403).json({ error: "Forbidden host" });
  }
  return next();
});

// Body parsing with limits
app.use(express.json({ limit: "64kb" }));
// Allow CORS preflight requests
// Express 5 doesn't support "*" path in router; handle all OPTIONS simply
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

// Invalid JSON body handling
app.use((err, _req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Malformed JSON" });
  }
  return next(err);
});

// ---- Helpers
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

function safeJson(res, data) {
  return res
    .type("application/json")
    .send(
      JSON.stringify(
        data,
        (_k, v) => (typeof v === "bigint" ? v.toString() : v)
      )
    );
}

function mapErrorToHttp(e) {
  const message = String(e?.shortMessage || e?.message || e);
  // Surface revert reasons if present
  if (e && e.cause && e.cause.name === "ContractFunctionRevertedError") {
    const reason = e.cause?.revert?.reason || e.cause?.reason || message;
    return { code: 400, body: { error: String(reason) } };
  }
  if (message.includes("Invalid address") || message.includes("invalid") && message.includes("address")) {
    return { code: 400, body: { error: message } };
  }
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("HTTP request failed")
  ) {
    return { code: 503, body: { error: "Node RPC unavailable", details: message } };
  }
  return { code: 500, body: { error: message } };
}

// ---- Chain & clients
const hardhatChain = defineChain({
  id: 31337,
  name: "Hardhat",
  network: "hardhat",
  rpcUrls: { default: { http: [RPC_URL] } },
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
});

const publicClient = createPublicClient({
  chain: hardhatChain,
  transport: http(RPC_URL, { timeout: 15_000 }),
});

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: hardhatChain,
  transport: http(RPC_URL, { timeout: 15_000 }),
});

// ---- Contract artifacts
const deployed = JSON.parse(
  fs.readFileSync("./ignition/deployments/chain-31337/deployed_addresses.json", "utf-8")
);
const contractAddress = deployed["SupplyChainModule#SupplyChain"];
const abi = JSON.parse(
  fs.readFileSync(
    "./ignition/deployments/chain-31337/artifacts/SupplyChainModule#SupplyChain.json",
    "utf-8"
  )
).abi;

// ---- Audit log setup
const auditDir = path.join(process.cwd(), "logs");
try { if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir); } catch {}
const auditPath = path.join(auditDir, "audit.log");
function audit(event, data) {
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + "\n";
    fs.appendFile(auditPath, line, () => {});
  } catch {}
}

// ---- Health endpoint
app.get("/health", async (_req, res) => {
  try {
    const chainId = await publicClient.getChainId();
    return safeJson(res, { ok: true, chainId, contractAddress });
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// Simple rate limits for write endpoints
const writeLimiter = rateLimit({ windowMs: 60_000, max: 30 });

// API key auth for write endpoints (company-level control)
const API_KEY = process.env.API_KEY || "dev-api-key";
function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || String(key) !== API_KEY) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  return next();
}

// ---- Add Produce
app.post("/produce", requireApiKey, writeLimiter, async (req, res) => {
  try {
    // Enforce JSON Content-Type
    if (!/^application\/json/i.test(req.headers["content-type"] || "")) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
    const { cropName, quantity, harvestDate } = req.body ?? {};

    if (typeof cropName !== "string" || cropName.trim().length === 0) {
      return res.status(400).json({ error: "Invalid cropName" });
    }
    const qtyNum = typeof quantity === "string" ? Number(quantity) : quantity;
    if (!Number.isFinite(qtyNum) || qtyNum < 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    if (typeof harvestDate !== "string" || harvestDate.trim().length === 0) {
      return res.status(400).json({ error: "Invalid harvestDate" });
    }

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "addProduce",
      args: [cropName.trim(), BigInt(qtyNum), harvestDate.trim()],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const nextId = await publicClient.readContract({
      address: contractAddress,
      abi,
      functionName: "nextBatchId",
    });

    const payload = {
      success: true,
      batchId: Number(nextId) - 1,
      transactionHash: hash,
      blockNumber: receipt.blockNumber == null ? null : Number(receipt.blockNumber),
      qrCodeUrl: `${req.protocol}://${req.get("host")}/qrcode/${Number(nextId) - 1}`,
    };
    audit("produce.add", { from: account.address, ...payload });
    return safeJson(res, payload);
  } catch (e) {
    console.error("/produce error:", e);
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});
// ---- QR Code endpoint
app.get("/qrcode/:id", async (req, res) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum) || idNum < 0) {
      return res.status(400).json({ error: "Invalid batch id" });
    }
    const appConsumerUrl = process.env.CONSUMER_URL || "http://localhost:8080/consumer";
    const url = `${appConsumerUrl}?batchId=${idNum}`;
    const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 256 });
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(svg);
  } catch (e) {
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// ---- Transfer Ownership
app.post("/transfer", requireApiKey, writeLimiter, async (req, res) => {
  try {
    if (!/^application\/json/i.test(req.headers["content-type"] || "")) {
      return res.status(415).json({ error: "Content-Type must be application/json" });
    }
    const { batchId, recipient, price } = req.body ?? {};

    const batchIdNum = typeof batchId === "string" ? Number(batchId) : batchId;
    if (!Number.isFinite(batchIdNum) || batchIdNum < 0) {
      return res.status(400).json({ error: "Invalid batchId" });
    }
    if (!isAddress(recipient)) {
      return res.status(400).json({ error: `Invalid recipient address: ${recipient}` });
    }
    const priceNum = typeof price === "string" ? Number(price) : price;
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    // Pre-check: ensure batch exists (farmer != address(0))
    try {
      const produceTuple = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "getProduce",
        args: [BigInt(batchIdNum)],
      });
      const farmerAddress = Array.isArray(produceTuple) ? produceTuple[3] : undefined;
      if (!farmerAddress || farmerAddress.toLowerCase() === "0x0000000000000000000000000000000000000000") {
        return res.status(404).json({ error: `Produce ${batchIdNum} not found` });
      }
    } catch (e) {
      const mapped = mapErrorToHttp(e);
      return res.status(mapped.code).json(mapped.body);
    }

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "transferOwnership",
      args: [BigInt(batchIdNum), recipient, BigInt(Math.floor(priceNum * 1e18))],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const payload = {
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber == null ? null : Number(receipt.blockNumber),
    };
    audit("produce.transfer", { from: account.address, batchId: batchIdNum, recipient, price: priceNum, ...payload });
    return safeJson(res, payload);
  } catch (e) {
    console.error("/transfer error:", e);
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// ---- Get Produce by batch id
app.get("/getProduce/:id", async (req, res) => {
  try {
    const idStr = req.params.id;
    const idNum = Number(idStr);
    if (!Number.isFinite(idNum) || idNum < 0) {
      return res.status(400).json({ error: "Invalid batch id" });
    }

    const produceAddedEvent = abi.find((x) => x.type === "event" && x.name === "ProduceAdded");
    const transferEvent = abi.find((x) => x.type === "event" && x.name === "OwnershipTransferred");

    const addedLogs = await publicClient.getLogs({
      address: contractAddress,
      events: [produceAddedEvent],
      fromBlock: 0n,
      toBlock: "latest",
    });

    const addedForId = addedLogs
      .map((l) => ({ ...l, args: l.args }))
      .filter((l) => l.args && l.args.batchId === BigInt(idNum));

    if (addedForId.length === 0) {
      return res.status(404).json({ error: "Produce not found" });
    }

    const { cropName, quantity, harvestDate, farmer } = addedForId[0].args;

    const transferLogs = await publicClient.getLogs({
      address: contractAddress,
      events: [transferEvent],
      fromBlock: 0n,
      toBlock: "latest",
    });

    const history = transferLogs
      .map((l) => ({ ...l, args: l.args }))
      .filter((l) => l.args && l.args.batchId === BigInt(idNum))
      .map((l) => ({
        from: l.args.from,
        to: l.args.to,
        price: Number(l.args.price) / 1e18,
        txHash: l.transactionHash,
      }));

    return safeJson(res, {
      cropName,
      quantity: Number(quantity),
      harvestDate,
      farmer,
      history,
    });
  } catch (e) {
    console.error("/getProduce/:id error:", e);
    const mapped = mapErrorToHttp(e);
    return res.status(mapped.code).json(mapped.body);
  }
});

// 404 handler
app.use((req, res) => {
  return res.status(404).json({ error: "Not found", path: req.path });
});

// Centralized error handler
// Note: Express 5 passes errors here
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const mapped = mapErrorToHttp(err);
  return res.status(mapped.code).json(mapped.body);
});

// ---- Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
// Graceful shutdown
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`Received ${sig}. Shutting down API.`);
    process.exit(0);
  });
}
// --- ROBUST API END ---