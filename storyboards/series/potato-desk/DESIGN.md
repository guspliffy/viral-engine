# Potato Desk: design (creative director, 17 Nov 2026)

Axes: x right, y up, z toward the camera, metres. Standing height = body + 0.14 legs: Chip 0.67, Reaper 1.14, Dragon 1.10, Viking 1.16, Phoenix 1.14.

## 0. The one shot (both sets)

- Camera (0, 1.45, 10.4), look (0, 1.45, 0), fov 26, level. At z 0: 400 px per metre, frame x -1.35..+1.35, floor y 1540 px, y 700 px = 2.10 m. No face or lettering above 2.05 m.
- **Departure from "counter along x":** the counter's LENGTH runs along z (prop turned 90 degrees), its near end toward the camera: clerk left, customer right, nobody shows a back. Both bodies yaw 25 degrees toward the camera.

## 1. Service counter set

**Room** 4.0 wide (x -2..+2), back wall z -1.30, no front wall, walls 4.0 high (no ceiling in frame).
- Dado 0..0.80 `#5f7a85`; rail 0.04 `#e6e2d6` at 0.80; wall to 2.15 `#c3ccd0`; second rail at 2.15 (y 680 px); above it `#aab6bc`, empty (behind the captions).
- Floor: `checkerfloor` `#97a3a8` / `#a9b3b6`, tile 0.40; if it takes no colours, flat `#97a3a8`.

**Counter**: `woodcounter` turned 90 degrees. Length 1.85 (z -1.30..+0.55), depth 0.50 (x -0.40..+0.10), top **0.50** high. Top `#d9c3a0`, body `#7d6a55`. Chip's eyes are at 0.47: he holds the edge with both hands and looks up 25 degrees.

**On the counter** (x, z; y 0.50):
| Item | Where | Kind |
|---|---|---|
| Monitor, screen turned 45 degrees to clerk and camera | (-0.12, -0.55) | NEW `crtmonitor` |
| Keyboard, long side along z | (-0.27, 0.05) | NEW `keyboard` |
| Stamp, knob `#b43a23` | (-0.25, 0.38) | `rubberstamp` |
| 3 marks `#b43a23`, size [0.06, 0.03] | round (-0.10, 0.30) | `stampmarks` |
| Call bell | (0.00, 0.42) | NEW `callbell` |

**Ticket dispenser**: NEW `ticketsnail` on the back wall at (0.35, 1.10, -1.27).

**Waiting chair**: one `chair` at (0.75, -0.80), facing +z turned 25 degrees toward -x, seat 0.42, `#c8452e`. Chip's feet hang 0.28 above the floor.

**Sign**: NEW `officesign` on the back wall, centre (0, 1.81), 1.50 x 0.42 x 0.04. Plate `#24323f`, letters `#f3ead2`, frame 0.03 `#b08a3c`.
- Ep 1: "AFTERLIFE" cap height 0.13 / "CUSTOMER SERVICE" 0.085.
- Ep 3: "BANK" 0.22.
- Ep 4: "REGISTRY" / "OFFICE", 0.13 each.

**Positions** (x, z): Reaper (-0.85, 0.10); Desk Clerk (-0.80, 0.10); Chip (0.40, 0.10); Phoenix (0.55, 0.10); Dragon (0.62, 0.10) leaning 15 degrees over the counter, right wing cut by the frame.

**Dressing per episode**
- Ep 1 afterlife: `fogveil` over the whole floor, 0.10 deep, `#eef3f6` at 60 %, drifting 0.05 m/s toward -x; `parkedscythe` on the back wall at x -1.18 (Reaper's hands are free); no clock.
- Ep 3 bank: `stanchions` posts at (0.95, 0.55) and (1.30, -0.30); `moneybag` at (-0.05, -1.00).
- Ep 4 registry: `wallcalendar` at (-1.00, 1.70); Form 7B = `paper` at (0.00, 0.15) with `pencil`.

**NEW props (set)**
1. `officesign`: above; spec.lines [text, cap height], spec.w, spec.h.
2. `crtmonitor`: box 0.30 x 0.28 x 0.30, back tapering to 0.20, shell `#d8d2c0`; screen 0.22 x 0.17 `#12261c` with 5 text lines `#9fe0b0` of different lengths; `typed` 0..1 adds a sixth.
3. `keyboard`: 0.36 x 0.13 x 0.025, tilt 6 degrees, shell `#d8d2c0`, 4 key rows `#f1ede2`, one key `#b43a23`.
4. `callbell`: brass dome r 0.045 `#c9a23c`, base r 0.05 `#3b2a20`; `press` 0..1 dips the button 4 mm.
5. `ticketsnail`: disc r 0.09, 0.07 thick, `#c8352b`, bracket `#9aa3a8`, paper tongue 0.03 x 0.04 `#fbf6ea`.
6. `ticket`: 0.06 x 0.11 paper `#fbf6ea`, a 3-digit number `#b43a23` cap height 0.03; `age` 0..1 turns it `#d9c79a` and curls one corner 30 degrees. Pinch grip.

## 2. Ep 1 ending look: "Chip has gone to seed"

The default (old Chip, beard, cobwebs, dust) plus ONE potato-own sign of time: his two leaves have grown into a vine up the wall. On screen the beard is 240 px tall, the vine 420 px. No bones (tone limits).

Chip sits in the chair at (0.75, -0.80), head top 0.95, hoodie and skin unchanged.
- **Face**: the age "old" lines (crease `#6e5236`), `glasses: false`, no cardigan; this needs `age` on the chip costume. Lids 0.5. One blink 0.8 s after the cut: he is alive and still waiting.
- **Eyebrows**: `#f1eee6`, 0.12 long, hanging 0.10 past the outer eye corners.
- **Beard**: `#f1eee6`, shade `#cfcbc0`, 9 locks each drawn once; 0.22 wide under the mouth (0.17 of hoodie stays visible each side), falls 0.60 to the floor tapering to 0.10, then lies 0.20 toward +z.
- **Vine**: one stem 0.012 thick `#5aa334` from the head top to the wall, up to 2.00 m, the last 0.25 curling left round the sign's lower right corner. 9 leaves 0.10..0.14 `#6cbf3a`, 3 potato flowers r 0.03 `#e9def5`, centre `#f2c94c`.
- **Cobwebs** (NEW `cobweb`, strands 3 mm `#e8ecee` at 70 %): A head to chair back to wall, 0.35 x 0.30; B seat edge to chair leg to floor, 0.25; C ticket hand to knee, 0.15; D the sign's lower left corner, 0.20.
- **Dust**: `#b9b3a6` at 55 % on upward faces only: hoodie shoulders, cowl top, head top, seat edge, bell dome.
- **Ticket**: right hand, 0.55 high, `age` 1.
- Reaper unchanged at (-0.85, 0.10), eyes on the monitor, says "NEXT" and presses `callbell`.

**NEW (ending)**: `cobweb` (spec.pts three corners; 6 spokes, 5 rings, each strand bent by index); chip costume keys `age`, `beard`, `brows`, `dust` 0..1, `vine`.

## 3. Desk Clerk (eps 3, 4)

- **Body**: 0.74 high (0.84 of Spud), 0.80 wide, 0.66 deep; a pear, widest at 0.30 of its height; lump 0.03. Skin `#e2a95c`, Spud's eyes and hands.
- **Garment**: knitted sleeveless vest `#8c5a86` over a short-sleeved shirt `#efe9dc`. Lanyard cord `#2f6fb5`, 0.008 wide, badge 0.06 x 0.09 `#fbf6ea` at 0.45 of body height.
- **Leaf**: one, size 0.8, pressed flat and pointing back under the headset band.
- **Object**: one-ear headset `#3a3d42`: band 0.012, ear cup r 0.05 on the camera side, boom 0.12, foam tip r 0.014 `#e0473a`.
- **Default face**: neutral and open. Clip look: lids 0.45, mouth curve 0, eyes on the monitor.
- **Habit**: one slow blink (12 frames) before every answer; types with one finger; looks at the customer only on the last line.
- **Voice**: flat, nasal, tired, slow, mid-low.

## 4. HR Manager (ep 2)

- **Body**: 0.88 high (1.0 of Spud), 0.62 wide, 0.56 deep; an upright capsule, lump 0.01, taper 0.03.
- **Garment**: fitted blazer `#27406b`, white collar `#f4f1e8`, one smiley pin r 0.018 `#ffcf2e` on the left lapel; sleeves end 0.11 before the hand.
- **Leaf**: one, straight up, size 0.9, tip cut square.
- **Object**: the skipage round wire glasses, rim `#c23b3b`. `clipboard` and `pencil` are held props.
- **Default face**: neutral and open. Clip look: smile curve 0.6 for the whole clip, lids 0, brows flat.
- **Habit**: ticks the clipboard after every score; pushes the glasses up once, before "Punctuality: zero".
- **Voice**: bright, sing-song, slow, too calm.

## 5. Small office set (ep 2)

Same camera, room size and rails. Dado `#7f9a82`, wall `#cfd8c4`, top band `#b9c4ae`, carpet `#6d7f8c`.
- **Desk**: `officedesk` turned 90 degrees, w 1.20 (z -0.65..+0.55), d 0.50 (x -0.40..+0.10), front panel toward +x. On it: `deskplate` "HR", w 0.22, at (-0.15, 0.40), one slope toward +z; `report` at (-0.10, 0.05).
- **HR** stands at (-0.85, 0.10).
- **Viking's chair**: `chair` scaled 0.70 (seat 0.30 high, 0.32 wide) at (0.55, 0.10), facing -x; Viking overhangs 0.27 each side.
- **Closet door**: `door` on the back wall, x 0.25..1.25, 1.70 high, leaf `#8a6a48`, casing `#e6e2d6`, hinge at x 0.25; `officesign` 0.50 x 0.14 "SUPPLIES" (cap 0.07) at (0.75, 1.85). Behind it a dark room `#2b3138`, 1.2 deep.
- **Wall**: `officesign` 0.60 x 0.30 "HR" at (-0.75, 1.80).
- **Carried in the ending**: 3 `chair`, 1 `printer`, Steve (body 0.50, round, vest `#7c8f5a`, one leaf, face "terrified").

## 6. Voices

- **Chip**: high, fast, bright, breathless; the pitch cracks on loud words ("I was dead!").
- **Reaper, service voice**: low, slow, flat; no rise at the end of a question; 0.4 s of silence before every answer; "NEXT" is the only loud word.

## Open questions (my default)

1. Counter along z, end-on (default), or along x with the camera yawed 55 degrees?
2. Vine in the ending: yes; if the build runs late it is cut first, beard and cobwebs stay.
3. Captions in the upper third as tasked (default); BRIEF.md says "low in the centre".
