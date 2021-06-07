const path = require('path');
const express = require('express');

function mangas(data) {
  return (req, res) => {
    res.json({
      mangas: data.mangasList,
      categories: data.categories.length ? data.categories : undefined,
      lastUpdate: data.timestamp,
    })
  }
}

function manga_$slug(data) {
  return (req, res) => {
    const slug = req.params.slug;

    if (!(slug in data.mangas)) {
      res.status(404);
      res.json({ message: `Manga ${slug} not found` });
      return;
    }

    res.json({
      manga: data.mangas[slug].fullEntry,
      lastUpdate: data.timestamp,
    })
  }
}

function cover_$slug(data) {
  return (req, res) => {
    const slug = req.params.slug;

    if (!(slug in data.mangas)) {
      res.status(404);
      res.json({ message: `Manga ${slug} not found` });
      return;
    }

    res.sendFile(path.resolve(data.mangas[slug].cover));
  }
}

module.exports = (data) => {
  const indexFile = path.join(__dirname, '..', 'index.html');
  const app = express();

  app.get('/mangas', mangas(data));
  app.get('/manga/:slug', manga_$slug(data));
  app.get('/cover/:slug', cover_$slug(data));
  app.get('/', (req, res) => {
    // force trailing slash (for relative path)
    const url = new URL(req.originalUrl, 'http://localhost');
    if (!url.pathname.endsWith('/')) {
      res.redirect(`${url.pathname}/`);
      return;
    }

    res.sendFile(indexFile)
  });

  return app;
}
