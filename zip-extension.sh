#!/bin/bash
set -e

# Thư mục chứa script (clone có thể tên fptu-schedule hoặc khác)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -d "ui" ]; then
  echo "Building React UI..."
  (cd ui && npm ci && npm run build)
fi

rm -f fptu-schedule.zip
zip -FS -r fptu-schedule.zip manifest.json *.png popup.html popup.js popup.css background.js content.js lib/ dist/
