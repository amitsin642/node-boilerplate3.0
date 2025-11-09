// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:promise/recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended', // integrates Prettier
  ],
  plugins: ['prettier', 'import', 'promise', 'node'],
  rules: {
    // ✅ Best Practices
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-var': 'error',
    'prefer-const': 'warn',
    'object-shorthand': ['warn', 'always'],
    'prefer-template': 'warn',
    'promise/no-callback-in-promise': 'off',

    // ✅ Import rules
    'import/no-unresolved': 'error',
    'import/order': [
      'warn',
      {
        groups: [
          ['builtin'], // Node built-ins like fs, path, url
          ['external'], // npm packages
          ['internal'], // your own modules
          ['parent', 'sibling', 'index'],
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    // ✅ Promise rules
    'promise/always-return': 'off',
    'promise/no-nesting': 'warn',

    // ✅ Node.js rules
    'node/no-unsupported-features/es-syntax': 'off', // allow import/export
    'node/no-missing-import': 'off', // handled by import plugin

    // ✅ Prettier integration
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true,
        semi: true,
        trailingComma: 'es5',
        tabWidth: 2,
        printWidth: 100,
        arrowParens: 'always',
        endOfLine: 'auto',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: { jest: true },
    },
    {
      files: ['src/server.js', 'src/config/**/*.js', 'src/loaders/**/*.js'],
      rules: {
        'no-process-exit': 'off', // allow only in boot/load files
      },
    },
  ],
};
