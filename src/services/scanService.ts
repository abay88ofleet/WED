import { supabase } from '../lib/supabase';

export interface ScanSettings {
  colorMode: 'color' | 'grayscale' | 'blackwhite';
  resolution: 150 | 300 | 600;
  autoDetectEdges: boolean;
  autoCrop: boolean;
  enhanceImage: boolean;
  format: 'jpeg' | 'png' | 'pdf';
}

export interface ScannedDocument {
  imageDataUrl: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  format: string;
}

const DEFAULT_SETTINGS: ScanSettings = {
  colorMode: 'color',
  resolution: 300,
  autoDetectEdges: true,
  autoCrop: true,
  enhanceImage: true,
  format: 'jpeg',
};

export async function detectDocumentEdges(imageDataUrl: string): Promise<{
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({
          topLeft: { x: 0, y: 0 },
          topRight: { x: img.width, y: 0 },
          bottomLeft: { x: 0, y: img.height },
          bottomRight: { x: img.width, y: img.height },
        });
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const margin = Math.min(canvas.width, canvas.height) * 0.05;

      let minX = canvas.width;
      let maxX = 0;
      let minY = canvas.height;
      let maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

          if (brightness < 240) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }

      minX = Math.max(0, minX - margin);
      minY = Math.max(0, minY - margin);
      maxX = Math.min(canvas.width, maxX + margin);
      maxY = Math.min(canvas.height, maxY + margin);

      resolve({
        topLeft: { x: minX, y: minY },
        topRight: { x: maxX, y: minY },
        bottomLeft: { x: minX, y: maxY },
        bottomRight: { x: maxX, y: maxY },
      });
    };
    img.src = imageDataUrl;
  });
}

export async function cropImage(
  imageDataUrl: string,
  edges: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = edges.topRight.x - edges.topLeft.x;
      const height = edges.bottomLeft.y - edges.topLeft.y;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      ctx.drawImage(
        img,
        edges.topLeft.x,
        edges.topLeft.y,
        width,
        height,
        0,
        0,
        width,
        height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imageDataUrl;
  });
}

export async function enhanceImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const contrast = 1.2;
        const adjusted = ((brightness - 128) * contrast + 128);

        data[i] = Math.min(255, Math.max(0, adjusted));
        data[i + 1] = Math.min(255, Math.max(0, adjusted));
        data[i + 2] = Math.min(255, Math.max(0, adjusted));
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imageDataUrl;
  });
}

export async function processScannedImage(
  imageDataUrl: string,
  settings: ScanSettings = DEFAULT_SETTINGS
): Promise<string> {
  let processedImage = imageDataUrl;

  if (settings.autoDetectEdges && settings.autoCrop) {
    const edges = await detectDocumentEdges(processedImage);
    processedImage = await cropImage(processedImage, edges);
  }

  if (settings.enhanceImage) {
    processedImage = await enhanceImage(processedImage);
  }

  if (settings.colorMode === 'grayscale') {
    processedImage = await convertToGrayscale(processedImage);
  } else if (settings.colorMode === 'blackwhite') {
    processedImage = await convertToBlackAndWhite(processedImage);
  }

  return processedImage;
}

async function convertToGrayscale(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imageDataUrl;
  });
}

async function convertToBlackAndWhite(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const bw = gray > 128 ? 255 : 0;
        data[i] = bw;
        data[i + 1] = bw;
        data[i + 2] = bw;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imageDataUrl;
  });
}

export async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
}

export function getScanSettings(): ScanSettings {
  const stored = localStorage.getItem('scanSettings');
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveScanSettings(settings: ScanSettings): void {
  localStorage.setItem('scanSettings', JSON.stringify(settings));
}
