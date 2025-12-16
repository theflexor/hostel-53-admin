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
import { HostelAPI, type Review } from "@/lib/api"
import { Trash2, Loader2, Star } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

export default function ReviewsPage() {
  const { isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    review: Review | null
    loading: boolean
  }>({ open: false, review: null, loading: false })

  useEffect(() => {
    if (isAuthenticated) {
      loadReviews()
    }
  }, [isAuthenticated])

  const loadReviews = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await HostelAPI.getAllReviews()
      setReviews(data)
    } catch (err) {
      console.error("Failed to load reviews:", err)
      setError("Не удалось загрузить отзывы. Проверьте авторизацию.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.review) return

    setDeleteDialog((prev) => ({ ...prev, loading: true }))
    try {
      await HostelAPI.deleteReview(deleteDialog.review.id)
      await loadReviews()
      setDeleteDialog({ open: false, review: null, loading: false })
    } catch (err) {
      console.error("Failed to delete review:", err)
      alert("Не удалось удалить отзыв")
      setDeleteDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
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
        <div>
          <h1 className="text-3xl font-bold">Отзывы гостей</h1>
          <p className="text-muted-foreground">
            Просмотр и управление отзывами от гостей хостела
          </p>
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
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Рейтинг</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Отзывы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.id}</TableCell>
                      <TableCell className="font-medium">{review.name}</TableCell>
                      <TableCell>{review.email}</TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {review.comment}
                      </TableCell>
                      <TableCell>
                        {format(new Date(review.createdAt), "dd MMM yyyy", {
                          locale: ru,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteDialog({ open: true, review, loading: false })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            !deleteDialog.loading &&
            setDeleteDialog({ open, review: null, loading: false })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить отзыв?</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить отзыв от {deleteDialog.review?.name}?
                Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            {deleteDialog.review && (
              <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Рейтинг:</span>
                  {renderStars(deleteDialog.review.rating)}
                </div>
                <div>
                  <span className="font-semibold">Комментарий:</span>
                  <p className="mt-1 text-sm">{deleteDialog.review.comment}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, review: null, loading: false })}
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
