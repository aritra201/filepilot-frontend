import { useState } from 'react';

export function UploadDropzone({ disabled, onFiles, children }) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`relative ${over && !disabled ? 'ring-2 ring-primary-container/40 ring-inset' : ''}`}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(false);
        const files = [...e.dataTransfer.files];
        if (files.length) onFiles(files);
      }}
    >
      {over && !disabled && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary-container/50 bg-primary-container/5">
          <p className="text-sm font-medium text-primary">Drop files to upload</p>
        </div>
      )}
      {children}
    </div>
  );
}
