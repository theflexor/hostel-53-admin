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
import { HostelAPI, type CategoryDto } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CategoryFormData {
  category: string
  price: number
}

export default function CategoriesPage() {
  const { isAuthenticated } = useAuth()
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    category: "",
    price: 0,
  })
  const [formLoading, setFormLoading] = useState(false)

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    category: CategoryDto | null
    loading: boolean
  }>({ open: false, category: null, loading: false })

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories()
    }
  }, [isAuthenticated])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await HostelAPI.getAllCategories()
      setCategories(data)
    } catch (err) {
      console.error("Failed to load categories:", err)
      setError("Не удалось загрузить категории. Проверьте авторизацию.")
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setFormData({
      category: "",
      price: 0,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (category: CategoryDto) => {
    setEditingCategory(category)
    setFormData({
      category: category.category,
      price: category.price,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const categoryData = {
        category: formData.category,
        price: formData.price,
      }

      if (editingCategory) {
        await HostelAPI.updateCategory(editingCategory.id, categoryData)
      } else {
        await HostelAPI.createCategory(categoryData)
      }

      await loadCategories()
      setDialogOpen(false)
    } catch (err) {
      console.error("Failed to save category:", err)
      alert("Не удалось сохранить категорию")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.category) return

    setDeleteDialog((prev) => ({ ...prev, loading: true }))
    try {
      await HostelAPI.deleteCategory(deleteDialog.category.id)
      await loadCategories()
      setDeleteDialog({ open: false, category: null, loading: false })
    } catch (err) {
      console.error("Failed to delete category:", err)
      alert("Не удалось удалить категорию")
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
            <h1 className="text-3xl font-bold">Управление категориями</h1>
            <p className="text-muted-foreground">
              Создание, редактирование и удаление категорий комнат
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить категорию
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
                  <TableHead>Категория</TableHead>
                  <TableHead>Цена (сом/ночь)</TableHead>
                  <TableHead>Количество комнат</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Категории не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.id}</TableCell>
                      <TableCell className="font-medium">{category.category}</TableCell>
                      <TableCell>{category.price.toLocaleString()} сом</TableCell>
                      <TableCell>{category.roomIds?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, category, loading: false })
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
                {editingCategory ? "Редактировать категорию" : "Добавить категорию"}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о категории
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Название категории</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="Например: Стандарт, Люкс, Эконом"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Цена за ночь (сом)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
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
            setDeleteDialog({ open, category: null, loading: false })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить категорию?</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить категорию "{deleteDialog.category?.category}"?
                Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, category: null, loading: false })}
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
