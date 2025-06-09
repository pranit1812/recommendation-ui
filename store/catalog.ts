import { create } from 'zustand';
import { CatalogItem } from '@/lib/types';
import { parseCatalogFromUrl, parseCatalogFromFile } from '@/lib/parseCatalog';

interface CatalogStore {
  catalog: CatalogItem[];
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCatalogFromUrl: (url: string) => Promise<void>;
  loadCatalogFromFile: (file: File) => Promise<void>;
  setCatalog: (catalog: CatalogItem[]) => void;
  getCatalogByTrade: (trade: string) => CatalogItem[];
  getAllTrades: () => string[];
}

export const useCatalogStore = create<CatalogStore>((set, get) => ({
      catalog: [],
      lastUpdated: null,
      isLoading: false,
      error: null,
      
      loadCatalogFromUrl: async (url: string) => {
        set({ isLoading: true, error: null });
        try {
          const catalog = await parseCatalogFromUrl(url);
          set({ 
            catalog, 
            lastUpdated: new Date(), 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load catalog',
            isLoading: false 
          });
        }
      },
      
      loadCatalogFromFile: async (file: File) => {
        set({ isLoading: true, error: null });
        try {
          const catalog = await parseCatalogFromFile(file);
          set({ 
            catalog, 
            lastUpdated: new Date(), 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load catalog',
            isLoading: false 
          });
        }
      },
      
      setCatalog: (catalog: CatalogItem[]) => {
        set({ catalog, lastUpdated: new Date() });
      },
      
      getCatalogByTrade: (trade: string) => {
        return get().catalog.filter(item => item.trade === trade);
      },
      
      getAllTrades: () => {
        const trades = new Set(get().catalog.map(item => item.trade));
        return Array.from(trades).sort();
      }
    })); 