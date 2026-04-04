import { createContext, useContext } from "react";
import type { TextStyle } from "../../store";

/** Per-section Text tab styling; null outside a worksheet section. */
export const SectionTextStyleContext = createContext<TextStyle | null>(null);

export function useSectionTextStyleOptional(): TextStyle | null {
  return useContext(SectionTextStyleContext);
}
