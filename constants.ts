import { CompressionSettings } from "./types";

export const DEFAULT_SETTINGS: CompressionSettings = {
  quality: 75,
  format: 'original',
  stripMetadata: true,
  scale: 1,
};

export const SUPPORTED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-matroska': ['.mkv'],
};

// Simulation constraints for demo purposes if WASM fails
export const SIMULATION_SPEED_MS = 100; 
export const MAX_SIMULATION_TIME = 5000;
