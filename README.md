# IDRC Indexer - Goldsky Subgraph

A production-ready subgraph indexer for the IDRC Protocol, built with The Graph Protocol and deployed on Goldsky infrastructure. This indexer tracks all blockchain events from the IDRC smart contracts on Base Sepolia testnet.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Indexed Contracts](#indexed-contracts)
- [GraphQL Schema](#graphql-schema)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Querying the Subgraph](#querying-the-subgraph)
- [Testing](#testing)
- [Local Development](#local-development)
- [Goldsky Integration](#goldsky-integration)

## Overview

The IDRC Indexer is a blockchain data indexing solution that:
- Listens to all events from IDRC Protocol contracts (Hub, IDRC Token, RewardDistributor)
- Processes and stores event data in a queryable GraphQL API
- Provides real-time and historical blockchain data access
- Integrates with Goldsky for production-grade indexing infrastructure
- Supports webhook notifications for real-time event processing

### Key Features

✅ **Comprehensive Event Coverage**
- All Hub contract events (subscriptions, redemptions, roles, etc.)
- All IDRC token events (transfers, minting, burning, approvals)
- All RewardDistributor events (rewards injection, distribution, claiming)

✅ **Production Infrastructure**
- Deployed on Goldsky's managed indexing platform
- Auto-pruning for efficient storage
- Real-time event processing
- High availability and reliability

✅ **Developer Experience**
- GraphQL API for flexible queries
- TypeScript-based event handlers
- Comprehensive testing with Matchstick
- Docker support for local development

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     IDRC Indexer Architecture                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│  Blockchain  │────────►│   Subgraph   │────────►│   GraphQL    │
│  (Base)      │ Events  │   Indexer    │  Store  │     API      │
│              │         │  (Goldsky)   │         │              │
└──────────────┘         └──────┬───────┘         └──────┬───────┘
                                │                        │
                         Event Handlers                  │
                                │                        │
                                ▼                        ▼
                         ┌──────────────┐        ┌──────────────┐
                         │              │        │              │
                         │  TypeScript  │        │   Webhook    │
                         │   Mappings   │        │   Endpoint   │
                         │              │        │   (Backend)  │
                         └──────────────┘        └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Data Flow                                │
└─────────────────────────────────────────────────────────────────┘

  Smart Contract          Subgraph Node          GraphQL Store
       │                       │                       │
       │───Event Emitted──────►│                       │
       │                       │                       │
       │                  ┌────▼────┐                  │
       │                  │ Detect  │                  │
       │                  │  Event  │                  │
       │                  └────┬────┘                  │
       │                       │                       │
       │                  ┌────▼────┐                  │
       │                  │  Parse  │                  │
       │                  │  Data   │                  │
       │                  └────┬────┘                  │
       │                       │                       │
       │                  ┌────▼────┐                  │
       │                  │ Handler │                  │
       │                  │Function │───────Save──────►│
       │                  └─────────┘                  │
       │                                               │
       │                                          ┌────▼────┐
       │                                          │GraphQL  │
       │                                          │Queryable│
       │                                          └─────────┘
```

## Indexed Contracts

### Contract Addresses (Base Sepolia)

| Contract | Address | Start Block |
|----------|---------|-------------|
| Hub | `0xf2CCA756D7dE98d54ed00697EA8Cf50D71ea0Dd1` | 32475130 |
| IDRC | `0xD3723bD07766d4993FBc936bEA1895227B556ea3` | 32475130 |
| RewardDistributor | `0xA77C8059B011Ad0DB426623d1c1B985E53fdb7db` | 32475150 |

### Network Configuration

The indexer is configured for **Base Sepolia** testnet, but can be easily adapted for mainnet deployment by updating contract addresses and network configuration in `subgraph.yaml` and `networks.json`.

## GraphQL Schema

### Hub Events

**RequestedSubscription** - User subscribes to bond tokens
```graphql
type RequestedSubscription @entity(immutable: true) {
  id: Bytes!
  user: Bytes!           # User wallet address
  amount: BigInt!        # IDRX amount deposited
  shares: BigInt!        # IDRC shares received
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

**RequestedRedemption** - User redeems bond tokens
```graphql
type RequestedRedemption @entity(immutable: true) {
  id: Bytes!
  user: Bytes!           # User wallet address
  shares: BigInt!        # IDRC shares burned
  amount: BigInt!        # IDRX amount received
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

**PriceUpdated** - Price oracle update
```graphql
type PriceUpdated @entity(immutable: true) {
  id: Bytes!
  priceId: BigInt!
  price: BigInt!
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

### IDRC Token Events

**MintedByHub** - Tokens minted by Hub
```graphql
type MintedByHub @entity(immutable: true) {
  id: Bytes!
  to: Bytes!             # Recipient address
  amount: BigInt!        # Amount minted
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

**BurnedByHub** - Tokens burned by Hub
```graphql
type BurnedByHub @entity(immutable: true) {
  id: Bytes!
  from: Bytes!           # Address tokens burned from
  amount: BigInt!        # Amount burned
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

**Transfer** - Standard ERC20 transfer
```graphql
type Transfer @entity(immutable: true) {
  id: Bytes!
  from: Bytes!
  to: Bytes!
  value: BigInt!
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

### RewardDistributor Events

**RewardInjected** - Admin injects yield rewards
```graphql
type RewardInjected @entity(immutable: true) {
  id: Bytes!
  amount: BigInt!        # Reward amount injected
  timestamp: BigInt!     # Injection timestamp
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

**RewardDistributed** - Rewards distributed to holders
```graphql
type RewardDistributed @entity(immutable: true) {
  id: Bytes!
  amount: BigInt!              # Total amount distributed
  newRewardPerToken: BigInt!   # New reward rate
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

**RewardClaimed** - User claims rewards
```graphql
type RewardClaimed @entity(immutable: true) {
  id: Bytes!
  user: Bytes!           # User claiming rewards
  amount: BigInt!        # Amount claimed
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

**RewardUpdated** - User reward balance updated
```graphql
type RewardUpdated @entity(immutable: true) {
  id: Bytes!
  user: Bytes!           # User address
  earned: BigInt!        # Total earned amount
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

### Administrative Events

All contracts also index:
- `Initialized` - Contract initialization
- `OwnershipTransferred` - Owner changes
- `RoleGranted` / `RoleRevoked` - Access control
- `Upgraded` - Contract upgrades
- `Paused` / `Unpaused` - Emergency controls

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Graph CLI installed globally: `npm install -g @graphprotocol/graph-cli`
- Goldsky CLI (for deployment): `npm install -g @goldsky/cli`
- Docker and Docker Compose (for local development)

### Installation

```bash
# Install dependencies
yarn install

# Generate TypeScript types from schema and ABIs
yarn codegen

# Build the subgraph
yarn build
```

## Development

### Project Structure

```
indexer/
├── abis/                           # Contract ABIs
│   ├── Hub.json
│   ├── IDRC.json
│   └── RewardDistributor.json
├── src/                            # Event handler mappings
│   ├── hub.ts                      # Hub event handlers
│   ├── idrc.ts                     # IDRC event handlers
│   └── rewardDistributor.ts        # Reward event handlers
├── tests/                          # Unit tests
│   ├── hub.test.ts
│   ├── idrc.test.ts
│   └── reward-distributor.test.ts
├── schema.graphql                  # GraphQL schema definition
├── subgraph.yaml                   # Subgraph manifest
├── networks.json                   # Network-specific config
├── docker-compose.yml              # Local Graph Node setup
├── package.json
└── README.md
```

### Adding New Events

1. **Update ABIs**: Place contract ABIs in `abis/` directory

2. **Update schema.graphql**: Define new entity types
```graphql
type NewEvent @entity(immutable: true) {
  id: Bytes!
  param1: BigInt!
  param2: Bytes!
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

3. **Update subgraph.yaml**: Add event handler
```yaml
eventHandlers:
  - event: NewEvent(uint256,address)
    handler: handleNewEvent
```

4. **Implement handler**: Create handler in `src/`
```typescript
export function handleNewEvent(event: NewEventEvent): void {
  let entity = new NewEvent(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.param1 = event.params.param1
  entity.param2 = event.params.param2
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
}
```

5. **Regenerate and rebuild**
```bash
yarn codegen
yarn build
```

## Deployment

### Goldsky Deployment

#### Setup Goldsky

```bash
# Install Goldsky CLI
npm install -g @goldsky/cli

# Login to Goldsky
goldsky login

# Verify authentication
goldsky auth status
```

#### Deploy to Goldsky

```bash
# Deploy development version
yarn deploy:goldsky

# Deploy production version
yarn deploy:goldsky:prod

# Check deployment status
yarn status

# View logs
yarn logs              # Development
yarn logs:prod         # Production
```

#### Goldsky Commands

```bash
# List all subgraphs
goldsky subgraph list

# Get subgraph details
goldsky subgraph get idrc-indexer/1.0.0

# View real-time logs
goldsky subgraph logs idrc-indexer/1.0.0 --follow

# Delete a deployment
goldsky subgraph delete idrc-indexer/1.0.0
```

### Network Updates

To deploy on a different network (e.g., mainnet):

1. Update `networks.json`:
```json
{
  "base-mainnet": {
    "Hub": {
      "address": "0x...",
      "startBlock": 12345678
    },
    "IDRC": {
      "address": "0x..."
    },
    "RewardDistributor": {
      "address": "0x...",
      "startBlock": 12345678
    }
  }
}
```

2. Update `subgraph.yaml` network field to `base-mainnet`

3. Deploy: `yarn deploy:goldsky:prod`

## Querying the Subgraph

### GraphQL Endpoint

Once deployed to Goldsky, you can query the subgraph at:
```
https://api.goldsky.com/api/public/project_<id>/subgraphs/idrc-indexer/1.0.0/gn
```

### Example Queries

**Get recent subscriptions:**
```graphql
query RecentSubscriptions {
  requestedSubscriptions(
    first: 10
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    user
    amount
    shares
    blockTimestamp
    transactionHash
  }
}
```

**Get user's total subscriptions:**
```graphql
query UserSubscriptions($user: Bytes!) {
  requestedSubscriptions(
    where: { user: $user }
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    amount
    shares
    blockTimestamp
  }
}
```

**Get reward claims:**
```graphql
query RewardClaims {
  rewardClaimeds(
    first: 20
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    user
    amount
    blockTimestamp
    transactionHash
  }
}
```

**Get user's reward history:**
```graphql
query UserRewards($user: Bytes!) {
  rewardClaimeds(where: { user: $user }) {
    amount
    blockTimestamp
  }
  rewardUpdateds(where: { user: $user }) {
    earned
    blockTimestamp
  }
}
```

**Track IDRC token transfers:**
```graphql
query IDRCTransfers {
  transfers(
    first: 50
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    from
    to
    value
    blockTimestamp
    transactionHash
  }
}
```

### Advanced Queries

**Aggregate user statistics:**
```graphql
query UserStats($user: Bytes!) {
  subscriptions: requestedSubscriptions(where: { user: $user }) {
    amount
  }
  redemptions: requestedRedemptions(where: { user: $user }) {
    amount
  }
  rewards: rewardClaimeds(where: { user: $user }) {
    amount
  }
}
```

**Filter by time range:**
```graphql
query EventsInTimeRange($startTime: BigInt!, $endTime: BigInt!) {
  requestedSubscriptions(
    where: { 
      blockTimestamp_gte: $startTime
      blockTimestamp_lte: $endTime
    }
  ) {
    user
    amount
    blockTimestamp
  }
}
```

## Testing

The subgraph uses [Matchstick](https://thegraph.com/docs/en/developer/matchstick/) for unit testing.

```bash
# Run all tests
yarn test

# Run specific test file
graph test tests/hub.test.ts
```

### Test Structure

Tests are located in the `tests/` directory:
- `hub-utils.ts` - Helper functions for Hub tests
- `hub.test.ts` - Hub event handler tests
- `idrc-utils.ts` - Helper functions for IDRC tests
- `idrc.test.ts` - IDRC event handler tests
- `reward-distributor-utils.ts` - Helper functions for Reward tests
- `reward-distributor.test.ts` - RewardDistributor tests

## Local Development

### Running Graph Node Locally

For local testing and development:

```bash
# Start local Graph Node, IPFS, and PostgreSQL
docker-compose up -d

# Create local subgraph
yarn create-local

# Deploy to local node
yarn deploy-local

# Query local endpoint
# GraphQL endpoint: http://localhost:8000/subgraphs/name/idrc

# Stop services
docker-compose down

# Remove local subgraph
yarn remove-local
```

### Local Docker Services

The `docker-compose.yml` sets up:
- **Graph Node**: Port 8000 (GraphQL), 8020 (JSON-RPC), 8030 (status), 8040 (metrics)
- **IPFS**: Port 5001
- **PostgreSQL**: Port 5432

## Goldsky Integration

### Webhook Configuration

Goldsky can send webhook notifications for indexed events to your backend:

1. **Configure webhook in Goldsky dashboard**
   - Select your subgraph
   - Add webhook endpoint: `https://your-backend.com/webhook/subscription`
   - Configure filters (e.g., only `RequestedSubscription` events)
   - Add authentication header

2. **Event payload example**:
```json
{
  "op": "INSERT",
  "data": {
    "new": {
      "id": "0x123...",
      "user": "0xabc...",
      "amount": "1000000",
      "shares": "1000000",
      "blockNumber": "12345678",
      "blockTimestamp": "1234567890",
      "transactionHash": "0xdef..."
    },
    "old": null
  },
  "entity": "RequestedSubscription",
  "data_source": "idrc-indexer/1.0.0"
}
```

### Monitoring

Goldsky provides built-in monitoring:
- **Sync status**: Check if indexer is caught up with chain
- **Error logs**: View indexing errors and warnings
- **Performance metrics**: Query latency, sync speed
- **Alerts**: Set up notifications for sync issues

Access monitoring at: `https://app.goldsky.com`

## Production Considerations

### Performance

- **Indexing Speed**: Goldsky provides high-performance indexing
- **Query Caching**: Results are cached for fast responses
- **Auto-pruning**: Historical data is pruned automatically (configurable)
- **Rate Limiting**: API has built-in rate limits (upgrade for higher limits)

### Best Practices

✅ **Entity Design**
- Use immutable entities for events (`@entity(immutable: true)`)
- Avoid complex relationships for better performance
- Use derived fields sparingly

✅ **Handler Optimization**
- Keep handlers simple and fast
- Avoid expensive computations
- Don't query external APIs in handlers

✅ **Schema Design**
- Index frequently queried fields
- Use appropriate data types (BigInt for token amounts)
- Include transaction metadata (hash, block, timestamp)

### Troubleshooting

**Indexing stalled:**
- Check Goldsky dashboard for errors
- Verify contract addresses and start blocks
- Review handler logs for exceptions

**Query errors:**
- Validate GraphQL syntax
- Check entity field names match schema
- Verify filters use correct field types

**Deployment fails:**
- Run `yarn build` locally first
- Check all ABIs are up to date
- Verify network configuration in `subgraph.yaml`

## Upgrading Contracts

When smart contracts are upgraded:

1. **Update ABIs**: Replace ABI files in `abis/` directory
2. **Update handlers**: Modify event handlers if event signatures changed
3. **Update schema**: Add new entity types if needed
4. **Test locally**: Deploy to local Graph Node and test
5. **Deploy new version**: Use new version number for deployment

```bash
# Deploy with new version
goldsky subgraph deploy idrc-indexer/1.1.0 --path .
```

## Resources

- **The Graph Documentation**: https://thegraph.com/docs
- **Goldsky Documentation**: https://docs.goldsky.com
- **AssemblyScript**: https://www.assemblyscript.org/
- **GraphQL**: https://graphql.org/learn/

## License

UNLICENSED - Private/Proprietary Code

## Support

For technical support or questions about the indexer:
- Check Goldsky dashboard for indexing status
- Review handler logs for errors
- Contact development team for deployment issues

---

**Built with The Graph Protocol** | **Deployed on Goldsky Infrastructure**
