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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HostelAPI, type BunkResponseDto, type RoomsDto } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BunkFormData {
  number: number
  tier: "TOP" | "BOTTOM"
  roomId: number | null
}

export default function BunksPage() {
  const { isAuthenticated } = useAuth()
  const [bunks, setBunks] = useState<BunkResponseDto[]>([])
  const [rooms, setRooms] = useState<RoomsDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBunk, setEditingBunk] = useState<BunkResponseDto | null>(null)
  const [formData, setFormData] = useState<BunkFormData>({
    number: 1,
    tier: "BOTTOM",
    roomId: null,
  })
  const [formLoading, setFormLoading] = useState(false)

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    bunk: BunkResponseDto | null
    loading: boolean
  }>({ open: false, bunk: null, loading: false })

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const roomsData = await HostelAPI.getAllRooms()
      setRooms(roomsData)

      // Load all bunks for all rooms
      const bunksPromises = roomsData.map((room) =>
        HostelAPI.getBunksByRoom(room.id).catch(() => [])
      )
      const bunksArrays = await Promise.all(bunksPromises)
      const allBunks = bunksArrays.flat()
      setBunks(allBunks)
    } catch (err) {
      console.error("Failed to load data:", err)
      setError("Не удалось загрузить данные. Проверьте авторизацию.")
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingBunk(null)
    setFormData({
      number: 1,
      tier: "BOTTOM",
      roomId: null,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (bunk: BunkResponseDto) => {
    setEditingBunk(bunk)
    setFormData({
      number: bunk.number,
      tier: bunk.tier,
      roomId: bunk.roomId,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (!formData.roomId) {
        throw new Error("Выберите комнату")
      }

      const bunkData = {
        number: formData.number,
        tier: formData.tier,
        roomId: formData.roomId,
      }

      if (editingBunk) {
        await HostelAPI.updateBunk(editingBunk.id, bunkData)
      } else {
        await HostelAPI.createBunk(bunkData)
      }

      await loadData()
      setDialogOpen(false)
    } catch (err) {
      console.error("Failed to save bunk:", err)
      alert("Не удалось сохранить койко-место")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.bunk) return

    setDeleteDialog((prev) => ({ ...prev, loading: true }))
    try {
      await HostelAPI.deleteBunk(deleteDialog.bunk.id)
      await loadData()
      setDeleteDialog({ open: false, bunk: null, loading: false })
    } catch (err) {
      console.error("Failed to delete bunk:", err)
      alert("Не удалось удалить койко-место")
      setDeleteDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const getRoomName = (roomId: number) => {
    return rooms.find((r) => r.id === roomId)?.title || `Room ${roomId}`
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
            <h1 className="text-3xl font-bold">Управление койко-местами</h1>
            <p className="text-muted-foreground">
              Создание, редактирование и удаление койко-мест
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить койко-место
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
                  <TableHead>Номер койки</TableHead>
                  <TableHead>Ярус</TableHead>
                  <TableHead>Комната</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bunks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Койко-места не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  bunks.map((bunk) => (
                    <TableRow key={bunk.id}>
                      <TableCell>{bunk.id}</TableCell>
                      <TableCell className="font-medium">{bunk.number}</TableCell>
                      <TableCell>
                        {bunk.tier === "TOP" ? (
                          <span className="text-blue-600">Верхняя</span>
                        ) : (
                          <span className="text-green-600">Нижняя</span>
                        )}
                      </TableCell>
                      <TableCell>{getRoomName(bunk.roomId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(bunk)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, bunk, loading: false })
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBunk ? "Редактировать койко-место" : "Добавить койко-место"}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о койко-месте
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="room">Комната</Label>
                <Select
                  value={formData.roomId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, roomId: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите комнату" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="number">Номер койки</Label>
                <Input
                  id="number"
                  type="number"
                  min="1"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      number: parseInt(e.target.value) || 1,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="tier">Ярус</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value: "TOP" | "BOTTOM") =>
                    setFormData((prev) => ({ ...prev, tier: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTTOM">Нижняя</SelectItem>
                    <SelectItem value="TOP">Верхняя</SelectItem>
                  </SelectContent>
                </Select>
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
            setDeleteDialog({ open, bunk: null, loading: false })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить койко-место?</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить койко-место #{deleteDialog.bunk?.number}?
                Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, bunk: null, loading: false })}
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
      </div>
    </AdminLayout>
  )
}
