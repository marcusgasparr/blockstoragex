import React, { useEffect, useState } from 'react';

interface FilePreviewProps {
  path: string;
  extension?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ path, extension }) => {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        if (extension === 'pdf') {
          setContent(null); // PDF será renderizado via embed
          return;
        }
        if (extension === 'docx') {
          setContent(null); // DOCX será renderizado via embed
          return;
        }
        const response = await fetch(`http://localhost:3001/api/files/read?path=${encodeURIComponent(path)}`);
        if (!response.ok) throw new Error('Erro ao ler arquivo');
        const text = await response.text();
        setContent(text);
      } catch (err: any) {
        setError(err.message || 'Erro ao ler arquivo');
      }
    };
    fetchFile();
  }, [path, extension]);

  if (error) return <div style={{ color: '#d00', padding: '1rem' }}>{error}</div>;

  if (extension === 'pdf') {
    return (
      <iframe
        src={`http://localhost:3001/api/files/download?path=${encodeURIComponent(path)}`}
        title="Visualização PDF"
        style={{ width: '100%', height: '60vh', border: 'none' }}
      />
    );
  }
  if (extension === 'docx') {
    return (
      <iframe
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent('http://localhost:3001/api/files/download?path=' + path)}`}
        title="Visualização DOCX"
        style={{ width: '100%', height: '60vh', border: 'none' }}
      />
    );
  }
  if (extension === 'json') {
    try {
      const jsonObj = content ? JSON.parse(content) : null;
      return (
        <pre style={{ background: '#222', color: '#fff', padding: '1rem', borderRadius: '8px', maxHeight: '60vh', overflow: 'auto' }}>
          {JSON.stringify(jsonObj, null, 2)}
        </pre>
      );
    } catch {
      return <pre style={{ background: '#222', color: '#fff', padding: '1rem', borderRadius: '8px', maxHeight: '60vh', overflow: 'auto' }}>{content}</pre>;
    }
  }
  return (
    <pre style={{ background: '#222', color: '#fff', padding: '1rem', borderRadius: '8px', maxHeight: '60vh', overflow: 'auto' }}>{content}</pre>
  );
};

export default FilePreview;
