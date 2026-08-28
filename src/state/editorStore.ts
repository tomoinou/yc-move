import { create } from 'zustand';
import { FIELD } from '../core/field.ts';

interface EditorStoreState {
  selectedId: string | null;
  currentPhaseIdx: number;
  scrollMode: boolean;
  passMode: boolean;
  passFrom: string | null;
  viewY: number;
  select: (id: string | null) => void;
  setPhaseIdx: (idx: number) => void;
  setScrollMode: (on: boolean) => void;
  setPassMode: (on: boolean) => void;
  setPassFrom: (id: string | null) => void;
  setViewY: (y: number) => void;
}

export const useEditorStore = create<EditorStoreState>((set) => ({
  selectedId: null,
  currentPhaseIdx: 0,
  scrollMode: false,
  passMode: false,
  passFrom: null,
  viewY: -FIELD.marginM,
  select: (id) => set({ selectedId: id }),
  setPhaseIdx: (idx) => set({ currentPhaseIdx: idx }),
  setScrollMode: (on) => set({ scrollMode: on }),
  setPassMode: (on) => set({ passMode: on }),
  setPassFrom: (id) => set({ passFrom: id }),
  setViewY: (y) => set({ viewY: y }),
}));
