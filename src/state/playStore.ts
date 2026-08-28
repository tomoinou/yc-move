import { create } from 'zustand';
import { produce } from 'immer';
import type { Play } from '../core/types.ts';
import { samplePlay } from '../ui/samplePlay.ts';

const MAX_HISTORY = 100;

interface PlayStoreState {
  play: Play;
  past: Play[];
  future: Play[];
  canUndo: boolean;
  canRedo: boolean;
  commit: (recipe: (draft: Play) => void) => void;
  undo: () => void;
  redo: () => void;
}

export const usePlayStore = create<PlayStoreState>((set, get) => ({
  play: samplePlay,
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  commit(recipe) {
    const { play, past } = get();
    const next = produce(play, recipe);
    if (next === play) return;
    const newPast = [...past, play].slice(-MAX_HISTORY);
    set({ play: next, past: newPast, future: [], canUndo: true, canRedo: false });
  },

  undo() {
    const { play, past, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    const newPast = past.slice(0, -1);
    set({
      play: prev,
      past: newPast,
      future: [play, ...future],
      canUndo: newPast.length > 0,
      canRedo: true,
    });
  },

  redo() {
    const { play, past, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      play: next,
      past: [...past, play],
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
  },
}));
