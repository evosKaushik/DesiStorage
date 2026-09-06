"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

interface ShimmerImageProps extends ImageProps {
  fallback?: string;
}

export function ShimmerImage({
  fallback = "/default-avatar.png",
  onLoad,
  onError,
  className,
  ...props
}: ShimmerImageProps) {
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState(props.src);

  // Keep the internal src in sync when the src prop changes (e.g. a new
  // avatar selected in the profile page). Without this the displayed image
  // stays stuck on the value it had on mount.
  useEffect(() => {
    setSrc(props.src);
    setLoading(true);
  }, [props.src]);

  // next/image can't run local object URLs through the image optimizer.
  // Skip optimization so blob:/data: previews render as a plain <img>.
  const isLocalPreview =
    typeof src === "string" &&
    (src.startsWith("blob:") || src.startsWith("data:"));

  return (
    <div className="relative h-full w-full overflow-hidden">
      {loading && (
        <div
          className="
    absolute inset-0
    overflow-hidden
    bg-muted
    before:absolute
    before:inset-y-0
    before:-left-1/2
    before:w-1/2
    before:content-['']
    before:animate-[shimmer_1.8s_ease-in-out_infinite]
    before:bg-gradient-to-r
    before:from-transparent
    before:via-white/40
    before:to-transparent
  "
        />
      )}

      <Image
        {...props}
        src={src}
        unoptimized={isLocalPreview}
        sizes={props.fill && !props.sizes ? "48px" : props.sizes}
        className={`${className ?? ""} ${
          loading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-200`}
        onLoad={(event) => {
          setLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          setLoading(false);
          setSrc(fallback);
          onError?.(event);
        }}
      />
    </div>
  );
}
