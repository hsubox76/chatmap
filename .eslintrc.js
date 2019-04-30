module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "parser": "babel-eslint",
    "plugins": [
        "react"
    ],
    "rules": {
        "react/jsx-uses-react": 2,
        "react/jsx-uses-vars": 2,
        "react/react-in-jsx-scope": 2,
        "no-console": ["error", { allow: ["warn", "error"]}]
    }
};