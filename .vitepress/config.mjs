// .vitepress/config.js
import { defineConfig } from 'vitepress'


export default defineConfig({
    title: 'RSS Impact',
    description: 'RSS Impact 是一个支持 Hook 的 RSS 订阅工具。',
    lang: 'zh-CN',
    // base: '/rss-impact-server',
    base: '/',
    // 显示最后更新时间
    lastUpdated: true,
    // 删除 .html 后缀
    cleanUrls: true,
    // 不会因为死链而导致构建失败
    ignoreDeadLinks: true,
    themeConfig: {
        //顶部导航栏
        nav: [
            { text: '首页', link: '/' },
            { text: '使用', link: '/docs/usage' },
            { text: '部署', link: '/docs/deploy' },
            { text: '贡献指南', link: '/contributing' },
            { text: '安全策略', link: '/security' },
            { text: '更新日志', link: 'https://github.com/CaoMeiYouRen/rss-impact-server/blob/master/CHANGELOG.md' }
        ],
        // 编辑链接
        editLink: {
            pattern: 'https://github.com/CaoMeiYouRen/rss-impact-server/edit/master/:path'
        },
        // 本地搜索
        search: {
            provider: 'local'
        }
    },
    // 重定向路由
    rewrites: {
        'README.md': 'index.md',
        'CHANGELOG.md': 'changelog.md',
        'CONTRIBUTING.md': 'contributing.md',
        'SECURITY.md': 'security.md'
    }
})
