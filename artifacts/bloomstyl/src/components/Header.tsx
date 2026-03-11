import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-border/60 bg-white/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            BloomStyl
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-primary/8 text-primary">
          For Teachers
        </span>
      </div>
    </header>
  );
}
