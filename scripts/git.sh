#!/bin/bash
# 获取 git hash 和 git date，写入到 .gitinfo 文件中。json 格式

git_hash=$(git rev-parse HEAD)
git_date=$(git log -1 --format=%cd)

echo "{\"gitHash\": \"$git_hash\", \"gitDate\": \"$git_date\"}" >.gitinfo
