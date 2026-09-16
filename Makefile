.PHONY: api api-dev web

api:
	./apps/api/start.sh

api-dev:
	cd apps/api && .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

web:
	cd apps/web && npm run dev
