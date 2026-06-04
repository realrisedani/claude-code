"use client";

interface EyebrowBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function EyebrowBadge({ children, className = "" }: EyebrowBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase glass text-white/60 ${className}`}
    >
      {children}
    </span>
  );
}
