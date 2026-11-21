.PHONY: up up-d down logs build

# Start the full stack (database, backend, frontend)
up:
	docker compose up --build

# Start in background (detached mode)
up-d:
	docker compose up -d --build

# Stop all containers
down:
	docker compose down

# View container logs
logs:
	docker compose logs -f
