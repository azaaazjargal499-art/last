//+------------------------------------------------------------------+
//| Smart Investory MT5 EA Connector                                 |
//| Sends MT5 trade events to Smart Investory without broker password |
//+------------------------------------------------------------------+
#property strict
#property version   "1.00"
#property description "Smart Investory real-time trade journal connector"

input string SmartInvestoryApiBase = "http://localhost:3000";
input string SmartInvestoryToken = "";
input int PingSeconds = 30;
input bool SendOpenPositionsOnStart = true;

string TrimSlash(string value)
{
   while(StringLen(value) > 0 && StringSubstr(value, StringLen(value) - 1, 1) == "/")
      value = StringSubstr(value, 0, StringLen(value) - 1);
   return value;
}

string JsonEscape(string value)
{
   StringReplace(value, "\\", "\\\\");
   StringReplace(value, "\"", "\\\"");
   return value;
}

string IsoTime(datetime value)
{
   MqlDateTime parts;
   TimeToStruct(value, parts);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02d", parts.year, parts.mon, parts.day, parts.hour, parts.min, parts.sec);
}

bool PostJson(string path, string payload)
{
   if(StringLen(SmartInvestoryToken) < 16)
   {
      Print("Smart Investory token is missing.");
      return false;
   }

   string url = TrimSlash(SmartInvestoryApiBase) + path;
   string headers = "Content-Type: application/json\r\n";
   char data[];
   char result[];
   string resultHeaders;

   StringToCharArray(payload, data, 0, WHOLE_ARRAY, CP_UTF8);
   ResetLastError();

   int status = WebRequest("POST", url, headers, 10000, data, result, resultHeaders);
   if(status == -1)
   {
      Print("Smart Investory WebRequest failed. Add this URL in MT5: Tools > Options > Expert Advisors > Allow WebRequest: ", SmartInvestoryApiBase, ". Error: ", GetLastError());
      return false;
   }

   if(status < 200 || status >= 300)
   {
      string body = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      Print("Smart Investory API returned HTTP ", status, ": ", body);
      return false;
   }

   return true;
}

bool PingSmartInvestory()
{
   string payload = "{\"token\":\"" + JsonEscape(SmartInvestoryToken) + "\"}";
   return PostJson("/api/ea/ping", payload);
}

string PositionPayload(ulong ticket, string eventType)
{
   if(!PositionSelectByTicket(ticket))
      return "";

   long positionType = PositionGetInteger(POSITION_TYPE);
   string tradeType = positionType == POSITION_TYPE_SELL ? "SELL" : "BUY";
   string symbol = PositionGetString(POSITION_SYMBOL);

   return "{"
      + "\"token\":\"" + JsonEscape(SmartInvestoryToken) + "\","
      + "\"eventType\":\"" + eventType + "\","
      + "\"ticket\":" + IntegerToString((long)ticket) + ","
      + "\"orderId\":" + IntegerToString((long)ticket) + ","
      + "\"symbol\":\"" + JsonEscape(symbol) + "\","
      + "\"type\":\"" + tradeType + "\","
      + "\"volume\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ","
      + "\"entryPrice\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), _Digits) + ","
      + "\"currentPrice\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_CURRENT), _Digits) + ","
      + "\"stopLoss\":" + DoubleToString(PositionGetDouble(POSITION_SL), _Digits) + ","
      + "\"takeProfit\":" + DoubleToString(PositionGetDouble(POSITION_TP), _Digits) + ","
      + "\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ","
      + "\"commission\":0,"
      + "\"swap\":" + DoubleToString(PositionGetDouble(POSITION_SWAP), 2) + ","
      + "\"openedAt\":\"" + IsoTime((datetime)PositionGetInteger(POSITION_TIME)) + "\","
      + "\"closedAt\":null"
      + "}";
}

string DealPayload(ulong dealTicket)
{
   if(!HistoryDealSelect(dealTicket))
      return "";

   long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
   long dealType = HistoryDealGetInteger(dealTicket, DEAL_TYPE);

   if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL)
      return "";

   string eventType = dealEntry == DEAL_ENTRY_OUT || dealEntry == DEAL_ENTRY_OUT_BY ? "CLOSE" : "OPEN";
   string tradeType = dealType == DEAL_TYPE_SELL ? "SELL" : "BUY";
   ulong orderId = (ulong)HistoryDealGetInteger(dealTicket, DEAL_ORDER);
   datetime dealTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
   string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
   double price = HistoryDealGetDouble(dealTicket, DEAL_PRICE);

   return "{"
      + "\"token\":\"" + JsonEscape(SmartInvestoryToken) + "\","
      + "\"eventType\":\"" + eventType + "\","
      + "\"ticket\":" + IntegerToString((long)dealTicket) + ","
      + "\"orderId\":" + IntegerToString((long)orderId) + ","
      + "\"symbol\":\"" + JsonEscape(symbol) + "\","
      + "\"type\":\"" + tradeType + "\","
      + "\"volume\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_VOLUME), 2) + ","
      + "\"entryPrice\":" + DoubleToString(price, _Digits) + ","
      + "\"currentPrice\":" + DoubleToString(price, _Digits) + ","
      + "\"stopLoss\":0,"
      + "\"takeProfit\":0,"
      + "\"profit\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_PROFIT), 2) + ","
      + "\"commission\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_COMMISSION), 2) + ","
      + "\"swap\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_SWAP), 2) + ","
      + "\"openedAt\":\"" + IsoTime(dealTime) + "\","
      + "\"closedAt\":" + (eventType == "CLOSE" ? "\"" + IsoTime(dealTime) + "\"" : "null")
      + "}";
}

void SendAllOpenPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      string payload = PositionPayload(ticket, "UPDATE");
      if(StringLen(payload) > 0)
         PostJson("/api/ea/trade", payload);
   }
}

int OnInit()
{
   if(PingSeconds < 5)
      EventSetTimer(5);
   else
      EventSetTimer(PingSeconds);

   PingSmartInvestory();

   if(SendOpenPositionsOnStart)
      SendAllOpenPositions();

   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTimer()
{
   PingSmartInvestory();
   SendAllOpenPositions();
}

void OnTradeTransaction(const MqlTradeTransaction& trans, const MqlTradeRequest& request, const MqlTradeResult& result)
{
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD)
      return;

   string payload = DealPayload(trans.deal);
   if(StringLen(payload) > 0)
      PostJson("/api/ea/trade", payload);
}
