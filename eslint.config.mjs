// eslint.config.mjs
import { defineConfig } from 'eslint/config'
import cmyr from 'eslint-config-cmyr'

export default defineConfig([cmyr, {
    rules: {
        '@stylistic/no-multiple-empty-lines': [1, { max: 2, maxBOF: 0, maxEOF: 1 }], // 禁止多余的空行
        '@stylistic/padded-blocks': [1, { blocks: 'never', classes: 'always', switches: 'never' }], // 强制在代码块中保持一致的空行填充
        '@stylistic/no-mixed-operators': [0], // 禁止混合使用不同的运算符
        '@typescript-eslint/no-unused-expressions': [0],
        '@stylistic/multiline-ternary': [1, 'always-multiline'], // 在三元表达式跨越多行时，强制操作符之间的换行。
        'no-useless-constructor': [1], // 禁止不必要的构造函数
    },
}])
