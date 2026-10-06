function createDocumentController(service) {
  const owner = 'local';

  return {
    async upload(req, res) {
      const document = await service.upload(req.file, owner);
      res.status(201).json(document);
    },

    list(req, res) {
      res.json({ documents: service.list(owner) });
    },

    async download(req, res, next) {
      const document = await service.download(req.params.id, owner);
      res.download(document.filePath, document.originalName, (error) => {
        if (!error) return;
        if (res.headersSent) return next(error);
        const code = error.code === 'ENOENT' ? 'DOCUMENT_NOT_FOUND' : 'DOWNLOAD_ERROR';
        next(Object.assign(new Error('Falha ao enviar documento.'), { code }));
      });
    },
  };
}

module.exports = createDocumentController;