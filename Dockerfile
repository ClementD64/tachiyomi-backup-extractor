FROM denoland/deno:alpine as models
RUN deno run --allow-net --allow-write https://raw.githubusercontent.com/ClementD64/tachiyomi-backup-models/main/mod.ts tachiyomi.proto

FROM node:16-alpine

ENV TACHIYOMI_LISTEN_PORT=80
ENV TACHIYOMI_BACKUP=/backup
ENV TACHIYOMI_COVER_CACHE=/tmp/cover-cache

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY --from=models /tachiyomi.proto ./tachiyomi.proto
COPY src src
COPY index.html index.html

EXPOSE 80
ENTRYPOINT [ "node", "src" ]
