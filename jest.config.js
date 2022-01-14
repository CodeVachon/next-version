module.exports = {
    roots: ["<rootDir>/src/"],
    setupFilesAfterEnv: ["jest-extended"],
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/?(*.)+(spec|test).+(tsx|ts|js)"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    globals: {
        "ts-jest": {
            tsconfig: "./tsconfig.json"
        }
    }
};
