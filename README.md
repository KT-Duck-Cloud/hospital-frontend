# hospital-frontend

병원 예약 시스템의 화면 (React 19 + Vite + Tailwind). 이미지는 nginx 로 정적 파일을 서빙하고 `/api/v1/*` 를 백엔드 서비스로 넘긴다.

## 구조

```
src/              화면 코드
nginx/            nginx 설정 (API 프록시, 보안 헤더)
docs/reference/   피그마에서 내보낸 참고 화면 (빌드에 쓰지 않음)
Dockerfile
```

## 개발 · 테스트

Node 22.18 이상.

```powershell
npm ci
npm test            # 단위 테스트 (node --test)
npm run typecheck
npm run build       # dist/
npm run dev         # 개발 서버
```

## 이미지 빌드 · 실행

```powershell
docker build --build-arg APP_VERSION=$(git rev-parse --short HEAD) -t hospital-frontend:dev .
docker run --rm -p 8080:8080 -e AUTH_UPSTREAM=http://auth:8000 -e RESERVATION_UPSTREAM=http://reservation:8000 -e STATS_UPSTREAM=http://stats:8000 hospital-frontend:dev
```

백엔드와 함께 띄우는 로컬 개발 환경은 `hospital-gitops` 의 `docker-compose.yml` 을 쓴다.

## 환경변수 (컨테이너 실행 때)

비밀 값은 없다.

| 이름 | 기본값 | 설명 |
|---|---|---|
| `AUTH_UPSTREAM` | `http://auth:8000` | 인증 서비스 주소 |
| `RESERVATION_UPSTREAM` | `http://reservation:8000` | 예약 서비스 주소 |
| `STATS_UPSTREAM` | `http://stats:8000` | 현황 서비스 주소 |
| `APP_VERSION` | `dev` | 버전 표시 (빌드 때 `--build-arg APP_VERSION`) |

## 코드 원본

이 저장소의 코드는 `reservation-app` 에서 `scripts/sync_to_repos.ps1` 로 복사한다.
README.md · .gitignore · .gitattributes · .github/ 는 이 저장소에서 직접 관리한다 (복사 대상 아님).
