import { create } from 'zustand';

interface EditorStoreState {
  selectedId: string | null;
  currentPhaseIdx: number;
  select: (id: string | null) => void;
  setPhaseIdx: (idx: number) => void;
}

export const useEditorStore = create<EditorStoreState>((set) => ({
  selectedId: null,
  currentPhaseIdx: 0,
  select: (id) => set({ selectedId: id }),
  setPhaseIdx: (idx) => set({ currentPhaseIdx: idx }),
}));
