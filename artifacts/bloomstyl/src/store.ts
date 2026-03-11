import { create } from 'zustand';
import type { GenerateWorksheetResponse } from '@workspace/api-client-react';

interface WorksheetStore {
  worksheet: GenerateWorksheetResponse | null;
  setWorksheet: (data: GenerateWorksheetResponse) => void;
  clearWorksheet: () => void;
}

export const useWorksheetStore = create<WorksheetStore>((set) => ({
  worksheet: null,
  setWorksheet: (worksheet) => set({ worksheet }),
  clearWorksheet: () => set({ worksheet: null }),
}));
