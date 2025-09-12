import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "node:fs";

async function main() {
	const deploymentPath = "./ignition/deployments/chain-31337/deployed_addresses.json";
	const deployed = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
	const supplyChainAddress = deployed["SupplyChainModule#SupplyChain"]; 

	const artifactPath = "./artifacts/contracts/SupplyChain.sol/SupplyChain.json";
	const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
	const abi = artifact.abi;

	const hardhatChain = defineChain({
		id: 31337,
		name: "Hardhat",
		network: "hardhat",
		rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	});

	const publicClient = createPublicClient({ chain: hardhatChain, transport: http("http://127.0.0.1:8545") });

	// Use first default account from local node (Hardhat default key)
	const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
	const walletClient = createWalletClient({ account, chain: hardhatChain, transport: http("http://127.0.0.1:8545") });

	// Add produce
	let hash = await walletClient.writeContract({
		address: supplyChainAddress,
		abi,
		functionName: "addProduce",
		args: ["Wheat", 100n, "10 Sept 2025"],
	});
	await publicClient.waitForTransactionReceipt({ hash });
	console.log("✅ Produce added");

	// Transfer ownership using second account
	const distributor = privateKeyToAccount("0x8b3a350cf5c34c9194ca3dd989eb1d6f5b0d591fa3e5fb87febc9a0f3ab8c06b");
	const distributorClient = createWalletClient({ account: distributor, chain: hardhatChain, transport: http("http://127.0.0.1:8545") });

	// Fund distributor with 1 ETH from the first account if needed
	const balance = await publicClient.getBalance({ address: distributor.address });
	if (balance === 0n) {
		const fundHash = await walletClient.sendTransaction({
			account,
			to: distributor.address,
			value: 1000000000000000000n, // 1 ETH
		});
		await publicClient.waitForTransactionReceipt({ hash: fundHash });
	}
	hash = await distributorClient.writeContract({
		address: supplyChainAddress,
		abi,
		functionName: "transferOwnership",
		args: [0n, distributor.address, 20n],
	});
	await publicClient.waitForTransactionReceipt({ hash });
	console.log("✅ Ownership transferred");
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
