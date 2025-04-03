module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.js'],
    testTimeout: 10000,
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/config/',
      '/migrations/'
    ],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1' 
    },
    transform: {
      '^.+\\.js$': 'babel-jest' 
    },
    transformIgnorePatterns: [
      '/node_modules/(?!(your-esm-modules)/)' 
    ]
  
  };