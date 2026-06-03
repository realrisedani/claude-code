"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Programm", href: "#programm" },
  { label: "Fahrplan", href: "#fahrplan" },
  { label: "Was du bekommst", href: "#leistungen" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div
          className="mx-auto max-w-[1200px] flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-500"
          style={{
            background: scrolled ? "rgba(9,9,11,0.85)" : "rgba(9,9,11,0.4)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.04)",
            boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
          }}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
            >
              RR
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">RealRise</span>
            <span className="text-white/25 text-xs hidden sm:inline">· Phase 1</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white/50 hover:text-white/90 text-sm transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a
              href="#investition"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
            >
              Einschreiben →
            </a>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-1.5"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              <motion.span
                animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="block w-5 h-0.5 bg-white/70 rounded-full"
              />
              <motion.span
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="block w-5 h-0.5 bg-white/70 rounded-full"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="block w-5 h-0.5 bg-white/70 rounded-full"
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mx-auto max-w-[1200px] mt-2 rounded-2xl p-4 flex flex-col gap-2"
              style={{
                background: "rgba(17,17,19,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.05] text-sm font-medium transition-all"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#investition"
                onClick={() => setOpen(false)}
                className="mt-2 px-4 py-3 rounded-xl text-sm font-semibold text-white text-center"
                style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
              >
                Jetzt einschreiben — €2.499 →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
