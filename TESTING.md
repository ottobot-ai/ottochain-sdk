# Testing Guide — ottochain-sdk

## Test Runner

**Jest** (v29) with `ts-jest` transformer. Tests live in `tests/`.

```bash
npm test            # Run all tests
npm run test:coverage  # With coverage report (enforces 50% threshold)
```

## Flaky Test Detection

Jest is configured with `retryTimes: 2` in `jest.config.js`. Any test that fails
will be retried up to 2 additional times before being reported as a failure. This
reduces false-negative CI failures caused by timing-sensitive or async tests.

**Behavior:**
- A test is only marked FAILED if it fails on all 3 attempts (original + 2 retries)
- Retried tests appear in the output with a note: `"Test has been retried N times"`
- Coverage collection uses the final (passing or failing) run

## Known Flaky Suites

| Suite | Reason | Retry count |
|-------|--------|-------------|
| `subscribe-fiber-state.test.ts` | setTimeout recursion polling — timing-sensitive | 2 |
| `agent-profile.test.ts` | In-memory async state transitions | 2 (via global config) |

If you discover a new flaky test pattern:
1. Add it to the table above with the reason
2. Consider using `jest.retryTimes(N)` in the specific test file for targeted retries
3. Open a GitHub Issue with label `flaky-test` and tag `@work` on the Trello board

## Coverage Requirements

Global threshold (branches/functions/lines/statements): **50%**

Run locally before pushing:
```bash
npm run test:coverage
```

## Debugging Flaky Tests

```bash
# Run a specific test file repeatedly to reproduce flakiness
for i in {1..10}; do npm test -- tests/subscribe-fiber-state.test.ts; done

# Run with verbose output
npm test -- --verbose tests/subscribe-fiber-state.test.ts
```
