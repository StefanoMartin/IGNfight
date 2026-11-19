# 🥊 Forum Fighters — IGN Italia Community Edition

A small Street Fighter–style fighting game starring members of the IGN Italia forum.
It runs in the browser: one HTML file of plain JavaScript and canvas, with no libraries, engine or image files.

### ▶️ [Play it on GitHub Pages](https://stefanomartin.github.io/IGNfight/forum-fighters.html)

![Fight screenshot](docs/screenshot.png)

## Features

- **1 player vs CPU** (Easy / Normal / Hard) or **2 players** on the same keyboard
- Gamepad support (up to 2 controllers)
- Character select, best-of-3 rounds, 99-second timer, K.O. and Time Over
- Punches, kicks, crouching attacks, sweeps, air attacks and blocking
- A **skill** on a cooldown and a **super** that uses a full meter for every fighter
- Combos: a punch or kick that lands can be cancelled into a skill or super
- Chiptune music, sound effects and an announcer voice (browser speech synthesis)

## Controls

| Action | Player 1 | Player 2 | Gamepad |
|---|---|---|---|
| Move / jump / crouch | `W` `A` `S` `D` | Arrow keys | Stick / D-pad |
| Punch | `F` | `,` or `Num1` | X |
| Kick | `G` | `.` or `Num2` | A |
| Skill | `H` | `/` or `Num3` | B |
| Super (meter at 100%) | `J` | `Right Shift` or `Num0` | Y / RB |
| Block | Hold away from the opponent | same | same |

`P` / `Esc` pause · `Q` (while paused) back to character select · `M` music on/off

> Click the game once if the keyboard doesn't respond.

## The roster

![Character select](docs/select.png)

| Fighter | Style | Skill | Super |
|---|---|---|---|
| **Talpaman** | All-Rounder / Trap Setter | **Burrow**: digs underground and pops up behind the opponent with an uppercut | **Thread Lock & Meme Flood**: a padlock stuns the foe, then a wave of *Immagini Divertenti* juggles them |
| **Gaara80** | Rushdown / Glass Cannon | **Instant Reply**: a lightning-fast dash punch | **100,000 Post Barrage**: a 50-hit keyboard flurry finished by a *TOP POSTER* uppercut. His floating post counter goes up with every hit |
| **menoDZero** | Heavy Counter / Stance | **Parry Stance**: catches an attack and answers with a counter-slash | **Dramatic Exit**: *"Lascio il forum. Per sempre."* Hit him while he walks away and he teleports back: *"Sono tornato!"* |
| **the.dark.player** | Zoner / Technical | **Code Throw**: hurls a line of raw code. His mechanical keyboard gives his attacks extra reach | **Wall of Text**: a towering wall of paragraphs slides across and crushes the foe into the corner |
| **Kyle_SR84** | Slow & Heavy Grappler | **Arcade Slam**: unblockable command grab. Super armor on standing punches and kicks | **Backlog Avalanche**: a rift drops his entire unplayed library on your head |

More fighters coming soon.

## Run it locally

No build step: download `forum-fighters.html` and open it in a modern browser (Chrome, Edge or Firefox).

## Project structure

```
forum-fighters.html   # the whole game: engine, characters, stage, audio
docs/                 # screenshots used in this README
```

---

A fan-made, non-commercial project for fun within the IGN Italia community. Not affiliated with or endorsed by IGN.
