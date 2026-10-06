const path = require('node:path');

function documentError(code, message) {
  return Object.assign(new Error(message), { code });
}

function createDocumentService(repository) {
  return {
    async upload(file, owner) {
      if (!file) throw documentError('FILE_REQUIRED', 'Selecione um arquivo.');
      try {
        if (file.size === 0) {
          throw documentError('INVALID_UPLOAD', 'O arquivo não pode estar vazio.');
        }
        const originalName = path.win32.basename(path.posix.basename(file.originalname))
          .replace(/[\x00-\x1f\x7f]/g, '').trim() || 'documento';
        return repository.save({
          id: file.filename,
          originalName,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          owner,
        }, file.filename);
      } catch (error) {
        await repository.removeFile(file.filename);
        throw error;
      }
    },

    list(owner) {
      try {
        return repository.listByOwner(owner);
      } catch {
        throw documentError('LIST_ERROR', 'Não foi possível listar os documentos.');
      }
    },

    async download(id, owner) {
      let download;
      try {
        download = await repository.findDownload(id, owner);
      } catch {
        throw documentError('DOWNLOAD_ERROR', 'Não foi possível baixar o documento.');
      }
      if (!download) {
        throw documentError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }
      return download;
    },
  };
}

module.exports = createDocumentService;