import json
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from mt5_worker import (
    get_account_info,
    get_history_deals,
    get_positions,
    initialize_mt5,
    login_mt5,
    shutdown_mt5,
)


HOST = "0.0.0.0"
PORT = 5050


def read_json(handler):
    length = int(handler.headers.get("Content-Length", "0") or "0")
    if length <= 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    return json.loads(raw or "{}")


def json_response(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    handler.end_headers()
    handler.wfile.write(body)


def fetch_snapshot(days=2):
    account = get_account_info()
    if not account:
        return {
            "success": False,
            "ok": False,
            "code": "NO_ACCOUNT",
            "message": "MT5 terminal account олдсонгүй. MT5 desktop дээр account-аараа login хийнэ үү.",
        }

    now = datetime.now()
    from_date = now - timedelta(days=max(1, int(days or 2)))
    return {
        "success": True,
        "ok": True,
        "account": account,
        "accountInfo": account,
        "positions": get_positions(),
        "deals": get_history_deals(from_date, now),
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def do_OPTIONS(self):
        json_response(self, 200, {"ok": True})

    def do_GET(self):
        if self.path == "/health":
            json_response(self, 200, {"ok": True, "service": "Smart Inventory MT5 simple bridge"})
            return
        json_response(self, 404, {"ok": False, "message": "Route not found"})

    def do_POST(self):
        try:
            if self.path == "/connect":
                payload = read_json(self)
                account_number = int(payload.get("accountNumber") or 0)
                password = payload.get("password") or ""
                server = payload.get("server") or ""
                terminal_path = payload.get("terminalPath")

                ok, error = initialize_mt5(terminal_path)
                if not ok:
                    shutdown_mt5()
                    json_response(self, 503, {"success": False, "ok": False, "code": "MT5_INITIALIZE_FAILED", "message": error})
                    return

                ok, error = login_mt5(account_number, password, server)
                if not ok:
                    shutdown_mt5()
                    json_response(self, 401, {"success": False, "ok": False, "code": "MT5_LOGIN_FAILED", "message": error})
                    return

                json_response(self, 200, fetch_snapshot(payload.get("days", 30)))
                return

            if self.path == "/snapshot":
                payload = read_json(self)
                ok, error = initialize_mt5(None)
                if not ok:
                    shutdown_mt5()
                    json_response(self, 503, {"success": False, "ok": False, "code": "MT5_INITIALIZE_FAILED", "message": error})
                    return

                json_response(self, 200, fetch_snapshot(payload.get("days", 2)))
                return

            json_response(self, 404, {"ok": False, "message": "Route not found"})
        except Exception as exc:
            json_response(self, 500, {"success": False, "ok": False, "code": "BRIDGE_ERROR", "message": str(exc)})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Smart Inventory MT5 simple bridge running on http://{HOST}:{PORT}")
    server.serve_forever()
