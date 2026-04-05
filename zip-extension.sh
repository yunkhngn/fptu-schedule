#!/bin/bash

# Di chuyển đến thư mục của dự án
cd /Volumes/Data/Code/extension/fptu-examination

# Tạo file zip với tên có version, đảm bảo bao gồm tất cả icon
zip -r fptu-examination.zip manifest.json background.js popup.html popup.js popup.css content.js sanitize-utils.js study-sources.json study-suggestions.js icon-16.png icon-48.png icon-128.png -x "*.DS_Store" "*.git*" 
