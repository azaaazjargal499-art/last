#!/usr/bin/env python3
"""
MT5 Worker Process with Threading Timeout Support
Handles actual MetaTrader5 operations (initialize, login, data fetching)
Runs as a subprocess with JSON input/output for inter-process communication
"""

from __future__ import annotations

import json
import logging
import sys
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional

import MetaTrader5 as mt5

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(sys.stderr),
    ],
)
logger = logging.getLogger("mt5-worker")


def _initialize_with_timeout(terminal_path: Optional[str], timeout: int = 20) -> tuple[bool, Optional[str]]:
    """Initialize MT5 with timeout using threading."""
    result = {"success": False, "error": None}
    
    def init_thread():
        try:
            logger.info(f"Starting init thread with terminal_path={terminal_path}")
            if terminal_path:
                terminal_path_normalized = terminal_path.replace("/", "\\")
                if not Path(terminal_path_normalized).exists():
                    result["error"] = f"Terminal path does not exist: {terminal_path}"
                    result["success"] = False
                    return
                logger.info(f"Initializing with path: {terminal_path_normalized}")
                success = mt5.initialize(path=terminal_path_normalized)
            else:
                logger.info("Initializing with default path")
                success = mt5.initialize()
            
            if not success:
                error_code = mt5.last_error()
                result["error"] = f"MT5 initialize failed: {error_code}"
                result["success"] = False
            else:
                result["success"] = True
                logger.info("MT5 initialized successfully")
        except Exception as e:
            logger.exception(f"Init exception: {e}")
            result["error"] = str(e)
            result["success"] = False
    
    thread = threading.Thread(target=init_thread, daemon=True)
    thread.start()
    thread.join(timeout=timeout)
    
    if thread.is_alive():
        logger.warning(f"MT5 initialize timed out after {timeout}s")
        return False, f"MT5 initialize timed out after {timeout}s"
    
    if result["success"]:
        return True, None
    else:
        return False, result["error"]


def _login_with_timeout(account: int, password: str, server: str, timeout: int = 25) -> tuple[bool, Optional[str]]:
    """Login to MT5 with timeout using threading."""
    result = {"success": False, "error": None}
    
    def login_thread():
        try:
            logger.info(f"Starting login thread: account={account}, server={server}")
            success = mt5.login(account, password=password, server=server)
            
            if not success:
                error_code = mt5.last_error()
                result["error"] = f"MT5 login failed: code={error_code}"
                result["success"] = False
                logger.warning(f"Login failed: {result['error']}")
            else:
                result["success"] = True
                logger.info(f"Login successful: account={account}")
        except Exception as e:
            logger.exception(f"Login exception: {e}")
            result["error"] = str(e)
            result["success"] = False
    
    thread = threading.Thread(target=login_thread, daemon=True)
    thread.start()
    thread.join(timeout=timeout)
    
    if thread.is_alive():
        logger.warning(f"MT5 login timed out after {timeout}s")
        return False, f"MT5 login timed out after {timeout}s"
    
    if result["success"]:
        return True, None
    else:
        return False, result["error"]


def initialize_mt5(terminal_path: Optional[str] = None) -> tuple[bool, Optional[str]]:
    """Initialize MetaTrader5 connection with timeout."""
    return _initialize_with_timeout(terminal_path, timeout=20)


def login_mt5(account_number: int, password: str, server: str) -> tuple[bool, Optional[str]]:
    """Log in to MT5 account with timeout."""
    return _login_with_timeout(account_number, password, server, timeout=25)


def shutdown_mt5() -> None:
    """Shutdown MetaTrader5 connection."""
    try:
        mt5.shutdown()
        logger.info("MT5 shutdown complete")
    except Exception as e:
        logger.warning(f"MT5 shutdown error: {e}")


def get_account_info() -> Optional[dict]:
    """Get current account information."""
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
    """Get current open positions."""
    try:
        positions = mt5.positions_get()
        if positions is None or len(positions) == 0:
            logger.info("No open positions")
            return []

        result = []
        for pos in positions:
            result.append({
                "ticket": pos.ticket,
                "identifier": getattr(pos, "identifier", pos.ticket),
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
    """Get historical deals."""
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


def handle_debug(payload: dict) -> dict:
    """Debug action: check MT5 initialization and current account."""
    terminal_path = payload.get("terminalPath")
    
    logger.info(f"DEBUG: terminal_path={terminal_path}")

    # Try to initialize
    success, error = initialize_mt5(terminal_path)
    
    if not success:
        logger.warning(f"Init failed: {error}")
        return {
            "success": True,
            "ok": True,
            "initialized": False,
            "message": error,
        }

    # Get current account info
    account_info = get_account_info()
    initialized = account_info is not None
    
    positions = []
    if initialized:
        try:
            positions = get_positions()
        except Exception as e:
            logger.warning(f"Failed to get positions: {e}")

    try:
        shutdown_mt5()
    except Exception as e:
        logger.warning(f"Shutdown error: {e}")

    return {
        "success": True,
        "ok": True,
        "initialized": initialized,
        "currentAccount": account_info,
        "positionsCount": len(positions),
    }


def handle_connect(payload: dict) -> dict:
    """Connect action: validate account credentials."""
    account_number = payload.get("accountNumber")
    password = payload.get("password")
    server = payload.get("server")
    terminal_path = payload.get("terminalPath")

    logger.info(f"CONNECT: account={account_number} server={server}")

    # Initialize
    success, error = initialize_mt5(terminal_path)
    if not success:
        logger.warning(f"Init failed: {error}")
        shutdown_mt5()
        return {
            "success": False,
            "ok": False,
            "code": "MT5_INITIALIZE_FAILED",
            "message": error,
        }

    # Login
    success, error = login_mt5(account_number, password, server)
    if not success:
        logger.warning(f"Login failed: {error}")
        shutdown_mt5()
        return {
            "success": False,
            "ok": False,
            "code": "MT5_LOGIN_FAILED",
            "message": error,
        }

    # Get account info
    account_info = get_account_info()
    if not account_info:
        logger.warning("Could not get account info")
        shutdown_mt5()
        return {
            "success": False,
            "ok": False,
            "code": "MT5_ACCOUNT_INFO_FAILED",
            "message": "Could not retrieve account info",
        }

    # Get positions
    positions = get_positions()

    shutdown_mt5()

    return {
        "success": True,
        "ok": True,
        "account": account_info,
        "positions": positions,
    }


def handle_positions(payload: dict) -> dict:
    """Positions action: get open positions."""
    account_number = payload.get("accountNumber")
    password = payload.get("password")
    server = payload.get("server")
    terminal_path = payload.get("terminalPath")

    logger.info(f"POSITIONS: account={account_number} server={server}")

    # Initialize
    success, error = initialize_mt5(terminal_path)
    if not success:
        shutdown_mt5()
        return {"success": False, "ok": False, "code": "MT5_INITIALIZE_FAILED", "message": error}

    # Login
    success, error = login_mt5(account_number, password, server)
    if not success:
        shutdown_mt5()
        return {"success": False, "ok": False, "code": "MT5_LOGIN_FAILED", "message": error}

    # Get positions
    positions = get_positions()

    shutdown_mt5()

    return {
        "success": True,
        "ok": True,
        "positions": positions,
    }


def handle_history(payload: dict) -> dict:
    """History action: get historical deals."""
    account_number = payload.get("accountNumber")
    password = payload.get("password")
    server = payload.get("server")
    from_date_str = payload.get("from")
    to_date_str = payload.get("to")
    terminal_path = payload.get("terminalPath")

    logger.info(f"HISTORY: account={account_number} server={server} from={from_date_str} to={to_date_str}")

    # Parse dates
    try:
        from_date = datetime.fromisoformat(from_date_str)
        to_date = datetime.fromisoformat(to_date_str)
    except Exception as e:
        logger.error(f"Date parse error: {e}")
        return {"success": False, "ok": False, "code": "INVALID_DATE", "message": str(e)}

    # Initialize
    success, error = initialize_mt5(terminal_path)
    if not success:
        shutdown_mt5()
        return {"success": False, "ok": False, "code": "MT5_INITIALIZE_FAILED", "message": error}

    # Login
    success, error = login_mt5(account_number, password, server)
    if not success:
        shutdown_mt5()
        return {"success": False, "ok": False, "code": "MT5_LOGIN_FAILED", "message": error}

    # Get history
    deals = get_history_deals(from_date, to_date)

    shutdown_mt5()

    return {
        "success": True,
        "ok": True,
        "deals": deals,
    }


def handle_sync(payload: dict) -> dict:
    """Sync action: get positions and history."""
    account_number = payload.get("accountNumber")
    password = payload.get("password")
    server = payload.get("server")
    from_date_str = payload.get("from")
    to_date_str = payload.get("to")
    terminal_path = payload.get("terminalPath")

    logger.info(f"SYNC: account={account_number} server={server} from={from_date_str} to={to_date_str}")

    # Parse dates
    try:
        from_date = datetime.fromisoformat(from_date_str)
        to_date = datetime.fromisoformat(to_date_str)
    except Exception as e:
        logger.error(f"Date parse error: {e}")
        return {"success": False, "ok": False, "code": "INVALID_DATE", "message": str(e)}

    # Initialize
    success, error = initialize_mt5(terminal_path)
    if not success:
        shutdown_mt5()
        return {"success": False, "ok": False, "code": "MT5_INITIALIZE_FAILED", "message": error}

    # Login
    success, error = login_mt5(account_number, password, server)
    if not success:
        shutdown_mt5()
        return {"success": False, "ok": False, "code": "MT5_LOGIN_FAILED", "message": error}

    # Get positions and history
    positions = get_positions()
    deals = get_history_deals(from_date, to_date)

    shutdown_mt5()

    return {
        "success": True,
        "ok": True,
        "positions": positions,
        "deals": deals,
    }


def main():
    """Main entry point: read JSON from stdin, process, output JSON to stdout."""
    try:
        # Read payload from stdin
        payload_str = sys.stdin.read()
        payload = json.loads(payload_str)
        
        action = payload.get("action")
        logger.info(f"Worker action: {action}")

        # Dispatch to handler
        if action == "debug":
            result = handle_debug(payload)
        elif action == "connect":
            result = handle_connect(payload)
        elif action == "positions":
            result = handle_positions(payload)
        elif action == "history":
            result = handle_history(payload)
        elif action == "sync":
            result = handle_sync(payload)
        else:
            result = {"success": False, "ok": False, "code": "INVALID_ACTION", "message": f"Unknown action: {action}"}

        # Output result to stdout
        print(json.dumps(result))
        sys.exit(0)

    except json.JSONDecodeError as e:
        logger.exception(f"JSON decode error: {e}")
        error = {"success": False, "ok": False, "code": "JSON_DECODE_ERROR", "message": str(e)}
        print(json.dumps(error))
        sys.exit(1)
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        error = {"success": False, "ok": False, "code": "INTERNAL_ERROR", "message": str(e)}
        print(json.dumps(error))
        sys.exit(1)


if __name__ == "__main__":
    main()
