"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FRAME_COUNT = 120;
const FRAME_PATH = (i: number) =>
  `/tunnel-frames/frame_${String(i).padStart(4, "0")}.jpg`;

interface AnnotationCard {
  id: string;
  label: string;
  sub: string;
  show: number;
  hide: number;
  position: string;
}

const ANNOTATIONS: AnnotationCard[] = [
  {
    id: "t-card-1",
    label: "Futuristic World",
    sub: "AI-generated vision",
    show: 0.05,
    hide: 0.35,
    position: "top-[20%] left-[5%] md:left-[8%]",
  },
  {
    id: "t-card-2",
    label: "Frame Sequence",
    sub: "Canvas-driven",
    show: 0.25,
    hide: 0.58,
    position: "top-[20%] right-[5%] md:right-[8%]",
  },
  {
    id: "t-card-3",
    label: "Scroll-Driven",
    sub: "No WebGL, pure canvas",
    show: 0.5,
    hide: 0.82,
    position: "bottom-[25%] left-[5%] md:left-[8%]",
  },
  {
    id: "t-card-4",
    label: "60 FPS",
    sub: "RAF + direct DOM",
    show: 0.7,
    hide: 0.97,
    position: "bottom-[25%] right-[5%] md:right-[8%]",
  },
];

export function TunnelSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const tickingRef = useRef(false);
  const currentFrameRef = useRef(0);

  const [loaded, setLoaded] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    let done = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = img.onerror = () => {
        done++;
        if (done === FRAME_COUNT) {
          setLoaded(true);
          drawFrame(0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;
  }, []);

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      drawFrame(currentFrameRef.current);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [loaded]);

  function drawFrame(index: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imagesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width;
    const ch = canvas.height;
    const isMobile = window.innerWidth < 768;
    const scale = isMobile ? 1.3 : 1;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = cw / ch;

    let sw, sh;
    if (canvasAspect > imgAspect) {
      sw = cw * scale;
      sh = (cw / imgAspect) * scale;
    } else {
      sh = ch * scale;
      sw = ch * imgAspect * scale;
    }
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  useEffect(() => {
    if (!loaded) return;

    function onScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) { tickingRef.current = false; return; }

        const rect = section.getBoundingClientRect();
        const progress = Math.max(
          0,
          Math.min(1, -rect.top / (section.offsetHeight - window.innerHeight))
        );

        const frameIndex = Math.min(
          FRAME_COUNT - 1,
          Math.floor(progress * FRAME_COUNT)
        );

        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }

        const nextVisible = new Set<string>();
        for (const card of ANNOTATIONS) {
          if (progress >= card.show && progress < card.hide) {
            nextVisible.add(card.id);
          }
        }
        setVisibleCards((prev) => {
          const prevKey = [...prev].sort().join(",");
          const nextKey = [...nextVisible].sort().join(",");
          return prevKey === nextKey ? prev : nextVisible;
        });

        tickingRef.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [loaded]);

  return (
    <section
      ref={sectionRef}
      style={{ height: "450vh" }}
      className="relative"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

        {/* Section label — fades in as section enters */}
        <AnimatePresence>
          {loaded && (
            <motion.div
              className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <span className="glass px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase text-white/50">
                ✦ Futuristic
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Annotation cards */}
        {ANNOTATIONS.map((card) => (
          <AnimatePresence key={card.id}>
            {visibleCards.has(card.id) && (
              <motion.div
                className={`absolute ${card.position} pointer-events-none`}
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="glass rounded-[16px] px-4 py-3 min-w-[140px]">
                  <p className="text-white text-sm font-semibold">{card.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{card.sub}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </section>
  );
}
