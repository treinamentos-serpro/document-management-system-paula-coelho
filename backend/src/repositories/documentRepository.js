const { mkdir, stat, unlink } = require('node:fs/promises');
const path = require('node:path');

function createDocumentRepository(storageDir) {
  const directory = path.resolve(storageDir);
  const records = new Map();

  function resolveFilename(filename) {
    if (path.basename(filename) !== filename) {
      throw new Error('Nome interno de arquivo inválido.');
    }
    return path.join(directory, filename);
  }

  return {
    async prepareStorage() {
      await mkdir(directory, { recursive: true });
      return directory;
    },

    save(document, filename) {
      if (records.has(document.id)) {
        throw new Error('Identificador de documento já utilizado.');
      }
      records.set(document.id, { document: { ...document }, filename });
      return { ...document };
    },

    listByOwner(owner) {
      return [...records.values()]
        .filter((record) => record.document.owner === owner)
        .map((record) => ({ ...record.document }))
        .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
    },

    async findDownload(id, owner) {
      const record = records.get(id);
      if (!record || record.document.owner !== owner) return null;
      const filePath = resolveFilename(record.filename);
      try {
        const information = await stat(filePath);
        if (!information.isFile()) return null;
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
      return { filePath, originalName: record.document.originalName };
    },

    async removeFile(filename) {
      try {
        await unlink(resolveFilename(filename));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    },
  };
}

module.exports = createDocumentRepository;