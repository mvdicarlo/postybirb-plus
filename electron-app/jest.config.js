process.env.TEST = true;

module.exports = {
  moduleDirectories: ['node_modules', './'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  runner: '@jest-runner/electron/main',
};
