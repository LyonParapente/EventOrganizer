# Local development

The whole stack runs with [Docker](https://docs.docker.com/get-docker/), identically on Windows, macOS and Linux:

```
docker compose up
```

That's it.
On first run it builds the images, creates the database, seeds it with development data, and starts everything.

| URL | What |
|-----|------|
| http://localhost:8000 | The application (served by Flask, front compiled automatically) |
| http://localhost:8000/swagger | Interactive API documentation |
| http://localhost:8025 | [Mailpit](https://mailpit.axllent.org/): every email sent by the app in dev lands here |

## Development accounts

The database is seeded with (password = local part + `1234`):

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin1234 | admin |
| marie@example.com | marie1234 | user |
| paul@example.com | paul1234 | user |
| jeanne@example.com | jeanne1234 | pending approval (test the admin flow) |

## How it works

Three containers, defined in `docker-compose.yml`:

* **back**: Python 3.13 + `fr_FR` locales (same as production), runs `flask run --debug`.
  Python files hot-reload on save.
  On first start it creates `back/app_secrets.py` (from the sample) and `back/settings_local.py` (dev overrides loaded at the end of `settings.py`); both are git-ignored, edit them freely.
* **front**: Node 18, compiles the TypeScript front with FuseBox in watch mode straight into `back/static/`.
  Save a file in `front/src/`, reload the page: Flask serves the fresh bundle.
* **mailpit**: catches all outgoing emails, nothing ever leaves your machine.

All the data (SQLite database, uploads, avatars) lives in a named Docker volume, not in the repo.

## Common operations

```
# Start (add -d to run in the background)
docker compose up

# Reset everything (database, uploads): next start re-seeds from scratch
docker compose down -v

# Rebuild the images (e.g. after changing docker/*.Dockerfile)
docker compose build

# Open a shell / sqlite console in the back container
docker compose exec back bash
docker compose exec back sqlite3 /data/events.db

# Front-only mode: FuseBox dev server + mocked API (front/data/*.json), no back
docker compose --profile mock up front-mock   # -> http://localhost:4444
```

## Platform notes

* **Host ports already taken** (8000 for the app, 8025 for Mailpit, 4444 for the mock server): create a `.env` file at the repo root (not versioned) with `APP_PORT=...`, `MAILPIT_PORT=...` and/or `MOCK_PORT=...`.
  We avoid port 5000 on purpose: macOS AirPlay squats it.
  If you are used to Flask's port 5000 (native setup), `APP_PORT=5000` in your `.env` brings it back — on Windows and Linux only, macOS will still serve AirPlay's 403 there.
* **Windows**: requires Docker Desktop (WSL2 backend).
  For fast file watching, clone the repo inside the WSL2 filesystem (e.g. `\\wsl$\Ubuntu\home\...`) rather than on `C:\`.
* **File changes not detected** (network drives, some WSL2 setups): uncomment `CHOKIDAR_USEPOLLING: 1` in `docker-compose.yml` (front service).
* **Apple Silicon / ARM**: works; `node-sass` compiles from source during the image build (a few extra minutes, once).

## Manual setup (without Docker)

Still fully supported, see the [README](README.md) and [BACK.md](BACK.md).
