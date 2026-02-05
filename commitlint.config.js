module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting, no code change
        'refactor', // Code change, no new feature or fix
        'perf',     // Performance improvement
        'test',     // Adding tests
        'build',    // Build system or external deps
        'ci',       // CI configuration
        'chore',    // Other changes
        'revert',   // Revert a commit
      ],
    ],
    'subject-case': [0], // Allow any case in subject
  },
};
