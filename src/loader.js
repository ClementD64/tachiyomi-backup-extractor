const fs = require('fs');
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

  watch() {
    this.load();
    return fs.watch(this.root, () => this.load());
  }

  load() {
    const last = this.getLatestFile();
    this.timestamp = last[1];
    this.loadBackup(path.join(this.root, last[0]));
    this.callback();
  }

  getLatestFile() {
    return fs.readdirSync(this.root)
      .filter(v => v.endsWith(".proto.gz"))
      .map(v => [v, Loader.parseFilename(v)])
      .sort((a, b) => b[1] - a[1])[0];
  }

  loadBackup(filename) {
    this.backup = Backup.decode(gunzipSync(fs.readFileSync(filename)));
  }

  static parseFilename(filename) {
    const match = filename.match(/^tachiyomi_(?<y>\d+)-(?<M>\d+)-(?<d>\d+)_(?<h>\d+)-(?<m>\d+)\.proto\.gz$/);
    return Date.UTC(match.groups.y, match.groups.M, match.groups.d, match.groups.h, match.groups.m);
  }
}

module.exports = Loader;
