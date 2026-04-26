const config = {
  moduleFileExtensions: ['js', 'json'],
  rootDir: '..',
  testEnvironment: 'node',
  testRegex: 'test/.*\\.e2e-spec\\.js$',
  transform: {
    '^.+\\.js$': ['@swc/jest'],
  },
  setupFilesAfterEnv: [],
};

module.exports = config;
