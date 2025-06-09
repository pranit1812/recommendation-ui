import { create } from 'zustand';
import { QuestionPack, Question } from '@/lib/types';

interface PacksStore {
  packs: QuestionPack[];
  
  // Actions
  addPack: (pack: QuestionPack) => void;
  updatePack: (id: string, pack: Partial<QuestionPack>) => void;
  deletePack: (id: string) => void;
  getPackById: (id: string) => QuestionPack | undefined;
  getAllPacks: () => QuestionPack[];
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

// Helper functions for localStorage
const loadPacks = (): QuestionPack[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('packs');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const savePacks = (packs: QuestionPack[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('packs', JSON.stringify(packs));
  } catch {
    // Ignore storage errors
  }
};

export const usePacksStore = create<PacksStore>((set, get) => ({
      packs: [],
      
      addPack: (pack: QuestionPack) => {
        set(state => {
          const newPacks = [...state.packs, pack];
          savePacks(newPacks);
          return { packs: newPacks };
        });
      },
      
      updatePack: (id: string, updates: Partial<QuestionPack>) => {
        set(state => {
          const newPacks = state.packs.map(pack => 
            pack.id === id ? { ...pack, ...updates } : pack
          );
          savePacks(newPacks);
          return { packs: newPacks };
        });
      },
      
      deletePack: (id: string) => {
        set(state => {
          const newPacks = state.packs.filter(pack => pack.id !== id);
          savePacks(newPacks);
          return { packs: newPacks };
        });
      },
      
      getPackById: (id: string) => {
        return get().packs.find(pack => pack.id === id);
      },
      
      getAllPacks: () => {
        return get().packs;
      },
      
      loadFromStorage: () => {
        const packs = loadPacks();
        set({ packs });
      },
      
      saveToStorage: () => {
        savePacks(get().packs);
      }
    })); 