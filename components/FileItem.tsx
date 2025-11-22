/// <reference lib="dom" />
import React, { useState } from 'react';
import { GhostFile, ProcessingState } from '../types';
import { Button } from './ui/Button';
import { FileImage, FileVideo, Download, Eye, Settings, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { CompressionVisualizer } from './CompressionVisualizer';
import { useLanguage } from '../contexts/LanguageContext';

interface FileItemProps {
  file: GhostFile;
  onRemove: (id: string) => void;
  onCompress: (id: string) => void;
  onCompare: (file: GhostFile) => void;
  onUpdateSettings: (id: string, key: string, value: any) => void;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onCompress, onCompare, onUpdateSettings }) => {
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useLanguage();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusLabel = (status: ProcessingState) => {
      switch (status) {
          case ProcessingState.IDLE: return t('status_idle');
          case ProcessingState.QUEUED: return t('status_queued');
          case ProcessingState.COMPRESSING: return t('status_compressing');
          case ProcessingState.COMPLETED: return t('status_completed');
          case ProcessingState.ERROR: return t('status_error');
          default: return status;
      }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case ProcessingState.COMPLETED: return 'text-emerald-400';
      case ProcessingState.ERROR: return 'text-red-400';
      case ProcessingState.COMPRESSING: return 'text-amber-400';
      default: return 'text-industrial-400';
    }
  };

  const isCompleted = file.status === ProcessingState.COMPLETED;
  const isCompressing = file.status === ProcessingState.COMPRESSING;

  return (
    <div className="bg-industrial-900 border border-industrial-700 rounded-lg overflow-hidden mb-4 transition-all hover:border-industrial-600">
      
      {/* Main Row */}
      <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
        
        {/* Icon & Preview */}
        <div className="flex-shrink-0 relative w-16 h-16 bg-industrial-950 rounded border border-industrial-800 overflow-hidden flex items-center justify-center">
          {file.type === 'video' ? (
             <FileVideo className="text-industrial-600" />
          ) : (
            <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover opacity-80" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <h4 className="font-mono font-medium text-industrial-100 truncate" title={file.name}>{file.name}</h4>
             <span className={`text-xs font-bold uppercase ${getStatusColor()}`}>
               [{getStatusLabel(file.status)}]
             </span>
          </div>
          <div className="flex items-center gap-4 text-sm font-mono text-industrial-400">
             <span>{formatSize(file.size)}</span>
             {isCompleted && (
                 <>
                    <span className="text-industrial-600">→</span>
                    <span className="text-emerald-400 font-bold">{formatSize(file.compressedSize || 0)}</span>
                    <span className="text-xs bg-emerald-900/30 text-emerald-300 px-1.5 rounded">
                        -{Math.round((1 - (file.compressedSize! / file.size)) * 100)}%
                    </span>
                 </>
             )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end md:self-center">
            {isCompleted ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => onCompare(file)}>
                    <Eye size={16} /> {t('btn_compare')}
                  </Button>
                  <a 
                    href={file.compressedPreviewUrl} 
                    download={`ghostpress_${file.name}`}
                    className="inline-flex"
                  >
                    <Button variant="primary" size="sm">
                        <Download size={16} /> {t('btn_save')}
                    </Button>
                  </a>
                </>
            ) : !isCompressing ? (
                <Button variant="primary" size="sm" onClick={() => onCompress(file.id)}>
                    {t('btn_init')}
                </Button>
            ) : null}

            <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded hover:bg-industrial-800 transition-colors ${showSettings ? 'text-industrial-100 bg-industrial-800' : 'text-industrial-500'}`}
                disabled={isCompressing || isCompleted}
            >
                <Settings size={18} />
            </button>
            <button 
                onClick={() => onRemove(file.id)}
                className="p-2 rounded hover:bg-red-900/20 text-industrial-500 hover:text-red-400 transition-colors"
                disabled={isCompressing}
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>

      {/* Visualizer when compressing */}
      {isCompressing && (
          <div className="px-4 pb-4">
              <CompressionVisualizer isActive={true} progress={file.progress} />
              <div className="w-full bg-industrial-950 h-1 mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${file.progress}%` }} 
                  />
              </div>
              <div className="text-right text-xs font-mono text-amber-500 mt-1">
                  {t('processing_chunk')} {file.progress}%
              </div>
          </div>
      )}

      {/* Settings Panel */}
      {showSettings && !isCompressing && !isCompleted && (
          <div className="px-4 pb-4 pt-0 border-t border-industrial-800/50 mt-2 bg-industrial-900/50">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                 <div>
                     <label className="block text-xs font-mono text-industrial-400 mb-1">{t('label_quality')}</label>
                     <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={file.settings.quality}
                        onChange={(e) => onUpdateSettings(file.id, 'quality', parseInt((e.target as HTMLInputElement).value))}
                        className="w-full h-2 bg-industrial-800 rounded-lg appearance-none cursor-pointer accent-industrial-400"
                     />
                     <div className="flex justify-between text-xs font-mono text-industrial-500 mt-1">
                         <span>{t('label_max_compress')}</span>
                         <span>{file.settings.quality}%</span>
                         <span>{t('label_max_quality')}</span>
                     </div>
                 </div>
                 
                 <div>
                     <label className="block text-xs font-mono text-industrial-400 mb-1">{t('label_metadata')}</label>
                     <button 
                        onClick={() => onUpdateSettings(file.id, 'stripMetadata', !file.settings.stripMetadata)}
                        className={`w-full py-2 px-3 rounded border text-xs font-mono transition-all ${
                            file.settings.stripMetadata 
                            ? 'bg-industrial-800 border-industrial-600 text-emerald-400' 
                            : 'bg-transparent border-industrial-700 text-industrial-500'
                        }`}
                     >
                        {file.settings.stripMetadata ? t('btn_meta_enabled') : t('btn_meta_disabled')}
                     </button>
                 </div>

                 {file.type === 'video' && (
                     <div>
                        <label className="block text-xs font-mono text-industrial-400 mb-1">{t('label_format')}</label>
                         <select 
                            value={file.settings.format}
                            onChange={(e) => onUpdateSettings(file.id, 'format', (e.target as HTMLSelectElement).value)}
                            className="w-full bg-industrial-950 border border-industrial-700 text-industrial-300 text-sm rounded p-2 focus:ring-1 focus:ring-industrial-500 outline-none"
                         >
                             <option value="original">{t('opt_original')}</option>
                             <option value="mp4">MP4 (H.264)</option>
                         </select>
                     </div>
                 )}
             </div>
          </div>
      )}

      {/* Error Display */}
      {file.status === ProcessingState.ERROR && (
          <div className="px-4 pb-4 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertTriangle size={12} />
              {t('status_error')}: {file.error || 'Unknown compression failure.'}
          </div>
      )}
    </div>
  );
};