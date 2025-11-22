export type FileType = 'image' | 'video' | 'pdf' | 'other';

export enum ProcessingState {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  COMPRESSING = 'COMPRESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface CompressionSettings {
  targetSizeMB?: number;
  quality: number; // 0-100
  format: string; // e.g., 'mp4', 'jpg'
  stripMetadata: boolean;
  scale?: number; // 0-1 multiplier
}

export interface GhostFile {
  id: string;
  originalFile: File;
  compressedBlob?: Blob;
  previewUrl: string;
  compressedPreviewUrl?: string;
  name: string;
  size: number;
  type: FileType;
  status: ProcessingState;
  progress: number;
  compressedSize?: number;
  settings: CompressionSettings;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface WorkerMessage {
  type: 'progress' | 'done' | 'error' | 'log';
  payload: any;
  fileId: string;
}
