# Dev image for the front (the code itself is bind-mounted at runtime).
FROM node:18-bullseye-slim

WORKDIR /workspace/front

COPY docker/front-entrypoint.sh /usr/local/bin/front-entrypoint
RUN chmod +x /usr/local/bin/front-entrypoint

ENTRYPOINT ["front-entrypoint"]
