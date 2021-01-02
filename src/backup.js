const protobuf = require('protobufjs');

const root = protobuf.loadSync(process.env.TACHIYOMI_PROTO ?? 'tachiyomi.proto');
const Backup = root.lookupType('Backup');
const BackupManga = root.lookupType('BackupManga');

BackupManga.ctor.prototype.totalRead = function() {
  const read = this.chapters.filter(v => v.read).length;
  return read !== 0 ? read : undefined;
}

BackupManga.ctor.prototype.simpleEntry = function(slug, categories = []) {
  const read = this.totalRead();
  const chapters = this.chapters.length;
  return {
    slug,
    categories: categories.length ? categories : undefined,
    chapters,
    completed: this.status === 2 && read === chapters,
    read,
    title: this.title,
  };
}

BackupManga.ctor.prototype.fullEntry = function(slug) {
  const read = this.totalRead();
  const chapters = this.chapters.length;
  return {
    slug,
    artist: this.artist.length && this.artist !== this.author ? this.artist : undefined,
    author: this.author,
    chapters,
    completed: this.status === 2 && read === chapters,
    description: this.description,
    genre: this.genre,
    read,
    status: this.status,
    title: this.title,
  };
}

module.exports = Backup;
