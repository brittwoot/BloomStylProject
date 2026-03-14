import React from "react";
import { useLocation } from "wouter";
export function Header() {
  const [, setLocation] = useLocation();
  return (
    <header className="w-full border-b border-border/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setLocation("/")}
          >
          {/* Logo icon */}
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden
            >
              <path
                d="M9 14.5C9 14.5 2.5 10.2 2.5 6a3.5 3.5 0 0 1 6.5-1.8A3.5 3.5 0 0 1 15.5 6c0 4.2-6.5 8.5-6.5 8.5z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* Wordmark — heart is attached to the 'l' at letter height, like a ligature */}
          <span
            className="text-lg font-bold text-foreground tracking-tight leading-none"
            style={{
              fontFamily: "var(--font-display)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            BloomSty
            {/*
              The 'l' and heart are wrapped together.
              The heart sits at mid-letter height (x-height), right up against the 'l',
              the same way 'e' would sit next to 'l' in a word.
            */}
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 0 }}
            >
              l
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  display: "inline-block",
                  position: "relative",
                  top: "2px",
                  marginLeft: "-2px",
                  transform: "rotate(-18deg)",
                  transformOrigin: "left center",
                  flexShrink: 0,
                }}
              >
                <path
                  d="M12 21C12 21 4 15 4 9.5C4 6.5 6.2 5 8.5 5C10.3 5 11.5 6 12 7C12.5 6 13.7 5 15.5 5C17.8 5 20 6.5 20 9.5C20 15 12 21 12 21Z"
                  stroke="#9333ea"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="60"
                  strokeDashoffset="60"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="60"
                    to="0"
                    dur="0.8s"
                    fill="freeze"
                  />
                </path>
              </svg>
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}/canvas`}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/8 transition-colors"
          >
            ✦ Canvas Editor
          </a>
          <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-primary/8 text-primary">
            For Teachers
          </span>
        </div>
      </div>
    </header>
  );
}
