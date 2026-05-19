# Deploy хийх заавар

## Render дээр deploy хийх

1. GitHub repo: `https://github.com/azaaazjargal499-art/trade`
2. Render dashboard дээр `New` -> `Blueprint` сонгоно.
3. Энэ repo-г connect хийнэ.
4. Render `render.yaml` файлыг уншаад 3 resource үүсгэнэ:
   - `smart-inventory-db` PostgreSQL database
   - `smart-inventory-api` Node/Express API
   - `smart-inventory-web` React/Vite static frontend
5. Secret асуувал AI/Google login ашиглах values нэмнэ:
   - `GROQ_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## Deploy URLs

Анхны тохиргоогоор:

- Frontend: `https://smart-inventory-web.onrender.com`
- Backend: `https://smart-inventory-api.onrender.com`
- Health check: `https://smart-inventory-api.onrender.com/health`

## Database

Энэ deploy тохиргоо Render-ийн PostgreSQL database ашиглана. `DATABASE_URL` нь `render.yaml`-аар автоматаар backend-д холбогдоно.

Хэрвээ Render service name давхцаад өөр URL өгвөл:

- Backend-ийн `CORS_ORIGIN`, `FRONTEND_URL`
- Frontend-ийн `VITE_API_URL`

гэсэн env variables-ийг Render dashboard дээр шинэ URL-аар солиод redeploy хийнэ.

## Database migration

`render.yaml` дотор backend-ийн `preDeployCommand`:

```bash
npx prisma migrate deploy
```

гэж тохирсон тул deploy бүрийн өмнө Prisma migration автоматаар ажиллана.
