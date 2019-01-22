module.exports = {
    "parserOptions": {
        "ecmaVersion": 6,
    },
    "env": {
        "mocha": true,
        "es6": true,
    },
    "rules": {
        "no-unused-vars": [
            "error",
            {
                "varsIgnorePattern": "should|expect"
            }
        ]
    }
}