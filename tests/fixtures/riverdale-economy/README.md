# Vendored riverdale-economy goldens

These JSON files are byte-for-byte copies of the chain-accepted definitions/policies from the
`riverdale-economy` e2e green lane (origin: `ottochain` repo,
`e2e-test/examples/riverdale-economy/`). They are the acceptance oracle for the
`@ottochain/sdk/templates` builders: a template's output must deep-equal (and canonicalize
byte-identically to) the form the chain already accepts on the green lane.

Vendored here (rather than read from the sibling repo) so the SDK test suite is self-contained
and runs in CI without the metagraph repo checked out. If a golden changes upstream, re-copy it
and confirm the corresponding template still reproduces it.
