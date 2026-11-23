// A nine-frame movement and a ten-level teaching book. Values are not thesis observations.
const armAngles = [0, 24, 52, 72, 72, 72, 49, 25, 0];
const backAngles = [0, 2, 4, 6, 6, 5, 3, 1, 0];
export const lastFrame = armAngles.length - 1;

export function poseAt(step) {
  if (!Number.isInteger(step) || step < 0 || step > lastFrame) throw Error('Unknown frame');
  const phase = step === 0 || step === lastFrame ? 'rest' : step < 3 ? 'raise' : step < 6 ? 'hold' : 'lower';
  return {arm: armAngles[step], back: backAngles[step], phase};
}

export const bidLots = Object.freeze([38, 68, 94, 71, 122, 156, 184, 140, 110, 62]);
export const askLots = Object.freeze([71, 122, 156, 184, 140, 110, 62, 38, 68, 94]);
export const highestWithdrawal = side => (side === 'ask' ? askLots[0] : bidLots[0]) - 1;

export function depthAt(withdraw, side = 'bid') {
  if (!['bid', 'ask'].includes(side) || !Number.isInteger(withdraw) || withdraw < 0 || withdraw > highestWithdrawal(side)) {
    throw Error('An active quote must remain on each side');
  }
  const bid = bidLots[0] - (side === 'bid' ? withdraw : 0);
  const ask = askLots[0] - (side === 'ask' ? withdraw : 0);
  return {bid, ask, spread: 0.25, bidPrice: 5000, askPrice: 5000.25, imbalance: (bid - ask) / (bid + ask)};
}

export function bookRows(quote) {
  let totalBid = 0, totalAsk = 0;
  return bidLots.map((lot, i) => {
    const bid = i === 0 ? quote.bid : lot;
    const ask = i === 0 ? quote.ask : askLots[i];
    totalBid += bid;
    totalAsk += ask;
    return {bid, ask, totalBid, totalAsk, bidPrice: quote.bidPrice - i * quote.spread, askPrice: quote.askPrice + i * quote.spread};
  });
}
