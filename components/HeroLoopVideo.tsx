'use client';

import { useEffect, useRef, useState } from 'react';

type HeroLoopVideoProps = {
  src: string;
  poster?: string;
  crossfadeDuration?: number;
  className?: string;
};

export default function HeroLoopVideo({
  src,
  poster,
  crossfadeDuration = 1,
  className = '',
}: HeroLoopVideoProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeIsA, setActiveIsA] = useState(true);
  const activeIsARef = useRef(true);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotionRef.current) {
      const a = videoARef.current;
      if (a) {
        a.loop = true;
        a.play().catch(() => {});
      }
      return;
    }

    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    let raf: number;
    let handedOff = false;

    a.play().catch(() => {});

    const tick = () => {
      const active = activeIsARef.current ? videoARef.current : videoBRef.current;
      const standby = activeIsARef.current ? videoBRef.current : videoARef.current;

      if (active && standby && active.duration) {
        const remaining = active.duration - active.currentTime;

        if (!handedOff && remaining <= crossfadeDuration) {
          handedOff = true;
          standby.currentTime = 0;
          standby.play().catch(() => {});
          activeIsARef.current = !activeIsARef.current;
          setActiveIsA(activeIsARef.current);
          // Reset the guard now (not when the old video later hits its own
          // remaining<=0.05 check below) — once flipped, "active" points at
          // the video we just started, so its *own* future approach-to-end
          // needs this guard clear or it can never hand off again.
          handedOff = false;
        }

        if (remaining <= 0.05) {
          active.pause();
          active.currentTime = 0;
          handedOff = false;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crossfadeDuration]);

  const fadeStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: isActive ? 1 : 0,
    transition: `opacity ${crossfadeDuration}s ease-in-out`,
  });

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <video ref={videoARef} src={src} poster={poster} muted playsInline preload="auto" style={fadeStyle(activeIsA)} />
      <video ref={videoBRef} src={src} muted playsInline preload="auto" style={fadeStyle(!activeIsA)} />
    </div>
  );
}
