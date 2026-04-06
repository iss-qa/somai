'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MediaFolder {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface MediaItem {
  id: string
  name: string
  url: string
  thumbnail: string
  size: number
  type: string
  tags: string[]
  folderId: string | null
  createdAt: string
}

interface MediaState {
  folders: MediaFolder[]
  items: MediaItem[]
  addFolder: (folder: MediaFolder) => void
  renameFolder: (id: string, name: string) => void
  removeFolder: (id: string) => void
  addItem: (item: MediaItem) => void
  addItems: (items: MediaItem[]) => void
  removeItem: (id: string) => void
  updateTags: (id: string, tags: string[]) => void
  moveToFolder: (itemId: string, folderId: string | null) => void
  moveMultipleToFolder: (itemIds: string[], folderId: string | null) => void
}

const FOLDER_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6']

export function getRandomFolderColor(): string {
  return FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)]
}

export const useMediaStore = create<MediaState>()(
  persist(
    (set) => ({
      folders: [],
      items: [],
      addFolder: (folder: MediaFolder) =>
        set((state) => ({ folders: [...state.folders, folder] })),
      renameFolder: (id: string, name: string) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),
      removeFolder: (id: string) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          items: state.items.map((i) => (i.folderId === id ? { ...i, folderId: null } : i)),
        })),
      addItem: (item: MediaItem) =>
        set((state) => ({ items: [item, ...state.items] })),
      addItems: (items: MediaItem[]) =>
        set((state) => ({ items: [...items, ...state.items] })),
      removeItem: (id: string) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateTags: (id: string, tags: string[]) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, tags } : i)),
        })),
      moveToFolder: (itemId: string, folderId: string | null) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === itemId ? { ...i, folderId } : i)),
        })),
      moveMultipleToFolder: (itemIds: string[], folderId: string | null) =>
        set((state) => ({
          items: state.items.map((i) =>
            itemIds.includes(i.id) ? { ...i, folderId } : i
          ),
        })),
    }),
    { name: 'soma-media' }
  )
)
