import React, { useState, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { FileItem } from './components/FileItem';
import { PrivacyShield } from './components/PrivacyShield';
import { ComparisonView } from './components/ComparisonView';
import { GhostFile, ProcessingState, FileType } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { ffmpegService } from './services/ffmpegService';
import { Activity, LayoutGrid, Cpu, Languages } from 'lucide-react';
import { Button } from './components/ui/Button';
import { useLanguage } from './contexts/LanguageContext';

const App: React.FC = () => {
  const [files, setFiles] = useState<GhostFile[]>([]);
  const [comparisonFile, setComparisonFile] = useState<GhostFile | null>(null);
  const [globalProcessing, setGlobalProcessing] = useState(false);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  // Initialize FFmpeg on mount
  useEffect(() => {
    const init = async () => {
      await ffmpegService.load();
      setFfmpegReady(true);
    };
    init();
  }, []);

  const handleFilesDropped = (uploadedFiles: File[]) => {
    const newFiles: GhostFile[] = uploadedFiles.map(file => {
        const type: FileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'other';
        return {
            id: Math.random().toString(36).substr(2, 9),
            originalFile: file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            type,
            status: ProcessingState.IDLE,
            progress: 0,
            settings: { ...DEFAULT_SETTINGS },
        };
    });
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
        const file = prev.find(f => f.id === id);
        if (file) {
            URL.revokeObjectURL(file.previewUrl);
            if (file.compressedPreviewUrl) URL.revokeObjectURL(file.compressedPreviewUrl);
        }
        return prev.filter(f => f.id !== id);
    });
  };

  const updateFileSettings = (id: string, key: string, value: any) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, settings: { ...f.settings, [key]: value } } : f));
  };

  const processFile = async (id: string) => {
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex === -1) return;

    const file = files[fileIndex];
    
    // Update State to Compressing
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: ProcessingState.COMPRESSING, progress: 0 } : f));
    setGlobalProcessing(true);

    try {
        const startTime = Date.now();
        
        // Call Service
        const compressedBlob = await ffmpegService.compressFile(file, (progress) => {
            setFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
        });

        const compressedUrl = URL.createObjectURL(compressedBlob);
        
        setFiles(prev => prev.map(f => f.id === id ? { 
            ...f, 
            status: ProcessingState.COMPLETED, 
            progress: 100,
            compressedBlob,
            compressedPreviewUrl: compressedUrl,
            compressedSize: compressedBlob.size,
            endTime: Date.now(),
            startTime
        } : f));

    } catch (error: any) {
        console.error(error);
        setFiles(prev => prev.map(f => f.id === id ? { 
            ...f, 
            status: ProcessingState.ERROR, 
            error: error.message 
        } : f));
    } finally {
        // Check if any are still processing
        const stillProcessing = files.some(f => f.id !== id && f.status === ProcessingState.COMPRESSING);
        if (!stillProcessing) setGlobalProcessing(false);
    }
  };

  const processAll = () => {
      files.forEach(f => {
          if (f.status === ProcessingState.IDLE) processFile(f.id);
      });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-industrial-950 text-industrial-100 font-sans selection:bg-industrial-500 selection:text-white">
      
      {/* Navbar */}
      <header className="border-b border-industrial-800 bg-industrial-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-industrial-100 text-industrial-900 p-1.5 rounded-sm font-bold font-mono text-xl tracking-tighter">
                    GP
                </div>
                <div>
                    <h1 className="font-mono font-bold text-lg tracking-wide leading-none">{t('app_title')}</h1>
                    <div className="text-[10px] text-industrial-500 font-mono tracking-widest uppercase">
                        {t('app_subtitle')}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-xs font-mono text-industrial-500">
                    {ffmpegReady ? (
                        <span className="flex items-center gap-1 text-emerald-500">
                             <Cpu size={14} /> {t('wasm_ready')} {ffmpegService.isSimulating() && t('sim_mode')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-amber-500 animate-pulse">
                             <Cpu size={14} /> {t('loading_core')}
                        </span>
                    )}
                </div>
                <PrivacyShield />
                <button 
                  onClick={toggleLanguage}
                  className="p-2 hover:bg-industrial-800 rounded-lg text-industrial-400 hover:text-industrial-100 transition-colors"
                  title="Switch Language"
                >
                  <Languages size={18} />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
          
          {/* Header Stats / Info */}
          <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4">
              <div>
                  <h2 className="text-2xl font-mono font-light text-white mb-2">{t('workbench_title')}</h2>
                  <p className="text-industrial-400 text-sm max-w-lg">
                      {t('workbench_desc')}
                  </p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right hidden md:block">
                     <div className="text-xs font-mono text-industrial-500 uppercase">{t('stat_total_files')}</div>
                     <div className="text-xl font-mono font-bold text-industrial-100">{files.length}</div>
                 </div>
                 <div className="text-right hidden md:block">
                     <div className="text-xs font-mono text-industrial-500 uppercase">{t('stat_savings')}</div>
                     <div className="text-xl font-mono font-bold text-emerald-400">
                        {files.reduce((acc, f) => acc + (f.compressedSize ? (f.size - f.compressedSize) : 0), 0) / 1024 / 1024 > 0 
                            ? (files.reduce((acc, f) => acc + (f.compressedSize ? (f.size - f.compressedSize) : 0), 0) / 1024 / 1024).toFixed(2) + ' MB'
                            : '--'}
                     </div>
                 </div>
              </div>
          </div>

          {/* Upload Area */}
          <DropZone onFilesDropped={handleFilesDropped} isProcessing={globalProcessing} />

          {/* Action Bar */}
          {files.length > 0 && (
              <div className="flex items-center justify-between mt-8 mb-4 border-b border-industrial-800 pb-4">
                  <div className="flex items-center gap-2 text-industrial-400 text-sm font-mono">
                      <LayoutGrid size={16} />
                      {t('queue_manifest')} [{files.length}]
                  </div>
                  <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setFiles([])}
                        disabled={globalProcessing}
                      >
                          {t('btn_clear_all')}
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={processAll}
                        disabled={globalProcessing || files.every(f => f.status === ProcessingState.COMPLETED)}
                        isLoading={globalProcessing}
                      >
                          <Activity size={18} /> {t('btn_init_all')}
                      </Button>
                  </div>
              </div>
          )}

          {/* File List */}
          <div className="space-y-4">
              {files.map(file => (
                  <FileItem 
                    key={file.id} 
                    file={file} 
                    onRemove={removeFile}
                    onCompress={processFile}
                    onCompare={(f) => setComparisonFile(f)}
                    onUpdateSettings={updateFileSettings}
                  />
              ))}
          </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-industrial-900 mt-12 py-8 text-center">
          <p className="text-industrial-600 text-xs font-mono uppercase tracking-widest">
              {t('footer_text')}
          </p>
      </footer>

      {/* Modals */}
      {comparisonFile && (
          <ComparisonView 
            file={comparisonFile} 
            onClose={() => setComparisonFile(null)} 
          />
      )}
    </div>
  );
};

export default App;