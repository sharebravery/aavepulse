FROM node:22-alpine AS web-builder

RUN corepack enable
WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

FROM golang:alpine AS builder

ARG APP=aavepulse
ARG VERSION=v0.1.0
ARG RELEASE_TAG=$(VERSION)

# Install the required packages
RUN apk add --no-cache gcc musl-dev sqlite-dev

# Set CGO_CFLAGS to enable large file support
ENV CGO_CFLAGS "-D_LARGEFILE64_SOURCE"

ENV GOPROXY="https://goproxy.cn"

WORKDIR /go/src/${APP}
COPY . .

# Build the application
RUN go build -ldflags "-w -s -X main.VERSION=${RELEASE_TAG}" -o ./${APP} .

FROM alpine
ARG APP=aavepulse
RUN apk add --no-cache libgcc sqlite-libs
WORKDIR /app
COPY --from=builder /go/src/${APP}/${APP} /usr/bin/
COPY configs ./configs
COPY --from=web-builder /app/web/dist ./web/dist
ENTRYPOINT ["aavepulse", "start", "-d", "/app/configs", "-c", "dev", "-s", "/app/web/dist"]
EXPOSE 8040
