# Deploy хийх заавар

## Render дээр deploy хийх

1. GitHub repo: `https://github.com/azaaazjargal499-art/trade`
2. Render dashboard дээр `New` -> `Blueprint` сонгоно.
3. Энэ repo-г connect хийнэ.
4. Render `render.yaml` файлыг уншаад 2 resource үүсгэнэ:
   - `smart-inventory-api` Node/Express API
   - `smart-inventory-web` React/Vite static frontend
5. Secret дээр MySQL connection string болон API keys оруулна:
   - `DATABASE_URL`
   - `GROQ_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## Deploy URLs

Анхны тохиргоогоор:

- Frontend: `https://smart-inventory-web.onrender.com`
- Backend: `https://smart-inventory-api.onrender.com`
- Health check: `https://smart-inventory-api.onrender.com/health`

## MySQL database

Энэ project-ийн Prisma schema MySQL ашигладаг. Render Blueprint нь database үүсгэхгүй тул hosted MySQL database-ийн connection string-ийг `DATABASE_URL` дээр оруулна.

Format:

```bash
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

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
