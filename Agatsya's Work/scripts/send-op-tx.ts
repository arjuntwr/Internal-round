import { network } from "hardhat";

async function main() {
  try {
    // Connect to Optimism (OP chain type)
    const { viem } = await network.connect({
      network: "hardhatOp", // make sure this is defined in hardhat.config.ts
      chainType: "op",
    });

    console.log("✅ Connected to OP chain");

    // Clients
    const publicClient = await viem.getPublicClient();
    const [senderClient] = await viem.getWalletClients();

    const sender = senderClient.account.address;

    console.log(`🔑 Sender address: ${sender}`);
    console.log("🔄 Preparing self-transaction (1 wei)");

    // Estimate L1 gas for Optimism
    const l1Gas = await publicClient.estimateL1Gas({
      account: sender,
      to: sender,
      value: 1n,
    });

    console.log(`⛽ Estimated L1 gas: ${l1Gas}`);

    // Send L2 transaction
    console.log("🚀 Sending transaction...");
    const txHash = await senderClient.sendTransaction({
      to: sender,
      value: 1n,
    });

    console.log(`📨 Transaction hash: ${txHash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log("✅ Transaction confirmed:", receipt);
  } catch (error) {
    console.error("❌ Error while sending transaction:", error);
    process.exit(1);
  }
}

// Run script
main().then(() => process.exit(0));
