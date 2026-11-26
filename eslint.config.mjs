import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['node_modules/', 'public/', 'resources/', 'tmp/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, use: 'readonly', make: 'readonly' }
    },
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
]
