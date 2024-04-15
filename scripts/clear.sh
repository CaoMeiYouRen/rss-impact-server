#!/bin/bash

# 安装 depcheck
# npm install -g depcheck

# 获取项目根目录
project_root=$(pwd)

# 切换到项目根目录
cd "$project_root"

# 运行 depcheck 扫描未使用的依赖
depcheck_output=$(depcheck --json)

# 提取未使用的 dependencies
unused_deps=$(echo "$depcheck_output" | grep -Eo '"dependencies":\[[^]]*\]' | sed 's/"dependencies":\[//;s/\]//g' | sed 's/,/ /g')

# 提取未使用的 devDependencies
unused_dev_deps=$(echo "$depcheck_output" | grep -Eo '"devDependencies":\[[^]]*\]' | sed 's/"devDependencies":\[//;s/\]//g' | sed 's/,/ /g')

# 合并两个列表
unused_deps_list="$unused_deps $unused_dev_deps"

# 如果有未使用的依赖,卸载它们
if [ -n "$unused_deps_list" ]; then
  echo "以下依赖在项目中未被使用:"
  echo "$unused_deps_list"
#   read -p "是否要卸载这些依赖? (y/n)" choice
#   if [ "$choice" == "y" ]; then
#     for dep in $unused_deps_list; do
#       npm uninstall "$dep"
#     done
#     echo "未使用的依赖已卸载"
#   fi
else
  echo "未发现未使用的依赖"
fi
