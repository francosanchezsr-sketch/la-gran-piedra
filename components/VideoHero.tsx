'use client';

import { useEffect, useRef } from 'react';

type VideoHeroProps = {
  src: string;
  poster?: string;
  alt: string;
  style?: React.CSSProperties;
};

export default function VideoHero({ src, poster, alt, style }: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      /* autoplay can be blocked until user interaction; safe to ignore */
    });
  }, []);

  return (
    <video
      ref={videoRef}
      style={{ width: '100%', height: 'min(34vh,340px)', objectFit: 'cover', objectPosition: '50% 38%', display: 'block', ...style }}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
