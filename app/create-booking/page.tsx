import { CreateBookingForm } from "@/components/create-booking-form"

export default function CreateBookingPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Создать бронирование</h1>
        <p className="text-muted-foreground mt-2">Выберите комнату, койки и заполните данные гостя</p>
      </div>
      <CreateBookingForm />
    </div>
  )
}
