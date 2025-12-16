"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HostelAPI, type RoomsDto, type CategoryDto, type AmenityDto, type PictureDto } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

interface RoomFormData {
  title: string
  description: string
  capacity: number
  beds: string
  roomSize: number
  categoryId: number | null
  amenityIds: number[]
}

export default function RoomsPage() {
  const { isAuthenticated } = useAuth()
  const [rooms, setRooms] = useState<RoomsDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [amenities, setAmenities] = useState<AmenityDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomsDto | null>(null)
  const [formData, setFormData] = useState<RoomFormData>({
    title: "",
    description: "",
    capacity: 1,
    beds: "",
    roomSize: 0,
    categoryId: null,
    amenityIds: [],
  })
  const [formLoading, setFormLoading] = useState(false)

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    room: RoomsDto | null
    loading: boolean
  }>({ open: false, room: null, loading: false })

  // Images dialog
  const [imagesDialog, setImagesDialog] = useState<{
    open: boolean
    room: RoomsDto | null
    pictures: PictureDto[]
    loading: boolean
    uploading: boolean
  }>({ open: false, room: null, pictures: [], loading: false, uploading: false })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const [roomsData, categoriesData, amenitiesData] = await Promise.all([
        HostelAPI.getAllRooms(),
        HostelAPI.getAllCategories(),
        HostelAPI.getAllAmenities(),
      ])
      setRooms(roomsData)
      setCategories(categoriesData)
      setAmenities(amenitiesData)
    } catch (err) {
      console.error("Failed to load data:", err)
      setError("Не удалось загрузить данные. Проверьте авторизацию.")
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingRoom(null)
    setFormData({
      title: "",
      description: "",
      capacity: 1,
      beds: "",
      roomSize: 0,
      categoryId: null,
      amenityIds: [],
    })
    setDialogOpen(true)
  }

  const openEditDialog = (room: RoomsDto) => {
    setEditingRoom(room)

    // Find amenity IDs by matching names
    const amenityIds = amenities
      .filter((amenity) => room.amenities?.includes(amenity.amenity))
      .map((amenity) => amenity.amenityId)

    setFormData({
      title: room.title,
      description: room.description,
      capacity: room.capacity,
      beds: room.beds,
      roomSize: room.roomSize,
      categoryId: room.categoryId || null,
      amenityIds: amenityIds,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (!formData.categoryId) {
        throw new Error("Выберите категорию")
      }

      const roomData = {
        title: formData.title,
        description: formData.description,
        capacity: formData.capacity,
        beds: formData.beds,
        roomSize: formData.roomSize,
        categoryId: formData.categoryId,
        amenityIds: formData.amenityIds,
        pictureUrls: editingRoom?.pictureUrls || [],
      }

      if (editingRoom) {
        await HostelAPI.updateRoom(editingRoom.id, roomData)
      } else {
        await HostelAPI.createRoom(roomData)
      }

      await loadData()
      setDialogOpen(false)
    } catch (err) {
      console.error("Failed to save room:", err)
      alert("Не удалось сохранить комнату")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.room) return

    setDeleteDialog((prev) => ({ ...prev, loading: true }))
    try {
      await HostelAPI.deleteRoom(deleteDialog.room.id)
      await loadData()
      setDeleteDialog({ open: false, room: null, loading: false })
    } catch (err) {
      console.error("Failed to delete room:", err)
      alert("Не удалось удалить комнату")
      setDeleteDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const toggleAmenity = (amenityId: number) => {
    setFormData((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter((id) => id !== amenityId)
        : [...prev.amenityIds, amenityId],
    }))
  }

  const openImagesDialog = async (room: RoomsDto) => {
    setImagesDialog({ open: true, room, pictures: [], loading: true, uploading: false })
    try {
      const pictures = await HostelAPI.getPicturesByRoom(room.id)
      setImagesDialog((prev) => ({ ...prev, pictures, loading: false }))
    } catch (err) {
      console.error("Failed to load pictures:", err)
      setImagesDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleUploadImages = async () => {
    if (!imagesDialog.room || selectedFiles.length === 0) return

    setImagesDialog((prev) => ({ ...prev, uploading: true }))
    try {
      await HostelAPI.uploadPictures(imagesDialog.room.id, selectedFiles)
      const pictures = await HostelAPI.getPicturesByRoom(imagesDialog.room.id)
      setImagesDialog((prev) => ({ ...prev, pictures, uploading: false }))
      setSelectedFiles([])
      await loadData()
    } catch (err) {
      console.error("Failed to upload pictures:", err)
      alert("Не удалось загрузить изображения")
      setImagesDialog((prev) => ({ ...prev, uploading: false }))
    }
  }

  const handleDeletePicture = async (pictureId: number) => {
    if (!imagesDialog.room) return

    setImagesDialog((prev) => ({ ...prev, loading: true }))
    try {
      await HostelAPI.deletePicture(pictureId)
      const pictures = await HostelAPI.getPicturesByRoom(imagesDialog.room.id)
      setImagesDialog((prev) => ({ ...prev, pictures, loading: false }))
      await loadData()
    } catch (err) {
      console.error("Failed to delete picture:", err)
      alert("Не удалось удалить изображение")
      setImagesDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="text-lg">Доступ запрещен. Войдите в систему.</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Управление комнатами</h1>
            <p className="text-muted-foreground">
              Создание, редактирование и удаление комнат
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить комнату
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Вместимость</TableHead>
                  <TableHead>Кровати</TableHead>
                  <TableHead>Размер (м²)</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Комнаты не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>{room.id}</TableCell>
                      <TableCell className="font-medium">{room.title}</TableCell>
                      <TableCell>{room.categoryName || "—"}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>{room.beds}</TableCell>
                      <TableCell>{room.roomSize}</TableCell>
                      <TableCell>{room.price ? `${room.price} сом` : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openImagesDialog(room)}
                            title="Управление изображениями"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(room)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, room, loading: false })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? "Редактировать комнату" : "Добавить комнату"}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о комнате
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Вместимость</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        capacity: parseInt(e.target.value) || 1,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="beds">Кровати</Label>
                  <Input
                    id="beds"
                    value={formData.beds}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, beds: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="roomSize">Размер комнаты (м²)</Label>
                  <Input
                    id="roomSize"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.roomSize}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        roomSize: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Категория</Label>
                  <Select
                    value={formData.categoryId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, categoryId: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.category} ({cat.price} сом)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Удобства</Label>
                  <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                    {amenities.map((amenity) => (
                      <div key={amenity.amenityId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity.amenityId}`}
                          checked={formData.amenityIds.includes(amenity.amenityId)}
                          onCheckedChange={() => toggleAmenity(amenity.amenityId)}
                        />
                        <label
                          htmlFor={`amenity-${amenity.amenityId}`}
                          className="text-sm cursor-pointer"
                        >
                          {amenity.amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={formLoading}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            !deleteDialog.loading &&
            setDeleteDialog({ open, room: null, loading: false })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить комнату?</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить комнату "{deleteDialog.room?.title}"?
                Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, room: null, loading: false })}
                disabled={deleteDialog.loading}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteDialog.loading}
              >
                {deleteDialog.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  "Удалить"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Images Management Dialog */}
        <Dialog
          open={imagesDialog.open}
          onOpenChange={(open) => {
            if (!imagesDialog.loading && !imagesDialog.uploading) {
              setImagesDialog({ open, room: null, pictures: [], loading: false, uploading: false })
              setSelectedFiles([])
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Управление изображениями - {imagesDialog.room?.title}</DialogTitle>
              <DialogDescription>
                Загрузка и управление изображениями комнаты
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Upload Section */}
              <div className="space-y-4">
                <Label>Загрузить новые изображения</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={imagesDialog.uploading}
                  />
                  <Button
                    onClick={handleUploadImages}
                    disabled={selectedFiles.length === 0 || imagesDialog.uploading}
                  >
                    {imagesDialog.uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Загрузить
                      </>
                    )}
                  </Button>
                </div>
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Выбрано файлов: {selectedFiles.length}
                  </p>
                )}
              </div>

              {/* Current Images */}
              <div className="space-y-4">
                <Label>Текущие изображения</Label>
                {imagesDialog.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : imagesDialog.pictures.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    Изображения не найдены
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagesDialog.pictures.map((picture) => (
                      <div
                        key={picture.id}
                        className="relative group border rounded-lg overflow-hidden aspect-square"
                      >
                        <img
                          src={picture.url}
                          alt={`Room ${imagesDialog.room?.title}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePicture(picture.id)}
                            disabled={imagesDialog.loading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setImagesDialog({ open: false, room: null, pictures: [], loading: false, uploading: false })
                  setSelectedFiles([])
                }}
                disabled={imagesDialog.loading || imagesDialog.uploading}
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
