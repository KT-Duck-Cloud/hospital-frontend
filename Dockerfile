# syntax=docker/dockerfile:1
# 화면(React) 이미지. 빌드는 web/ 폴더에서 한다:
#   docker build -t reservation-app-web:dev web
# 실행 때 API 서비스 주소를 환경변수로 준다 (기본값은 docker compose 의 서비스 이름):
#   AUTH_UPSTREAM, RESERVATION_UPSTREAM, STATS_UPSTREAM  (예: http://auth:8000)

# ---- 빌드 단계: node 로 정적 파일(dist/)을 만든다 ----
FROM node:22.23.3-alpine AS build

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- 실행 단계: nginx(root 아님, 포트 8080)로 dist/ 만 서빙 ----
FROM nginxinc/nginx-unprivileged:1.30.5-alpine3.24

# 이미지 태그와 같은 Git 커밋 값을 빌드 때 받는다: --build-arg APP_VERSION=<commit>
ARG APP_VERSION=dev
# NGINX_ENTRYPOINT_LOCAL_RESOLVERS: /etc/resolv.conf 의 DNS 서버를 NGINX_LOCAL_RESOLVERS 로 넘긴다 (resolver 지시어용)
# NGINX_ENVSUBST_*: 시작할 때 /etc/nginx/templates/*.template 에 아래 값만 넣어 /tmp 에 설정 파일을 만든다
# (/tmp 만 쓰기 때문에 readOnlyRootFilesystem 에서도 동작한다. $uri 같은 nginx 변수는 건드리지 않는다)
ENV APP_VERSION=${APP_VERSION} \
    AUTH_UPSTREAM=http://auth:8000 \
    RESERVATION_UPSTREAM=http://reservation:8000 \
    STATS_UPSTREAM=http://stats:8000 \
    NGINX_ENVSUBST_OUTPUT_DIR=/tmp \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    NGINX_ENVSUBST_FILTER="^(AUTH_UPSTREAM|RESERVATION_UPSTREAM|STATS_UPSTREAM|APP_VERSION|NGINX_LOCAL_RESOLVERS)$"

# 설정 파일은 root 소유(읽기 전용)로 두고, 실행은 이미지 기본 사용자(nginx, uid 101)로 한다.
USER root
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/security-headers.conf nginx/proxy.conf /etc/nginx/snippets/
COPY nginx/web.conf.template /etc/nginx/templates/web.conf.template
COPY --from=build /src/dist /usr/share/nginx/html
USER 101

EXPOSE 8080
