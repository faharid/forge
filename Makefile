.PHONY: dev install migrate test e2e \
	docker-up docker-down docker-logs docker-ps docker-reset \
	docker-dev docker-obs docker-stripe

install:
	npm install
	cd backend && npm install
	cd frontend && npm install

dev:
	npm run dev

migrate:
	cd backend && npm run migration:run

seed:
	cd backend && npm run seed

seed-fresh:
	cd backend && npm run seed:fresh

test:
	cd backend && npm test

e2e:
	cd backend && npm run test:e2e

# ─── Docker (full stack) ─────────────────────────────────────────────────────
docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-ps:
	docker compose ps

docker-reset:
	docker compose down -v

# ─── Docker profiles ─────────────────────────────────────────────────────────
docker-dev:
	docker compose --profile dev up -d --build postgres redis api-dev web-dev

docker-obs:
	docker compose --profile obs up -d --build

docker-stripe:
	docker compose --profile stripe up -d

# DB only for native npm run dev
docker-db:
	docker compose up -d postgres redis
