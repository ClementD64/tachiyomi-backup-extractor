const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Loader = require('./loader');

const dist = process.env.TACHIYOMI_DIST ?? '/dist';
const backupDir = process.env.TACHIYOMI_BACKUP ?? '/backup';
const outfileAll = process.env.TOCHIYOMI_OUTFILE ?? "collection.json";
const coverEndpoint = process.env.TOCHIYOMI_COVER_ENDPOINT ?? "";

const categories = [];
for (const key in process.env) {
  if (!key.startsWith("TOCHIYOMI_CATEGORY")) continue;
  const env = process.env[key];
  const index = env.indexOf(',');
  categories.push({
    outfile: env.slice(0, index),
    category: env.slice(index+1)
  });
}

fs.mkdirSync(path.join(dist, 'cover'), { recursive: true });

function download(url, filename, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, res => {
      if (res.statusCode >= 400) return reject(`Failed to download ${url} ${res.statusCode} ${res.statusMessage}`);
      const stream = fs.createWriteStream(filename);
      res.pipe(stream);
      stream.on('finish', resolve);
    });
    req.on('error', reject);
    req.end();
  });
}

function writeFile(filename, data, timestamp) {
  return fs.promises.writeFile(
    path.join(dist, filename),
    JSON.stringify({ timestamp, ...data })
  );
}

async function cacheCover(entry) {
  const url = new URL(entry.cover);
  const ext = path.parse(url.pathname).ext;
  const outfile = crypto.createHash('sha256').update(entry.cover).digest('hex') + ext;
  const fullpath = path.join(dist, 'cover', outfile);
  entry.coverCache = coverEndpoint + outfile;

  if (fs.existsSync(fullpath)) {
    return;
  }

  const headers = {};
  if (url.hostname === "webtoon-phinf.pstatic.net") {
    headers["Referer"] = "http://www.webtoons.com";
  }
  return download(url, fullpath, headers);
}

async function write(filename, backup, timestamp, cat) {
  const gen = backup.generate(cat);
  await Promise.all(gen.map(e => cacheCover(e)));
  return writeFile(filename, {
    mangas: gen,
    categories: backup.getCategories(),
  }, timestamp);
}

const watcher = new Loader(backupDir, async function() {
  await write(outfileAll, this.backup, this.timestamp);

  for (const entry of categories) {
    await write(entry.outfile, this.backup, this.timestamp, entry.category);
  }
}).watch();

process.on('SIGTERM', () => watcher.close());
