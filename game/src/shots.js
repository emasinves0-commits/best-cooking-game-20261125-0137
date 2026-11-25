// The screenshot scenes behind ?shot=cover|rush|serve|title. Each one plays the real rules forward
// from a fresh world with the autopilot (bot.js, which only issues the commands a player could),
// then stops on the frame where the scene reads best. The search is a pure replay: the same seed
// always lands on the same frame, and nothing is edited: it is the game's own render.
import { COOK, SHIFT, STEP } from './config.js';
import { dishesContaining } from './recipes.js';
import { createBot } from './bot.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** How well a world state matches each scene (higher is better); the scene takes the best frame. */
export const SCORERS = {
  cover(state) {
    let score = 0;
    const plate = state.plate;
    if (plate.placed.length === 2 && !plate.dish) score += 4;
    // a cooked dish assembling reads as cooking; the quick drink does not
    const assembling = dishesContaining(plate.ids);
    if (plate.placed.length === 2 && assembling.length === 1 && assembling[0].id !== 'teh') score += 2;
    if (state.window.dish && state.window.age < COOK.serveLinger - 2) score += 4;
    if (state.board.item && !state.board.item.chopped && state.board.chops >= 1) score += 3;
    if (state.focus && state.focus.station === 'board') score += 1;
    if (state.orders.length >= 3) score += 1;
    if (new Set(state.orders.map((order) => order.dish)).size >= 3) score += 1;
    if (state.burners.some((burner) => burner.state === 'cooking')) score += 1;
    if (state.combo >= 1) score += 1;
    if (state.time < 20) score -= 6;
    return score;
  },
  rush(state) {
    if (!state.rush) return -1;
    let score = 0;
    if (state.orders.length === 4) score += 3;
    score += Math.min(2, state.orders.filter((order) => order.left / order.total < 0.25).length) * 2;
    score += Math.min(4, state.combo) * 1.5;
    if (state.plate.placed.length >= 1) score += 1;
    if (state.chef.held) score += 1;
    if (state.burners.some((burner) => burner.state === 'cooking')) score += 1;
    if (state.banner.t <= 0) score += 1;
    if (state.remaining < 14) score -= 6;
    return score;
  },
  serve(state) {
    const popped = state.pops.find((entry) => entry.text.startsWith('+') && entry.age > 0.28 && entry.age < 0.5);
    if (!popped) return -1;
    let score = 2 + Math.min(5, state.combo) * 2;
    score += Math.min(3, state.orders.length);
    if (state.rush) score += 2;
    return score;
  },
};

function newPilot(world, seed) {
  world.reset();
  world.setRandom(seed);
  return createBot();
}

/**
 * Plays the world to the best frame for `scene`. `makeRandom` builds a fresh seeded generator so the
 * replay to the chosen step sees exactly the same dice as the search did.
 */
function playTo(world, scene, makeRandom) {
  const scorer = SCORERS[scene];
  let bot = newPilot(world, makeRandom());
  let best = { score: -Infinity, step: 0 };
  const steps = Math.floor(SHIFT.seconds / STEP);
  for (let step = 0; step < steps; step += 1) {
    world.step(STEP, bot(world));
    const score = scorer(world.state);
    if (score > best.score) best = { score, step };
    if (world.state.phase !== 'play') break;
  }
  bot = newPilot(world, makeRandom());
  for (let step = 0; step <= best.step; step += 1) world.step(STEP, bot(world));
  // the world's own pop animations already advanced by the replay; nothing else is touched
}

/** A full shift by the autopilot gives the title screen a believable best score. */
function sampleBest(world, makeRandom) {
  const bot = newPilot(world, makeRandom());
  for (let step = 0; step < Math.floor(SHIFT.seconds / STEP) + 2; step += 1) world.step(STEP, bot(world));
  return world.state.score;
}

/**
 * Stage the named scene (cover, rush, serve or title; anything else is the title) and return what
 * to draw: { screen, best, newBest, time }.
 */
export function stageShot(name, world, makeRandom) {
  if (name === 'cover' || name === 'rush' || name === 'serve') {
    playTo(world, name, makeRandom);
    return { screen: SCREEN_PLAY, best: 0, newBest: false, time: world.state.time };
  }
  const best = sampleBest(world, makeRandom);
  world.reset();
  return { screen: SCREEN_TITLE, best, newBest: false, time: 4.2 };
}
