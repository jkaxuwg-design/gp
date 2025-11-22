/// <reference lib="dom" />
import React, { useCallback, useState } from 'react';
import { Upload, FileUp, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesDropped, isProcessing }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const { t } = useLanguage();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragActive(true);
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isProcessing) return;

    // Recursive file scanning
    const getFilesFromEntry = async (entry: any): Promise<File[]> => {
        if (entry.isFile) {
            return new Promise(resolve => entry.file(resolve));
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            return new Promise(resolve => {
                reader.readEntries(async (entries: any[]) => {
                    const files = await Promise.all(entries.map(getFilesFromEntry));
                    resolve(files.flat());
                });
            });
        }
        return [];
    };

    const items = Array.from(e.dataTransfer.items);
    const promises = items.map(item => {
        const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
        if (entry) {
            return getFilesFromEntry(entry);
        }
        // Fallback for non-webkit browsers or non-entry items
        const file = item.getAsFile();
        return file ? [file] : [];
    });

    const nestedFiles = await Promise.all(promises);
    const allFiles = nestedFiles.flat();

    // Basic filtering for supported types
    const validFiles = allFiles.filter(f => 
        f.type.startsWith('video/') || 
        f.type.startsWith('image/') ||
        // Allow some containers that might not have strict mime types in all browsers
        f.name.endsWith('.mkv') || 
        f.name.endsWith('.mov')
    );

    if (validFiles.length > 0) {
      onFilesDropped(validFiles);
    }
  }, [onFilesDropped, isProcessing]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      onFilesDropped(Array.from(target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300
        min-h-[250px] flex flex-col items-center justify-center p-8
        ${isDragActive 
          ? 'border-industrial-neon-blue bg-industrial-800/50 scale-[1.01] shadow-[0_0_30px_rgba(0,225,255,0.1)]' 
          : 'border-industrial-700 bg-industrial-900/30 hover:border-industrial-500 hover:bg-industrial-900/50'}
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />
      
      <div className={`transition-transform duration-300 ${isDragActive ? 'scale-110' : 'scale-100'}`}>
        {isDragActive ? (
          <FileUp className="w-16 h-16 text-industrial-neon-blue mb-4" />
        ) : (
          <Upload className="w-16 h-16 text-industrial-500 mb-4 group-hover:text-industrial-300" />
        )}
      </div>

      <h3 className="text-xl font-mono font-bold text-industrial-100 mb-2 text-center">
        {isDragActive ? t('drop_release') : t('drop_initiate')}
      </h3>
      
      <p className="text-industrial-400 font-mono text-sm text-center max-w-md">
        {t('drop_desc')} <br/>
        <span className="text-xs opacity-60 mt-2 block">
            {t('drop_support')}
        </span>
      </p>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-industrial-600 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-industrial-600 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-industrial-600 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-industrial-600 rounded-br-lg" />
    </div>
  );
};