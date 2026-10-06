import { useEffect, useState } from 'react';
import { Files, HardDrive } from 'lucide-react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listDocuments({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setDocuments(result);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [refreshVersion]);

  function refreshDocuments() {
    setError('');
    setIsLoading(true);
    setRefreshVersion((version) => version + 1);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title"><Files size={28} aria-hidden="true" /><h1>Document Management System</h1></div>
        <span className="storage-label"><HardDrive size={16} aria-hidden="true" /> Armazenamento local</span>
      </header>
      <main>
        <UploadComponent onUploaded={refreshDocuments} />
        <DocumentList documents={documents} isLoading={isLoading} error={error} onRefresh={refreshDocuments} />
      </main>
    </div>
  );
}
