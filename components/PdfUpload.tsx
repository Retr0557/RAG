import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';

interface PdfUploadProps {
  onPdfUpload: (file: File) => void;
  onTrySample: () => void;
  isLoading: boolean;
  statusMessage: string;
  error: string;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ onPdfUpload, onTrySample, isLoading, statusMessage, error }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onPdfUpload(file);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onPdfUpload(file);
    }
  }, [onPdfUpload]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {isLoading ? (
        <>
          <Spinner />
          <p className="mt-4 text-lg text-brand-accent">{statusMessage}</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-2 text-white">Ask Questions About Your Documents</h2>
          <p className="text-brand-subtext mb-8 max-w-md">
            Upload a PDF and get answers using the power of Gemini.
          </p>
          <div
            onDragEnter={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`w-full max-w-lg p-10 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragging ? 'border-brand-accent bg-brand-primary' : 'border-brand-primary hover:border-brand-accent'}`}
          >
            <input
              type="file"
              id="pdf-upload"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-brand-text">
                <span className="font-semibold text-brand-accent">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-brand-secondary">PDF only</p>
            </label>
          </div>
          <div className="my-6 flex items-center w-full max-w-lg">
            <div className="flex-grow border-t border-brand-primary"></div>
            <span className="flex-shrink mx-4 text-brand-subtext">OR</span>
            <div className="flex-grow border-t border-brand-primary"></div>
          </div>
           <button 
                onClick={onTrySample}
                className="w-full max-w-lg bg-brand-secondary/50 text-brand-accent font-semibold py-3 px-4 border border-brand-secondary rounded-lg hover:bg-brand-primary transition-colors"
           >
                🧪 Try a Sample Document
           </button>
           {error && <p className="mt-4 text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
};

export default PdfUpload;