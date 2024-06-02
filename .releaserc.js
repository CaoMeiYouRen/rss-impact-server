const { name } = require('./package.json')
module.exports = {
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                "config": "conventional-changelog-cmyr-config"
            }
        ],
        [
            "@semantic-release/release-notes-generator",
            {
                "config": "conventional-changelog-cmyr-config"
            }
        ],
        [
            "@semantic-release/changelog",
            {
                "changelogFile": "CHANGELOG.md",
                "changelogTitle": "# " + name
            }
        ],
        '@semantic-release/npm',
        '@semantic-release/github',
        [
            "@semantic-release/git",
            {
                "assets": [
                    "src",
                    "CHANGELOG.md",
                    "package.json"
                ]
            }
        ],
        [
            '@semantic-release/exec', // build docker 镜像
            {
                prepareCmd: `docker build -t caomeiyouren/${name} .`,
            },
        ],
        [
            'semantic-release-docker', // 发布到 docker
            {
                name: `caomeiyouren/${name}`,
            },
        ],
    ],
}
