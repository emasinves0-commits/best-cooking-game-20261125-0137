# Kilat Kitchen

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/emasinves0-commits/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/emasinves0-commits/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

An entry for the make.fun [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty.

**Kilat Kitchen** is an original cooking game set in a tiny Indonesian street-food warung at night: paper
lanterns, a neon sign, a sleeping cat. One screen shows everything at once: the order board across the top,
the stations left to right (pantry, chopping board, stove, plating counter, serving window), and a small chef
you walk with WASD / arrows or by clicking.

## The loop

1. Read a ticket: each shows its dish, its three parts, how each part is prepared, and a timer bar that goes green, amber, red.
2. Fetch raw parts from the 12-bin pantry (hands carry one thing).
3. **Chop** at the board (three taps, the food changes and bursts at once) and/or **cook** in one of two pans (a short timed step: leave it too long and it burns).
4. **Plate**: ready parts snap onto the plating counter one by one; three right parts make a dish. A wrong mix can be binned with one click on the red X.
5. **Serve** at the window before the ticket runs out. Serving the leftmost ticket without a mistake builds a combo multiplier (up to x3); a mistake, a burnt pan or an expired ticket resets it.

The menu: **Nasi Goreng** (rice, egg, chilli), **Mie Goreng** (noodles, chicken, greens), **Sate Ayam**
(skewers, peanut sauce, lontong rice cake) and **Es Teh Manis** (tea, sugar, ice). Chicken needs both knife and pan.

A shift is 3 minutes. Orders arrive faster as it goes on, and the last 30 seconds are **RUSH HOUR** with double orders.

## Controls

| Action | Keys / mouse |
| --- | --- |
| Walk | WASD or arrow keys, or click the floor |
| Use the counter in front of you | E or Space, or click a counter (the chef walks there and uses it) |
| Bin what you hold | X (or click the "in hand" panel) |
| Bin the plate | click the red X on the plate |
| Pause / mute | P or Esc / M |

## Run it

```sh
node serve.ts          # http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # the bounty hand-in
```

No network, no libraries, no audio files: sound is synthesized with WebAudio, art is drawn on a canvas.

## Source layout (`game/src/`)

| File | Job |
| --- | --- |
| `config.js` | tuning numbers, layout, palette |
| `recipes.js` | the menu: ingredients, preparation steps, dishes |
| `world.js` | the simulation: orders, timers, stations, plating, combo, score |
| `input.js` | keyboard and mouse |
| `audio.js` | synthesized sounds |
| `random.js` | seeded random numbers |
| `food.js` | all food, plate and glass art |
| `characters.js` | the chef and the customer |
| `kitchen.js` | the room and the live stations |
| `hud.js` | sign, shift timer, order board, combo meter, prompts, score pops |
| `screens.js` | title, pause and shift summary |
| `render.js` | paints the layers each frame |
| `bot.js` | an autopilot cook that plays through the same commands as a player |
| `shots.js` | staged screenshot scenes (`?shot=cover|rush|serve|title`), played forward by the autopilot |
| `main.js` | boot, the fixed 1/60 s loop, screens |

Screenshots in `screenshots/` are real renders of the game: `?shot=` scenes are found by replaying the real rules with the autopilot (same seed, same frame).

MIT licensed.
