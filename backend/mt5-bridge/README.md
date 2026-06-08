# Smart Investory MT5 Bridge

This is a separate Python FastAPI service that validates broker accounts through the local MetaTrader 5 terminal.

The Next.js app calls:

```txt
POST /api/broker/connect
  -> MT5_BRIDGE_URL/connect
  -> Python MT5 Bridge
  -> MT5 Terminal
  -> broker account login validation
```

The bridge does not access XM, Exness, or any broker database directly. It validates the account by attempting a real MT5 login and then reading `account_info`.

## Requirements

- Windows PC or Windows VPS
- Python 3.10+
- MetaTrader 5 desktop terminal installed
- Broker MT5 account number, password, and exact server name

The `MetaTrader5` Python package talks to the installed MT5 desktop terminal, so this service normally runs on Windows where MT5 is installed.

## Install

```bash
cd mt5-bridge
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configure

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Set:

```env
NEXT_APP_URL=http://localhost:3000
MT5_TERMINAL_PATH=
```

`MT5_TERMINAL_PATH` is optional. If MT5 is not detected automatically, set it to your terminal path, for example:

```env
MT5_TERMINAL_PATH=C:\Program Files\MetaTrader 5\terminal64.exe
```

## Broker server name

For XM and other brokers, the server name must match the MT5 login server exactly.

You can see it in:

- MT5 login window
- Broker member area
- Account opening email
- MT5 Navigator account properties

Examples:

```txt
XMGlobal-MT5 7
Exness-MT5Real
ICMarketsSC-MT5
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 5050
```

Health check:

```bash
curl http://localhost:5050/health
```

Expected:

```json
{
  "ok": true,
  "service": "mt5-bridge"
}
```

## Connect API

```http
POST /connect
Content-Type: application/json
```

Request:

```json
{
  "accountNumber": 12345678,
  "password": "user-password",
  "server": "XMGlobal-MT5 7"
}
```

Success:

```json
{
  "success": true,
  "account": {
    "login": 12345678,
    "name": "Account Owner",
    "server": "XMGlobal-MT5 7",
    "balance": 1000,
    "equity": 1000,
    "currency": "USD",
    "leverage": 500
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Account number, password эсвэл server буруу байна"
}
```

## Positions API

```http
POST /positions
Content-Type: application/json
```

Request:

```json
{
  "accountNumber": 12345678,
  "password": "user-password",
  "server": "XMGlobal-MT5 7"
}
```

Response:

```json
{
  "success": true,
  "positions": [
    {
      "ticket": 123456,
      "symbol": "XAUUSD",
      "type": "BUY",
      "volume": 0.1,
      "price_open": 2350.5,
      "price_current": 2360.2,
      "sl": 2340,
      "tp": 2380,
      "profit": 97,
      "time": "2026-06-07T21:40:00"
    }
  ]
}
```

## History API

```http
POST /history
Content-Type: application/json
```

Request:

```json
{
  "accountNumber": 12345678,
  "password": "user-password",
  "server": "XMGlobal-MT5 7",
  "from": "2026-06-01",
  "to": "2026-06-07"
}
```

Response:

```json
{
  "success": true,
  "deals": [
    {
      "ticket": 987654,
      "order": 123456,
      "symbol": "EURUSD",
      "type": "SELL",
      "volume": 0.2,
      "price": 1.085,
      "profit": 45.2,
      "commission": -1.2,
      "swap": 0,
      "time": "2026-06-07T20:15:00"
    }
  ]
}
```

## Full Sync API

```http
POST /sync
Content-Type: application/json
```

Returns both open `positions` and historical `deals` in one call. The Next.js route `POST /api/trades/sync` calls this endpoint, then stores only real MT5 data in the database.

## Next.js setup

In the Next.js app `.env`:

```env
MT5_BRIDGE_URL=http://localhost:5050
```

Then start the website and connect a broker from the Broker page.

## Security

- Password is never printed.
- Password is never logged.
- Password is never written to a file or database.
- Response never includes password.
- CORS only allows `NEXT_APP_URL`.
- Error messages never expose password.
- Store only trade data and masked account metadata in the main app.
- Duplicate sync is prevented in Next.js by `mt5Ticket`.
