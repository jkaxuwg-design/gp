import React, { useState, useRef, useEffect } from 'react';
import { GhostFile } from '../types';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ComparisonViewProps {
  file: GhostFile;
  onClose: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ file, onClose }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const { t } = useLanguage();

  // If we don't have a compressed result yet (or just previewing), handle gracefully
  // Ideally this is only opened when COMPLETED
  if (file.status !== 'COMPLETED' || !file.compressedBlob) return null;

  const originalUrl = file.previewUrl;
  // If we have a compressed blob, create a URL for it (should be done in parent usually, but safe here if we cleanup)
  const compressedUrl = file.compressedPreviewUrl || file.previewUrl; // Fallback

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[80vh] flex flex-col bg-industrial-900 border border-industrial-700 rounded-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="h-14 border-b border-industrial-700 flex items-center justify-between px-6 bg-industrial-900">
            <div className="flex items-center gap-4">
                <h3 className="text-industrial-100 font-mono font-bold">{t('comp_title')}</h3>
                <span className="text-xs font-mono text-industrial-400 bg-industrial-800 px-2 py-1 rounded">
                    {file.name}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="p-2 hover:bg-industrial-800 rounded text-industrial-300 hover:text-white"
                >
                    {isZoomed ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-red-900/30 rounded text-industrial-300 hover:text-red-400"
                >
                    <X size={18} />
                </button>
            </div>
        </div>

        {/* Comparison Area */}
        <div className="flex-1 relative overflow-hidden select-none bg-industrial-950 flex items-center justify-center">
            <div 
                ref={containerRef}
                className={`relative w-full h-full cursor-col-resize ${isZoomed ? 'scale-150' : 'scale-100'} transition-transform duration-300`}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
            >
                 {/* Images need to be centered and 'contain' or 'cover' identically */}
                 {file.type === 'video' ? (
                     <div className="flex items-center justify-center h-full text-industrial-400 font-mono">
                        {t('comp_video_msg')}
                     </div>
                 ) : (
                     <>
                        {/* After Image (Background) */}
                        <div 
                            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${compressedUrl})` }}
                        />
                        
                        {/* Before Image (Foreground - Clipped) */}
                        <div 
                            className="absolute inset-0 bg-contain bg-center bg-no-repeat border-r-2 border-industrial-neon-blue shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                            style={{ 
                                backgroundImage: `url(${originalUrl})`,
                                width: `${sliderPos}%`,
                            }}
                        />

                        {/* Slider Handle */}
                        <div 
                            className="absolute top-0 bottom-0 w-1 bg-transparent cursor-ew-resize z-10"
                            style={{ left: `${sliderPos}%` }}
                        >
                             <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-industrial-neon-blue rounded-full flex items-center justify-center shadow-lg">
                                <div className="w-1 h-4 bg-black/50 mx-[1px]" />
                                <div className="w-1 h-4 bg-black/50 mx-[1px]" />
                             </div>
                        </div>

                        {/* Labels */}
                        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 text-xs font-mono text-white rounded pointer-events-none">
                            {t('comp_original')} ({ (file.size / 1024 / 1024).toFixed(2) } MB)
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 text-xs font-mono text-industrial-neon-blue rounded pointer-events-none border border-industrial-neon-blue/30">
                            {t('comp_compressed')} ({ (file.compressedSize! / 1024 / 1024).toFixed(2) } MB)
                        </div>
                     </>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};