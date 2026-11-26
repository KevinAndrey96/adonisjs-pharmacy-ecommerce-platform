.PHONY: help install dev lint test migrate rollback seed docker-up docker-down docker-logs docker-migrate docker-seed clean

help: ## Show this help message
	@echo "Available commands in PharmaStore Platform:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Install npm dependencies
	npm ci --legacy-peer-deps

dev: ## Start local AdonisJS HTTP server
	@if [ ! -f .env ]; then cp .env.example .env; fi
	node server.js

migrate: ## Run pending database migrations
	@if [ ! -f .env ]; then cp .env.example .env; fi
	node ace migration:run

lint: ## Run ESLint
	npm run lint

test: ## Run HTTP smoke tests against the seeded SQLite database
	npm test

rollback: ## Rollback the latest database migration batch
	node ace migration:rollback

seed: ## Seed database with pharmacy categories, products, coupons, and admin
	node ace seed

docker-up: ## Start application, MySQL, and Mailpit via Docker Compose (requires APP_KEY)
	docker compose up -d --build

docker-down: ## Stop and remove all Docker Compose containers
	docker compose down

docker-logs: ## Follow Docker Compose container logs
	docker compose logs -f

docker-migrate: ## Run database migrations inside Docker app container
	docker compose exec app node ace migration:run --force

docker-seed: ## Run database seeders inside Docker app container
	docker compose exec app node ace seed --force

clean: ## Clean local temporary cache and sqlite database files
	rm -f database/*.sqlite database/*.sqlite3
