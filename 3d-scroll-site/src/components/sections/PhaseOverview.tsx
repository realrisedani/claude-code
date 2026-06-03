"use client";

import { motion } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/ui/AnimatedSection";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";

const PHASES = [
  {
    number: "01",
    title: "High-Ticket",
    status: "Aktiv jetzt",
    statusColor: "var(--accent-from)",
    priceRange: "€2–10K/Monat",
    description: "Das vollständige System: Angebot, Positionierung, Outreach, Sales und Delivery. Dein Weg zum ersten High-Ticket-Kunden in 90 Tagen.",
    features: ["7 Module", "90-Tage-Plan", "Weekly Calls", "Sales-Skripte"],
    active: true,
  },
  {
    number: "02",
    title: "Development Agency",
    status: "Demnächst",
    statusColor: "rgba(250,250,250,0.3)",
    priceRange: "€10–50K/Monat",
    description: "Skaliere von Einzelprojekten zu einer vollständigen KI-Development-Agentur mit Team und Prozessen.",
    features: ["Agency-Setup", "Team-Building", "Prozesse", "Premium-Clients"],
    active: false,
  },
  {
    number: "03",
    title: "AI Transformation Partner",
    status: "Demnächst",
    statusColor: "rgba(250,250,250,0.3)",
    priceRange: "€50K+/Monat",
    description: "Positioniere dich als strategischer KI-Transformationspartner für Enterprise-Kunden.",
    features: ["Enterprise-Sales", "Consulting", "Partnerships", "Exit-Options"],
    active: false,
  },
];

export function PhaseOverview() {
  return (
    <section id="programm" className="px-6 py-24 md:px-8 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)" }}
      />

      <div className="mx-auto max-w-[1200px]">
        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <AnimatedItem>
            <EyebrowBadge className="mb-5">Dein Weg</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem index={1}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.08] max-w-[20ch]">
              Drei Phasen.{" "}
              <span className="gradient-text">Ein Ziel.</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem index={2}>
            <p className="mt-4 text-white/50 text-base md:text-lg max-w-[52ch] leading-relaxed">
              Phase 1 legt das Fundament. Jede weitere Phase baut auf dem auf, was du bereits aufgebaut hast.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PHASES.map((phase, i) => (
            <AnimatedItem key={phase.number} index={i}>
              <div
                className="relative h-full rounded-[20px] p-7 flex flex-col gap-5 transition-transform hover:-translate-y-1"
                style={{
                  background: phase.active ? "var(--surface-2)" : "var(--surface)",
                  border: phase.active
                    ? "1px solid rgba(245,158,11,0.35)"
                    : "1px solid var(--border)",
                  boxShadow: phase.active
                    ? "var(--shadow-neu), 0 0 40px rgba(245,158,11,0.08)"
                    : "var(--shadow-card)",
                }}
              >
                {/* Active badge */}
                {phase.active && (
                  <div
                    className="absolute -top-3 left-7 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                      boxShadow: "0 0 20px rgba(245,158,11,0.4)",
                    }}
                  >
                    Jetzt starten
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <span
                    className="text-4xl font-bold tracking-tighter"
                    style={{ color: phase.active ? "var(--accent-from)" : "rgba(250,250,250,0.12)" }}
                  >
                    {phase.number}
                  </span>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      color: phase.statusColor,
                      background: phase.active ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${phase.active ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    {phase.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">{phase.title}</h3>
                  <p className="text-sm font-medium mt-1" style={{ color: phase.active ? "var(--accent-from)" : "var(--text-muted)" }}>
                    {phase.priceRange}
                  </p>
                </div>

                <p className="text-white/50 text-sm leading-relaxed flex-1">
                  {phase.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {phase.features.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-2.5 py-1 rounded-lg"
                      style={{
                        background: phase.active ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
                        color: phase.active ? "rgba(252,211,77,0.9)" : "rgba(250,250,250,0.35)",
                        border: phase.active ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedItem>
          ))}
        </div>
      </div>
    </section>
  );
}
