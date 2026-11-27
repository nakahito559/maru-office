# 마루 비서실 (Maru Office)

순스튜디오 본부의 작업 현황을 한 화면에서 보는 모바일 PWA 대시보드입니다.
GitHub Pages에서 정적으로 서비스되며, 홈 화면에 추가하면 앱처럼 열립니다.

- 주소: <https://nakahito559.github.io/maru-office/>
- 구성: `index.html` · `styles.css` · `app.js` · `manifest.json` · `sw.js` · `assets/` · `data/status.json`

## 화면

| 탭 | 내용 |
| --- | --- |
| 오피스 | 아이소메트릭 오피스 위 5개 파트 핀. 핀을 누르면 파트별 최근 현황·링크가 열립니다. |
| 작업실 | 매일 자동 실행되는 5개 스케줄(06:00 / 08:30 / 09:00 / 12:00 / 18:00) |
| 현황 | 파이프라인 지표와 공개 링크 |
| 메모 | 확인·결정을 기다리는 항목 |

## 데이터 갱신

모든 수치와 문구는 `data/status.json` 하나에 있습니다. 이 파일만 고쳐서 커밋·푸시하면
사이트가 새 데이터를 읽습니다(서비스 워커가 `status.json`은 network-first로 처리).

```bash
# 예시
$EDITOR data/status.json
git add data/status.json && git commit -m "status: update" && git push
```

주요 키

- `updatedAt` — 헤더의 LIVE 시간과 하단 기준 시각
- `headline` / `hint` / `chips` — 오피스 상단 배너
- `parts[]` — 핀 위치(`x`, `y` 는 이미지 대비 %), 요약, `stats`, `items`
- `schedule[]` — 작업실 카드
- `metrics[]`, `links[]`, `memos[]` — 현황·메모 탭

## 로컬 확인

```bash
python3 -m http.server 8000
# http://localhost:8000/
```

`fetch('./data/status.json')` 를 쓰므로 `file://` 로 열면 동작하지 않습니다.
