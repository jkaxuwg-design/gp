import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CompressionVisualizerProps {
  progress: number; // 0 to 100
  isActive: boolean;
}

export const CompressionVisualizer: React.FC<CompressionVisualizerProps> = ({ progress, isActive }) => {
  const { t } = useLanguage();
  
  if (!isActive) return null;

  // Calculate press position: 0% progress = 0% down, 50% progress = 50% down (compressing), then release?
  // Let's make it press down as progress goes up.
  // Visual range: 0% -> 0px translation. 100% -> almost touching bottom.
  const pressDepth = Math.min(progress, 90); 

  return (
    <div className="w-full h-24 bg-industrial-900 relative overflow-hidden border-t border-b border-industrial-800 my-4 flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(#323f4b 1px, transparent 1px), linear-gradient(90deg, #323f4b 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
      />

      {/* The "Data" Block being crushed */}
      <div 
        className="relative z-10 w-32 bg-industrial-neon-blue/20 border border-industrial-neon-blue flex items-center justify-center transition-all duration-100 ease-out"
        style={{ 
            height: `${100 - (pressDepth * 0.6)}%`, // Shrinks vertically
            width: `${128 + (pressDepth * 0.5)}px`  // Expands horizontally slightly (squash effect)
        }}
      >
        <div className="text-industrial-neon-blue font-mono text-xs font-bold whitespace-nowrap overflow-hidden">
          {progress < 100 ? t('vis_binary') : t('vis_compressed')}
        </div>
      </div>

      {/* Hydraulic Press Head (Top) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-48 bg-industrial-700 border-b-4 border-industrial-500 z-20 transition-all duration-300 ease-out shadow-xl"
        style={{ 
            height: '50%',
            top: `-${50 - (pressDepth * 0.5)}%` 
        }}
      >
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-industrial-900 font-bold tracking-widest uppercase">
            {t('vis_hydraulic')}
        </div>
      </div>

      {/* Base (Bottom) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-industrial-700 border-t-2 border-industrial-500 z-20" />

      {/* Sparks/Particles (CSS only for simplicity) */}
      {isActive && progress < 100 && (
          <>
            <div className="absolute left-1/3 top-1/2 w-1 h-1 bg-white animate-ping" />
            <div className="absolute right-1/3 top-1/2 w-1 h-1 bg-white animate-ping" style={{ animationDelay: '0.5s' }} />
          </>
      )}
    </div>
  );
};