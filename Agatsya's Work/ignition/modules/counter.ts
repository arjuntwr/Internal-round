import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CounterModule", (m) => {
  // Deploy Counter contract
  const counter = m.contract("Counter");

  // Call incBy with 5 after deployment
  m.call(counter, "incBy", [5]);

  return { counter };
});
