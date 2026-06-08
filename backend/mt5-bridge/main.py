from __future__ import annotations

import logging
import threading
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Optional

import MetaTrader5 as mt5
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    next_app_url: str = "http://localhost:3000"
    mt5_terminal_path: Optional[str] = None
    expected_mt5_login: int = 318186829
    expected_mt5_server: str = "XMGlobal-MT5 7"
    mt5_login_mode: str = "MANUAL"  # MANUAL or AUTO. MANUAL: verify existing account. AUTO: call mt5.login()

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("mt5-bridge")

# Global MT5 session state
mt5_ready = False
mt5_error = None
mt5_lock = Lock()

app = FastAPI(title="Smart Investory MT5 Bridge", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.next_app_url],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ConnectRequest(BaseModel):
    accountNumber: int = Field(gt=0)
    password: Optional[str] = Field(default=None)
    server: str = Field(min_length=2)


class HistoryRequest(ConnectRequest):
    from_date: str = Field(alias="from")
    to: str


# ============================================================================
# MT5 SESSION MANAGEMENT
# ============================================================================


def initialize_mt5_once() -> bool:
    """Initialize MT5 session once at startup. Must only be called once."""
    global mt5_ready, mt5_error
    
    logger.info("Initializing MT5 session (this may take 30+ seconds)...")
    
    # Normalize and validate path
    terminal_path = settings.mt5_terminal_path
    if terminal_path:
        terminal_path = terminal_path.replace("/", "\\")
        if not Path(terminal_path).exists():
            error_msg = f"MT5 terminal path does not exist: {terminal_path}"
            logger.error(error_msg)
            mt5_error = error_msg
            mt5_ready = False
            return False
        logger.info(f"Terminal path: {terminal_path}")
    
    # Try initialization with retries (exponential backoff)
    max_retries = 2
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                logger.info(f"Retry {attempt}/{max_retries - 1}: waiting {retry_delay}s before retry...")
                import time
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            
            if terminal_path:
                logger.info(f"Calling mt5.initialize(path='{terminal_path}') - attempt {attempt + 1}/{max_retries}...")
                success = mt5.initialize(path=terminal_path)
            else:
                logger.info(f"Calling mt5.initialize() with default path - attempt {attempt + 1}/{max_retries}...")
                success = mt5.initialize()
            
            if success:
                logger.info("MT5 session initialized successfully")
                mt5_ready = True
                mt5_error = None
                return True
            
            error_code = mt5.last_error()
            logger.warning(f"Attempt {attempt + 1} failed: {error_code}")
            
            if attempt == max_retries - 1:
                # Last attempt failed, store error and return
                error_msg = f"MT5 initialization failed after {max_retries} attempts: {error_code}"
                logger.error(error_msg)
                mt5_error = error_msg
                mt5_ready = False
                return False
        
        except Exception as e:
            logger.exception(f"Initialization attempt {attempt + 1} exception: {e}")
            if attempt == max_retries - 1:
                error_msg = f"MT5 initialization exception after {max_retries} attempts: {e}"
                logger.error(error_msg)
                mt5_error = error_msg
                mt5_ready = False
                return False
    
    return False


def ensure_mt5_ready() -> tuple[bool, Optional[str]]:
    """Check if MT5 session is ready. Initializes on first call (lazy init)."""
    global mt5_ready, mt5_error
    
    # If already tried and failed, return error
    if mt5_error and mt5_ready is False:
        return False, mt5_error
    
    # If ready, return success
    if mt5_ready:
        return True, None
    
    # First call - try to initialize
    logger.info("First MT5 request - initializing MT5 session...")
    if initialize_mt5_once():
        return True, None
    else:
        return False, mt5_error or "MT5 session not initialized"


def get_account_info() -> Optional[dict]:
    """Get current account information. Must be called inside lock."""
    logger.info("Getting account info...")
    try:
        info = mt5.account_info()
        if info is None:
            logger.warning("account_info returned None")
            return None
        
        return {
            "login": info.login,
            "name": info.name,
            "server": info.server,
            "currency": info.currency,
            "balance": float(info.balance),
            "equity": float(info.equity),
            "credit": float(info.credit),
            "margin": float(info.margin),
            "margin_free": float(info.margin_free),
            "leverage": int(info.leverage),
            "margin_level": float(info.margin_level),
        }
    except Exception as e:
        logger.exception(f"account_info exception: {e}")
        return None


def get_positions() -> list[dict]:
    """Get open positions. Must be called inside lock."""
    logger.info("Getting positions...")
    try:
        positions = mt5.positions_get()
        if positions is None or len(positions) == 0:
            logger.info("No open positions")
            return []
        
        result = []
        for pos in positions:
            result.append({
                "ticket": pos.ticket,
                "symbol": pos.symbol,
                "type": "BUY" if pos.type == 0 else "SELL",
                "volume": float(pos.volume),
                "price_open": float(pos.price_open),
                "price_current": float(pos.price_current),
                "sl": float(pos.sl),
                "tp": float(pos.tp),
                "profit": float(pos.profit),
                "time": datetime.fromtimestamp(pos.time).isoformat(),
            })
        
        logger.info(f"Retrieved {len(result)} positions")
        return result
    except Exception as e:
        logger.exception(f"positions_get exception: {e}")
        return []


def get_history_deals(from_date: datetime, to_date: datetime) -> list[dict]:
    """Get historical deals. Must be called inside lock."""
    logger.info(f"Getting history from {from_date} to {to_date}...")
    try:
        deals = mt5.history_deals_get(from_date, to_date)
        if deals is None or len(deals) == 0:
            logger.info(f"No history deals between {from_date} and {to_date}")
            return []
        
        result = []
        for deal in deals:
            deal_type = "BUY" if deal.type == 0 else "SELL" if deal.type == 1 else "OTHER"
            result.append({
                "ticket": deal.ticket,
                "order": deal.order,
                "position_id": getattr(deal, "position_id", None),
                "entry": getattr(deal, "entry", None),
                "symbol": deal.symbol,
                "type": deal_type,
                "volume": float(deal.volume),
                "price": float(deal.price),
                "profit": float(deal.profit),
                "commission": float(deal.commission),
                "swap": float(deal.swap),
                "time": datetime.fromtimestamp(deal.time).isoformat(),
            })
        
        logger.info(f"Retrieved {len(result)} history deals")
        return result
    except Exception as e:
        logger.exception(f"history_deals_get exception: {e}")
        return []


def login_account(account: int, password: Optional[str], server: str) -> tuple[bool, Optional[str]]:
    """Handle MT5 login based on login mode. Must be called inside lock. Returns (success, error_message)."""
    
    if settings.mt5_login_mode.upper() == "MANUAL":
        # MANUAL mode: don't call mt5.login(), just verify current account
        logger.info(f"MANUAL mode: verifying current account matches {account}/{server}")
        
        account_info = get_account_info()
        if account_info is None:
            error_msg = "MT5 account info is empty - MT5 terminal may not be logged in"
            logger.warning(error_msg)
            return False, error_msg
        
        # Verify account matches
        logged_in_login = account_info.get("login")
        if logged_in_login != account:
            error_msg = f"Account mismatch: MT5 is logged into {logged_in_login}, but you requested {account}. Please login to {account} in MT5 desktop first."
            logger.warning(error_msg)
            return False, error_msg
        
        # Verify server matches (normalized comparison)
        logged_in_server = (account_info.get("server") or "").strip()
        requested_server = (server or "").strip()
        if logged_in_server.lower() != requested_server.lower():
            error_msg = f"Server mismatch: MT5 is logged into {logged_in_server}, but you requested {requested_server}. Please login to {requested_server} in MT5 desktop first."
            logger.warning(error_msg)
            return False, error_msg
        
        logger.info(f"MANUAL mode: verified account {account} on server {server}")
        return True, None
    else:
        # AUTO mode: call mt5.login()
        logger.info(f"AUTO mode: logging in to account {account} on server {server}...")
        if not password:
            error_msg = "AUTO mode requires password"
            logger.warning(error_msg)
            return False, error_msg
        
        login_result = {"success": False, "error": None}
        
        def _login_thread():
            try:
                success = mt5.login(login=account, password=password, server=server)
                if not success:
                    error_code = mt5.last_error()
                    login_result["error"] = f"MT5 login failed: {error_code}"
                    logger.warning(login_result["error"])
                else:
                    login_result["success"] = True
                    logger.info(f"Login successful for account {account}")
            except Exception as e:
                login_result["error"] = f"MT5 login exception: {e}"
                logger.exception(login_result["error"])
        
        thread = threading.Thread(target=_login_thread, daemon=True)
        thread.start()
        thread.join(timeout=30)  # Wait max 30 seconds for login
        
        if thread.is_alive():
            error = "MT5 login timed out after 30 seconds"
            logger.warning(error)
            return False, error
        
        if not login_result["success"]:
            error = login_result.get("error", "Unknown login error")
            # Check if it's IPC timeout
            if "IPC timeout" in error or "-10005" in error:
                error = f"{error}. Use MANUAL mode: login inside MT5 desktop first, then connect from website."
            return False, error
        
        return True, None

# ============================================================================
# FASTAPI STARTUP/SHUTDOWN
# ============================================================================


@app.on_event("startup")
async def startup_event():
    """Bridge startup. MT5 initialization is deferred to first request."""
    logger.info("Bridge starting up...")
    logger.info("MT5 initialization will happen on first request (lazy initialization)")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup at shutdown."""
    logger.info("Bridge shutting down...")
    global mt5_ready
    try:
        with mt5_lock:
            mt5.shutdown()
            mt5_ready = False
        logger.info("MT5 session shut down")
    except Exception as e:
        logger.warning("MT5 shutdown error: %s", e)


# ============================================================================
# ENDPOINTS
# ============================================================================


@app.get("/health")
def health() -> dict:
    """Health check. Always responds fast."""
    terminal_exists = False
    if settings.mt5_terminal_path:
        terminal_exists = Path(settings.mt5_terminal_path.replace("/", "\\")).exists()
    else:
        default_paths = [
            Path("C:\\Program Files\\MetaTrader 5\\terminal64.exe"),
            Path("C:\\Program Files (x86)\\MetaTrader 5\\terminal64.exe"),
        ]
        terminal_exists = any(p.exists() for p in default_paths)
    
    return {
        "ok": True,
        "service": "mt5-bridge",
        "mt5Ready": mt5_ready,
        "terminalPathExists": terminal_exists,
    }


@app.get("/debug")
def debug() -> dict:
    """Get current MT5 account info from terminal."""
    ready, error = ensure_mt5_ready()
    if not ready:
        return {
            "ok": False,
            "success": False,
            "code": "MT5_NOT_READY",
            "message": error,
            "loginMode": settings.mt5_login_mode.upper(),
        }
    
    try:
        with mt5_lock:
            account_info = get_account_info()
            if not account_info:
                return {
                    "ok": False,
                    "success": False,
                    "code": "MT5_ACCOUNT_INFO_EMPTY",
                    "message": "MT5 account info is empty - terminal may not be logged in",
                    "loginMode": settings.mt5_login_mode.upper(),
                }
            
            positions = get_positions()
            
            # Check if it's a demo account
            current_server = account_info.get("server", "").strip()
            is_demo = "demo" in current_server.lower()
            
            debug_msg = None
            if is_demo and current_server.lower() != settings.expected_mt5_server.lower():
                debug_msg = f"Current MT5 terminal account is {account_info.get('login')} ({current_server}), not {settings.expected_mt5_login} ({settings.expected_mt5_server}). Please login to {settings.expected_mt5_login} in MT5 desktop first."
            
            logger.info(
                "[DEBUG] login=%s server=%s balance=%s equity=%s positions=%s loginMode=%s",
                account_info.get("login"),
                account_info.get("server"),
                account_info.get("balance"),
                account_info.get("equity"),
                len(positions),
                settings.mt5_login_mode.upper(),
            )
            
            response = {
                "ok": True,
                "success": True,
                "mt5Ready": True,
                "loginMode": settings.mt5_login_mode.upper(),
                "currentAccount": account_info,
                "positionsCount": len(positions),
            }
            
            if debug_msg:
                response["debugMessage"] = debug_msg
            
            return response
    except Exception as e:
        logger.exception("Debug endpoint error: %s", e)
        return {
            "ok": False,
            "success": False,
            "code": "INTERNAL_ERROR",
            "message": str(e),
            "loginMode": settings.mt5_login_mode.upper(),
        }


@app.post("/connect")
def connect(request: ConnectRequest) -> dict:
    """Connect and validate broker account. Handles both MANUAL and AUTO login modes."""
    logger.info("Connect requested: account=%s server=%s loginMode=%s", 
                request.accountNumber, request.server, settings.mt5_login_mode.upper())
    
    ready, error = ensure_mt5_ready()
    if not ready:
        return {
            "success": False,
            "ok": False,
            "code": "MT5_NOT_READY",
            "message": error,
            "loginMode": settings.mt5_login_mode.upper(),
        }
    
    try:
        with mt5_lock:
            # Verify or login to requested account
            success, login_error = login_account(
                int(request.accountNumber),
                request.password,
                request.server,
            )
            
            if not success:
                logger.warning("Login/verify failed: %s", login_error)
                return {
                    "success": False,
                    "ok": False,
                    "code": "LOGIN_FAILED",
                    "message": login_error,
                    "loginMode": settings.mt5_login_mode.upper(),
                }
            
            # Get account info (should already be verified by login_account)
            account_info = get_account_info()
            if not account_info:
                return {
                    "success": False,
                    "ok": False,
                    "code": "MT5_ACCOUNT_INFO_EMPTY",
                    "message": "Could not retrieve account info",
                    "loginMode": settings.mt5_login_mode.upper(),
                }
            
            # Get positions
            positions = get_positions()
            
            logger.info(
                "[CONNECT] account=%s server=%s balance=%s equity=%s positions=%s loginMode=%s",
                account_info.get("login"),
                account_info.get("server"),
                account_info.get("balance"),
                account_info.get("equity"),
                len(positions),
                settings.mt5_login_mode.upper(),
            )
            
            return {
                "success": True,
                "ok": True,
                "account": account_info,
                "positions": positions,
                "loginMode": settings.mt5_login_mode.upper(),
            }
    except Exception as e:
        logger.exception("Connect endpoint error: %s", e)
        return {
            "success": False,
            "ok": False,
            "code": "INTERNAL_ERROR",
            "message": str(e),
            "loginMode": settings.mt5_login_mode.upper(),
        }


@app.post("/positions")
def positions(request: ConnectRequest) -> dict:
    """Get open positions for account."""
    logger.info("Positions requested: account=%s server=%s loginMode=%s", 
                request.accountNumber, request.server, settings.mt5_login_mode.upper())
    
    ready, error = ensure_mt5_ready()
    if not ready:
        return {
            "success": False,
            "ok": False,
            "code": "MT5_NOT_READY",
            "message": error,
            "loginMode": settings.mt5_login_mode.upper(),
        }
    
    try:
        with mt5_lock:
            # Verify or login to account
            success, login_error = login_account(
                int(request.accountNumber),
                request.password,
                request.server,
            )
            
            if not success:
                return {
                    "success": False,
                    "ok": False,
                    "code": "LOGIN_FAILED",
                    "message": login_error,
                    "loginMode": settings.mt5_login_mode.upper(),
                }
            
            positions = get_positions()
            
            return {
                "success": True,
                "ok": True,
                "positions": positions,
                "loginMode": settings.mt5_login_mode.upper(),
            }
    except Exception as e:
        logger.exception("Positions endpoint error: %s", e)
        return {
            "success": False,
            "ok": False,
            "code": "INTERNAL_ERROR",
            "message": str(e),
            "loginMode": settings.mt5_login_mode.upper(),
        }


@app.post("/history")
def history(request: HistoryRequest) -> dict:
    """Get historical deals for account."""
    logger.info("History requested: account=%s server=%s from=%s to=%s loginMode=%s", 
                request.accountNumber, request.server, request.from_date, request.to, settings.mt5_login_mode.upper())
    
    ready, error = ensure_mt5_ready()
    if not ready:
        return {
            "success": False,
            "ok": False,
            "code": "MT5_NOT_READY",
            "message": error,
            "loginMode": settings.mt5_login_mode.upper(),
        }
    
    try:
        # Parse dates
        from_date = datetime.fromisoformat(request.from_date)
        to_date = datetime.fromisoformat(request.to)
        
        with mt5_lock:
            # Verify or login to account
            success, login_error = login_account(
                int(request.accountNumber),
                request.password,
                request.server,
            )
            
            if not success:
                return {
                    "success": False,
                    "ok": False,
                    "code": "LOGIN_FAILED",
                    "message": login_error,
                    "loginMode": settings.mt5_login_mode.upper(),
                }
            
            deals = get_history_deals(from_date, to_date)
            
            return {
                "success": True,
                "ok": True,
                "deals": deals,
                "loginMode": settings.mt5_login_mode.upper(),
            }
    except Exception as e:
        logger.exception("History endpoint error: %s", e)
        return {
            "success": False,
            "ok": False,
            "code": "INTERNAL_ERROR",
            "message": str(e),
            "loginMode": settings.mt5_login_mode.upper(),
        }


@app.post("/sync")
def sync(request: HistoryRequest) -> dict:
    """Sync positions and history for account."""
    logger.info("Sync requested: account=%s server=%s from=%s to=%s loginMode=%s",
                request.accountNumber, request.server, request.from_date, request.to, settings.mt5_login_mode.upper())
    
    ready, error = ensure_mt5_ready()
    if not ready:
        return {
            "success": False,
            "ok": False,
            "code": "MT5_NOT_READY",
            "message": error,
            "loginMode": settings.mt5_login_mode.upper(),
        }
    
    try:
        # Parse dates
        from_date = datetime.fromisoformat(request.from_date)
        to_date = datetime.fromisoformat(request.to)
        
        with mt5_lock:
            # Verify or login to account
            success, login_error = login_account(
                int(request.accountNumber),
                request.password,
                request.server,
            )
            
            if not success:
                return {
                    "success": False,
                    "ok": False,
                    "code": "LOGIN_FAILED",
                    "message": login_error,
                    "loginMode": settings.mt5_login_mode.upper(),
                }
            
            account_info = get_account_info()
            positions = get_positions()
            deals = get_history_deals(from_date, to_date)
            
            logger.info(
                "[SYNC] account=%s positionsCount=%s dealsCount=%s balance=%s equity=%s loginMode=%s",
                request.accountNumber,
                len(positions),
                len(deals),
                account_info.get("balance") if account_info else None,
                account_info.get("equity") if account_info else None,
                settings.mt5_login_mode.upper(),
            )
            
            return {
                "success": True,
                "ok": True,
                "accountInfo": account_info,
                "account": account_info,
                "positions": positions,
                "deals": deals,
                "positionsCount": len(positions),
                "dealsCount": len(deals),
                "loginMode": settings.mt5_login_mode.upper(),
            }
    except Exception as e:
        logger.exception("Sync endpoint error: %s", e)
        return {
            "success": False,
            "ok": False,
            "code": "INTERNAL_ERROR",
            "message": str(e),
            "loginMode": settings.mt5_login_mode.upper(),
        }
