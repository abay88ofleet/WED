import { useState, useEffect, useRef } from 'react';
import { cdnService } from '../services/cdnService';

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface UseLazyImageReturn {
  src: string;
  isLoading: boolean;
  error: boolean;
  ref: React.RefObject<HTMLImageElement>;
}

export function useLazyImage(
  imageSrc: string,
  options: UseLazyImageOptions = {}
): UseLazyImageReturn {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder,
    onLoad,
    onError,
  } = options;

  const [src, setSrc] = useState<string>(
    placeholder || cdnService.generateBlurPlaceholder()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageSrc) {
      setIsLoading(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            if (imgRef.current) {
              observer.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [imageSrc, threshold, rootMargin]);

  const loadImage = async () => {
    try {
      setIsLoading(true);
      setError(false);

      const cachedUrl = await cdnService.getCachedUrl(imageSrc);
      if (cachedUrl) {
        setSrc(cachedUrl);
        setIsLoading(false);
        onLoad?.();
        return;
      }

      await cdnService.preloadImage(imageSrc);

      setSrc(imageSrc);
      await cdnService.setCachedUrl(imageSrc, imageSrc);
      setIsLoading(false);
      onLoad?.();
    } catch (err) {
      console.error('Failed to load image:', err);
      setError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  return {
    src,
    isLoading,
    error,
    ref: imgRef,
  };
}

export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string
): UseLazyImageReturn {
  const [src, setSrc] = useState<string>(lowQualitySrc);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!highQualitySrc) {
      setIsLoading(false);
      return;
    }

    setSrc(lowQualitySrc);

    const loadHighQuality = async () => {
      try {
        await cdnService.preloadImage(highQualitySrc);
        setSrc(highQualitySrc);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load high quality image:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    loadHighQuality();
  }, [lowQualitySrc, highQualitySrc]);

  return {
    src,
    isLoading,
    error,
    ref: imgRef,
  };
}
