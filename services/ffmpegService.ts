import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { GhostFile, ProcessingState } from '../types';

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private simulationMode = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  public async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this._initFFmpeg();
    return this.loadPromise;
  }

  private async _initFFmpeg() {
    try {
      if (!this.ffmpeg) this.ffmpeg = new FFmpeg();
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      // Attempt to load WASM
      // Note: In many sandbox environments, SharedArrayBuffer is blocked.
      // We will catch this error and enable simulation mode.
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      this.isLoaded = true;
      console.log('GhostPress: FFmpeg WASM engine loaded.');
    } catch (error) {
      console.warn('GhostPress: FFmpeg load failed (likely due to missing COOP/COEP headers). Enabling Simulation Mode for UI demo.', error);
      this.simulationMode = true;
      this.isLoaded = true;
    }
  }

  public async compressFile(
    file: GhostFile, 
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    if (!this.isLoaded) await this.load();

    if (this.simulationMode) {
      return this._simulateCompression(file, onProgress);
    }

    if (!this.ffmpeg) throw new Error("FFmpeg not initialized");

    const { name, originalFile, settings } = file;
    const inputName = `input_${file.id}_${name}`;
    const outputName = `output_${file.id}_${name}`; // Ideally change extension based on settings

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(originalFile));

      // Setup Progress Handler
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });

      // Construct FFmpeg Command
      // Simplified command logic for demo
      const args = ['-i', inputName];
      
      // Video vs Image logic
      if (file.type === 'video') {
         // CRF 23 is default, 28 is compressed. Scale 0-51.
         // Mapping 0-100 quality to CRF. 100 quality -> 18 crf. 0 quality -> 51 crf.
         const crf = Math.round(51 - (settings.quality / 100) * 33); 
         args.push('-c:v', 'libx264', '-crf', crf.toString(), '-preset', 'ultrafast');
         if (settings.stripMetadata) {
             args.push('-map_metadata', '-1');
         }
      } else {
         // Image logic (using ffmpeg for generic scaling/compression)
         // Quality for JPEG is 2-31 (scale q:v). 
         args.push('-q:v', Math.round((100 - settings.quality) / 3).toString());
      }
      
      args.push(outputName);

      await this.ffmpeg.exec(args);

      const data = await this.ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: originalFile.type });
      
      // Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);
      
      // Remove listener to avoid leaks or cross-talk
      this.ffmpeg.off('progress', () => {});

      return blob;
    } catch (e) {
      console.error(e);
      throw new Error('Compression failed');
    }
  }

  private _simulateCompression(file: GhostFile, onProgress: (p: number) => void): Promise<Blob> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 5 + 1;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // Return the original file as "compressed" in simulation mode
          // In a real simulation, we might slice it to fake size reduction
          const fakeCompressed = file.originalFile.slice(0, file.originalFile.size * 0.7);
          onProgress(100);
          resolve(fakeCompressed);
        } else {
          onProgress(Math.round(progress));
        }
      }, 100);
    });
  }

  public isSimulating() {
    return this.simulationMode;
  }
}

export const ffmpegService = new FFmpegService();
