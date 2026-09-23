module.exports = {
  preset: 'jest-expo',
  rootDir: '.',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/\\.expo/'],
};