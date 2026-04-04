import { createContext, useContext } from "react";

/** When set from SectionBlock, selects that section for the editor sidebar (Text / Style tabs). */
export const SectionActivationContext = createContext<() => void>(() => {});

export function useSectionActivation() {
  return useContext(SectionActivationContext);
}
