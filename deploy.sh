#!/usr/bin/env bash
# 마루 비서실 배포 스크립트
# 저장소(nakahito559/maru-office)가 이미 만들어져 있고 gh에 쓰기 권한이 있을 때 실행하세요.
set -euo pipefail
cd "$(dirname "$0")"

REPO="nakahito559/maru-office"

echo "1) 원격 확인"
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/${REPO}.git"

echo "2) 푸시"
git push -u origin main

echo "3) GitHub Pages 활성화 (main / root)"
if gh api "repos/${REPO}/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/${REPO}/pages" -f 'source[branch]=main' -f 'source[path]=/' >/dev/null
else
  gh api -X POST "repos/${REPO}/pages" -f 'source[branch]=main' -f 'source[path]=/' >/dev/null
fi

echo "4) 빌드 상태 대기"
for i in $(seq 1 40); do
  STATUS=$(gh api "repos/${REPO}/pages" -q '.status' 2>/dev/null || echo "unknown")
  echo "   [$i] status=$STATUS"
  [ "$STATUS" = "built" ] && break
  sleep 10
done

echo "5) 주소"
gh api "repos/${REPO}/pages" -q '.html_url'
