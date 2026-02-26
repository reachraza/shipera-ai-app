'use client';

import { useState, useRef } from 'react';
import { processFile } from '@/utils/csvParser';
import { Info } from 'lucide-react';
import { createLanes } from '@/services/laneService';

interface CSVUploadProps {
  rfpId: string;
  onUploaded: () => void;
}

export default function CSVUpload({ rfpId, onUploaded }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleFile(file: File) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (
      file.type !== 'text/csv' &&
      !file.name.endsWith('.csv') &&
      !file.name.endsWith('.xlsx') &&
      !file.type.includes('spreadsheetml')
    ) {
      setError('Please upload a valid CSV or XLSX file.');
      setLoading(false);
      return;
    }

    try {
      const result = await processFile(file);

      if (result.errors.length > 0) {
        setError(result.errors.join('\n'));
        setLoading(false);
        return;
      }

      if (result.lanes.length === 0) {
        setError('No valid lanes found in the CSV file.');
        setLoading(false);
        return;
      }

      await createLanes(rfpId, result.lanes);

      setSuccess(`Successfully added ${result.lanes.length} lanes.`);
      onUploaded();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${isDragging
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50'
          }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          disabled={loading}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-background border border-border text-primary shadow-sm group-hover:bg-primary/10'}`}>
            {loading ? (
              <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            )}
          </div>

          <div>
            <div className="text-foreground font-bold text-lg mb-1 flex items-center justify-center gap-2">
              {loading ? 'Processing File...' : 'Click or Drag & Drop Network CSV or XLSX'}
              <div className="relative group/tooltip flex items-center justify-center">
                <Info size={16} className="text-muted-foreground hover:text-primary cursor-help transition-colors" />
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 w-64 p-4 bg-card text-card-foreground border border-border rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-2xl shadow-black/20 z-[99999] pointer-events-none text-left">
                  <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-2">Required Columns</p>
                  <p className="font-mono text-xs text-primary mb-3 leading-relaxed">origin_city, origin_state, destination_city, destination_state, equipment_type</p>
                  <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-2">Optional</p>
                  <p className="font-mono text-xs text-muted-foreground">frequency</p>

                  {/* Triangle indicator */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 border-4 border-transparent border-b-border" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 border-[3px] border-transparent border-b-card translate-y-[1px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {success}
        </div>
      )}
    </div>
  );
}
