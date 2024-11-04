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
        '@typescript-eslint/indent': 0,
        'max-len': [0, { code: 200 }], // 强制行的最大长度
        'max-lines': [1, { max: 500 }], // 强制文件的最大行数
        'max-lines-per-function': [0, { max: 120 }], // 强制函数最大行数
        'max-nested-callbacks': [1, { max: 5 }], // 强制回调函数最大嵌套深度
        'max-params': [1, { max: 5 }], // 强制函数定义中最大参数个数
    },
}
