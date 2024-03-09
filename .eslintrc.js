const IS_PROD = process.env.NODE_ENV === 'production'
module.exports = {
    root: true,
    globals: {
    },
    env: {
    },
    extends: [
        'cmyr'
    ],
    plugins: [
    ],
    rules: {
        'no-useless-constructor': 0,
        'no-console': 0,
        '@typescript-eslint/indent': 0
    },
}
