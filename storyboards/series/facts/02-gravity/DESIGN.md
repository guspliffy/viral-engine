# Gravity design (Codex gpt-6.2-sol, medium, 19 Nov 2026, from its own sheets gravity-panels-v1 + gravity-room-v1)

Verbatim from codex-image-trial\out\gravity-01\gravity-design.md on Jonny's PC. Director notes in [brackets] where the
build departs (timing: the story's step times in lines.mjs win).

Vertical 1080 × 1920, 30 fps. Frame `n` samples `t = n / 30`. Screen coordinates start at the upper left. World coordinates are metres `(x,y,z)`, with `+y` up, `+x` to screen right in shot A and `−z` out the window. Camera FOV values are vertical degrees. Hex values are sRGB. Use a 69.0 s loop (2070 unique frames). For a 71.0 s master, append frames 0–59 at frames 2070–2129 as a loop handle.

For each animated channel, interpolate the values at `p = 0, .5, 1` piecewise linearly unless a curve or cut is specified. Clamp `p` to `[0,1]`. For a track timed `a–b`, `p = (t−a)/(b−a)`. Hold the final state until the next cue or the reset. A hard cut switches on the first frame at its timestamp. Use a fixed random seed of `26031` for all scatter.

## 1. Room

The room spans `x=−2.10…2.10`, `z=−2.65…3.45`, `y=0…3.55`. Back wall is at `z=−2.65`. Window opening is `x=−1.95…1.95`, `y=.09…3.43`. Glass plane `z=−2.68`, tint `#BCCDE3` at `.05` opacity, reflection gain `.08`. Opaque side jambs at `x=±1.95` are `.073` m wide. Vertical mullion centres at `x=−1.69,−.48,.94,1.69`, widths `.043,.060,.054,.043` m, depth `.065` m. Head and sill are `.080` m tall. No horizontal crossbar. Back wall piers and head `#9F715C`, side walls `#AF8067`, ceiling `#A47661`, frame `#2C2426`, floor `#79513D` with `.15–.22` m boards along `z`, seam `#4B332A` at `.002` m, baseboards `#694638` at `.075` m tall.

| Asset | x, z centre | Dimensions and placement | Palette |
|---|---|---|---|
| Sofa | `.20, −1.61` | `2.04 × .91` footprint, seat top `y=.45`, back top `y=.87`, facing `+z`, legs `.14` tall | upholstery `#30595B`, welt `#234344`, shadows `#223A3E`, legs `#69462F` |
| TV + cabinet | `−1.52, −.99` | cabinet `1.16 × .39 × .56` (W×D×H), screen `.94 × .53` centred at `(−1.52,.88,−.96)`, yaw `+34°` from `+z` for both | cabinet `#9E633D`, pulls `#573D34`, screen frame `#23252A` |
| Floor lamp | `1.45, −2.12` | base radius `.14`, arc top `y=2.31`, shade centred `(1.16,2.01,−2.12)`, radius `.24`, height `.32` | metal `#674724`, shade `#E8AC63` |
| Plant | `1.80, −1.60` | pot base at floor, height `.34`, top radius `.18`; foliage top `y=1.40`, radius `.28` | pot `#A08369`, leaves `#476039` and `#81823C` |
| Rug | `.18, .11` | radius `1.03`, height `.018`, rings at `.87` and `.92` | field `#B39171`, rings `#65756C` |
| Sofa pillows | `−.48, −1.87` and `.98, −1.90` | `.39 × .13 × .38` each, centres `y=.64`, roll `+16°` and `−19°` toward sofa centre | `#B16851`, `#C2A17A` |
| Phone | see §7 | `.067 × .137 × .009`, local long axis toward `+y` when upright, edge radius `.007` | case `#3E383B`, glass `#1E242D`, highlight `#807271` |

Directional key `#FFB479`, intensity `2.10`, rays travel normalized `(−.58,−.40,+.71)` into the room. Hemisphere fill intensity `.74`, sky `#90A7D8`, ground `#60463E`. Lamp point at `(1.16,1.94,−2.12)`, `#FFD19A`, `110 cd`, decay `2`, range `3.2` m. Warm floor bounce `#E6A06B` at `.15` relative to key. Keep the lamp on through the timeline.

## 2. City outside in 3D

- Street deck `y=−60`, spanning `z=−43…−15` and `x=−140…140`. Carriageway centre `z=−29`, width `20`, sidewalks `4` per side, asphalt `#373743`, curbs `#6F6260`, lane marks `#897868`. Surrounding city ground is also `y=−60`.
- Near tower footprint `14 × 13`, centre `(9.7,−49.5)` in `x,z`, base `y=−60`, roof `y=15.6`, height `75.6`, 27 floors at `2.8` m. Window-facing facade is at `z=−43`. Vertical bays `1.40` m on the front and `1.30` m on the sides, mullions `.07` m. Glass `#35455E`, keyward panels `#526885`, dark slag `#292D3B`, slab bands `#4C4A59`, occupied windows `#F5BD78`, `#E79754`, `#FFE1A9`, occupancy `.33`, emissive gain `.75`. Use 3D vertical returns `.10` m and alternate bay tint by ±`.05` linear luminance.
- Mid city has 136 instanced 3D buildings over `z=−85…−1950`, `x=−1450…1450`. Distribute in 8 blocks at `85–320` m with 7 buildings each and 10 blocks at `320–1950` m with 8 each. Footprints `9–34 × 10–40` m. Heights `16–63` m, with 12 towers `76–112` m tall. Place 8 of the taller buildings in `z=−160…−400` where the cloud sea leaves roofs exposed, with 4 to either side of `x=0`. Keep visible rooflines within `12°` elevation from A. Facades `#39384B`, `#4C4252`, `#5B4C57`, floor height `2.8–3.5`, occupied window fraction `.28`, lights `#FFB874`, `#FFD29A`, `#CD8D68`. Use actual facade meshes and emissive window quads.
- Beyond 2 km, use a single horizon band at `z=−2200`, `x=−1800…1800`, apparent roof heights `−44…65` world y. Use silhouette `#66506A`, low hills `#806078`, distant lights `#C88968` at `.25` emission. Blend the lower `.8°` into the horizon color. Nearer buildings, street, cloud volumes, dust, Moon and satellite geometry render with depth.

### Tower fall

`fall`, 26.0–29.5 s. Fracture around `y=−13.8`, `46.2` m above street, across floors 16–18, with diagonal endpoints `(2.7,−18.0,−42.97)` and `(16.7,−9.6,−42.97)` on the front. Split into a top section about `29.4` m tall, a lower shell and 42 shards `.25–2.2` m wide seeded along the cut. Fracture stroke `#24212A`, `.06–.22` m. Tip the top toward `−x` and `+z` around its cut-plane centre, rotation columns below are world Z and X. Dust is a 3D ellipsoid plus 18 billows, base `#B7A4A0`, light `#D3BDB1`, shadow `#776D76`.

| `fall` | Cut exposed | Upper translation `(dx,dy,dz)` | Upper rotation `(Z,X)` | Dust centre | Dust radii `(x,y,z)` and peak opacity |
|---:|---:|---|---|---|---|
| 0 | 0 | `(0,0,0)` | `(0°,0°)` | `(9.7,−58,−49.5)` | `(0,0,0)`, `0` |
| .5 | .90 | `(−3.2,−11.5,+2.6)` | `(+17°, +8°)` | `(8,−26,−46)` | `(20,29,15)`, `.78` |
| 1 | 1 | `(−10,−45,+7)` | `(+48°, +24°)` | `(6,−38,−45)` | `(37,24,29)`, `.64` |

Keep lower shell full at `fall=0`, strip its upper `.8` m by `fall=.5`, then bring the fracture line down to `y=−30` by `fall=1`. At `fall=1`, hide the buried upper mesh and expose a `25 × 19` m rubble field, height `1–6` m above street. The surviving shell has three exposed floor slabs and zero lit bays. Shards follow the upper transform until `p=.25`, reach `2–10` m from it at `.5` and land at `y=−59…−54` at `1`. During `sink`, multiply tower dust opacity by `1−.88×sink`.

## 3. Sky

Interpolate by world elevation on a sky dome. Add a horizontal sunset highlight centred at azimuth `−18°`, Gaussian width `34°`, gain `.18` in linear RGB. Azimuth zero is `−z` and positive points toward `+x`.

| Elevation | −12° | −2° | 2° | 8° | 18° | 35° | 75° |
|---|---|---|---|---|---|---|---|
| Color | `#786079` | `#D88070` | `#FFAB6D` | `#C6787E` | `#796285` | `#405A85` | `#293B65` |

### Moon

Use a sphere behind all city geometry, centred 30 km away from A along the angles below. Set radius to `30000 × sin(diameter/2)`. At normal size, its centre from A is `9.5°` left and `13.0°` up, at approximately `(210,489)` px. Base `#F0C799`, maria `#AD8176`, terminator `#776579`, lit rim `#FFE1AC`. Use 16 crater discs with diameters `.025–.18` of Moon diameter and wide maria with opacity `.22`. Light from upper left at phase angle `24°`.

| `moon` | Angular diameter | Azimuth, elevation | Lit-side gain |
|---:|---:|---|---:|
| 0 | `.52°` | `−9.5°, 13.0°` | `1.00` |
| .5 | `26°` | `−4°, 10°` | `1.13` |
| 1 | `96°` | `0°, 8°` | `1.23` |

`moon=0` until 56.0 s. Cut to `.5` at 56.0 s, move to `.58` at 60.97 s, cut to `.86` at 61.0 s and reach `1` at 62.0 s. The 50 g framing places the window head below the HUD zone and the final lunar limb outside the visible opening.

`cracks`, 61.1–64.6 s, on the camera-facing Moon surface. In disc UV (`u` right, `v` up), use origin `(.58,.61)` and three primary polylines through `(.42,.49)→(.32,.32)→(.08,.15)`, `(.68,.67)→(.72,.84)→(.83,.97)` and `(.72,.53)→(.81,.52)→(.98,.33)`. Add 11 daughter branches from intermediate vertices, lengths `.055–.17` disc diameters, angles `25–60°` off the parent, two bends per branch. Core `#624752`, rim `#FFDDAD`, rim width `.45×` core width. At `0` reveal 0% and width 0. At `.5` reveal 65% of primary lengths and 3 branches, core width `.0018` disc diameters. At `1` reveal 100% and all 11 branches, core width `.0035` disc diameters.

### Satellites

`satellites`, 41.0–45.9 s. Start 9 trails at `41.03,41.17,41.33,41.60,41.90,42.27,42.70,43.37,44.33` s. Life `.70–1.40` s, with the fourth trail at `1.40` s. Direction down-left, `25–41°` below screen horizontal. Spawn within azimuth `−6…+20°`, elevation `13…27°`. Use depth `1.2–3.2` km and trail length `3–12°` (`65–670` m, scaled by depth), head `#FFF1C4`, core `#FFAD57`, outer trail `#EB683D`, ember `#AF5241`. Use camera-facing tapered ribbons behind each moving 3D head. Fourth trail includes a 3D body `3.2 × 1.8 × 1.6` m and two navy panels `8.5 × 2.0 × .10` m each, `#314366` with `.5` m grid spacing. Orbit path crosses azimuth `+11°` at elevation `18°`, distance `1.20` km.

| Parameter | 0 | .5 | 1 |
|---|---|---|---|
| `satellites` | 0 heads launched | 7 heads launched, 1–3 trails visible | all 9 launched, 0 visible |
| `trailAge` per streak | at start, `0` length, `0` opacity, `0°` body roll | head at 50% of path, full length, `.95` opacity, `55°` roll | head at end, 25% length, `0` opacity, `110°` roll |

## 4. Clouds

Before the sink, use 28 soft 3D ellipsoid cloud clusters at `y=110…240` above room floor, `z=−650…−1500`, radii `30–105 × 5–18 × 18–50` m. Color `#E3A28E`, top light `#FFC29A`, shadow `#9D7485`, max opacity `.52`. Keep coarse silhouettes above `y=110` and below `17°` elevation in the main window view. Use world-space volume shading.

`sink`, 31.0–34.4 s. For the final sea, lay out 96 overlapping volume lobes over `x=−650…650`, `z=−26…−1250`; lobe radii `16–70 × 4–9 × 12–40`, use a dense shared base down to street level. Cap sea top at `y=−33` (27 m above street), with isolated billows up to `y=−28`. Use ocean fill `#BDB2B6`, lit crest `#F2CCB4`, shade `#90879F`, edge fade `2.3` m in the volume's density field. At final depth all structures below `y=−33` are veiled. Mid-city roofs above `−28` remain exposed. The broken near tower shows up to 3 m of shell in gaps between lobes.

| Parameter | 0 | .5 | 1 |
|---|---|---|---|
| `sink` | high clusters at original heights, city openings clear, sea opacity 0 | high clouds drop 50% of the distance to `y=−38`, sea crest `y=−9`, sea opacity `.68` | high clusters merge into sea, sea crest `y=−33`, sea opacity `.94` |
| `cloudDrift` across 0–65.5 s | initial `x` | `x+7` m | `x+14` m |

Hold the sea for 20–50 g. Keep its footprint outside the room, even where it passes under the camera.

## 5. In-room haze at 35 g

Use a room-clipped exponential fog with transmittance `exp(−density × distanceMeters)`, tint `#97898B`, and 5 blurred billows `#A79895` between camera and sofa. Billow radius `.35–.75` m, z centres `−1.0…+.15`, and vertical centres `.23–.94`. Fade fog on the room side of the window, within `.25` m of `z=−2.65`.

| `haze`, 46.0–47.8 s | Density `m⁻¹` | Billow peak opacity | Offset `(x,y)` |
|---:|---:|---:|---|
| 0 | `.020` | `.00` | `(0,−.15)` |
| .5 | `.105` | `.13` | `(.11,0)` |
| 1 | `.215` | `.22` | `(.23,.15)` |

Hold through 50.99 s, then use density `.055 m⁻¹` on D at the cut. Return to `.020 m⁻¹` at 56.0 s. Sample the same fog per fragment for Spud and foreground props.

## 6. TV picture

Draw a 1280 × 720 canvas into the `.94 × .53` m TV screen. Sky gradient `#435A87→#8098BC`. Use three stylized Alpine ridge layers; canvas coordinates are fractions from upper left. Ridge silhouettes (slabs rising from horizon) use summit points `(.16,.34),(.39,.17),(.54,.27),(.69,.21),(.84,.36)` for the front, each with two flanks to baseline `y=.76`. Front rock `#596275` and `#42495E`, snow `#E8EBEB`, snow shadow `#A2B1C6`, loose snow `#CAC2C0`, dark debris `#746D73`. Use 10 fixed triangular facets per peak. Draw 3 back peaks at `x=.27,.57,.93`, summits `y=.24,.19,.29`, colors `#7F91AD`, `#C1C9D5`.

Lower third from `y=.866…1.00` in canvas space. Base `#243149`, red block `x=.027… .139`, `y=.888… .961`, `#A43842`. Set `LIVE` in white at x `.046`, baseline y `.938`, 30 px bold. Secondary red strip `x=.154… .80`, height `.014`, y `.901`; two off-white rectangles between `x=.17… .68`, y `.928… .950`, fill `#D6DCE4`. Use only `LIVE` as readable text.

| `crumble`, 51.0–54.6 s | Summit drop from initial canvas y | Face rotation | Avalanche coverage |
|---:|---|---|---|
| 0 | `0` for all peaks | `0°` | none |
| .5 | `+.02,+.10,+.06,+.08,+.02` from left | alternating `±7°` | 3 lobes move from central peaks to `y=.69`; radii `.10 × .13` canvas units, opacity `.67` |
| 1 | `+.05,+.23,+.17,+.20,+.05` | alternating `±16°` | 8 merged lobes across `x=.16… .91`, base reaches `y=.86`; max single lobe radii `.19 × .16`, opacity `.86` |

Use peak bases as rotation pivots. Draw debris and dust behind the lower third. For 0–51.0 s and at 66.5 s, display `crumble=0`.

## 7. Spud and sofa by beat (director's part; condensed from Sol's table, numbers kept)

Spud lies on his back on the sofa, boots toward +z, head toward -z; flatten f: height factor 1-f, width 1+0.6f (engine
"flat" axis z, held). Face midpoint world positions and seat sink per cue:

| Cue | f | Pitch | Face (x,y,z) | Eyes L/R, gaze | Mouth | Seat sink |
|---|---:|---:|---|---|---|---:|
| 1 g 0.0 | .00 | -67 | (.46,1.00,-1.78) | .28/.28 | downturned | .012 |
| 2 g 1.0 | .04 | -71 | (.46,.98,-1.78) | .06/.06 squeezed | downturned | .024 |
| 3 g 6.0 | .075 | -75 | (.46,.93,-1.79) | .09/.12 | teeth, strain | .043 |
| 4 g 11.0 | .105 | -78 | (.46,.89,-1.80) | .27/.31 heavy lids | downturned | .058 |
| 5 g tunnel 16.0 | .13 | -80 | (.46,.88,-1.81) | .96/.92 wide | oval | .070 |
| 5 g slump 19.5 | .16 | -90 | (.41,.71,-1.83) roll -14 | closed | relaxed | .084 |
| 10 g 21.0 | .31 | -90 | (.46,.71,-1.79) | wide open | downturned | .109 |
| 15 g 26.0 | .41 | -90 | (.46,.65,-1.79) | .85, look right | oval | .123 |
| 20 g 31.0 | .51 | -90 | (.46,.61,-1.76) | .75 look down | oval | .135 |
| 25 g 36.0 | .72 | -90 | (.46,.55,-1.73) | .82/.04 WINK | upturned smile | .152 |
| 30 g 41.0 | .74 | -90 | (.46,.54,-1.73) | .73 look up | oval | .156 |
| 35 g 46.0 | .75 | -90 | (.46,.54,-1.73) | .9 | big oval gasp | .158 |
| 40 g 51.0 | .76 | -90 | | .74 look left (TV) | oval | .159 |
| 45 g 56.0 | .78 | -90 | | .87 look up | oval | .162 |
| 50 g 61.0 | .81 | -90 | (.46,.51,-1.73) | .93 look up | oval | .164 |
| 1 g 66.5 | .00 | -67 | (.46,1.00,-1.78) | wide | oval | .164 then rebound |
| 1 g 69.0 | = frame 0 |

- Hands start (.29,1.00,-1.54) and (.64,1.00,-1.54) holding the phone above the face; 1.13-6.33 s they drop to the seat
  (.11,.49,-1.39) / (.82,.49,-1.39); from 10 g lower by seatSink-.043, out by f*.08.
- 3 g strain: 7 Hz tremble 6.0-10.8 s; sweat beads 6.1-6.9 and 46.2-47.0. Breaths (0.8 s) at 21.0, 46.15, 47.35, 48.55, 49.75.
- Cushion dip under Spud: seatSink * exp(-((x-.46)/.52)^2 - ((z+1.60)/.34)^2).
- Phone: 0.54-1.0 hop over the face then the 2 g strike at 1.0 (impact ticks 1.0-1.13), 1.30-2.0 slides off the face
  (.46,1.027,-1.76) -> (.40,.73,-1.59) -> (.40,.47,-1.48) onto the seat. 68.27-69.0 launch from the seat (.40,.47,-1.48)
  up to (.43,1.41,-1.62) and down onto the face (.46,1.037,-1.76) = frame 0. Cushion rebound 68.27-68.55.
- Sofa legs + floor: floorDamage 21.0-21.8 (front legs splay 12 deg, rear 6, frame drops .03 m), 3 floor cracks per
  foot, .24 m long, splinters at the front legs; legs at (-.62,-1.95),(1.02,-1.95),(-.62,-1.27),(1.02,-1.27). Reset 66.5.

## 8. Look and grade
- Saturation keys (t, s): (0,1) (10.97,1) (11.35,.07) (15.97,.07) (16.00,.94) (19.5,.94) (19.8,.98) (45.97,.98) (47.8,.76)
  (50.97,.76) (51.0,.91) (55.97,.91) (56.0,1) ... hard cuts at 16, 51, 56, 66.5.
- Tunnel 16.0-19.5 on shot B, centred at the face (~545,1450 px): radius 1650 -> 238 (17.75) -> 126 (18.9) -> 0 (19.5),
  feather 84 -> 0; 19.5-19.8 full black, cut to the slump view at 19.8.
- Blackout card 65.5-66.5 (full black, silence), then everything resets to 1 g (tower, clouds, Moon, floor, TV).

## 9. Cameras (pos -> look, vertical fov)
| Panel, start s | Shot | pos | look | fov |
|---|---|---|---|---:|
| 1, 0.0 | A | (.05,1.52,3.18) | (.03,1.52,-2.65) | 51 |
| 2, 6.0 | A | (.11,1.42,2.72) | (.16,1.40,-2.65) | 51 |
| 3, 11.0 | A | (.11,1.42,2.72) | (.16,1.40,-2.65) | 51 |
| 4, 16.0 | B | (.30,1.10,.40) | (.44,1.37,-1.60) | 50 |
| 5, 19.8 | A | (.05,1.52,3.18) | (.03,1.52,-2.65) | 51 |
| 6, 21.0 | A | (.09,1.31,2.67) | (.15,1.29,-2.65) | 52 |
| 7, 26.0 | C | (.28,1.23,.33) | (.72,1.62,-2.65) | 66 |
| 8, 31.0 | C | (.20,1.42,.53) | (.12,1.37,-2.65) | 67 |
| 9, 36.0 | B | (.37,1.26,-.55) | (.46,.99,-1.70) | 53 |
| 10, 41.0 | C | (.21,1.23,.40) | (.16,1.71,-2.65) | 68 |
| 11, 46.0 | B | (.32,1.30,-.51) | (.45,1.03,-1.70) | 53 |
| 12, 51.0 | D | (-.84,1.33,.39) | (-1.52,1.06,-.96) | 59 |
| 13, 56.0 | C | (.16,1.24,.46) | (.05,1.87,-2.65) | 69 |
| 14, 61.0 | C | (.16,1.24,.46) | (.10,2.00,-2.65) | 72 |
| 15, 66.5 | A | (.05,1.52,3.18) | (.03,1.52,-2.65) | 51 |
Near .035, far 70000 (log depth). C = over Spud: his collar, head rim and leaf along the lower window.

## 10. Sound (realistic only, orchestra under the narrator)
0/1.0 phone case on skin + seat spring knock; 6 exhale, sleeve rub, spring ticks; 11 slow breathing, clock tick, muffled
traffic; 16 pulse, breath, room tone low-passed to 220 Hz by 19.5; 19.5 sweater slide, cushion puff; 21 inhale, two wood
snaps, floor creak; 26 glass fracture, concrete slams, debris rumble through glass; 31 wind on glass; 36 knit rub, small
exhale; 41 distant reports through glass; 46 four gasps, frame strain; 51 avalanche + rock from the TV speaker; 56 glass
flex, cabinet rattle; 61 mullion ticks, floor crack, vibration; 65.5 SILENCE to 66.5; 66.5 room tone, cushion, phone
scrape; 69 one case-on-skin clack (shared across the loop seam).

DESIGN DONE
