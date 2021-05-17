const fs = require('fs').promises;
const path = require('path');
const { gunzipSync } = require('zlib');
const Backup = require('./backup');

class Loader {
  backup = {};
  timestamp = 0;
  root = "";
  callback = () => {};

  constructor(root, callback) {
    this.root = root;
    this.callback = callback;
  }

  async watch() {
    await this.load();
    return fs.watch(this.root, () => this.load());
  }

  async load() {
    const last = await this.getLatestFile();
    this.timestamp = last[1];
    await this.loadBackup(path.join(this.root, last[0]));
    this.callback();
  }

  async getLatestFile() {
    return (await fs.readdir(this.root))
      .filter(v => v.endsWith(".proto.gz"))
      .map(v => [v, Loader.parseFilename(v)])
      .filter(v => v[1])
      .sort((a, b) => b[1] - a[1])[0];
  }

  async loadBackup(filename) {
    this.backup = Backup.decode(gunzipSync(await fs.readFile(filename)));
  }

  static parseFilename(filename) {
    const match = filename.match(/^tachiyomi_(?<y>\d+)-(?<M>\d+)-(?<d>\d+)_(?<h>\d+)-(?<m>\d+)\.proto\.gz$/);
    if (match === null) {
      return;
    }
    return new Date(match.groups.y, match.groups.M - 1, match.groups.d, match.groups.h, match.groups.m).getTime() / 1000;
  }
}

module.exports = Loader;
