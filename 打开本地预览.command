#!/bin/zsh
set -e
cd "$(dirname "$0")"
task_preview_node=$(command -v node || true)
if [[ -z "$task_preview_node" ]]; then
  task_preview_node="/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$task_preview_node" ]]; then
  print "未找到 Node.js，请安装 Node.js 22 或更新版本后重新打开。"
  read -k 1
  exit 1
fi
if ! curl --fail --silent --max-time 2 http://127.0.0.1:56071/__preview__ | /usr/bin/grep -q '"preview":"portfolio-v2"'; then
  if curl --fail --silent --max-time 2 http://127.0.0.1:56071/ >/dev/null; then
    print "56071端口正在服务其他项目。请先确认服务来源，未停止或替换其他预览。"
    read -k 1
    exit 1
  fi
  PREVIEW_PORT=56071 nohup "$task_preview_node" scripts/preview.mjs > /private/tmp/andy-portfolio-v2-56071.log 2>&1 </dev/null &
  for task_preview_attempt in {1..15}; do
    if curl --fail --silent --max-time 1 http://127.0.0.1:56071/__preview__ >/dev/null; then break; fi
    sleep 0.2
  done
fi
open http://127.0.0.1:56071/review.html
