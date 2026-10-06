import { FileText, FolderOpen, LoaderCircle, RefreshCw } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${numberFormatter.format(bytes / 1024)} KB`;
  return `${numberFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, isLoading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-heading" aria-busy={isLoading}>
      <div className="section-heading">
        <h2 id="documents-heading">Documentos <span className="document-count">{documents.length}</span></h2>
        <button className="icon-button" type="button" onClick={onRefresh} disabled={isLoading} title="Atualizar lista" aria-label="Atualizar lista">
          <RefreshCw size={19} className={isLoading ? 'spin' : undefined} aria-hidden="true" />
        </button>
      </div>
      {error && <p className="message error" role="alert">{error}</p>}
      {isLoading && <p className="list-status" role="status"><LoaderCircle size={18} className="spin" aria-hidden="true" /> Carregando documentos...</p>}
      {!isLoading && !error && documents.length === 0 && (
        <div className="empty-state"><FolderOpen size={32} aria-hidden="true" /><p>Nenhum documento.</p></div>
      )}
      {documents.length > 0 && (
        <div className="document-table" role="table" aria-label="Documentos enviados">
          <div className="document-row table-heading" role="row">
            <span role="columnheader">Nome</span>
            <span role="columnheader">Tamanho</span>
            <span role="columnheader">Enviado em</span>
            <span role="columnheader" className="action-heading">Download</span>
          </div>
          {documents.map((document) => (
            <div className="document-row" role="row" key={document.id}>
              <div className="document-name" role="cell"><FileText size={20} aria-hidden="true" /><span>{document.originalName}</span></div>
              <div className="document-size" role="cell">{formatSize(document.size)}</div>
              <div className="document-date" role="cell"><time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time></div>
              <div className="document-download" role="cell"><DownloadButton document={document} /></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}