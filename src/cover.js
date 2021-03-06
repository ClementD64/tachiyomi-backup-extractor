const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');

const coverTTL = Number(process.env.TACHIYOMI_COVER_TTL ?? 604800) * 1000;
if (isNaN(coverTTL)) {
  throw new Error(`Invalid cover TTL ${process.env.TACHIYOMI_COVER_TTL}`);
}

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

function buildHeader(url) {
  switch (url.hostname) {
    case 'webtoon-phinf.pstatic.net':
      return { 'Referer': 'http://www.webtoons.com' };
  }

  return {};
}

function cacheCover(coverUrl, coverDir) {
  const url = new URL(coverUrl);
  const ext = path.parse(url.pathname).ext;
  const outfile = crypto.createHash('sha256').update(coverUrl).digest('hex') + ext;

  const fullpath = path.join(coverDir, outfile);

  return {
    path: fullpath,
    promise: (async () => {
      const stat = await fs.promises.stat(fullpath).catch(() => false);
      if (stat && Date.now() - stat.mtimeMs < coverTTL) {
        return;
      }

      return download(url, fullpath, buildHeader(url));
    })(),
  };
}

module.exports = cacheCover;
