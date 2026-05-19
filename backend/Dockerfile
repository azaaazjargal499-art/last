FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm install

# Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Source code
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
