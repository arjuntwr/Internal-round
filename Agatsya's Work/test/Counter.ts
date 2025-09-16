import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";

describe("Counter", () => {
  let viem: any;
  let publicClient: any;
  let counter: any;
  let deploymentBlockNumber: bigint;

  beforeEach(async () => {
    ({ viem } = await network.connect());
    publicClient = await viem.getPublicClient();

    counter = await viem.deployContract("Counter");
    deploymentBlockNumber = await publicClient.getBlockNumber();
  });

  it("should emit Increment event when calling inc()", async () => {
    await viem.assertions.emitWithArgs(
      counter.write.inc(),
      counter,
      "Increment",
      [1n]
    );

    const current = await counter.read.x();
    assert.strictEqual(current, 1n);
  });

  it("should keep the sum of Increment events equal to current value", async () => {
    // run a series of increments
    for (let i = 1n; i <= 10n; i++) {
      await counter.write.incBy([i]);
    }

    const events = await publicClient.getContractEvents({
      address: counter.address,
      abi: counter.abi,
      eventName: "Increment",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    const total = events.reduce((acc: bigint, e: any) => acc + e.args.by, 0n);

    const current = await counter.read.x();
    assert.strictEqual(total, current);
  });
});
