const fs = require('fs');
const express = require('express');
const Server = require('./server');
const Loader = require('./loader');
const cacheCover = require('./cover');

const coverCacheDir = process.env.TACHIYOMI_COVER_CACHE ?? './.cover-cache';
fs.mkdirSync(coverCacheDir, { recursive: true });

function slugify(text) {
  return text.toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accent
    .toLowerCase()
    .replace(/\W+/g, '-') // Replace all non-word chars
    .replace(/\-{2,}/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

const data = {};

const watcher = new Loader(process.env.TACHIYOMI_BACKUP ?? './backup', async function() {
  const mangas = {};

  const mapping = {};
  const categories = process.env.TACHIYOMI_CATEGORIES?.split(',') ?? [];

  this.backup.backupCategories.forEach((v, i) => {
    if (!categories.includes(v.name)) return;
    mapping[i] = categories.indexOf(v.name);
  });

  const promises = [];

  this.backup.backupManga.forEach(manga => {
    const slug = slugify(manga.title);
    const cover = cacheCover(manga.thumbnailUrl, coverCacheDir);
    promises.push(cover.promise);
    mangas[slug] = {
      slug,
      fullEntry: manga.fullEntry(slug),
      simpleEntry: manga.simpleEntry(slug, manga.categories.map(v => mapping[v]).filter(v => typeof v === "number")),
      cover: cover.path,
      coverSource: manga.thumbnailUrl,
    };
  });

  await Promise.all(promises);

  data.mangas = mangas;
  data.mangasList = Object.values(data.mangas)
    .map(v => v.simpleEntry)
    .sort((a, b) => a.title.localeCompare(b.title));
  data.categories = categories;
  data.backup = this.backup;
  data.timestamp = this.timestamp;
}).watch();

const listenPort = Number(process.env.TACHIYOMI_LISTEN_PORT ?? 8080);
if (isNaN(listenPort) || listenPort < 0 || listenPort > 65535) {
  throw new Error(`Invalid port ${process.env.TACHIYOMI_LISTEN_PORT}`);
}

const app = express();
app.use(process.env.TACHIYOMI_MOUNT_PATH ?? '/', Server(data));
const server = app.listen(listenPort);

process.on('SIGTERM', () => {
  watcher.close();
  server.close();
});
