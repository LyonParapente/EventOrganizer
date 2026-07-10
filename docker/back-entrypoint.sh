#!/bin/sh
set -e

# First run: create the local (non-versioned) configuration files
[ -f app_secrets.py ] || cp app_secrets.sample.py app_secrets.py
[ -f settings_local.py ] || cp /bootstrap/settings_local.dev.py settings_local.py

# All data (sqlite db, uploads, avatars) lives in the "data" volume,
# so `docker compose down -v` gives a pristine environment back.
mkdir -p /data/uploads/backgrounds /data/avatars /data/backgrounds

# The home page needs at least one background image
if [ -z "$(ls -A /data/uploads/backgrounds)" ]; then
  cp /bootstrap/background.jpg /data/uploads/backgrounds/background.jpg
fi

# Keep dependencies in sync with requirements.txt without rebuilding the image
pip install --quiet --no-cache-dir -r requirements.txt

# Create the database if needed and seed it with dev data (no-op if users exist)
python -m database.seed_dev

exec flask --app app_flask run --debug --host 0.0.0.0 --port 5000
