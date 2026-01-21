/**
 * Optimized Image Component dengan auto WebP fallback
 * Gunakan component ini untuk semua images untuk automatic optimization
 */

'use client';

import Image from 'next/image';
import { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  objectPosition?: string;
  quality?: number;
  sizes?: string;
  blurDataURL?: string;
  placeholder?: 'empty' | 'blur' | 'data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27%3e%3c/svg%3e';
}

/**
 * OptimizedImage - Automatic WebP + format optimization
 * @example
 * <OptimizedImage src="/logo.png" alt="Logo" width={100} height={100} />
 * <OptimizedImage src="/banner.jpg" alt="Banner" fill objectFit="cover" />
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fill = false,
  objectFit = 'contain',
  objectPosition = 'center',
  quality = 85,
  sizes,
  placeholder,
  blurDataURL,
  className,
  style,
  ...props
}: OptimizedImageProps) {
  // Auto convert png/jpg to webp for optimization
  // Next.js Image component akan handle format negotiation
  const optimizedSrc = src;

  if (fill) {
    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        sizes={sizes || '100vw'}
        className={className}
        style={{
          objectFit,
          objectPosition,
          ...style,
        }}
        placeholder={placeholder || 'empty'}
        {...props}
      />
    );
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width || 100}
      height={height || 100}
      priority={priority}
      quality={quality}
      sizes={sizes}
      className={className}
      style={style}
      placeholder={placeholder || 'empty'}
      blurDataURL={blurDataURL}
      {...props}
    />
  );
}

/**
 * Picture component dengan WebP fallback untuk img tags
 * Gunakan untuk img tags yang tidak bisa pakai Next.js Image component
 */
interface PictureImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  srcWebP?: string;
}

export function PictureImage({ src, alt, srcWebP, ...props }: PictureImageProps) {
  // Auto generate webp path jika tidak disupply
  const webpSrc = srcWebP || src.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <source srcSet={src} type={`image/${src.split('.').pop()}`} />
      <img src={src} alt={alt} {...props} />
    </picture>
  );
}
