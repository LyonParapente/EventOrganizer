# Dev image for the Flask back (the code itself is bind-mounted at runtime).
FROM python:3.13-slim

# fr_FR locales, like the production Debian server (settings.lang_locale)
RUN apt-get update \
 && apt-get install -y --no-install-recommends locales \
 && sed -i -e 's/^# fr_FR.UTF-8 UTF-8/fr_FR.UTF-8 UTF-8/' -e 's/^# fr_FR ISO-8859-1/fr_FR ISO-8859-1/' /etc/locale.gen \
 && locale-gen \
 && rm -rf /var/lib/apt/lists/*
ENV LANG=fr_FR.UTF-8 \
    LC_ALL=fr_FR.UTF-8 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY back/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Files used to bootstrap a fresh dev environment (see back-entrypoint.sh)
COPY docker/settings_local.dev.py /bootstrap/settings_local.dev.py
COPY front/data/background.jpg /bootstrap/background.jpg

COPY docker/back-entrypoint.sh /usr/local/bin/back-entrypoint
RUN chmod +x /usr/local/bin/back-entrypoint

EXPOSE 5000
ENTRYPOINT ["back-entrypoint"]
