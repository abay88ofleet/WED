import { supabase } from '../lib/supabase';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface CDNConfig {
  baseUrl: string;
  enabled: boolean;
  cacheTTL: number;
}

class CDNService {
  private config: CDNConfig = {
    baseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    enabled: true,
    cacheTTL: 3600,
  };

  getOptimizedImageUrl(
    filePath: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (!this.config.enabled) {
      return this.getPublicUrl(filePath);
    }

    const params = new URLSearchParams();

    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);

    const queryString = params.toString();
    const baseUrl = this.getPublicUrl(filePath);

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  getThumbnailUrl(filePath: string, size: number = 200): string {
    return this.getOptimizedImageUrl(filePath, {
      width: size,
      height: size,
      quality: 75,
      format: 'webp',
    });
  }

  getPreviewUrl(filePath: string, maxWidth: number = 800): string {
    return this.getOptimizedImageUrl(filePath, {
      width: maxWidth,
      quality: 85,
      format: 'webp',
    });
  }

  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  generateBlurPlaceholder(width: number = 20, height: number = 20): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='none' style='filter: url(%23b);' href='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='/%3E%3C/svg%3E`;
  }

  async getCachedUrl(filePath: string): Promise<string | null> {
    const cacheKey = `cdn_url_${filePath}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { url, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < this.config.cacheTTL * 1000) {
        return url;
      }
    }

    return null;
  }

  async setCachedUrl(filePath: string, url: string): Promise<void> {
    const cacheKey = `cdn_url_${filePath}`;
    const data = {
      url,
      timestamp: Date.now(),
    };

    localStorage.setItem(cacheKey, JSON.stringify(data));
  }

  clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('cdn_url_')) {
        localStorage.removeItem(key);
      }
    });
  }

  prefetchImages(urls: string[]): Promise<void[]> {
    return Promise.all(urls.map((url) => this.preloadImage(url)));
  }
}

export const cdnService = new CDNService();
