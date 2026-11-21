FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src"

CMD ["sh", "-c", "alembic upgrade head && python -m app.db.seed && uvicorn app.main:app --app-dir src --host 0.0.0.0 --port ${PORT:-8000}"]
