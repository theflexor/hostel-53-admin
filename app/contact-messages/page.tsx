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
import { HostelAPI, type ContactMessage } from "@/lib/api"
import { Trash2, Loader2, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

export default function ContactMessagesPage() {
  const { isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // View dialog
  const [viewDialog, setViewDialog] = useState<{
    open: boolean
    message: ContactMessage | null
  }>({ open: false, message: null })

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    message: ContactMessage | null
    loading: boolean
  }>({ open: false, message: null, loading: false })

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages()
    }
  }, [isAuthenticated])

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await HostelAPI.getAllContactMessages()
      setMessages(data)
    } catch (err) {
      console.error("Failed to load contact messages:", err)
      setError("Не удалось загрузить сообщения. Проверьте авторизацию.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.message) return

    setDeleteDialog((prev) => ({ ...prev, loading: true }))
    try {
      await HostelAPI.deleteContactMessage(deleteDialog.message.id)
      await loadMessages()
      setDeleteDialog({ open: false, message: null, loading: false })
    } catch (err) {
      console.error("Failed to delete message:", err)
      alert("Не удалось удалить сообщение")
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
        <div>
          <h1 className="text-3xl font-bold">Контактные сообщения</h1>
          <p className="text-muted-foreground">
            Просмотр сообщений от посетителей сайта
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
                  <TableHead>Телефон</TableHead>
                  <TableHead>Тема</TableHead>
                  <TableHead>Сообщение</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Сообщения не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>{message.id}</TableCell>
                      <TableCell className="font-medium">
                        {message.firstName} {message.lastName}
                      </TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell>{message.phone}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {message.subject}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {message.message}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setViewDialog({ open: true, message })
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, message, loading: false })
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

        {/* View Dialog */}
        <Dialog
          open={viewDialog.open}
          onOpenChange={(open) => setViewDialog({ open, message: null })}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Контактное сообщение</DialogTitle>
              <DialogDescription>
                Детали сообщения от посетителя
              </DialogDescription>
            </DialogHeader>
            {viewDialog.message && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Имя</Label>
                    <p className="font-medium">{viewDialog.message.firstName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Фамилия</Label>
                    <p className="font-medium">{viewDialog.message.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{viewDialog.message.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Телефон</Label>
                    <p className="font-medium">{viewDialog.message.phone}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Тема</Label>
                  <p className="font-medium">{viewDialog.message.subject}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Сообщение</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                    <p className="whitespace-pre-wrap">{viewDialog.message.message}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewDialog({ open: false, message: null })}
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            !deleteDialog.loading &&
            setDeleteDialog({ open, message: null, loading: false })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить сообщение?</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить сообщение от{" "}
                {deleteDialog.message?.firstName} {deleteDialog.message?.lastName}?
                Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, message: null, loading: false })}
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
