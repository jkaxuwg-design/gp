import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();
let isLoaded = false;

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  switch (type) {
    case 'LOAD': await load(); break;
    case 'COMPRESS': await compress(payload); break;
  }
};

async function load() {
  if (isLoaded) return;
  // Load assets from a public CDN that supports COOP/COEP or local if configured
  // Using unpkg for demo consistency with previous files, but in production this should be local
  const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd';
  
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });
    isLoaded = true;
    postMessage({ type: 'LOADED' });
  } catch (err: any) {
    console.error("Worker Load Error:", err);
    postMessage({ type: 'ERROR', payload: 'WASM Load Failed: ' + err.message });
  }
}

async function compress({ file, settings, id }: any) {
  if (!isLoaded) {
    try {
        await load();
    } catch (e) {
        return; // Error already posted in load
    }
  }
  
  const ext = file.name.split('.').pop();
  const inputName = `input_${id}.${ext}`;
  const outputName = `output_${id}.mp4`; // Defaulting to mp4 for video, need logic for images

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    
    ffmpeg.on('progress', ({ progress }) => {
      postMessage({ type: 'PROGRESS', payload: { id, progress: Math.round(progress * 100) } });
    });

    // Construct arguments based on settings
    const args = ['-i', inputName];
    
    // Simple logic mapping settings to ffmpeg args
    // This mirrors the logic previously in the main service but running in worker
    if (file.type.startsWith('video')) {
        const crf = Math.round(51 - (settings.quality / 100) * 33); 
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', crf.toString());
        if (settings.stripMetadata) {
            args.push('-map_metadata', '-1');
        }
    } else {
        // Simple image compression for demo
        // Note: Real industrial app would use specific encoders per format
        args.push('-q:v', Math.round((100 - settings.quality) / 3).toString());
    }

    args.push(outputName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const buffer = (data as Uint8Array).buffer;
    
    // Zero-Copy Transfer
    postMessage({ type: 'DONE', payload: { id, buffer } }, [buffer]);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    ffmpeg.off('progress', () => {}); // Clear listeners

  } catch (error: any) {
    console.error("Worker Compression Error:", error);
    postMessage({ type: 'ERROR', payload: error.message });
  }
}