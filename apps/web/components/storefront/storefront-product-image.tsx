"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Product photos from seller uploads are served from /uploads/products/*.
 * Use a plain img for those so local disk files work without next/image quirks.
 * Remote (https / Unsplash) URLs still go through next/image.
 */
export function StorefrontProductImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  style,
  priority,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}) {
  const isLocalUpload =
    src.startsWith("/uploads/") ||
    src.includes("/uploads/products/");

  if (isLocalUpload) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            ...style,
          }}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
    />
  );
}
