import { create } from 'zustand';
import { FIELD } from '../core/field.ts';

interface EditorStoreState {
  selectedId: string | null;
  currentPhaseIdx: number;
  isEditActive: boolean;
  scrollMode: boolean;
  addMode: 'attack' | 'defence' | null;
  viewY: number;
  select: (id: string | null) => void;
  setPhaseIdx: (idx: number) => void;
  setIsEditActive: (on: boolean) => void;
  setScrollMode: (on: boolean) => void;
  setAddMode: (mode: 'attack' | 'defence' | null) => void;
  setViewY: (y: number) => void;
}

export const useEditorStore = create<EditorStoreState>((set) => ({
  selectedId: null,
  currentPhaseIdx: 0,
  isEditActive: true,
  scrollMode: false,
  addMode: null,
  viewY: -FIELD.marginM,
  select: (id) => set({ selectedId: id }),
  setPhaseIdx: (idx) => set({ currentPhaseIdx: idx }),
  setIsEditActive: (on) => set({ isEditActive: on }),
  setScrollMode: (on) => set({ scrollMode: on }),
  setAddMode: (mode) => set({ addMode: mode }),
  setViewY: (y) => set({ viewY: y }),
}));
