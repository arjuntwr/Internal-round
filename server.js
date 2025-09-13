// --- IMPROVED API START ---
// Imports and setup
import express from "express";
import cors from "cors";
import fs from "node:fs";
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const app = express();
app.use(cors());
app.use(express.json());

// Chain and client setup
const hardhatChain = defineChain({
  id: 31337,
  name: "Hardhat",
  network: "hardhat",
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
});

const publicClient = createPublicClient({ chain: hardhatChain, transport: http() });
const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
const walletClient = createWalletClient({ account, chain: hardhatChain, transport: http() });

// Load contract details
const deployed = JSON.parse(fs.readFileSync("./ignition/deployments/chain-31337/deployed_addresses.json", "utf-8"));
const contractAddress = deployed["SupplyChainModule#SupplyChain"];
const abi = JSON.parse(fs.readFileSync("./ignition/deployments/chain-31337/artifacts/SupplyChainModule#SupplyChain.json", "utf-8")).abi;

// --- Endpoint: Add Produce ---
app.post("/produce", async (req, res) => {
  try {
    const { cropName, quantity, harvestDate } = req.body;
    
    if (!cropName || !quantity || !harvestDate) {
      return res.status(400).json({ error: "Missing required fields: cropName, quantity, harvestDate" });
    }

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "addProduce",
      args: [cropName, BigInt(quantity), harvestDate],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const batchId = await publicClient.readContract({
      address: contractAddress,
      abi,
      functionName: "nextBatchId",
    });

    return res.json({ 
      success: true, 
      batchId: Number(batchId) - 1, 
      transactionHash: hash,
      blockNumber: receipt.blockNumber 
    });
  } catch (e) {
    console.error("/produce error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

// --- Endpoint: Transfer Ownership ---
app.post("/transfer", async (req, res) => {
  try {
    const { batchId, recipient, price } = req.body;
    
    if (!batchId || !recipient || !price) {
      return res.status(400).json({ error: "Missing required fields: batchId, recipient, price" });
    }

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "transferOwnership",
      args: [BigInt(batchId), recipient, BigInt(Math.floor(price * 1e18))],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return res.json({ 
      success: true, 
      transactionHash: hash,
      blockNumber: receipt.blockNumber 
    });
  } catch (e) {
    console.error("/transfer error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

// --- Endpoint: Get Produce Details ---
app.get("/getProduce/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Extract event ABIs
    const produceAddedEvent = abi.find((x) => x.type === "event" && x.name === "ProduceAdded");
    const transferEvent = abi.find((x) => x.type === "event" && x.name === "OwnershipTransferred");
    
    // Fetch metadata from ProduceAdded event
    const addedLogs = await publicClient.getLogs({ 
      address: contractAddress, 
      events: [produceAddedEvent], 
      fromBlock: 0n, 
      toBlock: "latest" 
    });
    
    const addedForId = addedLogs
      .map((l) => ({ ...l, args: l.args }))
      .filter((l) => l.args && l.args.batchId === BigInt(id));
      
    if (addedForId.length === 0) {
      return res.status(404).json({ error: "Produce not found" });
    }
    
    const { cropName, quantity, harvestDate, farmer } = addedForId[0].args;
    
    // Fetch transfer history
    const transferLogs = await publicClient.getLogs({ 
      address: contractAddress, 
      events: [transferEvent], 
      fromBlock: 0n, 
      toBlock: "latest" 
    });
    
    const history = transferLogs
      .map((l) => ({ ...l, args: l.args }))
      .filter((l) => l.args && l.args.batchId === BigInt(id))
      .map((l) => ({ 
        from: l.args.from, 
        to: l.args.to, 
        price: Number(l.args.price) / 1e18, 
        txHash: l.transactionHash 
      }));

    const payload = { 
      cropName, 
      quantity: Number(quantity), 
      harvestDate, 
      farmer, 
      history 
    };
    
    return res.type("application/json").send(JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
  } catch (e) {
    console.error("/getProduce/:id error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
// --- IMPROVED API END ---