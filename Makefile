.PHONY: start build test vet wire swagger deps-up deps-down web-install web-dev web-test web-build clean

NOW = $(shell date -u '+%Y%m%d%I%M%S')

RELEASE_VERSION = v0.1.0

APP 			= aavepulse
SERVER_BIN  	= ${APP}
GIT_COUNT 		= $(shell git rev-list --all --count 2>/dev/null || echo 0)
GIT_HASH        = $(shell git rev-parse --short HEAD 2>/dev/null || echo dev)
RELEASE_TAG     = $(RELEASE_VERSION).$(GIT_COUNT).$(GIT_HASH)

CONFIG_DIR       = ./configs
CONFIG_FILES     = dev
STATIC_DIR       = ./web/dist
START_ARGS       = -d $(CONFIG_DIR) -c $(CONFIG_FILES) -s $(STATIC_DIR)

all: start

start:
	@go run -ldflags "-X main.VERSION=$(RELEASE_TAG)" main.go start $(START_ARGS)

build:
	@go build -ldflags "-w -s -X main.VERSION=$(RELEASE_TAG)" -o $(SERVER_BIN)

test:
	@go test ./...

vet:
	@go vet ./...

build-linux:
	CGO_ENABLED=1 GOOS=linux GOARCH=amd64 CC="zig cc -target x86_64-linux-musl" CXX="zig c++ -target x86_64-linux-musl" CGO_CFLAGS="-D_LARGEFILE64_SOURCE" go build -ldflags "-w -s -X main.VERSION=$(RELEASE_TAG)" -o $(SERVER_BIN)_linux_amd64

wire:
	@go run github.com/google/wire/cmd/wire@latest gen ./internal/wirex

swagger:
	@go run github.com/swaggo/swag/cmd/swag@v1.16.2 init --parseDependency --generalInfo ./main.go --output ./internal/swagger

deps-up:
	@docker compose up -d postgres

deps-down:
	@docker compose down

web-install:
	@pnpm --dir web install

web-dev:
	@pnpm --dir web dev

web-test:
	@pnpm --dir web test

web-build:
	@pnpm --dir web build

# https://github.com/OpenAPITools/openapi-generator
openapi:
	docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate -i /local/internal/swagger/swagger.yaml -g openapi -o /local/internal/swagger/v3

clean:
	rm -rf data web/dist $(SERVER_BIN)

serve: build
	./$(SERVER_BIN) start $(START_ARGS)

serve-d: build
	./$(SERVER_BIN) start $(START_ARGS) --daemon

stop:
	./$(SERVER_BIN) stop
