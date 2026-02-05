# OttoChain SDK Examples

Working examples demonstrating common SDK usage patterns.

## Prerequisites

```bash
# Install dependencies
npm install

# Set environment variables (optional, defaults to localhost)
export ML0_URL=http://localhost:9200
export DL1_URL=http://localhost:9400
```

## Examples

### 🔐 Wallet Management
Generate keypairs, import from private key, secure storage patterns.

```bash
npx ts-node examples/wallet-management.ts
```

### 🤖 Agent Registration
Register a new agent identity on OttoChain.

```bash
npx ts-node examples/agent-registration.ts
```

### 🔍 Query State
Fetch checkpoint data, list fibers, watch for changes.

```bash
npx ts-node examples/query-state.ts
```

## Running Examples

All examples can be run with ts-node:

```bash
# Install ts-node if needed
npm install -g ts-node typescript

# Run any example
npx ts-node examples/<example-name>.ts
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ML0_URL` | `http://localhost:9200` | Metagraph L0 endpoint |
| `DL1_URL` | `http://localhost:9400` | Data L1 endpoint |
| `CL1_URL` | `http://localhost:9300` | Currency L1 endpoint |

## Example Output

### wallet-management.ts
```
=== Generate New Keypair ===
Address: DAG4x8yF...
Public Key: 04a3b2c1...

=== Import from Private Key ===
Imported address: DAG4x8yF...
Addresses match: true
```

### agent-registration.ts
```
Generating keypair...
Agent address: DAG7kLmN...
Signing registration transaction...
Submitting to DL1...
Transaction hash: abc123...
Waiting for on-chain confirmation...
Fiber created: f47ac10b-58cc-4372-a567-0e02b2c3d479
Agent activated!
```
