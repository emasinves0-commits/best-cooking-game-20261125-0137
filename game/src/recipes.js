// The menu: twelve ingredients, how each one is prepared, and the four dishes they combine into.
// An item is { ing, chopped, cooked, burnt }; it is "ready" for the plate when it has had every
// step its ingredient asks for. Dishes are plain lists of ingredient ids (order never matters).

export const PROCESS_NONE = 'none';
export const PROCESS_CHOP = 'chop';
export const PROCESS_COOK = 'cook';
export const PROCESS_BOTH = 'chopcook';

export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', local: 'Nasi', process: PROCESS_COOK, cookTime: 3.4, color: '#f2e7c9', dish: 'nasi' },
  { id: 'egg', name: 'Egg', local: 'Telur', process: PROCESS_COOK, cookTime: 2.4, color: '#ffd23f', dish: 'nasi' },
  { id: 'chilli', name: 'Chilli', local: 'Cabai', process: PROCESS_CHOP, cookTime: 0, color: '#e0301f', dish: 'nasi' },
  { id: 'noodle', name: 'Noodle', local: 'Mie', process: PROCESS_COOK, cookTime: 3, color: '#f1d98a', dish: 'mie' },
  { id: 'chicken', name: 'Chicken', local: 'Ayam', process: PROCESS_BOTH, cookTime: 3.6, color: '#f0a99b', dish: 'mie' },
  { id: 'greens', name: 'Greens', local: 'Sawi', process: PROCESS_CHOP, cookTime: 0, color: '#58b947', dish: 'mie' },
  { id: 'skewer', name: 'Skewer', local: 'Tusuk', process: PROCESS_COOK, cookTime: 4.2, color: '#d98c5f', dish: 'sate' },
  { id: 'peanut', name: 'Peanut', local: 'Kacang', process: PROCESS_CHOP, cookTime: 0, color: '#b5793c', dish: 'sate' },
  { id: 'ricecake', name: 'Lontong', local: 'Lontong', process: PROCESS_CHOP, cookTime: 0, color: '#79b45a', dish: 'sate' },
  { id: 'tea', name: 'Tea', local: 'Teh', process: PROCESS_COOK, cookTime: 3, color: '#c4741d', dish: 'teh' },
  { id: 'sugar', name: 'Sugar', local: 'Gula', process: PROCESS_NONE, cookTime: 0, color: '#ffffff', dish: 'teh' },
  { id: 'ice', name: 'Ice', local: 'Es', process: PROCESS_CHOP, cookTime: 0, color: '#9be7ff', dish: 'teh' },
];

export const DISHES = [
  { id: 'nasi', local: 'Nasi Goreng', name: 'Fried Rice', components: ['rice', 'egg', 'chilli'], price: 120, patience: 62, color: '#f08a24' },
  { id: 'mie', local: 'Mie Goreng', name: 'Fried Noodles', components: ['noodle', 'chicken', 'greens'], price: 170, patience: 78, color: '#e0b020' },
  { id: 'sate', local: 'Sate Ayam', name: 'Chicken Satay', components: ['skewer', 'peanut', 'ricecake'], price: 190, patience: 80, color: '#d9452f' },
  { id: 'teh', local: 'Es Teh Manis', name: 'Sweet Iced Tea', components: ['tea', 'sugar', 'ice'], price: 90, patience: 46, color: '#2fb5b0' },
];

const byIngredient = new Map(INGREDIENTS.map((entry) => [entry.id, entry]));
const byDish = new Map(DISHES.map((entry) => [entry.id, entry]));

export function ingredientOf(id) {
  return byIngredient.get(id);
}

export function dishOf(id) {
  return byDish.get(id);
}

export function newItem(ing) {
  return { ing, chopped: false, cooked: false, burnt: false };
}

/** The next preparation an item still needs: 'chop', 'cook' or null when it is ready. */
export function nextStep(item) {
  if (item.burnt) return null;
  const process = byIngredient.get(item.ing).process;
  if ((process === PROCESS_CHOP || process === PROCESS_BOTH) && !item.chopped) return PROCESS_CHOP;
  if ((process === PROCESS_COOK || process === PROCESS_BOTH) && !item.cooked) return PROCESS_COOK;
  return null;
}

export function isReady(item) {
  return !item.burnt && nextStep(item) === null;
}

/** The dish whose three components are exactly `ids`, or null. */
export function exactDish(ids) {
  if (ids.length !== 3) return null;
  return DISHES.find((dish) => dish.components.every((part) => ids.includes(part))) ?? null;
}

/** Dishes that `ids` could still grow into. */
export function dishesContaining(ids) {
  return DISHES.filter((dish) => ids.every((part) => dish.components.includes(part)));
}

/** Plain-words hint for what an item needs next. */
export function stepHint(item) {
  if (item.burnt) return 'Burnt: bin it (X)';
  const step = nextStep(item);
  if (step === PROCESS_CHOP) return 'Chop it at the board';
  if (step === PROCESS_COOK) return 'Cook it on the stove';
  return 'Ready: add it to the plate';
}

export function itemName(item) {
  const entry = byIngredient.get(item.ing);
  if (item.burnt) return `Burnt ${entry.name}`;
  if (item.chopped && item.cooked) return `Cooked chopped ${entry.name}`;
  if (item.cooked) return `Cooked ${entry.name}`;
  if (item.chopped) return `Chopped ${entry.name}`;
  return entry.name;
}
