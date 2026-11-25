// An autopilot cook. It looks at the world the way a player would and issues the same commands a
// player could (clicks on counters, E presses), so everything it does obeys the real rules. It is
// what the screenshot scenes play forward with, and it doubles as a play-tester in headless runs.
import { LAYOUT, STATIONS } from './config.js';
import { DISHES, INGREDIENTS, dishOf, ingredientOf, isReady, nextStep, PROCESS_CHOP, PROCESS_COOK } from './recipes.js';

const REACTION = 0.22;
const CHOP_RATE = 0.13;

function pointFor(world, goal) {
  switch (goal.station) {
    case 'pantry': return { x: world.binCenterX(goal.index), y: 340 };
    case 'board': return { x: STATIONS.board.x + STATIONS.board.w / 2, y: 330 };
    case 'stove': return { x: world.burnerX(goal.index ?? 0), y: 330 };
    case 'plating': return { x: STATIONS.plating.x + STATIONS.plating.w / 2, y: 330 };
    case 'window': return { x: STATIONS.window.x + STATIONS.window.w / 2, y: 330 };
    default: return { x: LAYOUT.trash.x, y: LAYOUT.trash.y };
  }
}

/** The dish the cook is working on: what is on the plate, else what is already in progress, else the oldest ticket. */
function targetDish(state) {
  if (state.plate.ids.length > 0) return DISHES.find((dish) => state.plate.ids.every((id) => dish.components.includes(id)));
  const inProcess = [];
  if (state.chef.held && state.chef.held.kind === 'item') inProcess.push(state.chef.held.item.ing);
  if (state.board.item) inProcess.push(state.board.item.ing);
  for (const burner of state.burners) if (burner.item) inProcess.push(burner.item.ing);
  for (const ing of inProcess) {
    const owner = ingredientOf(ing).dish;
    if (!state.orders.length || state.orders.some((order) => order.dish === owner)) return dishOf(owner);
  }
  // the leftmost ticket: serving in board order is what builds the combo
  return state.orders.length === 0 ? null : dishOf(state.orders[0].dish);
}

function inProcess(state, ing) {
  return (state.board.item && state.board.item.ing === ing) || state.burners.some((burner) => burner.item && burner.item.ing === ing);
}

/** Next thing to do as { station, index } or null to wait. */
function choose(world) {
  const state = world.state;
  const held = state.chef.held;
  const plate = state.plate;
  if (held && held.kind === 'plate') return { station: 'window' };
  if (plate.wrong && !held) return { station: 'plating' };
  if (held && held.kind === 'item') {
    const dish = targetDish(state);
    const step = nextStep(held.item);
    if (held.item.burnt) return { station: 'trash' };
    if (isReady(held.item)) {
      return plate.ids.includes(held.item.ing) ? { station: 'trash' } : { station: 'plating' };
    }
    if (step === PROCESS_CHOP) return state.board.item ? (state.board.chops < 3 ? { station: 'board' } : null) : { station: 'board' };
    if (step === PROCESS_COOK) {
      const free = state.burners.findIndex((burner) => burner.state === 'idle');
      if (free >= 0) return { station: 'stove', index: free };
      return dish ? null : { station: 'trash' };
    }
  }
  // empty hands
  if (plate.dish) {
    const next = state.orders.find((order) => order.dish !== plate.dish);
    const free = state.burners.findIndex((burner) => burner.state === 'idle');
    const nextDish = next ? dishOf(next.dish) : null;
    if (nextDish && free >= 0 && !state.burners.some((burner) => burner.item)) {
      const cookFirst = nextDish.components.find((ing) => ingredientOf(ing).process === PROCESS_COOK && !inProcess(state, ing));
      if (cookFirst) return { station: 'pantry', index: INGREDIENTS.findIndex((entry) => entry.id === cookFirst) };
    }
    return { station: 'plating' };
  }
  const done = state.burners.findIndex((burner) => burner.state === 'done' || burner.state === 'burnt');
  if (done >= 0) return { station: 'stove', index: done };
  // a pan about to finish is worth waiting beside rather than walking away from
  const soon = state.burners.findIndex((burner) => burner.state === 'cooking' && (1 - burner.progress) * ingredientOf(burner.item.ing).cookTime < 2.2);
  if (soon >= 0 && !state.board.item) return { station: 'stove', index: soon, linger: true };
  if (state.board.item && state.board.chops < 3) return { station: 'board' };
  if (state.board.item) return { station: 'board' };
  const dish = targetDish(state);
  if (!dish) return null;
  const need = dish.components.filter((ing) => !plate.ids.includes(ing) && !inProcess(state, ing));
  if (need.length === 0) return null;
  // cooking parts first so the pans work while the knife does
  need.sort((a, b) => Number(ingredientOf(b).process === PROCESS_COOK) - Number(ingredientOf(a).process === PROCESS_COOK));
  if (state.burners.every((burner) => burner.state !== 'idle') && ingredientOf(need[0]).process === PROCESS_COOK && need.some((ing) => ingredientOf(ing).process === PROCESS_CHOP)) {
    need.reverse();
  }
  return { station: 'pantry', index: INGREDIENTS.findIndex((entry) => entry.id === need[0]) };
}

/** Returns a function that, given the world, yields the command for this step. */
export function createBot() {
  let wait = 0;
  return function act(world) {
    const state = world.state;
    const command = { dx: 0, dy: 0, interact: false, trash: false, clicks: [] };
    if (state.chef.target) return command;
    wait -= 1 / 60;
    if (wait > 0) return command;
    const goal = choose(world);
    if (!goal) return command;
    if (goal.linger) {
      const x = world.burnerX(goal.index);
      if (Math.abs(state.chef.x - x) > 8) command.dx = x > state.chef.x ? 1 : -1;
      if (state.chef.y > 500) command.dy = -1;
      return command;
    }
    const atBoard = state.focus && state.focus.station === 'board' && goal.station === 'board';
    if (atBoard) {
      command.interact = true;
      wait = CHOP_RATE;
      return command;
    }
    command.clicks.push(pointFor(world, goal));
    wait = REACTION;
    return command;
  };
}
