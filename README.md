# 📊 Smart Inventory — Forex Trading Journal

> Диплом ын ажил | Fullstack Web Application | Баяр-Эрдэнэ

---

## 🗂️ Folder Structure

```
smart-inventory/
├── 📁 frontend/                    # Next.js + React + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── Layout.jsx      # Sidebar + Navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Хянах самбар (статистик, графикууд)
│   │   │   ├── Trades.jsx          # Арилжааны бүртгэл (CRUD)
│   │   │   ├── Analytics.jsx       # Аналитик (сарын, цагийн, паруудын)
│   │   │   ├── RiskManagement.jsx  # Эрсдэлийн хяналт + тооцоолол
│   │   │   ├── Alerts.jsx          # Үнийн мэдэгдлүүд
│   │   │   ├── Strategies.jsx      # Стратегийн бүртгэл
│   │   │   ├── Settings.jsx        # Тохиргоо
│   │   │   ├── Login.jsx           # Нэвтрэх
│   │   │   └── Register.jsx        # Бүртгүүлэх
│   │   ├── services/               # API хүсэлтүүд (Axios)
│   │   │   ├── api.js              # Axios instance + interceptors
│   │   │   └── index.js            # tradeService, analyticsService...
│   │   ├── store/
│   │   │   └── authStore.js        # Zustand auth state
│   │   ├── utils/
│   │   │   └── formatters.js       # formatCurrency, formatDate...
│   │   ├── App.jsx                 # Router + Protected routes
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles + CSS variables
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── 📁 backend/                     # Node.js + Express + Prisma
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # Prisma client
│   │   ├── controllers/
│   │   │   ├── authController.js   # Register, Login, Profile
│   │   │   ├── tradeController.js  # CRUD + PnL тооцоо
│   │   │   ├── analyticsController.js # Dashboard, Monthly, Pairs, Hourly
│   │   │   ├── riskController.js   # Risk calculator + Exposure
│   │   │   ├── alertController.js  # Alert CRUD + Check
│   │   │   └── strategyController.js # Strategy CRUD + stats
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT protect middleware
│   │   │   ├── errorHandler.js     # Global error handler
│   │   │   └── validate.js         # express-validator
│   │   ├── routes/
│   │   │   ├── auth.js             # POST /api/auth/...
│   │   │   ├── trades.js           # CRUD /api/trades
│   │   │   ├── analytics.js        # GET  /api/analytics/...
│   │   │   ├── risk.js             # POST /api/risk/calculate
│   │   │   ├── alerts.js           # CRUD /api/alerts
│   │   │   └── strategies.js       # CRUD /api/strategies
│   │   └── utils/
│   │       ├── logger.js           # Winston logger
│   │       ├── helpers.js          # calculatePnL, calculateWinRate
│   │       └── seed.js             # Demo өгөгдөл оруулах
│   ├── prisma/
│   │   ├── schema.prisma           # User, Trade, Alert, Strategy models
│   │   └── migrations/             # SQL migrations
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # postgres + backend + frontend
├── package.json                    # root dev scripts
├── .env.example
└── README.md
```

---

## 🚀 Хурдан эхлүүлэх (Docker)

```bash
# 1. Repository-г татах
git clone https://github.com/yourusername/smart-inventory.git
cd smart-inventory

# 2. Environment хуулах
cp .env.example .env

# 3. Docker ажиллуулах (postgres + backend + frontend)
docker compose up --build

# 4. Demo өгөгдөл оруулах (нэг удаа)
docker exec smart_inventory_api npm run seed
```

Дараа нь: **http://localhost:3001** руу орж нэвтрэнэ үү.

```
📧 demo@smartinventory.mn
🔑 demo1234
```

---

## 🖥️ Локал хөгжүүлэлт (Docker-гүй)

### Backend + Frontend хамт асаах
```bash
npm run dev                 # backend :5000 + frontend :3001
```

`npm run dev` нь Docker асаахгүй. Database хэрэгтэй бол `backend/.env` доторх
`DATABASE_URL`-ийг local PostgreSQL service эсвэл cloud PostgreSQL (Neon,
Supabase, Render external database URL гэх мэт) руу заана.

Docker-гүй хамгийн бага төвөгтэй хувилбар:
1. Cloud PostgreSQL дээр database үүсгэнэ.
2. Түүний connection string-ийг `backend/.env` дотор `DATABASE_URL=` дээр тавина.
3. Schema-г database руу оруулна:
```bash
npm run db:migrate
```
4. Дараа нь app-аа асаана:
```bash
npm run dev
```

Docker ашиглаж database асаах хувилбар:
```bash
npm run dev:docker          # postgres + backend :5000 + frontend :3001
```

### Backend
```bash
cd backend
npm install
cp .env.example .env        # DATABASE_URL засах + OPENAI_API_KEY нэмэх
npx prisma migrate dev
npm run seed                # Demo өгөгдөл
npm run dev                 # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env        # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:3001
```

---

## 🔌 API Endpoints

| Method | URL | Тайлбар |
|--------|-----|---------|
| POST | `/api/auth/register` | Бүртгүүлэх |
| POST | `/api/auth/login` | Нэвтрэх |
| GET | `/api/auth/me` | Профайл |
| GET | `/api/trades` | Арилжаануудын жагсаалт |
| POST | `/api/trades` | Арилжаа нэмэх |
| PUT | `/api/trades/:id` | Арилжаа засах |
| DELETE | `/api/trades/:id` | Арилжаа устгах |
| GET | `/api/analytics/dashboard` | Нийт статистик |
| GET | `/api/analytics/monthly` | Сарын P&L |
| GET | `/api/analytics/pairs` | Паруудын үр дүн |
| GET | `/api/analytics/hourly` | Цагийн шинжилгээ |
| GET | `/api/analytics/equity-curve` | Equity curve |
| POST | `/api/risk/calculate` | Позицийн хэмжээ тооцоолол |
| GET | `/api/risk/exposure` | Нийт эрсдэл |
| GET | `/api/alerts` | Alertуудын жагсаалт |
| POST | `/api/alerts` | Alert үүсгэх |
| GET | `/api/strategies` | Стратегиуд |
| POST | `/api/strategies` | Стратеги үүсгэх |
| GET | `/api/ai/subscription` | AI захиалгын статус |
| POST | `/api/ai/subscription` | AI захиалга үүсгэх |
| POST | `/api/ai/analyze-trades` | AI арилжааны шинжилгээ |
| POST | `/api/ai/analyze-chart` | AI чартын шинжилгээ |
| GET | `/api/ai/analyses` | AI шинжилгээний түүх |

---

## 🛠️ Технологийн стэк

| Давхарга | Технологи |
|----------|-----------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Recharts, Zustand, React Query, React Router |
| **Backend** | Node.js, Express.js, Prisma ORM, OpenAI API |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **AI** | OpenAI GPT-4, GPT-4 Vision |
| **Deploy** | Docker, Docker Compose |

---

## 📐 Архитектур

```
┌─────────────┐     HTTP/REST     ┌─────────────┐     Prisma     ┌──────────────┐
│   Frontend  │ ──────────────▶  │   Backend   │ ─────────────▶ │  PostgreSQL  │
│  Next.js    │ ◀──────────────  │  Express.js │ ◀───────────── │   Database   │
│  :3001      │    JSON API       │  :5000      │                │   :5432      │
└─────────────┘                   └─────────────┘                └──────────────┘
       │                                 │
       │           Docker Network        │
       └─────────── smart_network ───────┘
```

---

## 🤖 AI Функциональ (OpenAI)

Smart Inventory-д OpenAI API ашиглан дараах AI функцуудыг ашиглах боломжтой:

### AI Шинжилгээний Төрөл

1. **Арилжааны Шинжилгээ** (`/api/ai/analyze-trades`)
   - Сүүлийн 50 арилжааг шинжилнэ
   - Давуу тал, сул тал тодорхойлно
   - Стратегийн үнэлгээ өгнө
   - Эрсдэлийн түвшин тогтооно
   - Сайжруулах зөвлөгөө өгнө

2. **Чартын Шинжилгээ** (`/api/ai/analyze-chart`)
   - Чарт зураг оруулж техникийн шинжилгээ
   - RSI, MACD, боллингер зурвас шинжилнэ
   - Дэмжлэг/эсэргүүцлийн түвшин тодорхойлно
   - BUY/SELL зөвлөгөө өгнө
   - Entry/Stop Loss/Take Profit санал болгоно

### AI Тохиргоо

```bash
# .env файлд OpenAI API key нэмэх
OPENAI_API_KEY=sk-your-openai-api-key-here

# AI захиалга үүсгэх (30 хоног)
POST /api/ai/subscription
{
  "plan": "PREMIUM"
}

# Арилжаа шинжилгээ хийх
POST /api/ai/analyze-trades
# (JWT token шаардлагатай)

# Чарт шинжилгээ хийх
POST /api/ai/analyze-chart
Content-Type: multipart/form-data
{
  "image": "chart-image.png",
  "pair": "EURUSD",
  "timeframe": "H1"
}
```

### AI Хязгаарлалт

- **Захиалга шаардлагатай**: AI функцуудыг ашиглахын тулд PREMIUM захиалга хэрэгтэй
- **API лимит**: OpenAI-н API хязгаарлалттай
- **Хэл**: Шинжилгээг Монгол хэлээр гаргана
- **Түүх**: Бүх AI шинжилгээ хадгалагдана (`/api/ai/analyses`)

---

- ✅ **JWT Authentication** — Бүртгэл, нэвтрэх, профайл
- ✅ **Trading Journal** — Арилжааны бүрэн CRUD бүртгэл
- ✅ **Auto PnL** — Гаралтын үнэ оруулахад автоматаар тооцоолно
- ✅ **Dashboard** — Win rate, R:R ratio, equity curve
- ✅ **Analytics** — Сарын, цагийн, паруудын графикууд
- ✅ **Risk Calculator** — Позицийн хэмжээ автоматаар тооцоолно
- ✅ **Smart Alerts** — Үнийн мэдэгдлийн систем
- ✅ **Strategy Tracker** — Стратеги тус бүрийн win rate харах
- ✅ **AI Trade Analysis** — OpenAI ашиглан арилжааны түүхийг шинжилнэ
- ✅ **AI Chart Analysis** — Чарт зураг оруулж AI техникийн шинжилгээ авна
- ✅ **AI Recommendations** — Худалдан авах/зарах зөвлөгөө
- ✅ **Docker Deploy** — Нэг командаар бүгдийг ажиллуулна

---

*Smart Inventory — Диплом ын ажил © 2025*
# last
