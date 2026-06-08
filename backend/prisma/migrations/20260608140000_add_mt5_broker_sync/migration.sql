-- CreateEnum
CREATE TYPE "BrokerConnectionType" AS ENUM ('PASSWORD_BRIDGE', 'MT5_EA');

-- CreateEnum
CREATE TYPE "BrokerConnectionStatus" AS ENUM ('WAITING', 'CONNECTED', 'DISCONNECTED', 'ERROR', 'DISABLED');

-- AlterTable
ALTER TABLE "trades" ADD COLUMN "broker" TEXT,
ADD COLUMN "brokerAccountId" TEXT,
ADD COLUMN "mt5Ticket" TEXT,
ADD COLUMN "mt5OrderId" TEXT,
ADD COLUMN "swap" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "currentPrice" DOUBLE PRECISION,
ADD COLUMN "syncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "broker_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "brokerAccountId" TEXT,
    "maskedAccountNumber" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "accountLogin" TEXT,
    "accountName" TEXT,
    "accountBalance" DOUBLE PRECISION,
    "accountEquity" DOUBLE PRECISION,
    "accountCurrency" TEXT,
    "accountLeverage" INTEGER,
    "apiTokenHash" TEXT,
    "connectionType" "BrokerConnectionType" NOT NULL DEFAULT 'PASSWORD_BRIDGE',
    "lastSyncedAt" TIMESTAMP(3),
    "lastPingAt" TIMESTAMP(3),
    "status" "BrokerConnectionStatus" NOT NULL DEFAULT 'WAITING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trades_mt5Ticket_key" ON "trades"("mt5Ticket");

-- CreateIndex
CREATE INDEX "trades_brokerAccountId_idx" ON "trades"("brokerAccountId");

-- CreateIndex
CREATE INDEX "trades_mt5OrderId_idx" ON "trades"("mt5OrderId");

-- CreateIndex
CREATE UNIQUE INDEX "broker_connections_apiTokenHash_key" ON "broker_connections"("apiTokenHash");

-- CreateIndex
CREATE INDEX "broker_connections_userId_idx" ON "broker_connections"("userId");

-- AddForeignKey
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
