"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

const FRAME_COUNT = 169;
const FRAME_PATH = (i: number) =>
  `/frames/frame_${String(i).padStart(4, "0")}.jpg`;

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const tickingRef = useRef(false);
  const currentFrameRef = useRef(0);
  const heroTextRef = useRef<HTMLDivElement>(null);

  const [loadProgress, setLoadProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Preload all frames
  useEffect(() => {
    let done = 0;
    const imgs: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = () => {
        done++;
        setLoadProgress(Math.round((done / FRAME_COUNT) * 100));
        if (done === FRAME_COUNT) {
          setLoaded(true);
          drawFrame(0);
        }
      };
      img.onerror = () => {
        done++;
        setLoadProgress(Math.round((done / FRAME_COUNT) * 100));
        if (done === FRAME_COUNT) setLoaded(true);
      };
      imgs.push(img);
    }
    framesRef.current = imgs;
  }, []);

  // DPR-aware canvas sizing
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
    const img = framesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width;
    const ch = canvas.height;
    const isMobile = window.innerWidth < 768;
    const scale = isMobile ? 1.3 : 1;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = cw / ch;

    let sw: number, sh: number;
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

  // RAF loop — works reliably with Lenis smooth scroll
  useEffect(() => {
    if (!loaded) return;

    let rafId: number;

    function tick() {
      const section = sectionRef.current;
      if (section) {
        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        const progress = scrollable > 0
          ? Math.max(0, Math.min(1, -rect.top / scrollable))
          : 0;

        const frameIndex = Math.min(
          FRAME_COUNT - 1,
          Math.floor(progress * FRAME_COUNT)
        );

        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }

        // Fade hero text out on first 8% of scroll
        if (heroTextRef.current) {
          const opacity = Math.max(0, 1 - progress / 0.08);
          heroTextRef.current.style.opacity = String(opacity);
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [loaded]);

  return (
    <>
      {/* Loading bar */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            className="loading-bar"
            style={{ width: `${loadProgress}%` }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          />
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "var(--background)" }}
            exit={{ opacity: 0, transition: { duration: 0.8, delay: 0.2 } }}
          >
            <div className="flex flex-col items-center gap-5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
              >
                RR
              </div>
              <div className="w-48 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${loadProgress}%`,
                    background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))",
                  }}
                />
              </div>
              <span className="text-white/30 text-xs tracking-widest uppercase">
                {loadProgress}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll section — 450vh creates the scroll distance */}
      <section
        ref={sectionRef}
        className="relative scroll-animation"
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Frame canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

          {/* Hero text — fades out on scroll start */}
          <AnimatePresence>
            {loaded && (
              <div
                ref={heroTextRef}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex flex-col items-center gap-5"
                >
                  <EyebrowBadge>✦ RealRise · Phase 1</EyebrowBadge>

                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] max-w-[20ch] text-white">
                    Lerne wie du ein echter{" "}
                    <span className="gradient-text">digitaler KI Reseller</span>{" "}
                    wirst.
                  </h1>

                  <p className="text-white/55 text-base md:text-lg max-w-[48ch] leading-relaxed">
                    Nicht ein weiterer Kurs. Ein vollständiges Umsetzungs-System — von Angebot über Outreach bis zum ersten High-Ticket-Kunden.
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-8 mt-1">
                    {[
                      { value: "7", label: "Module" },
                      { value: "90", label: "Tage Plan" },
                      { value: "€10K+", label: "Monatsziel" },
                    ].map((stat) => (
                      <div key={stat.label} className="flex flex-col items-center">
                        <span className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</span>
                        <span className="text-white/40 text-xs tracking-widest uppercase">{stat.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mt-3 pointer-events-auto">
                    <button
                      className="px-7 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                        boxShadow: "0 0 32px rgba(99,102,241,0.35)",
                      }}
                    >
                      Jetzt einschreiben — €2.499 →
                    </button>
                    <button className="px-7 py-3.5 rounded-2xl font-semibold text-sm text-white/80 glass transition-all hover:bg-white/[0.08] active:scale-[0.98]">
                      Unverbindlich sprechen — Gratis
                    </button>
                  </div>

                  {/* Social proof */}
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-amber-400 text-sm">★</span>
                      ))}
                    </div>
                    <span className="text-white/40 text-sm">
                      Bereits <strong className="text-white/70">50+ Builder</strong> vertrauen RealRise
                    </span>
                  </div>
                </motion.div>

                {/* Scroll hint */}
                <motion.div
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    <div className="w-1 h-1.5 rounded-full bg-white/40" />
                  </motion.div>
                  <span className="text-white/25 text-[10px] tracking-widest uppercase">Scroll</span>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
