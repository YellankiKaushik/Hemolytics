import { create } from 'zustand';

interface AppState {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    activeRequestId: string | null;
    setActiveRequestId: (id: string | null) => void;
    selectedDonorId: string | null;
    setSelectedDonorId: (id: string | null) => void;
    datasetLoaded: boolean;
    setDatasetLoaded: (loaded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    activeRequestId: null,
    setActiveRequestId: (id) => set({ activeRequestId: id }),
    selectedDonorId: null,
    setSelectedDonorId: (id) => set({ selectedDonorId: id }),
    datasetLoaded: true,
    setDatasetLoaded: (loaded) => set({ datasetLoaded: loaded }),
}));
