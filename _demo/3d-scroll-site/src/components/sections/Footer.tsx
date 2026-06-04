"use client";

export function Footer() {
  return (
    <footer
      className="px-6 py-10 md:px-8"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="mx-auto max-w-[1200px] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
          >
            RR
          </div>
          <span className="text-white/40 text-sm">© 2026 RealRise — Phase 1</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-5">
          {[
            { label: "Impressum", href: "#" },
            { label: "AGB", href: "#" },
            { label: "Datenschutz", href: "#" },
            { label: "Cookie-Einstellungen", href: "#" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-white/30 hover:text-white/55 text-xs transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
