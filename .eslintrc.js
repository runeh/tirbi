module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: ['import', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-confusing-non-null-assertion': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    '@typescript-eslint/prefer-ts-expect-error': 'error',
    'import/no-default-export': 'error',
    'import/no-duplicates': 'error',
    'no-restricted-globals': [
      'error',
      {
        name: 'isNaN',
        message: 'Use Number.isNaN instead.',
      },
    ],
    'no-return-await': 'error',
    'no-template-curly-in-string': 'error',
    'eol-last': ['error', 'always'],

    'sort-imports': ['error', { ignoreDeclarationSort: true }],
    'import/order': ['error'],
  },
};
