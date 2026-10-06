import { useRef, useState } from 'react';
import { LoaderCircle, Upload } from 'lucide-react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;
    setIsUploading(true);
    setError('');
    setSuccess('');
    try {
      const document = await uploadDocument(file);
      setSuccess(`${document.originalName} enviado com sucesso.`);
      setFile(null);
      inputRef.current.value = '';
      onUploaded();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Enviar documento</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="file-field">
          <label htmlFor="document-file">Arquivo</label>
          <input
            ref={inputRef}
            id="document-file"
            type="file"
            disabled={isUploading}
            onChange={(event) => {
              setFile(event.target.files[0] || null);
              setError('');
              setSuccess('');
            }}
          />
        </div>
        <button className="primary-button" type="submit" disabled={!file || isUploading}>
          {isUploading ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      <p className="message success" role="status">{success}</p>
    </section>
  );
}