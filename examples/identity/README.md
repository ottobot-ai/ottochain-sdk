# Identity Examples

Agent identity (DID) workflow examples using `@ottochain/sdk/apps/identity`.

## Examples

### `did-credential-workflow.ts`

Complete identity lifecycle:
1. Register agent DID
2. Add platform links (GitHub, Twitter, etc.)
3. Receive attestations from peers
4. Query reputation and state

```bash
# With a running cluster
METAGRAPH_URL=http://localhost:9300 BRIDGE_URL=http://localhost:3030 \
  npx tsx did-credential-workflow.ts

# Offline demo (shows workflow steps, skips cluster calls)
npx tsx did-credential-workflow.ts
```

## Key SDK Types

```typescript
import {
  getIdentityDefinition,   // State machine JSON definition
  AgentState,              // Enum: UNREGISTERED | REGISTERED | SUSPENDED | BANNED
  Platform,                // Enum: GITHUB | TWITTER | DISCORD | ...
  AgentIdentity,           // Proto type: agent record
  AttestationType,         // Enum: VOUCH | CHALLENGE | REVOKE
  Attestation,             // Proto type: attestation record
} from '@ottochain/sdk/apps/identity';
```

## State Machine Transitions

```
unregistered ──register──→ registered ──suspend──→ suspended ──reinstate──→ registered
registered   ──vouch──→    registered  (reputation++)
registered   ──challenge──→ registered (reputation--)
registered   ──ban──→      banned
```
