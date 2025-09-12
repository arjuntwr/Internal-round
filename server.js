import express from "express";
import cors from "cors";
import fs from "node:fs";
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const app = express();
app.use(cors());
app.use(express.json());

const hardhatChain = defineChain({
	id: 31337,
	name: "Hardhat",
	network: "hardhat",
	rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
});

const publicClient = createPublicClient({ chain: hardhatChain, transport: http("http://127.0.0.1:8545") });
const owner = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
const walletClient = createWalletClient({ account: owner, chain: hardhatChain, transport: http("http://127.0.0.1:8545") });

const deployed = JSON.parse(fs.readFileSync("./ignition/deployments/chain-31337/deployed_addresses.json", "utf-8"));
const contractAddress = deployed["SupplyChainModule#SupplyChain"];
const abi = JSON.parse(fs.readFileSync("./artifacts/contracts/SupplyChain.sol/SupplyChain.json", "utf-8")).abi;

app.post("/produce", async (req, res) => {
	try {
		const { cropName, quantity, harvestDate } = req.body;
		if (!cropName || quantity == null || !harvestDate) return res.status(400).json({ error: "Missing fields" });
		const hash = await walletClient.writeContract({ address: contractAddress, abi, functionName: "addProduce", args: [String(cropName), BigInt(quantity), String(harvestDate)] });
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		return res.json({ txHash: hash, status: receipt.status });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: String(e) });
	}
});

app.post("/transfer", async (req, res) => {
	try {
		const { batchId, to, price } = req.body;
		if (batchId == null || !to || price == null) return res.status(400).json({ error: "Missing fields" });
		const hash = await walletClient.writeContract({ address: contractAddress, abi, functionName: "transferOwnership", args: [BigInt(batchId), to, BigInt(price)] });
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		return res.json({ txHash: hash, status: receipt.status });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: String(e) });
	}
});

	app.get("/getProduce/:id", async (req, res) => {
	try {
		const id = BigInt(req.params.id);

		// Extract event ABIs
		const produceAddedEvent = abi.find((x) => x.type === "event" && x.name === "ProduceAdded");
		const transferEvent = abi.find((x) => x.type === "event" && x.name === "OwnershipTransferred");

		// Fetch metadata from ProduceAdded event
		const addedLogs = await publicClient.getLogs({ address: contractAddress, events: [produceAddedEvent], fromBlock: 0n, toBlock: "latest" });
		const addedForId = addedLogs.map((l) => ({ ...l, args: l.args })).filter((l) => l.args && l.args.batchId === id);
		if (addedForId.length === 0) return res.status(404).json({ error: "Produce not found" });
		const { cropName, quantity, harvestDate, farmer } = addedForId[0].args;

		// Fetch transfer history
		const transferLogs = await publicClient.getLogs({ address: contractAddress, events: [transferEvent], fromBlock: 0n, toBlock: "latest" });
		const history = transferLogs
			.map((l) => ({ ...l, args: l.args }))
			.filter((l) => l.args && l.args.batchId === id)
			.map((l) => ({ from: l.args.from, to: l.args.to, price: Number(l.args.price), txHash: l.transactionHash }));

		const payload = { cropName, quantity: Number(quantity), harvestDate, farmer, history };
		return res
			.type("application/json")
			.send(JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: String(e) });
	}
});

import QRCode from "qrcode";
app.get("/qr/:id", async (req, res) => {
	try {
		const id = req.params.id;
		const url = `https://example.com/produce/${id}`;
		const png = await QRCode.toBuffer(url, { type: "png", width: 256, margin: 1 });
		res.setHeader("Content-Type", "image/png");
		return res.send(png);
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: String(e) });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`API server running on http://localhost:${PORT}`);
});
