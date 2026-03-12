export function Header() {
  return (
    <header className="w-full border-b border-border/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Logo icon */}
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M9 14.5C9 14.5 2.5 10.2 2.5 6a3.5 3.5 0 0 1 6.5-1.8A3.5 3.5 0 0 1 15.5 6c0 4.2-6.5 8.5-6.5 8.5z" fill="white" opacity="0.9"/>
            </svg>
          </div>

          {/* Wordmark */}
          <div className="flex items-center gap-0.5">
            <span className="text-lg font-bold text-foreground tracking-tight leading-none" style={{ fontFamily: "var(--font-display)" }}>
              BloomStyl
            </span>
            {/* Crooked purple heart — hand-drawn feel using SVG */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="mb-2.5 ml-0.5"
              style={{ transform: "rotate(-12deg)" }}
            >
              <path
                d="M7 12C7 12 1.2 8.1 1.2 4.4a2.8 2.8 0 0 1 5.2-1.4A2.8 2.8 0 0 1 12.8 4.4C12.8 8.1 7 12 7 12z"
                fill="#9333ea"
                opacity="0.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Tiny imperfection stroke to give hand-drawn feel */}
              <path
                d="M6.8 11.5 Q6.4 10.8 5.5 10"
                stroke="#7c3aed"
                strokeWidth="0.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>

        <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-primary/8 text-primary">
          For Teachers
        </span>
      </div>
    </header>
  );
}
