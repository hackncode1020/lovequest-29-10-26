# Love Quest 🎮❤️

**An 8-bit love game where she's the final level.**

A cute pixel boy runs across a starry pixel city collecting hearts and dodging little 💔 heartbreak clouds. Collect 10 hearts and Player 2 appears: the hearts merge into one giant pixel heart, fireworks go off and the screen says:

> **PLAYER 2 HAS JOINED YOUR LIFE ❤️**

🔗 **Live demo:** https://lovequest-hackncode.sites.tab.bot/
💌 **Make it yours:** https://lovequest-hackncode.sites.tab.bot/?name=Priya
🤖 **Auto-play demo:** https://lovequest-hackncode.sites.tab.bot/?demo=1&name=Priya

## Features

- 🕹️ Retro start screen with blinking **PRESS START** and a saved **HI-SCORE** (localStorage)
- 🏃 Endless-runner gameplay on a pixel-art canvas: parallax pixel city, twinkling stars, a pixel moon, neon heart signs
- ❤️ Collect hearts (some on the ground, some in the air) and dodge 💔 heartbreak rain clouds (a hit costs a heart)
- 🦘 Jump and double jump, move left and right
- 📱 Mobile-first tap controls (◀ JUMP ▶, or tap the game) plus keyboard (↑ / Space / ← →)
- 📊 Pixel level progress bar (0 → 100%) and live score
- 👧 Player 2 walks in after 10 hearts, the hearts fly together and merge into one giant beating pixel heart
- 🎆 Pixel fireworks and floating hearts
- 📜 Level-complete love letter scroll that unrolls with the final score and NEW HI badge
- 🎵 Chiptune music + sound effects synthesized live with the WebAudio API (on/off toggle)
- ↻ Play again
- 💬 Share on WhatsApp (sends a personalised link)
- ⬇️ Download a love card PNG (canvas → PNG): "You completed my heart 💖"
- ✍️ Personalise with `?name=` (default: "my love")
- 🤖 `?demo=1` auto-play mode (the game plays itself, perfect for screen recording)

## Tech

Plain **HTML + CSS + JavaScript + Canvas**. No libraries, no frameworks, no images: every sprite (boy, girl, hearts, clouds, city) is drawn from tiny pixel maps in code, and the music is generated with oscillators.

```
index.html   layout: HUD, game stage, start screen, letter, card modal
style.css    retro pixel UI
game.js      game engine, sprites, physics, autopilot, chiptune, love card
```

Run it: open `index.html` in a browser (or any static server).

---

Day 3 of 100 💻❤️ · Made by [@hack.n.code](https://instagram.com/hack.n.code)
