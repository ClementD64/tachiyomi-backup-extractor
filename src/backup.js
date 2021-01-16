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
  const total = this.chapters.length;
  return {
    slug,
    categories: categories.length ? categories : undefined,
    read,
    title: this.title,
    total,
  };
}

BackupManga.ctor.prototype.fullEntry = function(slug) {
  const read = this.totalRead();
  const total = this.chapters.length;
  return {
    slug,
    artist: this.artist.length && this.artist !== this.author ? this.artist : undefined,
    author: this.author,
    chapters: this.chapters.sort((a, b) => b.sourceOrder - a.sourceOrder).map(v => ({
      name: v.name,
      read: v.read,
      number: v.chapterNumber,
    })),
    description: this.description,
    genre: this.genre,
    read,
    status: this.status,
    title: this.title,
    total,
  };
}

module.exports = Backup;
