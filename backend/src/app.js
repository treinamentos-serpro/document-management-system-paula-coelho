const express = require('express');
const multer = require('multer');
const path = require('node:path');
const createDocumentRepository = require('./repositories/documentRepository');
const createDocumentService = require('./services/documentService');
const createDocumentController = require('./controllers/documentController');
const createDocumentRouter = require('./routes/documentRoutes');

const PORT = process.env.PORT || 3000;

function createApp(options = {}) {
  const storageDir = options.storageDir || process.env.STORAGE_DIR || path.join(__dirname, '../storage');
  const maxFileSize = Number(options.maxFileSize ?? process.env.MAX_FILE_SIZE ?? 10 * 1024 * 1024);
  if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
    throw new Error('MAX_FILE_SIZE deve ser um inteiro positivo em bytes.');
  }
  const app = express();
  const repository = createDocumentRepository(storageDir);
  const service = createDocumentService(repository);
  const controller = createDocumentController(service);

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentRouter(controller, {
    prepareStorage: repository.prepareStorage,
    maxFileSize,
  }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let code = error.code;
    if (error instanceof multer.MulterError) {
      code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
    }
    if (error.type === 'entity.parse.failed') code = 'INVALID_UPLOAD';
    const errors = {
      FILE_REQUIRED: [400, 'Selecione um arquivo.'],
      INVALID_UPLOAD: [400, 'Envio de arquivo inválido.'],
      FILE_TOO_LARGE: [413, 'O arquivo excede o tamanho permitido.'],
      DOCUMENT_NOT_FOUND: [404, 'Documento não encontrado.'],
      LIST_ERROR: [500, 'Não foi possível listar os documentos.'],
      DOWNLOAD_ERROR: [500, 'Não foi possível baixar o documento.'],
      STORAGE_ERROR: [500, 'Não foi possível armazenar o documento.'],
    };
    if (!Object.hasOwn(errors, code)) code = 'STORAGE_ERROR';
    const [status, message] = errors[code];
    res.status(status).json({ error: { code, message } });
  });
  return app;
}

const app = createApp();
app.createApp = createApp;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
