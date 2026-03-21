import type { CandlestickData, Time } from 'lightweight-charts';

export interface IndicatorPoint {
  time: Time;
  value: number;
}

export interface BollingerBandsResult {
  upper: IndicatorPoint[];
  middle: IndicatorPoint[];
  lower: IndicatorPoint[];
}

export interface MACDResult {
  macd: IndicatorPoint[];
  signal: IndicatorPoint[];
  histogram: IndicatorPoint[];
}

export interface StochasticResult {
  k: IndicatorPoint[];
  d: IndicatorPoint[];
}

export interface ADXResult {
  adx: IndicatorPoint[];
  plusDI: IndicatorPoint[];
  minusDI: IndicatorPoint[];
}

export function calcSMA(data: CandlestickData<Time>[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close as number;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

export function calcEMA(data: CandlestickData<Time>[], period: number): IndicatorPoint[] {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const result: IndicatorPoint[] = [];
  let ema = data[0].close as number;
  for (let i = 0; i < data.length; i++) {
    ema = (data[i].close as number) * k + ema * (1 - k);
    if (i >= period - 1) {
      result.push({ time: data[i].time, value: ema });
    }
  }
  return result;
}

export function calcBollingerBands(
  data: CandlestickData<Time>[],
  period = 20,
  multiplier = 2
): BollingerBandsResult {
  const middle = calcSMA(data, period);
  const upper: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];

  for (let i = 0; i < middle.length; i++) {
    const idx = i + period - 1;
    let sumSq = 0;
    for (let j = 0; j < period; j++) {
      const diff = (data[idx - j].close as number) - middle[i].value;
      sumSq += diff * diff;
    }
    const std = Math.sqrt(sumSq / period);
    upper.push({ time: middle[i].time, value: middle[i].value + multiplier * std });
    lower.push({ time: middle[i].time, value: middle[i].value - multiplier * std });
  }

  return { upper, middle, lower };
}

export function calcRSI(data: CandlestickData<Time>[], period = 14): IndicatorPoint[] {
  if (data.length < period + 1) return [];

  const result: IndicatorPoint[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  // Initial average gain/loss over first period
  for (let i = 1; i <= period; i++) {
    const change = (data[i].close as number) - (data[i - 1].close as number);
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  result.push({ time: data[period].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs) });

  // Wilder's smoothing for subsequent values
  for (let i = period + 1; i < data.length; i++) {
    const change = (data[i].close as number) - (data[i - 1].close as number);
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ time: data[i].time, value: rsi });
  }

  return result;
}

export function calcMACD(
  data: CandlestickData<Time>[],
  fast = 12,
  slow = 26,
  signal = 9
): MACDResult {
  const fastEMA = calcEMA(data, fast);
  const slowEMA = calcEMA(data, slow);

  // Align fast and slow EMAs — slow starts later (index slow-1), fast at fast-1
  // fastEMA[i] corresponds to data[i + fast - 1]
  // slowEMA[i] corresponds to data[i + slow - 1]
  // The offset between them: slow - fast
  const offset = slow - fast;
  const macdLine: IndicatorPoint[] = [];

  for (let i = 0; i < slowEMA.length; i++) {
    const fastVal = fastEMA[i + offset].value;
    const slowVal = slowEMA[i].value;
    macdLine.push({ time: slowEMA[i].time, value: fastVal - slowVal });
  }

  if (macdLine.length < signal) {
    return { macd: macdLine, signal: [], histogram: [] };
  }

  // EMA of MACD line for signal
  const k = 2 / (signal + 1);
  let sigEMA = macdLine[0].value;
  const signalLine: IndicatorPoint[] = [];
  const histogram: IndicatorPoint[] = [];

  for (let i = 0; i < macdLine.length; i++) {
    sigEMA = macdLine[i].value * k + sigEMA * (1 - k);
    if (i >= signal - 1) {
      signalLine.push({ time: macdLine[i].time, value: sigEMA });
      histogram.push({ time: macdLine[i].time, value: macdLine[i].value - sigEMA });
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

export function calcStochastic(
  data: CandlestickData<Time>[],
  kPeriod = 14,
  dPeriod = 3,
  smooth = 3
): StochasticResult {
  if (data.length < kPeriod) return { k: [], d: [] };

  const rawK: IndicatorPoint[] = [];

  for (let i = kPeriod - 1; i < data.length; i++) {
    let lowestLow = data[i].low as number;
    let highestHigh = data[i].high as number;
    for (let j = 1; j < kPeriod; j++) {
      const low = data[i - j].low as number;
      const high = data[i - j].high as number;
      if (low < lowestLow) lowestLow = low;
      if (high > highestHigh) highestHigh = high;
    }
    const range = highestHigh - lowestLow;
    const kVal = range === 0 ? 50 : (((data[i].close as number) - lowestLow) / range) * 100;
    rawK.push({ time: data[i].time, value: kVal });
  }

  // Smooth %K if smooth > 1
  const smoothedK: IndicatorPoint[] =
    smooth > 1 ? smoothSMA(rawK, smooth) : rawK;

  // %D = SMA of smoothed %K
  const dLine: IndicatorPoint[] = smoothSMA(smoothedK, dPeriod);

  return { k: smoothedK, d: dLine };
}

function smoothSMA(points: IndicatorPoint[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  for (let i = period - 1; i < points.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += points[i - j].value;
    }
    result.push({ time: points[i].time, value: sum / period });
  }
  return result;
}

export function calcATR(data: CandlestickData<Time>[], period = 14): IndicatorPoint[] {
  if (data.length < 2) return [];

  const trValues: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high as number;
    const low = data[i].low as number;
    const prevClose = data[i - 1].close as number;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trValues.push(tr);
  }

  if (trValues.length < period) return [];

  const result: IndicatorPoint[] = [];

  // Initial ATR = simple average of first period TRs
  let atr = trValues.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  result.push({ time: data[period].time, value: atr });

  // Wilder's smoothing
  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
    result.push({ time: data[i + 1].time, value: atr });
  }

  return result;
}

export function calcADX(data: CandlestickData<Time>[], period = 14): ADXResult {
  if (data.length < period + 1) return { adx: [], plusDI: [], minusDI: [] };

  const plusDMArr: number[] = [];
  const minusDMArr: number[] = [];
  const trArr: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high as number;
    const low = data[i].low as number;
    const prevHigh = data[i - 1].high as number;
    const prevLow = data[i - 1].low as number;
    const prevClose = data[i - 1].close as number;

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    plusDMArr.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMArr.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trArr.push(tr);
  }

  if (trArr.length < period) return { adx: [], plusDI: [], minusDI: [] };

  // Wilder smoothing init
  let smoothTR = trArr.slice(0, period).reduce((s, v) => s + v, 0);
  let smoothPlusDM = plusDMArr.slice(0, period).reduce((s, v) => s + v, 0);
  let smoothMinusDM = minusDMArr.slice(0, period).reduce((s, v) => s + v, 0);

  const adxArr: IndicatorPoint[] = [];
  const plusDIArr: IndicatorPoint[] = [];
  const minusDIArr: IndicatorPoint[] = [];
  const dxValues: number[] = [];

  const computeDI = (idx: number) => {
    const plusDI = smoothTR === 0 ? 0 : (100 * smoothPlusDM) / smoothTR;
    const minusDI = smoothTR === 0 ? 0 : (100 * smoothMinusDM) / smoothTR;
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (100 * Math.abs(plusDI - minusDI)) / diSum;

    plusDIArr.push({ time: data[idx].time, value: plusDI });
    minusDIArr.push({ time: data[idx].time, value: minusDI });
    dxValues.push(dx);
  };

  computeDI(period);

  for (let i = period; i < trArr.length; i++) {
    smoothTR = smoothTR - smoothTR / period + trArr[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDMArr[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDMArr[i];
    computeDI(i + 1);
  }

  // ADX = Wilder smoothing of DX over period
  if (dxValues.length < period) return { adx: [], plusDI: plusDIArr, minusDI: minusDIArr };

  let adx = dxValues.slice(0, period).reduce((s, v) => s + v, 0) / period;
  adxArr.push({ time: plusDIArr[period - 1].time, value: adx });

  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
    adxArr.push({ time: plusDIArr[i].time, value: adx });
  }

  return { adx: adxArr, plusDI: plusDIArr, minusDI: minusDIArr };
}

export function calcOBV(data: CandlestickData<Time>[]): IndicatorPoint[] {
  if (data.length === 0) return [];

  const result: IndicatorPoint[] = [];
  let obv = 0;
  result.push({ time: data[0].time, value: obv });

  for (let i = 1; i < data.length; i++) {
    const close = data[i].close as number;
    const prevClose = data[i - 1].close as number;
    const volume = (data[i] as CandlestickData<Time> & { volume?: number }).volume ?? 0;

    if (close > prevClose) obv += volume;
    else if (close < prevClose) obv -= volume;

    result.push({ time: data[i].time, value: obv });
  }

  return result;
}

export function calcVWAP(data: CandlestickData<Time>[]): IndicatorPoint[] {
  if (data.length === 0) return [];

  const result: IndicatorPoint[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < data.length; i++) {
    const high = data[i].high as number;
    const low = data[i].low as number;
    const close = data[i].close as number;
    const volume = (data[i] as CandlestickData<Time> & { volume?: number }).volume ?? 0;

    const typicalPrice = (high + low + close) / 3;
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;

    const vwap = cumulativeVolume === 0 ? typicalPrice : cumulativeTPV / cumulativeVolume;
    result.push({ time: data[i].time, value: vwap });
  }

  return result;
}
