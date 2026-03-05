/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/generated/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  verbose: true,
  // Retry flaky tests up to 2 additional times before marking as failed
  // jest-circus (default since Jest 27) supports this natively
  retryTimes: 2,
  // Handle .js extension in imports for ESM compatibility
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Allow Jest to transform ESM-only packages in node_modules.
  // @constellation-network/metagraph-sdk uses @noble/curves + @noble/hashes which are
  // pure-ESM packages. babel-jest transforms them to CJS for the test runner.
  transformIgnorePatterns: [
    '/node_modules/(?!(@constellation-network|@noble)/)',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          moduleResolution: 'node16',
        },
      },
    ],
    // Transform ESM node_modules to CJS using babel
    '^.+\\.m?js$': 'babel-jest',
  },
};
