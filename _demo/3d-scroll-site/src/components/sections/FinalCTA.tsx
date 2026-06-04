"use client";

import { motion } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/ui/AnimatedSection";

export function FinalCTA() {
  return (
    <section className="px-6 py-24 md:px-8 md:py-32 relative overflow-hidden">
      {/* Animated orb bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(234,88,12,0.06) 0%, transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto max-w-[900px] relative">
        <AnimatedSection className="flex flex-col items-center text-center gap-8">
          <AnimatedItem>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-2"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                color: "rgba(252,211,77,0.9)",
              }}
            >
              ✦ Dein nächster Schritt
            </div>
          </AnimatedItem>

          <AnimatedItem index={1}>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] max-w-[18ch]">
              Bereit zu starten?{" "}
              <span className="gradient-text">Phase 1</span>{" "}
              ist dein Move.
            </h2>
          </AnimatedItem>

          <AnimatedItem index={2}>
            <p className="text-white/50 text-base md:text-lg max-w-[52ch] leading-relaxed">
              Kein Abo. Kein Massenprogramm. Nur ein strukturierter Weg zum ersten High-Ticket-Kunden — für Builder, die wirklich umsetzen wollen.
            </p>
          </AnimatedItem>

          <AnimatedItem index={3}>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <a
                href="#investition"
                className="px-8 py-4 rounded-2xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                  boxShadow: "0 0 40px rgba(245,158,11,0.35)",
                }}
              >
                Jetzt einschreiben →
              </a>
              <a
                href="#"
                className="px-8 py-4 rounded-2xl font-semibold text-white/70 text-sm glass transition-all hover:bg-white/[0.08]"
              >
                Kostenloses Erstgespräch — Gratis
              </a>
            </div>
          </AnimatedItem>

          <AnimatedItem index={4}>
            <p className="text-white/25 text-sm">
              Noch unsicher?{" "}
              <a href="#faq" className="text-white/40 hover:text-white/60 underline underline-offset-4 transition-colors">
                Lies die häufigen Fragen
              </a>{" "}
              oder buche ein kostenloses Gespräch.
            </p>
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </section>
  );
}
