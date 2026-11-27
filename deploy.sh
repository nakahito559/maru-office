#!/usr/bin/env bash
# 마루 비서실 배포 스크립트
# GitHub Pages 주소: https://nakahito559.github.io/maru-office/
#
# 이 저장소의 Pages 는 `gh-pages` 브랜치 / (root) 를 소스로 쓰고 있습니다.
# (Pickle GitHub App 에 Pages 관리 권한이 없어 소스를 main 으로 바꾸는 API 가 403 입니다.
#  github.com → 저장소 → Settings → Pages 에서 Source 를 main / (root) 로 바꾸면
#  아래 gh-pages 복사 단계는 없어도 됩니다. 그때까지는 main 과 gh-pages 를 같이 밀어야
#  사이트가 최신 상태로 유지됩니다.)
set -euo pipefail
cd "$(dirname "$0")"

REPO="nakahito559/maru-office"

echo "1) 원격 확인"
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/${REPO}.git"

echo "2) main 푸시"
git push -u origin main

echo "3) 배포 브랜치(gh-pages)도 같은 내용으로 갱신"
git push origin main:gh-pages

echo "4) 빌드 상태 확인 (관리 권한이 없으면 건너뜀)"
for i in $(seq 1 20); do
  INFO=$(gh api "repos/${REPO}/pages" 2>/dev/null || echo "")
  if [ -z "$INFO" ]; then
    echo "   Pages API 접근 불가(앱 권한) — 빌드는 GitHub 이 자동으로 진행합니다."
    break
  fi
  STATUS=$(printf '%s' "$INFO" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("status","unknown"))' 2>/dev/null || echo "unknown")
  echo "   [$i] status=$STATUS"
  [ "$STATUS" = "built" ] && break
  sleep 10
done

echo "5) 주소"
echo "   https://nakahito559.github.io/maru-office/"
