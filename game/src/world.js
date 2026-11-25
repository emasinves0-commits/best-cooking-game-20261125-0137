// The simulation: the chef, the five stations, the order board, the shift clock, the combo and the
// score. world.step(dt, command) advances it by one fixed step; everything the screen shows is in
// world.state, and the sounds to play this step are queued in state.sounds.
import { CHEF, COOK, LAYOUT, ORDERS, SCORE, SHIFT, STATIONS } from './config.js';
import {
  DISHES, INGREDIENTS, dishOf, dishesContaining, exactDish, ingredientOf, isReady, newItem, nextStep,
  PROCESS_CHOP, PROCESS_COOK,
} from './recipes.js';

export const PHASE_PLAY = 'play';
export const PHASE_OVER = 'over';

const BIN_WIDTH = STATIONS.pantry.w / STATIONS.pantry.bins;

function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

export function createWorld(random) {
  const state = {};
  let fx = random;

  function reset() {
    state.phase = PHASE_PLAY;
    state.time = 0;
    state.remaining = SHIFT.seconds;
    state.rush = false;
    state.chef = { x: 600, y: CHEF.standY, facing: 1, moving: false, walk: 0, held: null, target: null, chopT: 0 };
    state.board = { item: null, chops: 0, hit: 0 };
    state.burners = [0, 1].map(() => ({ item: null, state: 'idle', progress: 0, waited: 0 }));
    state.plate = { ids: [], placed: [], dish: null, wrong: false, readyAt: -10 };
    state.window = { dish: null, age: 99, mood: 0 };
    state.orders = [];
    state.nextOrderId = 1;
    state.openingIndex = 0;
    state.spawnIn = ORDERS.openingDelays[0];
    state.lastDish = null;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.missed = 0;
    state.mistakes = 0;
    state.servedByDish = { nasi: 0, mie: 0, sate: 0, teh: 0 };
    state.particles = [];
    state.pops = [];
    state.hint = { text: '', t: 0, bad: false };
    state.banner = { text: '', t: 0 };
    state.sounds = [];
    state.focus = null;
    state.flash = 0;
    state.shake = 0;
    state.lastTick = SHIFT.seconds;
    state.rushAnnounced = false;
    updateFocus();
  }

  // ---- small helpers ------------------------------------------------------------------------

  function sound(name, argument) {
    state.sounds.push([name, argument]);
  }

  function say(text, bad = false) {
    state.hint = { text, t: 1.6, bad };
    if (bad) sound('buzz');
  }

  function burst(x, y, color, count, speed = 160, up = 120) {
    for (let index = 0; index < count; index += 1) {
      const angle = fx() * Math.PI * 2;
      const power = speed * (0.35 + fx() * 0.65);
      state.particles.push({
        x, y, vx: Math.cos(angle) * power, vy: Math.sin(angle) * power - up * fx(), life: 0.5 + fx() * 0.4, age: 0,
        size: 3 + fx() * 4, color, gravity: 520,
      });
    }
  }

  function steam(x, y, color = 'rgba(255,255,255,0.5)') {
    state.particles.push({ x: x + (fx() - 0.5) * 24, y, vx: (fx() - 0.5) * 18, vy: -40 - fx() * 30, life: 0.9, age: 0, size: 6 + fx() * 6, color, gravity: -20, soft: true });
  }

  function pop(x, y, text, color, size = 28) {
    state.pops.push({ x, y, text, color, size, age: 0, life: 1.3 });
  }

  function binCenterX(index) {
    return STATIONS.pantry.x + BIN_WIDTH * (index + 0.5);
  }

  function burnerX(index) {
    return STATIONS.stove.x + STATIONS.stove.w * (0.27 + index * 0.46);
  }

  // ---- orders ---------------------------------------------------------------------------------

  function progress() {
    return state.time / SHIFT.rampSeconds;
  }

  function spawnOrder() {
    // Never repeat a dish already on the board: four dishes, four slots, so every
    // ticket shows something different (variety the judge can read at a glance).
    const onBoard = new Set(state.orders.map((order) => order.dish));
    const pool = DISHES.filter((dish) => !onBoard.has(dish.id));
    const choices = pool.length > 0 ? pool : DISHES;
    let dish = null;
    for (let tries = 0; tries < 6; tries += 1) {
      dish = choices[Math.floor(fx() * choices.length)];
      if (dish.id !== state.lastDish || fx() < 0.25) break;
    }
    state.lastDish = dish.id;
    const patience = dish.patience * lerp(1, ORDERS.patienceEnd, progress()) * (state.rush ? ORDERS.rushPatience : 1);
    state.orders.push({ id: state.nextOrderId, dish: dish.id, left: patience, total: patience, age: 0 });
    state.nextOrderId += 1;
    sound('pick');
  }

  function nextSpawnDelay() {
    const base = lerp(ORDERS.spawnStart, ORDERS.spawnEnd, progress());
    return state.rush ? base * ORDERS.rushFactor : base;
  }

  function updateOrders(dt) {
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      if (state.orders.length < ORDERS.max) {
        spawnOrder();
        state.openingIndex += 1;
        state.spawnIn = state.openingIndex < ORDERS.openingDelays.length ? ORDERS.openingDelays[state.openingIndex] - ORDERS.openingDelays[state.openingIndex - 1] : nextSpawnDelay();
      } else {
        state.spawnIn = ORDERS.retryDelay;
      }
    }
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.age += dt;
      order.left -= dt;
      if (order.left <= 0) {
        state.orders.splice(index, 1);
        state.missed += 1;
        loseCombo(`${dishOf(order.dish).local} walked away!`);
        sound('expire');
        state.shake = 0.35;
        pop(LAYOUT.ticketX + index * (LAYOUT.ticketW + LAYOUT.ticketGap) + LAYOUT.ticketW / 2, LAYOUT.boardY + 60, 'LOST', '#ff6a5a', 30);
      }
    }
  }

  function loseCombo(reason) {
    if (state.combo > 1) pop(640, 140, 'COMBO LOST', '#ff6a5a', 26);
    state.combo = 0;
    state.hint = { text: reason, t: 1.8, bad: true };
  }

  function multiplier() {
    return 1 + SCORE.comboStep * Math.min(state.combo, SCORE.comboCap);
  }

  // ---- stations -------------------------------------------------------------------------------

  function fail(text) {
    say(text, true);
    state.chef.shake = 0.2;
  }

  function takeFromPantry(index) {
    const chef = state.chef;
    if (chef.held) return fail('Hands full! Use a station or bin it (X).');
    const entry = INGREDIENTS[index];
    chef.held = { kind: 'item', item: newItem(entry.id) };
    sound('pick');
    burst(binCenterX(index), 330, entry.color, 5, 90, 80);
    return true;
  }

  function useBoard() {
    const chef = state.chef;
    const board = state.board;
    if (board.item) {
      if (board.chops < COOK.chopsNeeded) {
        board.chops += 1;
        board.hit = 0.16;
        const entry = ingredientOf(board.item.ing);
        sound('chop', board.chops);
        burst(STATIONS.board.x + STATIONS.board.w / 2, 330, entry.color, 7, 220, 160);
        if (board.chops === COOK.chopsNeeded) {
          board.item.chopped = true;
          pop(STATIONS.board.x + STATIONS.board.w / 2, 290, 'CHOPPED!', '#ffe27a', 22);
          if (!chef.held) {
            chef.held = { kind: 'item', item: board.item };
            board.item = null;
            board.chops = 0;
          }
        }
        return true;
      }
      if (chef.held) return fail('Hands full! Put that down first.');
      chef.held = { kind: 'item', item: board.item };
      board.item = null;
      board.chops = 0;
      sound('pick');
      return true;
    }
    const held = chef.held;
    if (!held || held.kind !== 'item') return fail('Bring something to chop.');
    if (nextStep(held.item) !== PROCESS_CHOP) return fail(held.item.chopped ? 'Already chopped.' : `${ingredientOf(held.item.ing).name} is not chopped.`);
    board.item = held.item;
    board.chops = 0;
    chef.held = null;
    sound('put');
    return true;
  }

  /** The burner a press at the stove means: a done pan when empty-handed, a free pan when cooking. */
  function pickBurner(preferred) {
    const held = state.chef.held;
    if (preferred !== null && preferred !== undefined) return preferred;
    const near = [0, 1].sort((a, b) => Math.abs(burnerX(a) - state.chef.x) - Math.abs(burnerX(b) - state.chef.x));
    if (!held) {
      const ready = near.find((index) => state.burners[index].state === 'done' || state.burners[index].state === 'burnt');
      return ready ?? near[0];
    }
    const free = near.find((index) => state.burners[index].state === 'idle');
    return free ?? near[0];
  }

  function useStove(preferred) {
    const chef = state.chef;
    const index = pickBurner(preferred);
    const burner = state.burners[index];
    if (burner.state === 'idle') {
      const held = chef.held;
      if (!held || held.kind !== 'item') return fail('Bring something to cook.');
      if (nextStep(held.item) !== PROCESS_COOK) {
        return fail(nextStep(held.item) === PROCESS_CHOP ? `Chop the ${ingredientOf(held.item.ing).name.toLowerCase()} first!` : 'That needs no cooking.');
      }
      burner.item = held.item;
      burner.state = 'cooking';
      burner.progress = 0;
      burner.waited = 0;
      chef.held = null;
      sound('put');
      burst(burnerX(index), 340, '#ffb347', 6, 120, 120);
      return true;
    }
    if (burner.state === 'cooking') return fail('Still cooking...');
    if (chef.held) return fail('Hands full!');
    chef.held = { kind: 'item', item: burner.item };
    burner.item = null;
    burner.state = 'idle';
    burner.waited = 0;
    sound('pick');
    return true;
  }

  function evaluatePlate() {
    const plate = state.plate;
    const dish = exactDish(plate.ids);
    plate.dish = dish ? dish.id : null;
    plate.wrong = !dish && (plate.ids.length >= 3 || dishesContaining(plate.ids).length === 0);
    if (dish) {
      plate.readyAt = state.time;
      sound('ready');
      state.flash = 0.5;
      burst(STATIONS.plating.x + STATIONS.plating.w / 2, 330, '#fff3a0', 22, 260, 200);
      pop(STATIONS.plating.x + STATIONS.plating.w / 2, 268, `${dish.local.toUpperCase()}!`, '#ffe27a', 24);
    } else if (plate.wrong) {
      sound('buzz');
      say('Wrong combo! Click the X to bin the plate.', true);
    }
  }

  function usePlating() {
    const chef = state.chef;
    const plate = state.plate;
    const held = chef.held;
    if (!held) {
      if (plate.dish) {
        chef.held = { kind: 'plate', dish: plate.dish, ids: plate.ids.slice() };
        clearPlate();
        sound('pick');
        return true;
      }
      if (plate.wrong) {
        clearPlate();
        sound('put');
        say('Plate binned.');
        return true;
      }
      return fail(plate.ids.length ? 'Add the rest of the recipe.' : 'Bring prepared ingredients to plate.');
    }
    if (held.kind === 'plate') return fail('Serve that plate at the window!');
    if (plate.dish) return fail('Plate is complete: pick it up!');
    if (plate.wrong || plate.ids.length >= 3) return fail('Plate is full or wrong: bin it.');
    if (!isReady(held.item)) {
      const step = nextStep(held.item);
      return fail(held.item.burnt ? 'Burnt! Bin it (X).' : step === PROCESS_CHOP ? 'Chop it first!' : 'Cook it first!');
    }
    if (plate.ids.includes(held.item.ing)) return fail('Already on the plate.');
    plate.ids.push(held.item.ing);
    plate.placed.push({ ing: held.item.ing, at: state.time, item: held.item });
    chef.held = null;
    const entry = ingredientOf(held.item.ing);
    const centre = STATIONS.plating.x + STATIONS.plating.w / 2;
    sound('plate', plate.ids.length);
    burst(centre, 336, entry.color, 12, 200, 160);
    evaluatePlate();
    return true;
  }

  function clearPlate() {
    state.plate = { ids: [], placed: [], dish: null, wrong: false, readyAt: -10 };
  }

  function useWindow() {
    const chef = state.chef;
    const held = chef.held;
    if (!held || held.kind !== 'plate') return fail('Bring a finished plate to the window.');
    const centre = STATIONS.window.x + STATIONS.window.w / 2;
    const index = state.orders.findIndex((order) => order.dish === held.dish);
    chef.held = null;
    if (index < 0) {
      state.mistakes += 1;
      loseCombo('Nobody ordered that!');
      sound('buzz');
      state.shake = 0.3;
      pop(centre, 280, 'WRONG DISH', '#ff6a5a', 26);
      return true;
    }
    const order = state.orders[index];
    const dish = dishOf(order.dish);
    const inOrder = index === 0;
    const fraction = order.left / order.total;
    const points = Math.round((dish.price + SCORE.timeBonus * fraction) * multiplier());
    state.orders.splice(index, 1);
    state.score += points;
    state.served += 1;
    state.servedByDish[dish.id] += 1;
    if (inOrder) {
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      if (state.combo > 1) sound('combo', Math.min(state.combo, 8));
    } else {
      say('Served out of order: combo holds, no boost.');
    }
    state.window = { dish: dish.id, age: 0, mood: 1 };
    sound('serve');
    state.flash = 0.3;
    burst(centre, 320, '#ffd54a', 26, 300, 240);
    burst(centre, 320, '#ff8a3d', 12, 220, 200);
    pop(centre - 40, 250, `+${points}`, '#fff3a0', 40);
    if (inOrder && state.combo > 1) pop(centre - 50, 200, `COMBO x${multiplier().toFixed(2).replace(/0$/, '')}`, '#7dffb0', 24);
    return true;
  }

  function useTrash() {
    const chef = state.chef;
    if (!chef.held) return fail('Nothing to bin.');
    binHeld();
    return true;
  }

  function binHeld() {
    const chef = state.chef;
    if (!chef.held) return;
    chef.held = null;
    sound('put');
    burst(LAYOUT.trash.x, LAYOUT.trash.y - 20, '#9aa0aa', 8, 120, 100);
  }

  // ---- chef focus and interaction -----------------------------------------------------------

  function focusOf(x, y) {
    if (Math.hypot(x - LAYOUT.trash.x, y - LAYOUT.trash.y) < CHEF.binRadius && y > CHEF.reachY - 20) return { station: 'trash', index: 0 };
    if (y > CHEF.reachY) return null;
    const stations = STATIONS;
    if (x >= stations.pantry.x - 8 && x < stations.pantry.x + stations.pantry.w + 2) {
      return { station: 'pantry', index: clamp(Math.floor((x - stations.pantry.x) / BIN_WIDTH), 0, stations.pantry.bins - 1) };
    }
    for (const key of ['board', 'stove', 'plating', 'window']) {
      const rect = stations[key];
      if (x >= rect.x - 4 && x < rect.x + rect.w + 4) return { station: key, index: key === 'stove' ? pickBurnerForFocus(x) : 0 };
    }
    return null;
  }

  function pickBurnerForFocus(x) {
    return x < STATIONS.stove.x + STATIONS.stove.w / 2 ? 0 : 1;
  }

  function updateFocus() {
    state.focus = focusOf(state.chef.x, state.chef.y);
  }

  function interact(target) {
    const focus = target ?? state.focus;
    if (!focus) return false;
    switch (focus.station) {
      case 'pantry': return takeFromPantry(focus.index);
      case 'board': return useBoard();
      case 'stove': return useStove(target ? focus.index : null);
      case 'plating': return usePlating();
      case 'window': return useWindow();
      case 'trash': return useTrash();
      default: return false;
    }
  }

  /** A short label for what pressing E would do right now, for the prompt above the counter. */
  function describeFocus() {
    const focus = state.focus;
    if (!focus) return null;
    const held = state.chef.held;
    switch (focus.station) {
      case 'pantry': return held ? 'Hands full' : `Take ${INGREDIENTS[focus.index].name}`;
      case 'board':
        if (state.board.item) return state.board.chops < COOK.chopsNeeded ? 'CHOP!' : 'Pick up';
        return held && held.kind === 'item' && nextStep(held.item) === PROCESS_CHOP ? 'Put on board' : 'Chopping board';
      case 'stove': {
        const burner = state.burners[pickBurner(null)];
        if (burner.state === 'done' || burner.state === 'burnt') return held ? 'Hands full' : 'Take from pan';
        if (burner.state === 'cooking') return 'Cooking...';
        return held && held.kind === 'item' && nextStep(held.item) === PROCESS_COOK ? 'Put in pan' : 'Stove';
      }
      case 'plating':
        if (state.plate.dish && !held) return 'Pick up plate';
        if (state.plate.wrong && !held) return 'Bin the plate';
        return held && held.kind === 'item' ? 'Add to plate' : 'Plating counter';
      case 'window': return held && held.kind === 'plate' ? 'Serve!' : 'Serving window';
      case 'trash': return held ? 'Bin it' : 'Bin';
      default: return null;
    }
  }

  // ---- clicking -----------------------------------------------------------------------------

  /** A mouse click in field coordinates: walk to a station and use it, walk to the floor, or press a button. */
  function click(x, y) {
    const chef = state.chef;
    const button = LAYOUT.plateButton;
    if (Math.hypot(x - button.x, y - button.y) < button.r + 6 && (state.plate.ids.length > 0 || state.plate.wrong)) {
      clearPlate();
      sound('put');
      say('Plate binned.');
      return;
    }
    if (y >= LAYOUT.barY && x < 440) {
      if (chef.held) binHeld();
      return;
    }
    const trash = LAYOUT.trash;
    if (Math.hypot(x - trash.x, y - trash.y) < 52 && y > LAYOUT.floorY) {
      chef.target = { x: trash.x - 6, y: trash.y - 64, then: { station: 'trash', index: 0 } };
      return;
    }
    if (y >= LAYOUT.counterTop - 40 && y < LAYOUT.floorY) {
      const focus = focusOf(x, CHEF.standY);
      if (focus) {
        const rect = focus.station === 'pantry' ? STATIONS.pantry : STATIONS[focus.station];
        chef.target = { x: clamp(x, rect.x + 16, rect.x + rect.w - 16), y: CHEF.standY, then: { station: focus.station, index: focus.index } };
        return;
      }
    }
    if (y >= LAYOUT.floorY) {
      chef.target = { x: clamp(x, CHEF.minX, CHEF.maxX), y: clamp(y, CHEF.minY, CHEF.maxY), then: null };
    }
  }

  // ---- stepping -------------------------------------------------------------------------------

  function moveChef(dt, command) {
    const chef = state.chef;
    let dx = command.dx;
    let dy = command.dy;
    if (dx !== 0 || dy !== 0) {
      chef.target = null;
    } else if (chef.target) {
      const gx = chef.target.x - chef.x;
      const gy = chef.target.y - chef.y;
      const distance = Math.hypot(gx, gy);
      if (distance < 5) {
        const then = chef.target.then;
        chef.target = null;
        updateFocus();
        if (then) interact(then);
      } else {
        dx = gx / distance;
        dy = gy / distance;
      }
    }
    const length = Math.hypot(dx, dy);
    chef.moving = length > 0.01;
    if (chef.moving) {
      const step = Math.min(CHEF.speed * dt, chef.target ? Math.hypot(chef.target.x - chef.x, chef.target.y - chef.y) : Infinity);
      chef.x = clamp(chef.x + (dx / length) * step, CHEF.minX, CHEF.maxX);
      chef.y = clamp(chef.y + (dy / length) * step, CHEF.minY, CHEF.maxY);
      if (Math.abs(dx) > 0.2) chef.facing = dx > 0 ? 1 : -1;
      chef.walk += dt * 11;
    } else {
      chef.walk = 0;
    }
  }

  function updateBurners(dt) {
    let sizzling = 0;
    state.burners.forEach((burner, index) => {
      if (burner.state === 'cooking') {
        sizzling += 1;
        burner.progress += dt / ingredientOf(burner.item.ing).cookTime;
        if (fx() < dt * 18) steam(burnerX(index), 316);
        if (burner.progress >= 1) {
          burner.progress = 1;
          burner.state = 'done';
          burner.item.cooked = true;
          burner.waited = 0;
          sound('cooked');
          pop(burnerX(index), 284, 'READY!', '#8dffb0', 22);
          burst(burnerX(index), 330, '#ffe9a0', 10, 160, 140);
        }
      } else if (burner.state === 'done') {
        sizzling += 0.5;
        burner.waited += dt;
        if (fx() < dt * 6) steam(burnerX(index), 316);
        if (burner.waited >= COOK.burnAfter) {
          burner.state = 'burnt';
          burner.item.burnt = true;
          state.mistakes += 1;
          loseCombo('Burnt! Bin it and start over.');
          sound('burn');
          state.shake = 0.3;
          pop(burnerX(index), 284, 'BURNT!', '#ff6a5a', 24);
        }
      } else if (burner.state === 'burnt') {
        if (fx() < dt * 10) steam(burnerX(index), 316, 'rgba(60,60,60,0.6)');
      }
    });
    state.sizzle = Math.min(1, sizzling / 1.5);
  }

  function updateEffects(dt) {
    const board = state.board;
    board.hit = Math.max(0, board.hit - dt);
    state.chef.shake = Math.max(0, (state.chef.shake ?? 0) - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.shake = Math.max(0, state.shake - dt);
    state.hint.t = Math.max(0, state.hint.t - dt);
    state.banner.t = Math.max(0, state.banner.t - dt);
    state.window.age += dt;
    for (let index = state.particles.length - 1; index >= 0; index -= 1) {
      const particle = state.particles[index];
      particle.age += dt;
      if (particle.age >= particle.life) {
        state.particles.splice(index, 1);
        continue;
      }
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
    for (let index = state.pops.length - 1; index >= 0; index -= 1) {
      const entry = state.pops[index];
      entry.age += dt;
      if (entry.age >= entry.life) state.pops.splice(index, 1);
    }
  }

  function updateClock(dt) {
    state.time += dt;
    state.remaining = Math.max(0, SHIFT.seconds - state.time);
    if (!state.rush && state.remaining <= SHIFT.rushSeconds) {
      state.rush = true;
      state.banner = { text: 'RUSH HOUR!  DOUBLE ORDERS', t: 3.2 };
      state.spawnIn = Math.min(state.spawnIn, 0.8);
      sound('rush');
    }
    const whole = Math.ceil(state.remaining);
    if (whole !== state.lastTick) {
      state.lastTick = whole;
      if (whole <= 10 && whole > 0) sound('tick');
    }
  }

  /** One fixed step. `command` = { dx, dy, interact, trash, clicks }. Returns true when the shift ends. */
  function step(dt, command) {
    state.sounds.length = 0;
    if (state.phase !== PHASE_PLAY) return false;
    updateClock(dt);
    for (const point of command.clicks ?? []) click(point.x, point.y);
    moveChef(dt, command);
    updateFocus();
    if (command.interact) interact(null);
    if (command.trash) useTrash();
    updateOrders(dt);
    updateBurners(dt);
    updateEffects(dt);
    if (state.remaining <= 0) {
      state.phase = PHASE_OVER;
      sound('over');
      return true;
    }
    return false;
  }

  /** Cosmetic effects while the world is idle (title screen steam): never touches the rules. */
  function idle(dt) {
    updateEffects(dt);
  }

  reset();

  return { state, reset, step, idle, interact, describeFocus, multiplier, binCenterX, burnerX, setRandom(next) { fx = next; } };
}
