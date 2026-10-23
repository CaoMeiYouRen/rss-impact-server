#!/bin/sh
# 在基础镜像上验证 SQLite 写入能力，模拟旧版 Docker/containerd 的 seccomp 策略。
#
# 用法：
#   sh scripts/ci/test-docker-sqlite.sh [基础镜像]
#
# 不传基础镜像时，从 Dockerfile 的 NODE_IMAGE 读取。
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

IMAGE=${1:-}
if [ -z "$IMAGE" ]; then
    IMAGE=$(sed -n 's/^ARG NODE_IMAGE=//p' Dockerfile | head -1)
fi
if [ -z "$IMAGE" ]; then
    echo "无法从 Dockerfile 解析 NODE_IMAGE" >&2
    exit 1
fi

SQLITE_VERSION=$(sed -n 's/.*"better-sqlite3": "\([^"]*\)".*/\1/p' package.json | head -1)
if [ -z "$SQLITE_VERSION" ]; then
    echo "无法从 package.json 解析 better-sqlite3 版本" >&2
    exit 1
fi

TAG=sqlite-runtime-test:ci
PROFILE="$ROOT/scripts/ci/deny-pwritev2.seccomp.json"

echo "基础镜像: $IMAGE"
echo "better-sqlite3: $SQLITE_VERSION"

docker build -q \
    -f scripts/ci/Dockerfile.sqlite-test \
    --build-arg "BASE_IMAGE=$IMAGE" \
    --build-arg "SQLITE_VERSION=$SQLITE_VERSION" \
    -t "$TAG" \
    scripts/ci

echo
echo "[1/2] 默认 seccomp"
docker run --rm "$TAG"

echo
echo "[2/2] 拒绝 pwritev2（模拟旧版 Docker/containerd）"
docker run --rm --security-opt "seccomp=$PROFILE" "$TAG"

echo
echo "SQLite 运行时自检全部通过"
