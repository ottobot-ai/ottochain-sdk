# Changelog

## [1.5.0](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.4.2...v1.5.0) (2026-03-18)


### Features

* **normalize:** add participants to CreateStateMachine wire format ([#122](https://github.com/ottobot-ai/ottochain-sdk/issues/122)) ([032a1ca](https://github.com/ottobot-ai/ottochain-sdk/commit/032a1ca1bff829ffcc83fdcd1c915209f098f52d))


### Bug Fixes

* add prepare script so dist/ builds on GitHub install ([#120](https://github.com/ottobot-ai/ottochain-sdk/issues/120)) ([ab2a897](https://github.com/ottobot-ai/ottochain-sdk/commit/ab2a8977c24ee00352ba7306b1b72f567adc91fb))
* **normalize:** use effect+dependencies fields in normalizeTransition ([#124](https://github.com/ottobot-ai/ottochain-sdk/issues/124)) ([94296d4](https://github.com/ottobot-ai/ottochain-sdk/commit/94296d4413856bff88eb7092d2cc9c6b03b7e5b6))

## [1.4.2](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.4.1...v1.4.2) (2026-03-13)


### Bug Fixes

* **build:** emit proper ESM in dist/esm ([#111](https://github.com/ottobot-ai/ottochain-sdk/issues/111)) ([50bbff1](https://github.com/ottobot-ai/ottochain-sdk/commit/50bbff1da5468393761e6a8af6847c72373fa7fe))

## [1.4.1](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.4.0...v1.4.1) (2026-03-13)


### Bug Fixes

* remove pnpm-lock.yaml, add to .gitignore ([#107](https://github.com/ottobot-ai/ottochain-sdk/issues/107)) ([e686ea9](https://github.com/ottobot-ai/ottochain-sdk/commit/e686ea93de6ee21372a8a8a1605d3b6d2e5e25f7))

## [1.4.0](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.3.0...v1.4.0) (2026-03-11)


### Features

* dispatch SDK bump PRs to consumer repos on release ([#103](https://github.com/ottobot-ai/ottochain-sdk/issues/103)) ([ad67192](https://github.com/ottobot-ai/ottochain-sdk/commit/ad67192c220d93a4ad2d440a57aae7cd10f1d52c))

## [1.3.0](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.2.0...v1.3.0) (2026-03-05)


### Features

* **examples:** add domain-specific workflow examples ([#96](https://github.com/ottobot-ai/ottochain-sdk/issues/96)) ([3f67716](https://github.com/ottobot-ai/ottochain-sdk/commit/3f6771651a021af8d2b7d97eb0ceaf6753d43e41))
* SDK transaction helpers for client-side signing (self-signed mode) ([#93](https://github.com/ottobot-ai/ottochain-sdk/issues/93)) ([4c9afca](https://github.com/ottobot-ai/ottochain-sdk/commit/4c9afcaf3fe94ce16b1cf21ae0237254a11fde83))

## [1.2.0](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.1.1...v1.2.0) (2026-03-01)


### Features

* add transaction helpers for self-signed mode ([#85](https://github.com/ottobot-ai/ottochain-sdk/issues/85)) ([a60f9a2](https://github.com/ottobot-ai/ottochain-sdk/commit/a60f9a216770f647776c7b27d532795d2063ee08))


### Bug Fixes

* **ci:** trigger CI on develop-targeting PRs ([#86](https://github.com/ottobot-ai/ottochain-sdk/issues/86)) ([3ae11d4](https://github.com/ottobot-ai/ottochain-sdk/commit/3ae11d483e278228a33a07122851e01c5273f64b))

## [1.1.1](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.1.0...v1.1.1) (2026-02-26)


### Bug Fixes

* publish StateId schema refactor as patch release ([#81](https://github.com/ottobot-ai/ottochain-sdk/issues/81)) ([255a808](https://github.com/ottobot-ai/ottochain-sdk/commit/255a808d84e2427ce35b08a7d7f72bf081a43136))

## [1.1.0](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.0.3...v1.1.0) (2026-02-26)


### Features

* **sdk:** subscribeFiberState + waitForState on MetagraphClient ([#44](https://github.com/ottobot-ai/ottochain-sdk/issues/44)) ([14c3ec4](https://github.com/ottobot-ai/ottochain-sdk/commit/14c3ec46df5edf5ba076e7450493ce1774f3f879))
* ts-proto Phase 1 cleanup ([#52](https://github.com/ottobot-ai/ottochain-sdk/issues/52)) ([30f8d33](https://github.com/ottobot-ai/ottochain-sdk/commit/30f8d335949250f7f02b6e5ed89072af1aa6aceb))


### Bug Fixes

* remove dist/ from git, fix zod 4 z.record() API change ([#76](https://github.com/ottobot-ai/ottochain-sdk/issues/76)) ([b5a3687](https://github.com/ottobot-ai/ottochain-sdk/commit/b5a3687c1d716e1f5f19c4606b1b64ad7e80a56f))

## [1.0.3](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.0.2...v1.0.3) (2026-02-23)


### Bug Fixes

* remove emits from transition definitions ([#50](https://github.com/ottobot-ai/ottochain-sdk/issues/50)) ([c2ab539](https://github.com/ottobot-ai/ottochain-sdk/commit/c2ab5390ec73380dcf686013a3e305522973cac1))

## [1.0.2](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.0.1...v1.0.2) (2026-02-23)


### Bug Fixes

* **docs:** apply [@research](https://github.com/research) corrections to token behavior matrix spec ([dbf9ea3](https://github.com/ottobot-ai/ottochain-sdk/commit/dbf9ea3bcd0aa8e679b0147bd3a010249bb8e7b0))
* move crossReferences and emits into metadata namespace ([#42](https://github.com/ottobot-ai/ottochain-sdk/issues/42)) ([bb9fd02](https://github.com/ottobot-ai/ottochain-sdk/commit/bb9fd02adc54a28e940eee3a0bc2eb525288479f))

## [1.0.1](https://github.com/ottobot-ai/ottochain-sdk/compare/v1.0.0...v1.0.1) (2026-02-13)


### Bug Fixes

* use $epochProgress instead of $timestamp in market guards ([#35](https://github.com/ottobot-ai/ottochain-sdk/issues/35)) ([a1e56b8](https://github.com/ottobot-ai/ottochain-sdk/commit/a1e56b81a6f72c3fd8819d5570c3e31322300e86))
* use RELEASE_TOKEN for release-please to trigger CI ([#33](https://github.com/ottobot-ai/ottochain-sdk/issues/33)) ([86fd438](https://github.com/ottobot-ai/ottochain-sdk/commit/86fd43873a488bceae0ddc9a615b5a15ad95e0d5))

## 1.0.0 (2026-02-10)


### ⚠ BREAKING CHANGES

* Remove wrapper message types (Address, FiberOrdinal, etc.)
* Remove hand-written types.ts files
* NetworkError.response renamed to NetworkError.responseBody

### Features

* add application-specific types (identity, contracts) ([6b0ffa5](https://github.com/ottobot-ai/ottochain-sdk/commit/6b0ffa59e194474db40a1d9695a2c5563404d481))
* add error classes, validation schemas, and examples ([c56d624](https://github.com/ottobot-ai/ottochain-sdk/commit/c56d6247f5b33631e36ec090b15e6d2fb4ff9752))
* add governance and corporate proto definitions ([#15](https://github.com/ottobot-ai/ottochain-sdk/issues/15)) ([2d5bfb5](https://github.com/ottobot-ai/ottochain-sdk/commit/2d5bfb52357803d85ddfe886e2c70f8b8eba38a9))
* add npm auto-publish to release workflow ([#29](https://github.com/ottobot-ai/ottochain-sdk/issues/29)) ([e771417](https://github.com/ottobot-ai/ottochain-sdk/commit/e771417969e05c0ada3c6840701976bb24b35100))
* add release workflow for GitHub Packages publishing ([#26](https://github.com/ottobot-ai/ottochain-sdk/issues/26)) ([6a8f13e](https://github.com/ottobot-ai/ottochain-sdk/commit/6a8f13e57742ff521d0681e742739d3f77e33b2d))
* add typedoc, examples, custom errors, and zod validation ([#1](https://github.com/ottobot-ai/ottochain-sdk/issues/1)) ([17c113c](https://github.com/ottobot-ai/ottochain-sdk/commit/17c113c4e74e1727f1f98672bced1ce154df53f1))
* **apps:** add governance module with DAO types ([#4](https://github.com/ottobot-ai/ottochain-sdk/issues/4)) ([37c5fb4](https://github.com/ottobot-ai/ottochain-sdk/commit/37c5fb4eab3d6bde8876abe1f6d2729c0e1b9e3f))
* **apps:** add Markets and Oracles apps ([#3](https://github.com/ottobot-ai/ottochain-sdk/issues/3)) ([3c1e1df](https://github.com/ottobot-ai/ottochain-sdk/commit/3c1e1df07316f630d2e641751adbe66e529243c3))
* **ci:** add release-please for automated npm releases ([#30](https://github.com/ottobot-ai/ottochain-sdk/issues/30)) ([56ad1aa](https://github.com/ottobot-ai/ottochain-sdk/commit/56ad1aa6bda69b42038c87c84afc08915f67ce2f))
* **corporate:** add corporate governance types and state machines ([#6](https://github.com/ottobot-ai/ottochain-sdk/issues/6)) ([5174a3d](https://github.com/ottobot-ai/ottochain-sdk/commit/5174a3de63804b6a66eed168c0117ed7cdfaef0b))
* **governance:** add governance types and DAO state machine definitions ([#5](https://github.com/ottobot-ai/ottochain-sdk/issues/5)) ([90935aa](https://github.com/ottobot-ai/ottochain-sdk/commit/90935aab7737e6dbac2353c858fe1d1b92318ec7))
* **identity:** add agent identity state machine definition ([#11](https://github.com/ottobot-ai/ottochain-sdk/issues/11)) ([3aba893](https://github.com/ottobot-ai/ottochain-sdk/commit/3aba8938ef8f2f1b2830802a353c6aba81413422))
* initial SDK extraction from ottochain repo ([4a313ed](https://github.com/ottobot-ai/ottochain-sdk/commit/4a313ed3c99879487536a73a3765e89d1e7c9592))
* protobuf as single source of truth for all types ([deecb11](https://github.com/ottobot-ai/ottochain-sdk/commit/deecb11c140571365e571a999c894f062e66dca7))
* symmetric app exports for markets and oracles ([#9](https://github.com/ottobot-ai/ottochain-sdk/issues/9)) ([ee0c8a0](https://github.com/ottobot-ai/ottochain-sdk/commit/ee0c8a063f73b5614deaa1a96d86f53d2bea19d7))


### Bug Fixes

* add dependencies field to all state machine transitions ([#12](https://github.com/ottobot-ai/ottochain-sdk/issues/12)) ([b71bce2](https://github.com/ottobot-ai/ottochain-sdk/commit/b71bce2a0e968a9588d8f58c8853149d330d1fc6))
* add missing ESLint config and tests ([1796c3b](https://github.com/ottobot-ai/ottochain-sdk/commit/1796c3b90519008872698bbfc533ed985488ed4f))
* add subpath exports for all apps ([#10](https://github.com/ottobot-ai/ottochain-sdk/issues/10)) ([b706a33](https://github.com/ottobot-ai/ottochain-sdk/commit/b706a33b9eb3f70c6a7b816d600a29cce86604ea))
* align legacy types with wire format ([#23](https://github.com/ottobot-ai/ottochain-sdk/issues/23)) ([8281058](https://github.com/ottobot-ai/ottochain-sdk/commit/8281058b842961c4b81910beadb06408330cc1ec))
* export markets and oracles proto types ([#8](https://github.com/ottobot-ai/ottochain-sdk/issues/8)) ([d9676e3](https://github.com/ottobot-ai/ottochain-sdk/commit/d9676e34b4cc3cd7a3783646c138e394a37368bf))
* move @bufbuild/protobuf to runtime dependencies ([268fb07](https://github.com/ottobot-ai/ottochain-sdk/commit/268fb078cb850140ccd86a661d1d142acc290867))
* remove initialDataTemplate field from state machines ([#14](https://github.com/ottobot-ai/ottochain-sdk/issues/14)) ([61f6e51](https://github.com/ottobot-ai/ottochain-sdk/commit/61f6e511768ba3b04d2475adaf972ea44f81c8ac))
* restore AGENT_TRANSITIONS and ATTESTATION_DELTAS constants ([#21](https://github.com/ottobot-ai/ottochain-sdk/issues/21)) ([ff7bdd1](https://github.com/ottobot-ai/ottochain-sdk/commit/ff7bdd14c3c6cb2bcc9f43017f6323b39050062b)), closes [#19](https://github.com/ottobot-ai/ottochain-sdk/issues/19)
* switch from GitHub Packages to npmjs.com registry ([#27](https://github.com/ottobot-ai/ottochain-sdk/issues/27)) ([09b9090](https://github.com/ottobot-ai/ottochain-sdk/commit/09b909087fe8b184d596d2e2463ebc34bbcf55a8))
* use array syntax for JSON Logic guards in identity state machine ([#17](https://github.com/ottobot-ai/ottochain-sdk/issues/17)) ([79c5a3b](https://github.com/ottobot-ai/ottochain-sdk/commit/79c5a3b6dca6a8f4d3aef3faa4280cb466e991a4))
* use array-based commitments and claims in market definition ([#25](https://github.com/ottobot-ai/ottochain-sdk/issues/25)) ([d9d122d](https://github.com/ottobot-ai/ottochain-sdk/commit/d9d122da450bf5cc5ad74dc56eb1b81e76478ec8))
* use merge instead of cat for array concatenation in market SM ([#28](https://github.com/ottobot-ai/ottochain-sdk/issues/28)) ([f24377a](https://github.com/ottobot-ai/ottochain-sdk/commit/f24377aa69814fedb1aa2850ef6e4010bc21eec6))
* use plain string types for wire format compatibility ([#22](https://github.com/ottobot-ai/ottochain-sdk/issues/22)) ([df39dc3](https://github.com/ottobot-ai/ottochain-sdk/commit/df39dc39ee2463c02d149d15e9af430ffcfb06d7)), closes [#20](https://github.com/ottobot-ai/ottochain-sdk/issues/20)


### Code Refactoring

* use ts-proto as single source of truth ([#16](https://github.com/ottobot-ai/ottochain-sdk/issues/16)) ([02bdb59](https://github.com/ottobot-ai/ottochain-sdk/commit/02bdb59fc1fa91a525c1ba2f0b180ceb396cb0c3))
