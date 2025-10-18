import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  RewardInjected,
  RewardDistributed,
  RewardClaimed,
  RewardUpdated,
  RewardInitialized
} from "../generated/schema"
import {
  handleRewardInjected,
  handleRewardDistributed,
  handleRewardClaimed,
  handleRewardUpdated,
  handleInitialized
} from "../src/rewardDistributor"
import {
  createRewardInjectedEvent,
  createRewardDistributedEvent,
  createRewardClaimedEvent,
  createRewardUpdatedEvent,
  createRewardInitializedEvent
} from "./reward-distributor-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("RewardDistributor Event Tests", () => {
  afterAll(() => {
    clearStore()
  })

  describe("RewardInjected", () => {
    test("RewardInjected event creates and stores entity", () => {
      // Test data
      let amount = BigInt.fromI32(1000)
      let timestamp = BigInt.fromI32(1634567890)
      
      // Create and handle event
      let rewardInjectedEvent = createRewardInjectedEvent(amount, timestamp)
      handleRewardInjected(rewardInjectedEvent)

      // Assertions
      assert.entityCount("RewardInjected", 1)
      
      // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
      assert.fieldEquals(
        "RewardInjected",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "amount",
        "1000"
      )
      assert.fieldEquals(
        "RewardInjected",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "timestamp",
        "1634567890"
      )

      clearStore()
    })
  })

  describe("RewardDistributed", () => {
    test("RewardDistributed event creates and stores entity", () => {
      // Test data
      let amount = BigInt.fromI32(500)
      let newRewardPerToken = BigInt.fromI32(1000000)
      
      // Create and handle event
      let rewardDistributedEvent = createRewardDistributedEvent(amount, newRewardPerToken)
      handleRewardDistributed(rewardDistributedEvent)

      // Assertions
      assert.entityCount("RewardDistributed", 1)
      
      assert.fieldEquals(
        "RewardDistributed",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "amount",
        "500"
      )
      assert.fieldEquals(
        "RewardDistributed",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "newRewardPerToken",
        "1000000"
      )

      clearStore()
    })
  })

  describe("RewardClaimed", () => {
    test("RewardClaimed event creates and stores entity", () => {
      // Test data
      let user = Address.fromString("0x1234567890123456789012345678901234567890")
      let amount = BigInt.fromI32(250)
      
      // Create and handle event
      let rewardClaimedEvent = createRewardClaimedEvent(user, amount)
      handleRewardClaimed(rewardClaimedEvent)

      // Assertions
      assert.entityCount("RewardClaimed", 1)
      
      assert.fieldEquals(
        "RewardClaimed",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "user",
        "0x1234567890123456789012345678901234567890"
      )
      assert.fieldEquals(
        "RewardClaimed",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "amount",
        "250"
      )

      clearStore()
    })
  })

  describe("RewardUpdated", () => {
    test("RewardUpdated event creates and stores entity", () => {
      // Test data
      let user = Address.fromString("0x1234567890123456789012345678901234567890")
      let earned = BigInt.fromI32(750)
      
      // Create and handle event
      let rewardUpdatedEvent = createRewardUpdatedEvent(user, earned)
      handleRewardUpdated(rewardUpdatedEvent)

      // Assertions
      assert.entityCount("RewardUpdated", 1)
      
      assert.fieldEquals(
        "RewardUpdated",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "user",
        "0x1234567890123456789012345678901234567890"
      )
      assert.fieldEquals(
        "RewardUpdated",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "earned",
        "750"
      )

      clearStore()
    })
  })

  describe("RewardInitialized", () => {
    test("RewardInitialized event creates and stores entity", () => {
      // Test data
      let version = BigInt.fromI32(1)
      
      // Create and handle event
      let initializedEvent = createRewardInitializedEvent(version)
      handleInitialized(initializedEvent)

      // Assertions
      assert.entityCount("RewardInitialized", 1)
      
      assert.fieldEquals(
        "RewardInitialized",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "version",
        "1"
      )

      clearStore()
    })
  })

  describe("Multiple Events Integration", () => {
    test("Multiple reward events work together", () => {
      // Test data
      let amount = BigInt.fromI32(2000)
      let timestamp = BigInt.fromI32(1634567890)
      let newRewardPerToken = BigInt.fromI32(2000000)
      let user = Address.fromString("0x1234567890123456789012345678901234567890")
      let claimAmount = BigInt.fromI32(100)
      let earnedAmount = BigInt.fromI32(200)

      // Create and handle multiple events
      let rewardInjectedEvent = createRewardInjectedEvent(amount, timestamp)
      handleRewardInjected(rewardInjectedEvent)

      let rewardDistributedEvent = createRewardDistributedEvent(amount, newRewardPerToken)
      handleRewardDistributed(rewardDistributedEvent)

      let rewardClaimedEvent = createRewardClaimedEvent(user, claimAmount)
      handleRewardClaimed(rewardClaimedEvent)

      let rewardUpdatedEvent = createRewardUpdatedEvent(user, earnedAmount)
      handleRewardUpdated(rewardUpdatedEvent)

      // Assertions
      assert.entityCount("RewardInjected", 1)
      assert.entityCount("RewardDistributed", 1)
      assert.entityCount("RewardClaimed", 1)
      assert.entityCount("RewardUpdated", 1)

      // Verify specific field values
      assert.fieldEquals(
        "RewardInjected",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "amount",
        "2000"
      )
      assert.fieldEquals(
        "RewardDistributed",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "newRewardPerToken",
        "2000000"
      )

      clearStore()
    })
  })

  describe("Edge Cases", () => {
    test("Zero amounts are handled correctly", () => {
      // Test with zero amounts
      let zeroAmount = BigInt.fromI32(0)
      let timestamp = BigInt.fromI32(1634567890)
      
      let rewardInjectedEvent = createRewardInjectedEvent(zeroAmount, timestamp)
      handleRewardInjected(rewardInjectedEvent)

      assert.entityCount("RewardInjected", 1)
      assert.fieldEquals(
        "RewardInjected",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "amount",
        "0"
      )

      clearStore()
    })

    test("Large numbers are handled correctly", () => {
      // Test with large amounts (simulating real token amounts)
      let largeAmount = BigInt.fromString("1000000000000000000") // 1 * 10^18
      let timestamp = BigInt.fromI32(1634567890)
      
      let rewardInjectedEvent = createRewardInjectedEvent(largeAmount, timestamp)
      handleRewardInjected(rewardInjectedEvent)

      assert.entityCount("RewardInjected", 1)
      assert.fieldEquals(
        "RewardInjected",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
        "amount",
        "1000000000000000000"
      )

      clearStore()
    })
  })
})