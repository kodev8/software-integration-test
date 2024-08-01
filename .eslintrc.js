module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:prettier/recommended',
        'prettier',
    ],
    parser: '@typescript-eslint/parser',
    ignorePatterns: [
        '/lib/**/*', // Ignore built files.
        'node_modules/',
        '**/*.json', // Ignore json
        'dist/',
        'build/',
        '**/*.sql',
        '**/*.md',
        '**/*.yml',
    ],
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        'no-unused-expressions': ['error', { allowTernary: true }],
        semi: 'error',
        'no-useless-concat': 'error',
        'no-useless-return': 'error',
    },

    overrides: [
        {
            files: ['*.ts'],

            extends: [
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/strict',
            ],

            parserOptions: {
                project: ['./tsconfig.json'],
                sourceType: 'module',
            },

            rules: {
                '@typescript-eslint/interface-name-prefix': 'off',
                '@typescript-eslint/explicit-function-return-type': 'error',
                '@typescript-eslint/explicit-module-boundary-types': 'off',
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/no-unused-vars': 'error',
                'no-console': 'warn',
                'no-restricted-syntax': [
                    'error',
                    'ForInStatement',
                    'LabeledStatement',
                    'WithStatement',
                ],
            },
        },
    ],
};
