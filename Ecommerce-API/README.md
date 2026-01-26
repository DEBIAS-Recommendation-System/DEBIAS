# FastAPI E-commerce API

Minimal FastAPI service that exposes product, category, cart, user, and auth endpoints backed by PostgreSQL.

## Features at a Glance

- CRUD APIs for products and categories
- JWT-based signup/login and account management
- Cart operations scoped to the authenticated user

## Prerequisites

- Python 3.10 (recommended) or Python 3.11. Dependencies in requirements.txt are not compatible with Python 3.12+.
- Docker (for the local Postgres container)
- Git

```bash
python3.10 --version          # confirm Python 3.10 is available
docker --version              # confirm Docker is available
```

If python3.10 is not on your PATH, install it before continuing. Using the system default (for example Python 3.12/3.14) will fail when creating the virtual environment and installing the pinned dependencies.

## Environment Configuration

Copy the `.env.example` into `.env`
```

On startup the app ensures an admin user exists using the admin_* values. Change them before the first run if you want different defaults.

## Local Setup

1. **Create the virtual environment with Python 3.10**

   ```bash
   python3.10 -m venv venv
   source venv/bin/activate
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```

2. **Apply database migrations**

   ```bash
   venv/bin/python migrate.py
   ```

3. **Run the API**

   ```bash
   venv/bin/python run.py
   ```

   Visit:

   - API root: http://127.0.0.1:8000/
   - Swagger UI: http://127.0.0.1:8000/docs
   - ReDoc: http://127.0.0.1:8000/redoc

4. **Verify everything works (optional smoke test)**

   ```bash
   venv/bin/python tests/api_smoke_test.py
   ```

   The script clears the schema, seeds data, exercises every endpoint, and prints progress to the terminal.

## Docker Compose

1. Copy `.env` with the desired credentials (the bootstrap admin section is required).
2. Build and start both services from the repository root:

   ```bash
   docker compose up --build
   ```

   This launches:

   - `fastapi-app` on http://127.0.0.1:8000/
   - `fastapi-postgres` on port 5432 (mapped to the host for optional psql access)

3. Apply database migrations inside the running app container:

   ```bash
   docker compose exec app python migrate.py
   ```

   The startup hook creates the default admin using the `.env` values if it does not already exist.

4. Stop everything when finished:

   ```bash
   docker compose down
   ```

## Basic Usage

- Admin credentials (auto-created):
  - username: `admin`
  - password: `admin`
  - email: `admin@example.com`
- Obtain tokens:

  ```bash
  curl -X POST http://127.0.0.1:8000/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=admin"
  ```

  Use the returned `access_token` in `Authorization: Bearer <token>` headers for protected endpoints.

## Troubleshooting

- `ModuleNotFoundError` or missing wheels: confirm you activated the venv and that it was created with Python 3.10/3.11.
- `pg_config executable not found`: ensure you are using psycopg2-binary via the supplied requirements and that the Postgres container is running.