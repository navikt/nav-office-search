module.exports = {
    plugins: ['react', '@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    root: true,
    rules: {
        "react/prop-types": "off",
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                "argsIgnorePattern": "^_$",
            }
        ],
        "@typescript-eslint/no-explicit-any": "off"
    }
};
