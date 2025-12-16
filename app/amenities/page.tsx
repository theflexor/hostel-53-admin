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
import { HostelAPI, type AmenityDto } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AmenityFormData {
  amenity: string
}

export default function AmenitiesPage() {
  const { isAuthenticated } = useAuth()
  const [amenities, setAmenities] = useState<AmenityDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState<AmenityDto | null>(null)
  const [formData, setFormData] = useState<AmenityFormData>({
    amenity: "",
  })
  const [formLoading, setFormLoading] = useState(false)

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    amenity: AmenityDto | null
    loading: boolean
  }>({ open: false, amenity: null, loading: false })

  useEffect(() => {
    if (isAuthenticated) {
      loadAmenities()
    }
  }, [isAuthenticated])

  const loadAmenities = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await HostelAPI.getAllAmenities()
      setAmenities(data)
    } catch (err) {
      console.error("Failed to load amenities:", err)
      setError("Не удалось загрузить удобства. Проверьте авторизацию.")
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingAmenity(null)
    setFormData({ amenity: "" })
    setDialogOpen(true)
  }

  const openEditDialog = (amenity: AmenityDto) => {
    setEditingAmenity(amenity)
    setFormData({ amenity: amenity.amenity })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (editingAmenity) {
        await HostelAPI.updateAmenity(editingAmenity.amenityId, formData)
      } else {
        await HostelAPI.createAmenity(formData)
      }

      await loadAmenities()
      setDialogOpen(false)
    } catch (err) {
      console.error("Failed to save amenity:", err)
      alert("Не удалось сохранить удобство")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.amenity) return

    setDeleteDialog((prev) => ({ ...prev, loading: true }))
    try {
      await HostelAPI.deleteAmenity(deleteDialog.amenity.amenityId)
      await loadAmenities()
      setDeleteDialog({ open: false, amenity: null, loading: false })
    } catch (err) {
      console.error("Failed to delete amenity:", err)
      alert("Не удалось удалить удобство")
      setDeleteDialog((prev) => ({ ...prev, loading: false }))
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
            <h1 className="text-3xl font-bold">Управление удобствами</h1>
            <p className="text-muted-foreground">
              Создание, редактирование и удаление удобств для комнат
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить удобство
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
                  <TableHead>Удобство</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amenities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Удобства не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  amenities.map((amenity) => (
                    <TableRow key={amenity.amenityId}>
                      <TableCell>{amenity.amenityId}</TableCell>
                      <TableCell className="font-medium">{amenity.amenity}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(amenity)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, amenity, loading: false })
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
                {editingAmenity ? "Редактировать удобство" : "Добавить удобство"}
              </DialogTitle>
              <DialogDescription>
                Введите название удобства
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amenity">Название удобства</Label>
                <Input
                  id="amenity"
                  value={formData.amenity}
                  onChange={(e) =>
                    setFormData({ amenity: e.target.value })
                  }
                  placeholder="Например: Wi-Fi, Кондиционер, Телевизор"
                  required
                />
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
            setDeleteDialog({ open, amenity: null, loading: false })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить удобство?</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить удобство "{deleteDialog.amenity?.amenity}"?
                Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, amenity: null, loading: false })}
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
