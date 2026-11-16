import type { ImgHTMLAttributes } from 'react';
import type { ImageAsset } from '../../data/generated/imageMeta';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height' | 'alt'> {
  asset: ImageAsset;
  alt: string;
  /** Rendered width hint for `sizes` (default: full viewport). */
  sizes?: string;
  priority?: boolean;
}

/** Responsive <img> from a generated asset: explicit dimensions (CLS), lazy by default, eager when `priority`. */
export const Picture = ({ asset, alt, sizes = '100vw', priority = false, ...rest }: Props) => (
  <img
    src={asset.src}
    srcSet={`${asset.srcSmall} 800w, ${asset.srcMedium} 1280w, ${asset.src} ${asset.width}w`}
    sizes={sizes}
    width={asset.width}
    height={asset.height}
    alt={alt}
    loading={priority ? 'eager' : 'lazy'}
    decoding={priority ? 'sync' : 'async'}
    fetchPriority={priority ? 'high' : undefined}
    {...rest}
  />
);
