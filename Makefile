# ==============================================================================
# AgriVeda AI — Software Development & Deployment Automation Makefile
# ==============================================================================

.PHONY: help install run test lint format docker-build docker-up docker-down clean

help:
	@echo "AgriVeda AI Development Automation Commands:"
	@echo "  make install      Install Python dependencies"
	@echo "  make run          Launch live development ASGI server"
	@echo "  make run-prod     Launch multi-worker production server"
	@echo "  make test         Execute full 23-suite automated test suite"
	@echo "  make lint         Check code syntax and style"
	@echo "  make format       Auto-format codebase with Black and isort"
	@echo "  make docker-build Build hardened multi-stage production Docker image"
	@echo "  make docker-up    Start Docker Compose multi-service stack"
	@echo "  make docker-down  Stop all Docker Compose services"
	@echo "  make clean        Clean bytecode caches and temporary files"

install:
	pip install -r requirements.txt

run:
	uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

run-prod:
	uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4

test:
	python tests/test_api.py

lint:
	python -m py_compile backend/main.py backend/services/*.py

format:
	black --line-length 120 backend/ tests/
	isort --profile black backend/ tests/

docker-build:
	docker build -t agriveda-ai:latest .

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.log" -delete
