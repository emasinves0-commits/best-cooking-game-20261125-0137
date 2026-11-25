// Tuning and palette: every number a designer would want to nudge lives here.

export const STEP = 1 / 60;
export const FIELD = { width: 1280, height: 720 };
export const BEST_KEY = 'kilat-kitchen-best-v1';

export const SHIFT = {
  seconds: 180,
  rushSeconds: 30,
  /** Seconds of the shift over which the orders ramp from calm to hectic. */
  rampSeconds: 150,
};

export const CHEF = {
  speed: 310,
  minX: 34,
  maxX: 1246,
  minY: 446,
  maxY: 612,
  /** The chef can use a counter when standing at or above this line. */
  reachY: 526,
  standY: 480,
  binRadius: 82,
};

export const ORDERS = {
  max: 4,
  openingDelays: [0.4, 3.2, 6.4],
  spawnStart: 11.5,
  spawnEnd: 6.8,
  rushFactor: 0.5,
  patienceEnd: 0.74,
  rushPatience: 0.86,
  retryDelay: 1.2,
};

export const COOK = {
  /** Seconds a finished pan sits before it burns. */
  burnAfter: 7,
  warnAfter: 4.6,
  chopsNeeded: 3,
  serveLinger: 12,
};

export const SCORE = {
  timeBonus: 70,
  comboStep: 0.25,
  comboCap: 8,
};

/** The counters, left to right (x ranges); y bands are in LAYOUT. */
export const STATIONS = {
  pantry: { x: 14, w: 600, bins: 12 },
  board: { x: 622, w: 112 },
  stove: { x: 742, w: 160, burners: 2 },
  plating: { x: 910, w: 182 },
  window: { x: 1100, w: 166 },
};

export const LAYOUT = {
  headerH: 58,
  boardY: 64,
  ticketH: 122,
  ticketW: 299,
  ticketGap: 14,
  ticketX: 20,
  wallY: 190,
  counterTop: 290,
  counterFront: 380,
  floorY: 430,
  barY: 644,
  trash: { x: 1186, y: 584, r: 44 },
  plateButton: { x: 1070, y: 306, r: 14 },
};

export const PALETTE = {
  ink: '#150e1c',
  night: '#1d1530',
  wall: '#32203a',
  wood: '#8a5430',
  woodDark: '#5a3320',
  woodLight: '#b97a46',
  lantern: '#ffb347',
  lanternDeep: '#e8452c',
  neonPink: '#ff4fa3',
  neonCyan: '#4df3ff',
  cream: '#fff4d6',
  steel: '#8b95a3',
  good: '#4bd36b',
  warn: '#ffc233',
  bad: '#ff4a3d',
  text: '#fff7e6',
  dim: '#b9a9c9',
};

export const FONT = '"Trebuchet MS", "Segoe UI", "Liberation Sans", "DejaVu Sans", Arial, sans-serif';
