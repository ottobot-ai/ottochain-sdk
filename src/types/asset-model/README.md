# Producer-Validator Framework

The Producer-Validator Framework provides a foundational architecture for building secure, decentralized asset management systems on OttoChain. It implements clean separation between data production and governance validation to eliminate double-signing security risks.

## Architecture Overview

### Core Principle: Separation of Concerns

The framework enforces a strict separation between two fundamental roles:

- **Producers**: Create, maintain, and update data but cannot unilaterally validate their own transactions
- **Validators**: Govern and validate state transitions with cryptographic authority

This separation eliminates the security risk where a single entity can both produce data AND validate its own transactions, which could lead to unauthorized state changes.

### Key Components

1. **Role Definitions**: Clear interfaces for Producers and Validators
2. **Relationship Management**: Formal contracts between producers and validators  
3. **Validation Workflows**: Standardized request/response patterns
4. **Multi-Party Coordination**: Complex scenarios requiring multiple approvals
5. **OttoChain Integration**: Seamless integration with fiber system and JSON Logic VM

## Producer Role

Producers are responsible for:
- Creating new assets and data
- Maintaining and updating existing assets
- Proposing state transitions
- Providing accurate data and metadata

Producers **CANNOT**:
- Unilaterally validate their own transactions
- Approve state transitions without validator consent
- Override governance decisions
- Access validator-only operations

### Producer Capabilities

Producers register with specific capabilities:
- `asset_creation`: Can create new assets
- `asset_modification`: Can update existing assets  
- `asset_transfer`: Can initiate ownership transfers
- `state_management`: Can propose lifecycle state changes
- `asset_destruction`: Can initiate asset burning/destruction

### Producer Registration

```typescript
import { ProducerRegistrationRequest } from '@ottochain/sdk/types/asset-model';

const registration: ProducerRegistrationRequest = {
  producerId: 'producer-001',
  address: '0x1234...', 
  capabilities: ['asset_creation', 'asset_modification'],
  bondAmount: 100,  // Economic stake
  termsHash: 'hash-of-governance-terms',
  signature: 'cryptographic-signature'
};
```

## Validator Role

Validators are responsible for:
- Reviewing producer requests
- Applying governance rules and policies
- Approving or rejecting state transitions
- Maintaining system integrity
- Slashing malicious producers

Validators have:
- **Governance Domains**: Specific areas of authority (e.g., 'asset_management', 'compliance')
- **Authority Levels**: Numeric level (0-100) indicating validation power
- **Economic Stake**: Bond ensuring good behavior

### Validator Registration

```typescript
import { ValidatorRegistrationRequest } from '@ottochain/sdk/types/asset-model';

const registration: ValidatorRegistrationRequest = {
  validatorId: 'validator-001',
  address: '0x5678...',
  governanceDomains: ['asset_management', 'compliance'],
  stake: 5000,  // Higher stake = more authority
  requestedAuthorityLevel: 50,
  termsHash: 'hash-of-validator-terms', 
  signature: 'validator-signature'
};
```

## Validation Workflows

The framework provides standardized workflow patterns for common governance scenarios.

### Basic Validation Flow

1. **Producer Request**: Producer submits validation request
2. **Validator Review**: Validator evaluates against rules
3. **Decision**: Validator approves, rejects, or requests modification
4. **Execution**: If approved, state transition occurs

```typescript
import { ValidationRequest, ValidationResponse, ValidationDecision } from '@ottochain/sdk/types/asset-model';

// Producer submits request
const request: ValidationRequest = {
  id: 'req-001',
  producerId: 'producer-001', 
  validatorIds: ['validator-001'],
  assetId: 'asset-123',
  validationType: 'asset_transfer',
  payload: { to: '0x9abc...', amount: 100 },
  requestedAt: new Date().toISOString(),
  expiresAt: expiryTimestamp,
  signature: 'producer-signature'
};

// Validator responds
const response: ValidationResponse = {
  requestId: 'req-001',
  validatorId: 'validator-001', 
  decision: ValidationDecision.APPROVED,
  reason: 'Transfer meets all compliance requirements',
  rulesApplied: ['transfer_limit_check', 'kyc_verification'],
  respondedAt: new Date().toISOString(),
  signature: 'validator-signature'
};
```

### Workflow Templates

The framework includes predefined templates for common patterns:

- **Simple Asset Creation**: Basic creation with single validator approval
- **Multi-Party Transfer**: Complex transfers requiring multiple validators
- **Asset State Transition**: Lifecycle state changes
- **High Value Operations**: Enhanced workflows for valuable assets

```typescript
import { SIMPLE_ASSET_CREATION_TEMPLATE, WorkflowBuilder } from '@ottochain/sdk/types/asset-model';

// Use predefined template
const template = SIMPLE_ASSET_CREATION_TEMPLATE;

// Or build custom workflow
const customTemplate = new WorkflowBuilder('custom_workflow', 'Custom Asset Workflow')
  .description('Custom workflow for special asset type')
  .requiresProducerCapabilities(['asset_creation', 'special_handling'])
  .requiresValidatorDomains(['asset_management', 'special_compliance'])
  .minValidatorAuthority(25)
  .defaultTimeout(7200) // 2 hours
  .build();
```

## Multi-Party Coordination

For complex scenarios requiring multiple participants:

```typescript  
import { MultiPartyCoordination, CoordinationStatus } from '@ottochain/sdk/types/asset-model';

const coordination: MultiPartyCoordination = {
  id: 'coord-001',
  assetId: 'high-value-asset-456', 
  requiredProducers: ['producer-001'],
  requiredValidators: ['validator-001', 'validator-002', 'validator-003'],
  coordinationType: 'high_value_transfer',
  approvals: [], // Filled as approvals come in
  status: CoordinationStatus.PENDING,
  createdAt: new Date().toISOString(),
  deadline: deadlineTimestamp
};
```

## Producer-Validator Relationships

Formal relationships define the terms of collaboration:

```typescript
import { ProducerValidatorRelationship, RelationshipType } from '@ottochain/sdk/types/asset-model';

const relationship: ProducerValidatorRelationship = {
  producerId: 'producer-001',
  validatorId: 'validator-001', 
  relationshipType: RelationshipType.DELEGATED,
  permissions: ['action:create_asset', 'action:update_asset'],
  establishedAt: new Date().toISOString(),
  expiresAt: null, // Permanent relationship
  termsHash: 'hash-of-relationship-terms'
};
```

### Relationship Types

- **REGISTERED**: Basic producer under validator governance
- **DELEGATED**: Producer has limited authority delegation  
- **COORDINATED**: Multi-party coordination relationship
- **SUSPENDED**: Temporarily suspended (can be restored)
- **TERMINATED**: Permanently ended relationship

## Integration with OttoChain

### Fiber Integration

The framework integrates seamlessly with OttoChain's fiber system:

```typescript
import { AssetFiberState, AssetFiberIntegration } from '@ottochain/sdk/types/asset-model';

// Initialize framework for a fiber
const integration = AssetFiberIntegration.initializeFramework(
  'fiber-123',
  DEFAULT_INTEGRATION_CONFIG
);

// Asset fiber maintains producer-validator state
const fiberState: AssetFiberState = {
  fiberId: 'fiber-123',
  state: currentFiberState,
  sequence: 42,
  producers: ['producer-001', 'producer-002'],
  validators: ['validator-001'],
  relationships: [relationship],
  activeValidations: [validationRequest],
  // ... additional asset-specific state
};
```

### JSON Logic Integration

Validation rules use JSON Logic for declarative business logic:

```typescript
import { ValidationRule } from '@ottochain/sdk/types/asset-model';

const transferLimitRule: ValidationRule = {
  id: 'transfer_limit_rule',
  name: 'Transfer Limit Check',
  rule: {
    "<=": [
      {"var": "payload.amount"},
      {"var": "producer.dailyLimit"}
    ]
  },
  description: 'Ensures transfer amount does not exceed daily limit',
  category: 'compliance',
  version: '1.0.0'
};
```

### State Machine Integration

Assets follow formal state machines with JSON Logic guards:

```typescript
import { AssetStateMachine, AssetStateTransition } from '@ottochain/sdk/types/asset-model';

const assetLifecycle: AssetStateMachine = {
  id: 'basic_asset_lifecycle',
  assetType: 'standard_token',
  states: [
    { id: 'created', name: 'Created', description: 'Asset exists but not active' },
    { id: 'active', name: 'Active', description: 'Asset can be transferred' },
    { id: 'locked', name: 'Locked', description: 'Asset temporarily frozen' },
    { id: 'burned', name: 'Burned', description: 'Asset permanently destroyed' }
  ],
  transitions: [
    {
      id: 'activate',
      fromState: 'created', 
      toState: 'active',
      trigger: 'activation_request',
      guards: [{ ">=": [{"var": "validator.authorityLevel"}, 10] }],
      effects: [{ "log": "Asset activated" }],
      requiredAuthorityLevel: 10,
      requiredCapabilities: ['state_management']
    }
  ],
  initialState: 'created',
  terminalStates: ['burned']
};
```

## 16-Type Token Behavior Matrix

Assets can be configured with a 4-boolean behavior matrix:

- **Transferable (T)**: Can tokens be transferred between accounts?
- **Expendable (E)**: Are tokens consumed on use?  
- **Replicable (R)**: Can tokens be duplicated?
- **Verifiable (V)**: Can authenticity be cryptographically proven?

This creates 16 distinct token types (2^4 = 16 combinations), each with specific behavior patterns:

```typescript
import { AssetBehaviorConfig } from '@ottochain/sdk/types/asset-model';

// TERV = 1101 = Transferable, Expendable, Replicable, Verifiable
// Example: Game tokens that can be traded, consumed, duplicated in-game, and verified
const gameTokenBehavior: AssetBehaviorConfig = {
  transferable: true,   // T=1: Can be traded between players
  expendable: true,     // E=1: Consumed when used (health potions, ammo) 
  replicable: true,     // R=1: Game can create more (not scarce)
  verifiable: true,     // V=1: Cryptographically authentic
  behaviorRules: {
    maxDuplicationRate: 1000,  // per day
    consumptionEffects: ['health_increase', 'mana_restore']
  }
};

// TERV = 1010 = Non-transferable, Expendable, Non-replicable, Verifiable  
// Example: Personal credentials/certificates
const credentialBehavior: AssetBehaviorConfig = {
  transferable: false,  // T=0: Bound to specific person
  expendable: true,     // E=1: Single-use verification
  replicable: false,    // R=0: Cannot be duplicated
  verifiable: true,     // V=1: Cryptographically provable
  behaviorRules: {
    bindingAddress: 'owner_address',
    expirationPolicy: 'time_based'
  }
};
```

## Security Considerations

### Double-Signing Prevention

The framework prevents double-signing attacks by:
1. **Role Separation**: Producers cannot validate their own transactions
2. **Cryptographic Signatures**: All requests and responses are signed
3. **Relationship Contracts**: Formal terms define authority boundaries
4. **Multi-Party Coordination**: High-value operations require multiple validators

### Economic Incentives  

- **Producer Bonds**: Economic stake ensuring good behavior
- **Validator Stakes**: Larger stakes for greater authority
- **Reputation System**: Track record affects future opportunities
- **Slashing Mechanisms**: Economic penalties for malicious behavior

### Authority Delegation

Validators can delegate limited authority to trusted producers:

```typescript
import { DelegationRequest } from '@ottochain/sdk/types/asset-model';

const delegation: DelegationRequest = {
  validatorId: 'validator-001',
  producerId: 'producer-001',
  delegatedPermissions: ['action:create_asset'],
  scope: {
    'asset_types': ['standard_token'],
    'max_value': ['1000']
  },
  duration: 86400, // 24 hours
  conditions: ['reputation_above_50', 'within_business_hours'],
  signature: 'validator-signature'
};
```

## Monitoring and Metrics

The framework provides comprehensive monitoring:

```typescript
import { WorkflowMetrics } from '@ottochain/sdk/types/asset-model';

// Example metrics
const metrics: WorkflowMetrics = {
  templateId: 'simple_asset_creation', 
  totalExecutions: 1000,
  successfulCompletions: 950,
  averageExecutionTime: 1800, // 30 minutes
  timeoutRate: 0.02, // 2%
  commonFailureReasons: [
    'insufficient_validator_authority',
    'validation_timeout',
    'rule_violation'
  ],
  calculatedAt: new Date().toISOString()
};
```

## Best Practices

### For Producers
1. **Capability Registration**: Only register capabilities you can fulfill
2. **Economic Bonding**: Stake sufficient bond for your operation scale  
3. **Request Clarity**: Provide clear, complete validation requests
4. **Compliance**: Follow validator guidance and governance rules

### For Validators
1. **Domain Expertise**: Only validate in your areas of competence
2. **Economic Stake**: Maintain stake proportional to your authority
3. **Response Time**: Respond to validation requests promptly
4. **Transparency**: Provide clear reasons for decisions

### For System Designers
1. **Workflow Templates**: Use predefined templates where possible
2. **Authority Levels**: Set appropriate minimum authority requirements
3. **Timeout Configuration**: Configure reasonable validation timeouts
4. **Multi-Party Thresholds**: Require multiple validators for high-value operations

## Examples

See the `examples/` directory for complete implementation examples:

- `basic-asset-creation/`: Simple asset creation workflow
- `multi-party-transfer/`: Complex transfer requiring multiple approvals
- `delegation-authority/`: Authority delegation patterns
- `state-machine-integration/`: Asset lifecycle state machines
- `16-type-matrix/`: Examples of all 16 token behavior types

## Further Reading

- [JSON Logic Guide](../../../JSONLOGIC-GUIDE.md) - Business rule definitions
- [OttoChain Fiber System](../../README.md) - Core architecture
- [Asset Model Specification](./SPECIFICATION.md) - Detailed technical spec
- [Security Analysis](./SECURITY.md) - Threat model and mitigations