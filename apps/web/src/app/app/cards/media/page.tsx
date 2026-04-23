'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  useMediaStore,
  getRandomFolderColor,
  type MediaFolder,
  type MediaItem,
} from '@/store/mediaStore'
import toast from 'react-hot-toast'
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Tag,
  Search,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  MoveRight,
  Pencil,
  X,
  Loader2,
  Plus,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

interface PendingFile {
  id: string
  file: File
  preview: string
  progress: number
  tags: string[]
}

export default function MediaLibraryPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Store selectors
  const folders = useMediaStore((s) => s.folders)
  const items = useMediaStore((s) => s.items)
  const addFolder = useMediaStore((s) => s.addFolder)
  const renameFolder = useMediaStore((s) => s.renameFolder)
  const removeFolder = useMediaStore((s) => s.removeFolder)
  const addItems = useMediaStore((s) => s.addItems)
  const removeItem = useMediaStore((s) => s.removeItem)
  const updateTags = useMediaStore((s) => s.updateTags)
  const moveToFolder = useMediaStore((s) => s.moveToFolder)

  // Local state
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState<Record<string, string>>({})
  const [editingTagId, setEditingTagId] = useState<string | null>(null)

  // Folder state
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameFolderOpen, setRenameFolderOpen] = useState(false)
  const [renameFolderTarget, setRenameFolderTarget] = useState<MediaFolder | null>(null)
  const [renameFolderValue, setRenameFolderValue] = useState('')
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)

  // Collect all unique tags from items
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach((item) => item.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [items])

  // Count images per folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((item) => {
      if (item.folderId) {
        counts[item.folderId] = (counts[item.folderId] || 0) + 1
      }
    })
    return counts
  }, [items])

  // Active folder object
  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null
    return folders.find((f) => f.id === activeFolderId) ?? null
  }, [folders, activeFolderId])

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesFolder =
        activeFolderId === null ? true : item.folderId === activeFolderId
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesTag = !activeTag || item.tags.includes(activeTag)
      return matchesFolder && matchesSearch && matchesTag
    })
  }, [items, activeFolderId, searchQuery, activeTag])

  // --- Folder handlers ---
  const handleCreateFolder = useCallback(() => {
    const name = newFolderName.trim()
    if (!name) {
      toast.error('Digite um nome para a pasta.')
      return
    }
    const folder: MediaFolder = {
      id: generateId(),
      name,
      color: getRandomFolderColor(),
      createdAt: new Date().toISOString(),
    }
    addFolder(folder)
    setNewFolderName('')
    setCreateFolderOpen(false)
    toast.success(`Pasta "${name}" criada.`)
  }, [newFolderName, addFolder])

  const handleRenameFolder = useCallback(() => {
    if (!renameFolderTarget) return
    const name = renameFolderValue.trim()
    if (!name) {
      toast.error('Digite um nome para a pasta.')
      return
    }
    renameFolder(renameFolderTarget.id, name)
    setRenameFolderOpen(false)
    setRenameFolderTarget(null)
    setRenameFolderValue('')
    toast.success('Pasta renomeada.')
  }, [renameFolderTarget, renameFolderValue, renameFolder])

  const handleDeleteFolder = useCallback(
    (folder: MediaFolder) => {
      removeFolder(folder.id)
      if (activeFolderId === folder.id) {
        setActiveFolderId(null)
      }
      toast.success(`Pasta "${folder.name}" excluida. Imagens movidas para raiz.`)
    },
    [removeFolder, activeFolderId]
  )

  const openRenameDialog = useCallback((folder: MediaFolder) => {
    setRenameFolderTarget(folder)
    setRenameFolderValue(folder.name)
    setRenameFolderOpen(true)
  }, [])

  const handleMoveToFolder = useCallback(
    (itemId: string, folderId: string | null) => {
      moveToFolder(itemId, folderId)
      const folderName = folderId
        ? folders.find((f) => f.id === folderId)?.name ?? 'pasta'
        : 'raiz'
      toast.success(`Imagem movida para "${folderName}".`)
    },
    [moveToFolder, folders]
  )

  // --- Drag image over folder card ---
  const handleFolderDragOver = useCallback((e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(folderId)
  }, [])

  const handleFolderDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(null)
  }, [])

  const handleFolderDrop = useCallback(
    (e: React.DragEvent, folderId: string) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverFolderId(null)

      const itemId = e.dataTransfer.getData('text/media-item-id')
      if (itemId) {
        handleMoveToFolder(itemId, folderId)
        return
      }
    },
    [handleMoveToFolder]
  )

  // --- Drag & Drop upload handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    const valid: PendingFile[] = []

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" não e um formato aceito. Use JPG, PNG ou WebP.`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" excede o limite de 10MB.`)
        continue
      }
      const preview = URL.createObjectURL(file)
      valid.push({
        id: generateId(),
        file,
        preview,
        progress: 0,
        tags: [],
      })
    }

    if (valid.length > 0) {
      setPendingFiles((prev) => [...prev, ...valid])
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
        e.target.value = ''
      }
    },
    [processFiles]
  )

  const removePending = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const removed = prev.find((f) => f.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  // --- Upload (base64 to localStorage) ---
  const handleUpload = useCallback(async () => {
    if (pendingFiles.length === 0) return
    setUploading(true)

    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
        reader.readAsDataURL(file)
      })
    }

    try {
      const newItems: MediaItem[] = []

      for (let i = 0; i < pendingFiles.length; i++) {
        const pf = pendingFiles[i]

        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, progress: 30 } : f))
        )

        const base64 = await readFileAsBase64(pf.file)

        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, progress: 80 } : f))
        )

        const mediaItem: MediaItem = {
          id: generateId(),
          name: pf.file.name,
          url: base64,
          thumbnail: base64,
          size: pf.file.size,
          type: pf.file.type,
          tags: pf.tags,
          folderId: activeFolderId,
          createdAt: new Date().toISOString(),
        }
        newItems.push(mediaItem)

        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, progress: 100 } : f))
        )
      }

      addItems(newItems)

      pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview))
      setPendingFiles([])

      const folderMsg = activeFolderId
        ? ` na pasta "${activeFolder?.name}"`
        : ''
      toast.success(
        newItems.length === 1
          ? `Imagem enviada com sucesso${folderMsg}!`
          : `${newItems.length} imagens enviadas com sucesso${folderMsg}!`
      )
    } catch {
      toast.error('Erro ao processar imagens. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }, [pendingFiles, addItems, activeFolderId, activeFolder])

  const handleDelete = useCallback(
    (id: string, name: string) => {
      removeItem(id)
      toast.success(`"${name}" removida.`)
    },
    [removeItem]
  )

  const handleAddTag = useCallback(
    (itemId: string) => {
      const value = (tagInput[itemId] || '').trim().toLowerCase()
      if (!value) return
      const item = items.find((i) => i.id === itemId)
      if (!item) return
      if (item.tags.includes(value)) {
        toast.error('Tag ja existe nesta imagem.')
        return
      }
      updateTags(itemId, [...item.tags, value])
      setTagInput((prev) => ({ ...prev, [itemId]: '' }))
    },
    [tagInput, items, updateTags]
  )

  const handleRemoveTag = useCallback(
    (itemId: string, tag: string) => {
      const item = items.find((i) => i.id === itemId)
      if (!item) return
      updateTags(
        itemId,
        item.tags.filter((t) => t !== tag)
      )
    },
    [items, updateTags]
  )

  // Image card drag start (for dragging to folders)
  const handleImageDragStart = useCallback(
    (e: React.DragEvent, itemId: string) => {
      e.dataTransfer.setData('text/media-item-id', itemId)
      e.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Mídias</h2>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie as imagens dos seus produtos para usar nos cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setCreateFolderOpen(true)}
          >
            <FolderPlus className="w-4 h-4" />
            Nova Pasta
          </Button>
          <span className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? 'imagem' : 'imagens'}
          </span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${
            isDragOver
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-gray-700 bg-brand-surface/50 hover:border-gray-600 hover:bg-brand-surface'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload
          className={`w-10 h-10 mx-auto mb-3 transition-colors ${
            isDragOver ? 'text-primary-400' : 'text-gray-500'
          }`}
        />
        <p className="text-sm font-medium text-gray-300">
          Arraste imagens aqui ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG ou WebP - ate 10MB por arquivo
          {activeFolderId && activeFolder
            ? ` (enviar para "${activeFolder.name}")`
            : ''}
        </p>
      </div>

      {/* Pending Files Preview */}
      {pendingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-200">
                {pendingFiles.length}{' '}
                {pendingFiles.length === 1
                  ? 'arquivo selecionado'
                  : 'arquivos selecionados'}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    pendingFiles.forEach((pf) =>
                      URL.revokeObjectURL(pf.preview)
                    )
                    setPendingFiles([])
                  }}
                  disabled={uploading}
                >
                  Limpar
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Enviar {pendingFiles.length > 1 ? 'todos' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {pendingFiles.map((pf) => (
                <div
                  key={pf.id}
                  className="relative group rounded-lg overflow-hidden border border-brand-border bg-brand-surface"
                >
                  <div className="aspect-square">
                    <img
                      src={pf.preview}
                      alt={pf.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {pf.progress > 0 && pf.progress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                      <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${pf.progress}%` }}
                      />
                    </div>
                  )}
                  {pf.progress === 100 && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                  {!uploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removePending(pf.id)
                      }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                  <div className="p-1.5">
                    <p className="text-[10px] text-gray-400 truncate">
                      {pf.file.name}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {formatFileSize(pf.file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Folder Row */}
      {folders.length > 0 && (
        <div className="space-y-2">
          {/* Breadcrumb */}
          {activeFolder && (
            <div className="flex items-center gap-1.5 text-sm">
              <button
                onClick={() => setActiveFolderId(null)}
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                Todas
              </button>
              <span className="text-gray-600">&gt;</span>
              <span className="text-white font-medium">{activeFolder.name}</span>
            </div>
          )}

          {/* Scrollable folder cards */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
            {/* "Todas" button */}
            <button
              onClick={() => setActiveFolderId(null)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                activeFolderId === null
                  ? 'bg-primary-500/15 text-primary-400 border-primary-500/30'
                  : 'bg-brand-surface/50 text-gray-400 border-brand-border hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Todas</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                {items.length}
              </Badge>
            </button>

            {/* Folder cards */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                onDragLeave={handleFolderDragLeave}
                onDrop={(e) => handleFolderDrop(e, folder.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm group/folder ${
                  activeFolderId === folder.id
                    ? 'bg-primary-500/15 text-primary-400 border-primary-500/30'
                    : dragOverFolderId === folder.id
                      ? 'bg-primary-500/10 text-primary-300 border-primary-500/40 scale-105'
                      : 'bg-brand-surface/50 text-gray-400 border-brand-border hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="whitespace-nowrap">{folder.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {folderCounts[folder.id] || 0}
                  </Badge>
                </button>

                {/* Folder actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover/folder:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => openRenameDialog(folder)}
                      className="gap-2 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Renomear
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteFolder(folder)}
                      className="gap-2 cursor-pointer text-red-400 focus:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Tag Filter Bar */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-gray-500" />
              <button
                onClick={() => setActiveTag(null)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  !activeTag
                    ? 'bg-primary-500/15 text-primary-400 border-primary-500/20'
                    : 'text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
              >
                Todas
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setActiveTag(activeTag === tag ? null : tag)
                  }
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    activeTag === tag
                      ? 'bg-primary-500/15 text-primary-400 border-primary-500/20'
                      : 'text-gray-400 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Grid */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">
            Nenhuma imagem ainda
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Arraste fotos dos seus produtos aqui.
          </p>
          <Button
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Selecionar imagens
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-300 mb-1">
            Nenhum resultado encontrado
          </h3>
          <p className="text-sm text-gray-500">
            Tente buscar por outro termo ou limpe os filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const itemFolder = item.folderId
              ? folders.find((f) => f.id === item.folderId)
              : null

            return (
              <Card
                key={item.id}
                className="overflow-hidden group"
                draggable
                onDragStart={(e) => handleImageDragStart(e, item.id)}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden relative">
                  <img
                    src={item.thumbnail || item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1 text-xs"
                      onClick={() =>
                        router.push(
                          `/app/cards/generate?image=${encodeURIComponent(item.url)}`
                        )
                      }
                    >
                      <ImageIcon className="w-3 h-3" />
                      Usar no card
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="secondary" className="px-2">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs text-gray-500">
                          Mover para pasta
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleMoveToFolder(item.id, null)}
                          className="gap-2 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Sem pasta
                        </DropdownMenuItem>
                        {folders.map((folder) => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={() => handleMoveToFolder(item.id, folder.id)}
                            className="gap-2 cursor-pointer"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: folder.color }}
                            />
                            {folder.name}
                            {item.folderId === folder.id && (
                              <span className="ml-auto text-primary-400 text-[10px]">atual</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id, item.name)}
                          className="gap-2 cursor-pointer text-red-400 focus:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardContent className="p-3 space-y-2">
                  {/* File info */}
                  <div>
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11px] text-gray-500">
                        {formatFileSize(item.size)}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Folder badge */}
                  {itemFolder && (
                    <div className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: itemFolder.color }}
                      />
                      <span className="text-[11px] text-gray-400 truncate">
                        {itemFolder.name}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1">
                    {item.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 gap-1 cursor-pointer group/tag"
                        onClick={() => handleRemoveTag(item.id, tag)}
                      >
                        {tag}
                        <X className="w-2.5 h-2.5 opacity-0 group-hover/tag:opacity-100 transition-opacity" />
                      </Badge>
                    ))}
                    {editingTagId === item.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleAddTag(item.id)
                          setEditingTagId(null)
                        }}
                        className="inline-flex"
                      >
                        <input
                          autoFocus
                          value={tagInput[item.id] || ''}
                          onChange={(e) =>
                            setTagInput((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          onBlur={() => {
                            if (tagInput[item.id]?.trim()) {
                              handleAddTag(item.id)
                            }
                            setEditingTagId(null)
                          }}
                          placeholder="tag"
                          className="h-5 w-16 text-[10px] bg-brand-surface border border-gray-700 rounded px-1.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-primary-500"
                        />
                      </form>
                    ) : (
                      <button
                        onClick={() => setEditingTagId(item.id)}
                        className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-1 py-0.5 rounded hover:bg-brand-surface"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        tag
                      </button>
                    )}
                  </div>

                  {/* Mobile actions */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1 text-xs"
                      onClick={() =>
                        router.push(
                          `/app/cards/generate?image=${encodeURIComponent(item.url)}`
                        )
                      }
                    >
                      <ImageIcon className="w-3 h-3" />
                      Usar no card
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="px-2">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs text-gray-500">
                          Mover para pasta
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleMoveToFolder(item.id, null)}
                          className="gap-2 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Sem pasta
                        </DropdownMenuItem>
                        {folders.map((folder) => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={() => handleMoveToFolder(item.id, folder.id)}
                            className="gap-2 cursor-pointer"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: folder.color }}
                            />
                            {folder.name}
                            {item.folderId === folder.id && (
                              <span className="ml-auto text-primary-400 text-[10px]">atual</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id, item.name)}
                          className="gap-2 cursor-pointer text-red-400 focus:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateFolder()
            }}
            className="space-y-4"
          >
            <div>
              <Input
                autoFocus
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreateFolderOpen(false)
                  setNewFolderName('')
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Criar pasta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameFolderOpen} onOpenChange={setRenameFolderOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Renomear Pasta</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleRenameFolder()
            }}
            className="space-y-4"
          >
            <div>
              <Input
                autoFocus
                placeholder="Novo nome da pasta"
                value={renameFolderValue}
                onChange={(e) => setRenameFolderValue(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRenameFolderOpen(false)
                  setRenameFolderTarget(null)
                  setRenameFolderValue('')
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <Pencil className="w-4 h-4" />
                Renomear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
