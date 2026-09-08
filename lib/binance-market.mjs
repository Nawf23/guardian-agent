const BASE_URL = process.env.BINANCE_MARKET_BASE_URL || "https://data-api.binance.vision";

async function getJson(path) {
  const response = await fetch(`${BASE_URL}${path}`, { signal: AbortSignal.timeout(4500) });
  if (!response.ok) throw new Error(`Binance market request failed (${response.status})`);
  return response.json();
}

function realizedVolatilityPercent(klines) {
  const closes = klines.map((candle) => Number(candle[4])).filter(Number.isFinite);
  const returns = closes.slice(1).map((close, index) => Math.log(close / closes[index]));
  if (returns.length < 2) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(returns.length) * 100;
}

export async function getBinanceMarketSnapshot(symbol) {
  if (!/^[A-Z0-9]{5,20}$/.test(symbol)) throw new Error("Invalid Binance symbol");
  const query = encodeURIComponent(symbol);
  const [ticker, book, klines] = await Promise.all([
    getJson(`/api/v3/ticker/24hr?symbol=${query}`),
    getJson(`/api/v3/ticker/bookTicker?symbol=${query}`),
    getJson(`/api/v3/klines?symbol=${query}&interval=1m&limit=30`),
  ]);
  const bid = Number(book.bidPrice);
  const ask = Number(book.askPrice);
  const midpoint = (bid + ask) / 2;
  return {
    symbol,
    price: Number(ticker.lastPrice),
    priceChangePercent24h: Number(ticker.priceChangePercent),
    spreadBps: midpoint > 0 ? ((ask - bid) / midpoint) * 10000 : 0,
    volatilityPercent: realizedVolatilityPercent(klines),
    dailyQuoteVolume: Number(ticker.quoteVolume),
    source: "Binance Spot API · live",
    observedAt: new Date().toISOString(),
  };
}
