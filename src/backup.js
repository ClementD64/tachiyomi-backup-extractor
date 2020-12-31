const protobuf = require('protobufjs');

const root = protobuf.loadSync(process.env.TACHIYOMI_PROTO ?? 'tachiyomi.proto');
const Backup = root.lookupType('Backup');
const BackupManga = root.lookupType('BackupManga');

Backup.ctor.prototype.queryCategories = function(name) {
  const index = this.backupCategories.findIndex(v => v.name === name);
  return this.backupManga.filter(v => v.categories.includes(index));
}

Backup.ctor.prototype.generate = function(cat) {
  return (typeof cat === "undefined" ? this.backupManga : this.queryCategories(cat)).map(v => v.entry());
}

Backup.ctor.prototype.getCategories = function() {
  return this.backupCategories.map(v => v.name);
}

BackupManga.ctor.prototype.totalRead = function() {
  const read = this.chapters.filter(v => v.read).length;
  return read !== 0 ? read : undefined;
}

BackupManga.ctor.prototype.entry = function() {
  const read = this.totalRead();
  const chapters = this.chapters.length;
  return {
    artist: this.artist.length && this.artist !== this.author ? this.artist : undefined,
    author: this.author,
    categories: this.categories,
    chapters,
    completed: this.status === 2 && read === chapters,
    cover: this.thumbnailUrl,
    description: this.description,
    genre: this.genre,
    read,
    status: this.status,
    title: this.title,
  };
}

module.exports = Backup;
