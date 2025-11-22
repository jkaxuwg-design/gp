import { GhostFile } from '../types';

class FFmpegService {
  private worker: Worker | null = null;
  private callbacks = new Map<string, (data: any) => void>();
  private isWorkerLoaded = false;

  constructor() {
    // Initialize worker
    // Note: In some bundlers, new Worker(new URL(...)) is required.
    try {
        this.worker = new Worker(new URL('./ffmpeg.worker.ts', import.meta.url), { type: 'module' });
        
        this.worker.onmessage = (e) => {
          const { type, payload } = e.data;
          
          if (type === 'LOADED') {
              this.isWorkerLoaded = true;
              console.log('GhostPress: Worker Engine Loaded');
          }
          
          if (type === 'ERROR') {
              console.error('GhostPress Worker Error:', payload);
          }

          if (type === 'PROGRESS') {
              const callback = this.callbacks.get(`p_${payload.id}`);
              if (callback) callback(payload.progress);
          }
          
          if (type === 'DONE') {
              const callback = this.callbacks.get(`d_${payload.id}`);
              if (callback) callback(payload.buffer);
          }
        };
    } catch (e) {
        console.error("Failed to initialize FFmpeg worker", e);
    }
  }

  public async load(): Promise<void> {
    if (this.isWorkerLoaded) return;
    this.worker?.postMessage({ type: 'LOAD' });
    // We don't strictly await the load here to avoid blocking UI, 
    // the compress function will check/wait or the worker will queue.
  }

  public isSimulating() {
    return false; // Worker implementation aims for real processing
  }

  async compressFile(file: GhostFile, onProgress: (p: number) => void): Promise<Blob> {
    if (!this.worker) throw new Error("Worker not initialized");
    
    return new Promise((resolve, reject) => {
      const id = file.id;
      
      // Set progress callback
      this.callbacks.set(`p_${id}`, onProgress);
      
      // Set completion callback
      this.callbacks.set(`d_${id}`, (buffer: ArrayBuffer) => {
        // Determine mime type based on file type or output format
        // For this demo, we default video to mp4
        const type = file.type === 'video' ? 'video/mp4' : file.originalFile.type;
        resolve(new Blob([buffer], { type }));
        
        // Cleanup
        this.callbacks.delete(`p_${id}`);
        this.callbacks.delete(`d_${id}`);
      });

      this.worker?.postMessage({ 
          type: 'COMPRESS', 
          payload: { 
              file: file.originalFile, 
              settings: file.settings, 
              id 
          } 
      });
    });
  }
}

export const ffmpegService = new FFmpegService();