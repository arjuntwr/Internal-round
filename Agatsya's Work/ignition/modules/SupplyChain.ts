// ignition/modules/SupplyChainModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SupplyChainModule = buildModule("SupplyChainModule", (m) => {
  // Example: first account as the deployer/owner
  const owner = m.getAccount(0);

  // Deploy the SupplyChain contract with constructor argument (owner)
  const supplyChain = m.contract("SupplyChain", [owner]);

  // 🔹 Optional: If your contract has an initializer, call it after deployment
  // m.call(supplyChain, "initialize", ["Initial Data"]);

  return { supplyChain };
});

export default SupplyChainModule;
