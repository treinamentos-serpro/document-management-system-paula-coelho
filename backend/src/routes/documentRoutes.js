const { Router } = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');

function createDocumentRouter(controller, { prepareStorage, maxFileSize }) {
  const router = Router();
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      prepareStorage().then(
        (directory) => callback(null, directory),
        () => callback(Object.assign(new Error('Falha no armazenamento.'), { code: 'STORAGE_ERROR' })),
      );
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: maxFileSize, files: 1, fields: 10, fieldSize: 1024, parts: 11 },
  }).single('file');

  router.post('/upload', (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) return next(error);
      const code = error.code ? 'STORAGE_ERROR' : 'INVALID_UPLOAD';
      next(Object.assign(new Error('Falha no envio do arquivo.'), { code }));
    });
  }, controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = createDocumentRouter;