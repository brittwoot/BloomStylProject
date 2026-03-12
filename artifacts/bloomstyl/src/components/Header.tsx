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

          {/* Wordmark — heart is attached to the 'l' at letter height, like a ligature */}
          <span
            className="text-lg font-bold text-foreground tracking-tight leading-none"
            style={{ fontFamily: "var(--font-display)", display: "inline-flex", alignItems: "center" }}
          >
            BloomSty
            {/*
              The 'l' and heart are wrapped together.
              The heart sits at mid-letter height (x-height), right up against the 'l',
              the same way 'e' would sit next to 'l' in a word.
            */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              l
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
                style={{
                  display: "inline-block",
                  position: "relative",
                  top: "4px",
                  marginLeft: "1px",
                  transform: "rotate(-20deg)",
                  flexShrink: 0,
                }}
              >
                <path
                  d="M7 12C7 12 1.5 8.2 1.5 4.8a2.8 2.8 0 0 1 5.2-1.5A2.8 2.8 0 0 1 12.5 4.8C12.5 8.2 7 12 7 12z"
                  fill="#9333ea"
                  opacity="0.9"
                />
              </svg>
            </span>
          </span>
        </div>

        <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-primary/8 text-primary">
          For Teachers
        </span>
      </div>
    </header>
  );
}
