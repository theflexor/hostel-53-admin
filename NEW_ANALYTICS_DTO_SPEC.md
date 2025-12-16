# Новая структура DTO для Admin Analytics API

## Обзор изменений

Текущая структура DTO для эндпоинта `/api/v1/admin/` была полностью переработана для более эффективного представления аналитических данных. Новая структура обеспечивает:

- Более логичную группировку данных
- Улучшенные метрики производительности
- Расширенные insights для бизнес-аналитики
- Поддержку множественных временных периодов (daily, weekly, monthly)
- Метрики заполняемости (occupancy)

## Endpoint

```
GET /api/v1/admin/?startDate={date}&endDate={date}
```

### Request Parameters

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| startDate | string | Yes      | Start date (YYYY-MM-DD format) |
| endDate   | string | Yes      | End date (YYYY-MM-DD format)   |

## Новая структура Response

```typescript
interface AdminAnalyticsDashboardResponse {
  period: {
    startDate: string        // ISO date format: "2025-01-01"
    endDate: string          // ISO date format: "2025-01-31"
    totalDays: number        // Calculated: 31
  }

  summary: SummaryStats

  trends: {
    daily: RevenueTrendItem[]
    weekly?: RevenueTrendItem[]   // Optional: для длительных периодов
    monthly?: RevenueTrendItem[]  // Optional: для годовых отчетов
  }

  breakdown: {
    byStatus: BookingStatusBreakdown[]
    bySources: BookingSourceStats[]
  }

  performance: {
    rooms: RoomPerformance[]
    categories: CategoryPerformance[]
  }

  insights: PeakAnalysis
}
```

### 1. SummaryStats - Основные показатели

```typescript
interface SummaryStats {
  revenue: {
    total: number           // Общий доход (подтвержденный + отмененный)
    confirmed: number       // Подтвержденный доход
    cancelled: number       // Упущенный доход от отмен
    average: number         // Средний чек (confirmed / confirmed bookings)
  }

  bookings: {
    total: number           // Всего броней (включая отмененные)
    confirmed: number       // Подтвержденные брони
    cancelled: number       // Отмененные брони
    active: number          // Активные брони (гость в хостеле)
    completed: number       // Завершенные брони
    cancellationRate: number // Процент отмен (cancelled / total * 100)
  }

  guests: {
    total: number           // Общее количество гостей
    averagePerBooking: number // Среднее количество гостей на бронь
  }

  occupancy: {
    rate: number            // Процент заполняемости (0-100)
    totalBedNights: number  // Всего койко-ночей в периоде
    occupiedBedNights: number // Занятых койко-ночей
  }
}
```

**Пример:**
```json
{
  "summary": {
    "revenue": {
      "total": 125000,
      "confirmed": 120000,
      "cancelled": 5000,
      "average": 1500
    },
    "bookings": {
      "total": 85,
      "confirmed": 80,
      "cancelled": 5,
      "active": 15,
      "completed": 60,
      "cancellationRate": 5.88
    },
    "guests": {
      "total": 180,
      "averagePerBooking": 2.25
    },
    "occupancy": {
      "rate": 78.5,
      "totalBedNights": 1240,
      "occupiedBedNights": 973
    }
  }
}
```

### 2. RevenueTrendItem - Тренды по времени

```typescript
interface RevenueTrendItem {
  date: string          // ISO date: "2025-01-15"
  revenue: number       // Доход за день
  bookings: number      // Количество броней
  guests: number        // Количество гостей
  averageRate: number   // Средний чек за день
}
```

**Пример:**
```json
{
  "trends": {
    "daily": [
      {
        "date": "2025-01-15",
        "revenue": 4500,
        "bookings": 3,
        "guests": 7,
        "averageRate": 1500
      }
    ]
  }
}
```

### 3. BookingStatusBreakdown - Разбивка по статусам

```typescript
interface BookingStatusBreakdown {
  status: "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  count: number         // Количество броней
  revenue: number       // Доход от броней
  percentage: number    // Процент от общего количества
}
```

**Пример:**
```json
{
  "breakdown": {
    "byStatus": [
      {
        "status": "CONFIRMED",
        "count": 20,
        "revenue": 30000,
        "percentage": 25.0
      },
      {
        "status": "ACTIVE",
        "count": 15,
        "revenue": 22500,
        "percentage": 18.75
      },
      {
        "status": "COMPLETED",
        "count": 45,
        "revenue": 67500,
        "percentage": 56.25
      }
    ]
  }
}
```

### 4. BookingSourceStats - Анализ источников броней

```typescript
interface BookingSourceStats {
  source: "RECEPTION" | "WEBSITE"
  bookings: number          // Количество броней
  revenue: number           // Доход
  percentage: number        // Процент от общего количества
  averageValue: number      // Средний чек
  cancellationRate: number  // Процент отмен для этого источника
}
```

**Пример:**
```json
{
  "breakdown": {
    "bySources": [
      {
        "source": "WEBSITE",
        "bookings": 50,
        "revenue": 75000,
        "percentage": 62.5,
        "averageValue": 1500,
        "cancellationRate": 3.2
      },
      {
        "source": "RECEPTION",
        "bookings": 30,
        "revenue": 45000,
        "percentage": 37.5,
        "averageValue": 1500,
        "cancellationRate": 8.5
      }
    ]
  }
}
```

### 5. RoomPerformance - Производительность комнат

```typescript
interface RoomPerformance {
  roomId: number
  roomName: string
  categoryName: string      // Название категории (women-6, men-4a, etc.)
  bookings: number          // Количество броней
  revenue: number           // Доход
  occupancyRate: number     // Процент заполняемости (0-100)
  averageRate: number       // Средний чек
  totalNights: number       // Общее количество ночей
}
```

**Формула occupancyRate:**
```
occupancyRate = (occupiedBedNights / (totalBeds * daysInPeriod)) * 100
```

**Пример:**
```json
{
  "performance": {
    "rooms": [
      {
        "roomId": 1,
        "roomName": "Women's Dormitory 6",
        "categoryName": "women-6",
        "bookings": 25,
        "revenue": 37500,
        "occupancyRate": 85.5,
        "averageRate": 1500,
        "totalNights": 150
      }
    ]
  }
}
```

### 6. CategoryPerformance - Производительность категорий

```typescript
interface CategoryPerformance {
  categoryId: number
  categoryName: string      // "women-6", "men-4a", "men-4b", "men-12"
  bookings: number          // Количество броней
  revenue: number           // Доход
  rooms: number             // Количество комнат в категории
  averageRate: number       // Средний чек
  occupancyRate: number     // Процент заполняемости
}
```

**Пример:**
```json
{
  "performance": {
    "categories": [
      {
        "categoryId": 1,
        "categoryName": "women-6",
        "bookings": 45,
        "revenue": 67500,
        "rooms": 3,
        "averageRate": 1500,
        "occupancyRate": 82.3
      }
    ]
  }
}
```

### 7. PeakAnalysis - Insights и аналитика

```typescript
interface PeakAnalysis {
  busiestDays: Array<{
    date: string            // ISO date
    bookings: number        // Количество броней
    revenue: number         // Доход
  }>

  topRooms: Array<{
    roomId: number
    roomName: string
    revenue: number
  }>

  averageLeadTime: number   // Среднее время от бронирования до заезда (дни)
  averageStayDuration: number // Средняя продолжительность пребывания (дни)
}
```

**Пример:**
```json
{
  "insights": {
    "busiestDays": [
      {
        "date": "2025-01-15",
        "bookings": 8,
        "revenue": 12000
      }
    ],
    "topRooms": [
      {
        "roomId": 3,
        "roomName": "Men's Dormitory 12",
        "revenue": 45000
      }
    ],
    "averageLeadTime": 5.5,
    "averageStayDuration": 3.2
  }
}
```

## Полный пример Response

```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "totalDays": 31
  },
  "summary": {
    "revenue": {
      "total": 125000,
      "confirmed": 120000,
      "cancelled": 5000,
      "average": 1500
    },
    "bookings": {
      "total": 85,
      "confirmed": 80,
      "cancelled": 5,
      "active": 15,
      "completed": 60,
      "cancellationRate": 5.88
    },
    "guests": {
      "total": 180,
      "averagePerBooking": 2.25
    },
    "occupancy": {
      "rate": 78.5,
      "totalBedNights": 1240,
      "occupiedBedNights": 973
    }
  },
  "trends": {
    "daily": [
      {
        "date": "2025-01-01",
        "revenue": 3000,
        "bookings": 2,
        "guests": 5,
        "averageRate": 1500
      }
    ]
  },
  "breakdown": {
    "byStatus": [
      {
        "status": "CONFIRMED",
        "count": 20,
        "revenue": 30000,
        "percentage": 25.0
      },
      {
        "status": "ACTIVE",
        "count": 15,
        "revenue": 22500,
        "percentage": 18.75
      },
      {
        "status": "COMPLETED",
        "count": 45,
        "revenue": 67500,
        "percentage": 56.25
      },
      {
        "status": "CANCELLED",
        "count": 5,
        "revenue": 0,
        "percentage": 6.25
      }
    ],
    "bySources": [
      {
        "source": "WEBSITE",
        "bookings": 50,
        "revenue": 75000,
        "percentage": 62.5,
        "averageValue": 1500,
        "cancellationRate": 3.2
      },
      {
        "source": "RECEPTION",
        "bookings": 30,
        "revenue": 45000,
        "percentage": 37.5,
        "averageValue": 1500,
        "cancellationRate": 8.5
      }
    ]
  },
  "performance": {
    "rooms": [
      {
        "roomId": 1,
        "roomName": "Women's Dormitory 6",
        "categoryName": "women-6",
        "bookings": 25,
        "revenue": 37500,
        "occupancyRate": 85.5,
        "averageRate": 1500,
        "totalNights": 150
      }
    ],
    "categories": [
      {
        "categoryId": 1,
        "categoryName": "women-6",
        "bookings": 45,
        "revenue": 67500,
        "rooms": 3,
        "averageRate": 1500,
        "occupancyRate": 82.3
      }
    ]
  },
  "insights": {
    "busiestDays": [
      {
        "date": "2025-01-15",
        "bookings": 8,
        "revenue": 12000
      }
    ],
    "topRooms": [
      {
        "roomId": 3,
        "roomName": "Men's Dormitory 12",
        "revenue": 45000
      }
    ],
    "averageLeadTime": 5.5,
    "averageStayDuration": 3.2
  }
}
```

## Важные формулы для бэкенда

### 1. Заполняемость комнаты (occupancyRate)
```
occupancyRate = (occupiedBedNights / totalBedNights) * 100

где:
totalBedNights = количество коек в комнате * количество дней в периоде
occupiedBedNights = сумма (количество занятых коек * количество ночей) для всех броней
```

### 2. Средний чек (averageRate)
```
averageRate = totalRevenue / numberOfBookings
```

### 3. Процент отмен (cancellationRate)
```
cancellationRate = (cancelledBookings / totalBookings) * 100
```

### 4. Средняя продолжительность пребывания (averageStayDuration)
```
averageStayDuration = сумма (endTime - startTime в днях) / количество броней
```

### 5. Среднее время от бронирования до заезда (averageLeadTime)
```
averageLeadTime = сумма (startTime - createdAt в днях) / количество броней
```

## Миграция со старой структуры

Frontend уже содержит адаптер для преобразования старой структуры в новую. Это позволяет постепенную миграцию без ломки существующего функционала.

### Mapping старых полей на новые:

| Старое поле                       | Новое поле                        |
|-----------------------------------|-----------------------------------|
| summary.totalRevenue              | summary.revenue.confirmed         |
| summary.potentialLostRevenue      | summary.revenue.cancelled         |
| summary.averageBookingValue       | summary.revenue.average           |
| summary.totalBookings             | summary.bookings.total            |
| summary.cancelledBookings         | summary.bookings.cancelled        |
| summary.cancellationRate          | summary.bookings.cancellationRate |
| summary.totalGuests               | summary.guests.total              |
| revenueTrend                      | trends.daily                      |
| bookingSources                    | breakdown.bySources               |
| statusBreakdown                   | breakdown.byStatus                |
| roomPerformance                   | performance.rooms                 |

## Преимущества новой структуры

1. **Логичная группировка**: Данные сгруппированы по смыслу (revenue, bookings, guests)
2. **Расширяемость**: Легко добавлять новые метрики в существующие группы
3. **Множественные периоды**: Поддержка daily/weekly/monthly трендов
4. **Occupancy метрики**: Критически важные данные для хостела
5. **Insights**: Автоматические выводы о пиковых периодах и лучших комнатах
6. **Performance по категориям**: Анализ производительности не только комнат, но и категорий

## TODO для Backend

- [ ] Реализовать расчет occupancy метрик
- [ ] Добавить поле `guests` в RevenueTrendItem
- [ ] Реализовать CategoryPerformance
- [ ] Добавить расчет averageLeadTime и averageStayDuration
- [ ] Добавить опциональные weekly и monthly trends для длительных периодов
- [ ] Добавить categoryName в RoomPerformance
- [ ] Добавить cancellationRate для каждого источника бронирования
