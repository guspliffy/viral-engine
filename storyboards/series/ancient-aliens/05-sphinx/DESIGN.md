# How old is the Sphinx really?

## 1. Palette

63.0 s, 1080 × 1920 only, focal subject in middle third, DOF blur 0, far plane 300 m. 24-panel anime target, 3 cel levels `0.64/0.83/1.00` at `N·L` thresholds `0.20/0.58`, silhouette ink `0.85–1.65 px` and interior ink `0.55–1.10 px`. Use 3D scenery, optional far-sky painting.

| Material | Hex colours |
|---|---|
| Member I, hard floor and footing | Fresh `#CDB083`, weathered `#AD8B65`, edge `#E1C498` |
| Member II, alternating soft/hard | Fresh `#D5AE79/#E9CA96`, weathered `#B48860/#D8B17E`, seam `#826344` |
| Member III, harder head | Fresh `#E5C494`, weathered `#CFAB79`, facet `#E9C996`, nemes cuts `#957653` |
| Surface marks | Ink `#493526`, pits `#72533B`, cracks `#654B38`, stain `#9B6C4A`, scratches `#EED3A8` |
| Sand and repairs | Sand `#DEC198`, ripples `#C3A278`, rubble `#B9956D/#EBD0AA`, repairs `#DAB88E/#C9A881`, mortar `#8D7055` |
| Temple and stele | Core soft/hard `#BE946B/#D7B38A`, edge `#EDD0A8`, joint `#806249`, red granite `#8F514D`, light `#B5746C`, grain `#573D42`, stele `#94776C`, relief `#624B43`, paving `#DDCEAF` |
| Storm | Wet hard/soft/head `#746555/#594A40/#887562`, mud `#685845`, water `#566B71`, water edge `#C4D9DE`, rain `#B9CCD8`, cloud top/base `#536477/#293846`, storm horizon `#788A91` |
| Savanna | Soil `#586142`, turf `#546F37`, grass `#37512C/#678743/#8CA55D`, acacia trunk/grain `#493E33/#7B6B50`, crowns `#2F472F/#496536/#6B8548` |
| Salt and water | Damp `#657478`, capillary `#65858B`, damp edge `#8EACAC`, salt base/light/shade `#F0EEE2/#FFFAEB/#B8C6C7`, flake `#F3D5A5` |
| Hall and quarry | Section `#8F694A`, masonry `#9D744D/#6B4B37`, wood/grain `#69492E/#3F2B22`, rope `#AF8A50`, copper `#976044`, scroll/binding `#D8B67B/#8F533C`, tablet/cuts `#B9966F/#66503B`, lamp clay `#8D5030`, flame `#FFF0B4/#F28A32`, lamp amber `#FFB557` |
| Survey | Yellow `#DDA531`, steel `#58606A`, aluminum `#B6BAC0`, rubber `#272A2A`, screen/trace `#243748/#608394`, case `#3E515C`, core `#D2AA7F` |
| Sky, zenith/east horizon | Day `#276CB7/#BEDCED`, dusk `#353D75/#DC8B70`, night `#0A1637/#233B62`, pre-dawn `#14234B/#C46F5B`, dawn `#516493/#FFD29C`, sun `#FFF1BD`, Leo/lines `#F2F7FF/#A9C8E6` |

Hash every mark by index `i` and surface/layer channel `k`. Set `h=imul(i+1,0x9E3779B1) XOR imul(k+1,0x85EBCA6B)`, then `h=imul(h XOR (h>>>16),0x7FEB352D)`, then `U=((h XOR (h>>>15))>>>0)/4294967296`. Independent channels for position, size, rotation and strength. Angle `0–360°` or feature axis, opacity `0.30+0.60U`, offset `0.001–0.004 m`. Batch marks. 0 MB new canvases, 0 tiled textures, sparkles, bloom or floating glyphs. Motion from `[0,1]` clip params only.

## 2. Scale and coordinates

**0.40 engine m per real m** for Sphinx, pit, temples and blocks. Sphinx bounds `29.20 × 8.00 × 7.60 m` (X × Y × Z) derive from `73 × 20 × 19 m`. Paw height `1.55 m` is `1.76×` Spud's `0.88 m` body. Same `4.20–4.95 m` rim relief in all Giza views. Cast heights `0.88/0.76/0.82/0.85 m` for Spud/archaeologist/workers/survey. Existing costumes, survey `strawhat s=1`.

`+X` east, `+Y` up, `−Z` north. Sphinx centreline `z=0`, rear `x=−14.60`, paw tips `x=14.60`, anatomical right `+Z`. Pit floor `y=0`. Props use bottom-centre origins and front `+Z`, with overrides below. Dimensions are X × Y × Z unless labelled. `gizaplateau` at `(0,−0.10,0)`, `s=1`, `r=290 m`. `gizatoday` keeps real metres internally, with `spec.s=0.22`, yaw `0°` and Khafre pyramid base centre translated to `(−111,4.80,−12)`. Distant scenery inside `r=250 m`.

6 shared hard horizons for body, pit and blocks. `B(k,x,z)=b[k]+0.006x+0.003z+0.025sin(0.8x+0.5z+0.7k)` in radians, `b=[1.02,1.46,1.92,2.48,3.04,3.64] m`. Seam thicknesses `[0.14,0.16,0.19,0.15,0.21,0.18] m`. Member I ends at `B(0)−0.07`. Member II extends to the head transition. [Egyptian Ministry of Tourism and Antiquities](https://egymonuments.gov.eg/en/monuments/the-great-sphinx/) · [AERA quarry geology](https://aeraweb.org/projects/who-built-the-sphinx/)

## 3. The Sphinx (`sphinx`)

**Body.** At origin `(0,0,0)`, loft `(x,half-width,back y)` stations with 12 longitudinal subdivisions per interval, monotone interpolation and 32 cross-section samples. For height fraction `t`, use `y=t·backY`, `z=±halfWidth·sqrt(1−t^4)`. Cap at ground. Stations in metres follow.

`(−14.60,0,0.60), (−13.30,2.75,2.50), (−11.30,3.80,3.42), (−7.00,3.42,3.17), (−2.00,3.16,3.30), (1.80,3.28,4.05), (3.60,3.50,4.66), (5.20,2.86,3.50), (6.10,0,0.30)`.

- Paws `10.00 × 1.55 × 2.46 m` each at `z=±2.17`, gap `1.88 m`. Top heights at `x=4.60/8.20/12.80/14.10/14.60` are `1.55/1.50/1.37/1.05/0.10 m`. Use exponent `3.2` superellipse sections and round plan corners over the last `0.62 m`. Per paw cut 3 toe furrows `0.046 m` wide, `0.095 m` deep and `1.42 m` long at relative `z=−0.60/0/+0.60`. Blend into chest.
- Haunch ellipsoids at `(−10.40,1.35,±2.44)` with radii `(2.58,1.31,1.11) m`, buried in main loft. Right tail is an embedded 12-sided sweep, radius `0.16–0.27 m`, through `(−13.66,0.46,1.82),(−12.85,0.44,2.89),(−11.35,0.50,3.51),(−9.40,0.61,3.48),(−8.66,0.92,3.24),(−9.12,1.19,3.27)`. Clamp to `z≤3.80`.
- Cut 6 real Member II ledges at `B`. Round hard edges `0.05–0.10 m`. Use smooth bell recesses between ledges and above the last with peak depths `0.24/0.38/0.46/0.31/0.29/0.17 m` in ascending order, multiplied by `0.85+0.15sin(2.1x+1.7z+k)`. Use at least 5 rings per gap. Ease depths to 0 within `0.32 m` of back ridge or toe ends. Expose `0.72–0.93 m` of Member I at the base with 2 benches `0.14/0.22 m` proud, inside the nominal silhouette.

**Head.** Loft Member III as 32-point rounded-rectangle rings `(y,xRear,xFront,half-width)` in m `(4.50,2.00,5.05,1.22),(5.40,2.21,5.22,1.33),(5.86,2.25,5.82,1.49),(6.30,2.32,5.76,1.56),(6.90,2.35,5.76,1.52),(7.52,2.48,5.62,1.37),(7.88,2.66,5.33,1.11),(8.00,3.00,5.04,0.72)`. Face east. Brow shelf `0.21 m` tall at `y=6.97`. Eyes at `y=6.77,z=±0.54`, each `0.64 m` wide, `0.18 m` tall, `0.10 m` inset. Ears at `(4.57,6.66,±1.48)` with `0.42 × 0.70 m` side profile. Mouth at `y=6.11`, `1.12 m` wide, `0.045 m` inset with `0.12 m` lip shelf. Missing nose is a 7-point broken recess at `y=6.28–6.88`, width `0.32–0.45 m`, depth `0.12 m`. Add a `0.28 × 0.14 m` chin scar and no beard. Nemes wings and lappets use mirrored `(x,y,abs(z))` contours `(3.10,7.82,1.04),(3.56,7.18,1.52),(3.79,6.30,1.86),(4.00,5.78,1.97),(5.04,5.46,1.61),(5.30,5.93,1.15)`, thickness `0.22 m`, rear joined to head. Cut 9 stripe traces per side, pitch `0.19 m`, width `0.020–0.042 m`, depth `0.014–0.026 m`.

**Details.** Paw bases get 4 staggered repair courses and flanks 3, below `y=0.86`. Blocks `0.31–0.56 m` long, `0.14–0.23 m` tall and `0.11–0.19 m` deep with `0.012 m` joints, `0.018 m` bevels, `≤0.03 m` surface offset and 2 chips (`0.012–0.042 m`) each. Body marks include 1,350 pits (`0.012–0.068 m` diameter, largest 180 inset `0.006–0.022 m`), 72 cracks (`0.10–0.74 m`, 2–5 segments), 85 bed strokes (`0.08–0.48 m`), 96 stains (`0.09–0.44 m` high, `0.015–0.075 m` wide). Head marks include 180 pits (`0.009–0.030 m`) and 8 cracks (`0.09–0.23 m`).

**Dream Stele.** With `stele=true`, slab bottom `(6.93,0.08,0)`, east-facing. Granite `0.25 × 1.44 × 0.88 m`, arched rise `0.22 m`, bevel `0.034 m`, foot `0.48 × 0.08 × 1.08 m`. Add `0.06 m` border, 2 relief silhouettes `0.14 × 0.23 m`, 9 rows of unreadable `0.012–0.032 m` cuts. Omit in historical and imagined past. [Egyptian Ministry of Tourism and Antiquities](https://egymonuments.gov.eg/en/monuments/the-great-sphinx/)

| Param | Driven change |
|---|---|
| `rough` | At 0 use present shape. At 1 flatten 65% of flank curvature into 6 quarry facets, keep 15% recess depth, replace pit/stain marks with 210 tool cuts (`0.08–0.25 m`), retain a `3.25 m` high apron at `x=−14.6…−0.8,z=−5.5…−1.2` merging into §4's uncut bench. Toe grooves become `0.035 m` deep guide cuts, face cuts retain 35% depth. Fade casing and stele by `0.20`. Use `1/0.35` in 15/16. |
| `flake` | 12 chips at `flakeAt=(5.40,0.76,3.22)`, snapped to south surface along Z. Five sides, width `0.012–0.058 m`, thickness `0.003–0.012 m`, initial spread `0.09 m`. For chip `i`, `q=clamp((flake−0.018i)/0.78,0,1)`. Move `+Z` by `0.18q m`, fall `0.90q² m` with floor clamp `y=0.012`, tumble `(110+140U)q°`. Hide if `flake≤0.018i`. At 1 chips rest on floor. |
| `wet` | Rock blends to wet palette by `wet·(0.75+0.25U)` per bed. Add 32 runoff traces `0.015–0.06 m` wide along steepest descent over head/chest/paws, edge alpha `0.33·wet`. |

## 4. The enclosure (`sphinxpit`)

Use inside polyline `(x,z)=(16.60,−8.60),(−15.40,−8.60),(−18.20,−6.65),(−18.20,6.95),(−15.60,9.35),(16.60,9.35)`. Main length `34.80 m`, width and east opening `17.95 m`. Rim heights north/west/south `4.20/4.95/4.65 m`, blended on chamfers. Wall foot projects `0.38 m` inwards. Add `1.35 m` rim ledge and outside terrain declining to `y=−0.10` at `r=80 m`. Floor and terrace share `y=0`, terrace `x=16.60–36.00,z=−11–29`. Ground disc stays below the floor.

- Cut 62 grooves, north/west/south `25/12/25`, west includes chamfers. Pitch `sideLength/(count+1)`, jitter `±0.18 m`. Width `w=0.48+0.40U m`, depth `D=0.23+0.47U m`, centre drift `0.14sin(1.4y+6.28U) m`. Inset `D cos²(πd/w)` for distance `|d|<w/2`. Mesh step `≤0.10 m` along wall, `≤0.12 m` in Y. Seam lips `0.07–0.13 m` proud. Deepen 19 grooves with fissures `0.025–0.075 m` wide and `0.07–0.18 m` deep. Use 780 pits (`0.014–0.064 m`), 190 bed strokes (`0.12–0.70 m`), 105 stains (`0.18–0.95 m`).
- North shelf `y=1.12`, width `0.10→1.32 m` west to east, inner edge `z=−7.30` in `x=4.40–8.80`. Four attached blocks centred `(x,z)=(9.20,−8.05),(10.73,−8.04),(12.34,−8.01),(14.06,−7.96)` and sized `(1.24,0.91,0.90),(1.38,1.00,0.96),(1.47,0.84,1.02),(1.60,0.75,1.04) m`. Cut 3 channels per block, widths `0.14/0.16/0.18/0.19 m` by block, depth `0.51–0.73 m` clamped to leave a `0.24 m` base web. Per block cut 36 chisel marks `0.065–0.15 m` long, `0.008–0.017 m` wide and `0.006 m` deep, at `65–82°`. Two eastern blocks each get a `0.19 × 0.11 × 0.15 m` lever socket. [AERA north-ledge excavation](https://aeraweb.org/wp-content/uploads/2022/08/aeragram5_2.pdf)
- 17 sets both pit and temple `match=true`. Cut a recess across `x=4.78–8.38,y=1.12–2.48` to `z=−8.73`. East return begins `x=7.205`, front `z=−7.55`. Evaluate `B` on the return and suppress grooves here. Use 36 floor sand patches `0.40–2.60 m` across, 360 ripples `0.12–0.52 m` long and 145 chips `0.04–0.24 m` across, relief `≤0.045 m`.
- `wet` blends floor/wall to mud/wet rock. Groove depth multiplier `1−0.24·wet·(1−flow)`. Use 28 water ribbons at `wet=1`, `10/8/10` north/west/south, following groove bottoms from rim, dropping vertically off bed lips until the next wall contact. Width `0.035–0.14 m`, wall clearance `0.015–0.055 m`, 2 edge highlights at alpha `0.50·wet`. March 7 dashes along each path at `fract(flow+U+j/7)`. Add 15 pools with radii `0.30–1.65 m`, depths `0.007–0.019 m`, a `3.6 × 0.5 m` mud band at each outer paw, and 2 ripples per pool growing `0.06→0.38 m` at phase `fract(flow+U+j/2)` and alpha `0.32·wet·(1−phase)`.
- `quarry` retains `ceil(12·quarry)` cells counted from the west, north row first within each column. Grid 6 × 2, cell `2.30 × 2.00 m` in XZ, northwest corner `(−14.20,−7.35)`, tops by column `3.25/3.25/2.85/2.55/1.85/1.12 m`, channels `0.18 m` wide and `0.40 m` deep. Join inner cells to Sphinx apron where they overlap. Scale groove depth at retained cells by `1−0.8·quarry`. 15/16 use `1/0.34`. At 16 use an east ramp `6.8 × 2.8 m` in XZ, height `0→0.42 m`, `x=10.0–16.8,z=5.20` centreline. Reuse `haulteam` at `(13.0,0.19,5.20)` facing east, `s=1`, existing pull phase, with `limeblock`, `look=core`, scaled to `2.24 × 0.98 × 1.12 m`.

## 5. The temples (`sphinxtemple`, `khafrevalley`)

**Sphinx Temple.** Origin `(25.60,0,0)`, front `+X`. Footprint `17.88 × 21.00 m` in XZ, wall `1.35 m` thick, court `7.8 × 9.2 m`, sanctuaries `2.30 × 4.10 m` at local `x=±5.45,z=0`. Cut 2 east doors `1.45 m` wide at `z=±5.35`. Use 24 pier sites (6 per run on `z=±5.20` or `x=±4.55`, spaced evenly over `x=±3.60` or `z=±4.20`), square section `0.56 m`, paving `0.10 m` thick. In ruins leave 15 stumps `0.12–0.48 m` tall. Retain perimeter courses at `100/72/15%`, indexed by hash, heights `0.88/0.92/1.05 m`, lengths `0.92–1.34 m`, joints `0.022–0.046 m`, half-block stagger. Use 6 monoliths up to `2.24 × 0.98 × 1.12 m` (about `100 t` at full size). Per block add 3 chips, 5 pits and 2 chisel marks `0.018–0.08 m`.

Carry the lowest Member II beds through the volumes. Block `i` samples `B` about source lower-front centre `(1.40+0.46(i mod 9),0.97+0.13(i mod 5),−7.55)`. Use setbacks `0.025–0.063 m`. For `match=true`, add witness at world `(6.08,1.12,−8.11)`, size `2.24 × 0.98 × 1.12 m`, front `+Z`. Evaluate `B(k,x,−7.55)` on both front faces at world X. At the `0.005 m` joint use setback `0.025 m`, bevel `0.004 m`. Keep seam height mismatch `≤0.010 m`.

`era='ruin'` selects ruins. `era='quarry'` starts with recessed footings `y=−0.14…0` and 35% of course 1 at `build=0`. Reveal blocks by course, then east/north/west/south/interior run, then along run. At 1 reach `2.85 m` at 3 corners, `1.80 m` at NE. Raise the 24 piers to `1.84 m` and place 10 statue bases `0.68 × 0.26 × 0.65 m` around the court and 3 loose casing blanks `1.16 × 0.84 × 0.32 m` east. Keep 5 third-course slots empty on north/east runs, roof and wall casing absent. Use `.47/.91` for 16/18. Valley Temple and causeway precede this phase, circa 4,500 years ago. [AERA construction sequence](https://aeraweb.org/why-sequence-is-important/) · [Sphinx Temple plan](https://academic.oup.com/edited-volume/43506/chapter/364132852)

**Khafre Valley Temple miniature.** Origin `(25.60,0,19.64)`, front east. `17.60 × 3.60 × 17.60 m`, limestone core, `0.22 m` granite facing, `1.30 m` wall thickness, `7°` inward batter. Two east portals `1.24 × 2.55 m` at local `z=±4.65`, jambs `0.16 m`. West exit `1.35 × 2.32 m` at `zLocal=−7.19`. T hall crossbar `4.8 × 9.8 m` XZ centred at local `(−2.6,0)` and stem `6.4 × 4.8 m` centred at `(3.0,0)`. Use 16 square pillars `0.42 × 2.60 × 0.42 m`, 2 × 5 and 3 × 2 grids respectively, pitch `1.62 m`. Per run 5 casing joints, per slab 3 grain lines and 11 flecks `0.008–0.027 m`.

Compress the `~500 m` real causeway to a polyline `(16.8,0.40,12.45) → (−20,4.90,11.20) → (−149,6.80,−24.00)`. Road width `1.80 m`, parapets `0.32 m` high in `1.25 m` blocks with `0.03 m` joints, support to terrain. End at landing `3.10 × 0.35 × 4.00 m` at `(−150.55,6.45,−24.00)`. Reuse `pyramid` `state=finished,s=0.34`, base centre `(−188.6,6.80,−24.00)`, yaw `0°`. In 18 use `aasky` `sunset,night=0`, disc on, bearing `270°`, altitude `2.2°`, zenith/horizon `#625D91/#F9A368`. [AERA Khafre complex survey](https://aeraweb.org/khafres-monuments/)

## 6. Spud's reconstructions

**`savanna`.** In 05, `cover=true,storm=true`, Sphinx `wet=0.78,stele=false`, 0 pyramids, temples or enclosure walls. Turf within `r=85 m` at `y=0.012+0.045sin(0.31x)sin(0.43z)` inside `r=80`, blending to plateau edge. Clear statue by `0.18 m`. Use 1,440 tufts inside `r=47 m`, 360 from `47–80 m`, 5 tapered 2-segment blades per tuft, height `0.12–0.39 m`, width `0.010–0.033 m`, bend `8–33°`, turf patches `0.08–0.25 m`. Add 12 puddles with radii `0.52–1.75 m` at lows. Acacia `(x,z,trunk height,crown diameter)` tuples in m `(−8,−11,3.5,6.8),(9,8,4.2,7.8),(−23,9,3.7,7.0),(18,−13,3.2,6.0),(−32,−17,3.0,5.4),(25,14,3.7,6.5),(−45,7,3.1,5.9),(29,−27,4.0,7.4)`. Trunk radius `0.18→0.07 m`, 5 forks at `52–76%` height, 19 canopy lobes with Y radii `0.52–0.83 m`, 32 leaf-edge strokes per crown `0.06–0.19 m`. Grass tips and crown edges sway `6°·sin(2πgust+6.28U)`.

Storms use `aasky` `time=afternoon,night=0`, sun off. Cloud deck has 18 masses at `(−62+24i,18+3j,−55+45j)` for `i=0…5,j=0…2`, XYZ radii `17–26/2.8–4.8/10–19 m`, 7 merged lobes per mass and vertical colour ramp. Blend horizon colour over `r=70–130 m`. Reuse `rainbox` at `(0,0,0)`, bounds `68 × 18 × 48 m` in 05 and `39 × 13 × 23 m` in 06. Drops `1,280/1,050`, length `0.22–0.60 m`, tilt `11°` toward `+Z`, alpha `0.46`, 5 wraps over normalized phase. In 06 use `cover=false,storm=true`, pit and Sphinx `wet=1`, `stele=false`.

**`hiddenhall`.** Shell bottom `(11.30,−5.60,2.17)` below right paw. Shell `7.60 × 5.60 × 11.20 m`, inner room width `5.60 m`, depth `8.80 m`, floor/ceiling at local `y=0.24/3.42`. Open `+Z` section through stair bay and room. In 11 use shell ground, hide plateau and pit floor. Expose `2.18 m` roof section under the paw and two side rock faces. Stair width `2.20 m`, 16 rises `0.19 m`, treads `0.24 m`, ascending from `zLocal=0.78` towards `+Z` to a `0.46 m` landing. Add 2 walls `0.27 m` thick and cut a `2.46 m` wide stair void with `1.40 m` head clearance. On exposed rock add 6 strata `0.20–0.47 m` thick, 54 chips `0.025–0.14 m`, 80 pits `0.012–0.052 m` and 18 vein strokes `0.13–0.51 m`.

4 shelf bays per side at `xLocal=±2.43,zLocal=−3.65/−2.50/−1.35/−0.20`, each `0.43 × 2.32 × 1.05 m`, 4 boards `0.055 m` thick on `0.51 m` pitch. Load 3 scrolls per shelf (`0.12 m` diameter, `0.32 m` long, 96 total), 1 tablet per bottom 3 shelves (`0.23 × 0.30 × 0.065 m`, 24 total) with 5–7 incisions. Add 12 pilasters `0.23 × 2.70 × 0.26 m` at `xLocal=±2.67`, `zLocal=−4.15+0.73i`, `i=0…5`. Stone table `1.60 × 0.72 × 0.84 m` centred `xLocal=0,zLocal=−2.72`. Six `oillamp` at `xLocal=±2.15,yLocal=1.36,zLocal=−3.78/−2.17/−0.53`, `s=1`. Pools radius `1.26 m`, intensity `0.70·(1+0.08sin(2πlamp+6.28U))`, fill `0.24`.

## 7. Evidence pieces

**`saltslice`.** Member II section facing `+Z`, `2.40 × 1.75 × 0.66 m`. Upper chips `0.035–0.080 m`, 3 seam traces `0.025–0.06 m` thick. Cut 160 7-point pores on a 16 × 10 lattice from `x=−1.10…0.88,y=0.10…1.65`, jitter `±0.020 m`, radii `0.008–0.042 m`, inset `0.009–0.055 m`. Add 53 connecting throats `0.0015–0.006 m` wide, 83 grains `0.004–0.014 m`, 28 fracture chips. `damp` raises the damp front `y=0.12→1.27 m` along 17 capillary branches `0.005–0.019 m` wide. Offset front `0.043sin(9x)`, feather `0.075 m`, tint below it at `0.52`. Grow 31 clusters at crossed pores, 5 six-faced crystals each, edge `0.009–0.033 m`, scale `clamp((grow−0.25U)/0.75,0,1)`. Largest cluster is behind the flake seat `(1.02,1.13,0.33)` and appears when `damp≥0.90`. Match 8 fracture vertices on flake and seat, flake `0.31 × 0.28 m`, thickness `0.037 m`. `pop=p` displaces by `(0.25p,0.05p−0.30p²,0.23p) m` and rotates `37p°` Y, `22p°` Z. Release 8 chips `0.009–0.031 m` with `0.40–1.35×` flake travel and extra fall `0.60p² m`. Over clip phases `0–0.42/0.30–0.76/0.76–1`, ramp `damp/grow/pop` respectively. Salt and moisture cycling contribute to erosion. [Sphinx limestone-bed study](https://doi.org/10.1007/BF01706413) · [GCI/EAO monitoring](https://gizamedia.rc.fas.harvard.edu/images/MFA-images/Giza/GizaImage/full/library/preusser_et_al_fs_el-sawi.pdf)

**`surveykit`.** Root `(11.0,0,5.65)`, front `+Z`. Composite survey, no library found. [AERA survey and drill record](https://aeraweb.org/wp-content/uploads/2022/08/AERA_2019.pdf)

- Cart `0.48 × 0.21 × 0.71 m`, yellow box, `0.024 m` steel tubing. Four wheels `r=0.105 m`, width `0.058 m`, axles at `(±0.25,0.105,±0.25)`, 12 grooves per wheel. Screen `0.29 × 0.18 m` at `(0,0.65,−0.13)`, tilt `28°` back, 6 traces, 0 text. Push bar spans `x=±0.21` at `y=0.69,z=−0.46`. Export `0.035 m` diameter grips at `(±0.15,0.69,−0.46)`. `roll` moves cart and anchors `+0.85·roll m` along Z and turns wheels `0.85·roll/0.105 rad`.
- Rig at `(−3.30,0,1.03)` with twin `0.31 × 0.25 × 1.48 m` tracks at `xLocal=±0.47`, 26 treads per track. Housing `1.01 × 0.77 × 1.22 m` on `0.26 m` chassis, 12 vents, 8 bolts. Mast `0.24 × 3.18 × 0.28 m` at `(0,0.20,+0.48)` relative to rig, 18 rungs on `0.15 m` pitch, 2 hoses `r=0.022 m`, drill stem diameter `0.046 m`. `drill` lowers carriage `0.33·drill m` and turns stem `4·drill` rev. Case `0.46 × 0.41 × 0.35 m` at offset `(0.93,0,0.28)`.
- Table at `(2.52,0,−0.58)`, top `1.55 × 0.045 × 0.65 m` at surface height `0.64 m`, 4 tube legs `0.024 m` diameter splayed `12°`, 2 crossbars. Solid core along X, length `1.05 m`, diameter `0.17 m`, two V cradles at `xLocal=±0.31`. Add 7 bed transitions `0.05–0.16 m` apart, 106 pits `0.002–0.012 m`, 2 hairline fractures `0.04–0.08 m`, flat cut ends.

**`leo`.** Use `orion`-style unlit 12-sided discs, 0 halos or rays. J2000 RA, Dec and disc diameters in °. [IAU catalogue](https://www.iau.org/static/science/scientific_bodies/working_groups/280/WGSN_bulletin2.pdf) · [SIMBAD Eta Leo](https://simbad.u-strasbg.fr/simbad/sim-id?Ident=%2A+eta+Leo) · [Astrometry.net Epsilon Leo](https://sources.debian.org/src/astrometry.net/0.76%2Bdfsg-3/catalogs/brightstars-data.c)

| Star | RA | Dec | Disc |
|---|---:|---:|---:|
| Regulus | 152.0930 | +11.9672 | 0.105 |
| Eta Leo | 151.8331 | +16.7627 | 0.055 |
| Algieba | 154.9931 | +19.8415 | 0.078 |
| Adhafera | 154.1726 | +23.4173 | 0.055 |
| Rasalas | 148.1909 | +26.0070 | 0.045 |
| Ras Elased Australis | 146.4628 | +23.7743 | 0.069 |
| Zosma | 168.5271 | +20.5237 | 0.078 |
| Chertan | 168.5600 | +15.4296 | 0.058 |
| Denebola | 177.2649 | +14.5721 | 0.088 |

Sphere `r=240 m`, centre `(0,0,0)`. Convert to unit vectors `(cosδ cosα,cosδ sinα,sinδ)`. Resolve against increasing-RA, increasing-Dec and radial unit basis at `(162°,18°)`. Map components to `−Z,+Y,+X`, then rotate about `+X` by `−5°` and about `+Z` by `(6+3·rise)°`. Centre bearing `90°`, altitude `6→9°` along the Sphinx's gaze. Rigid placement illustrates Spud's 12,500-year claim. `show` scales sprite alpha. Link `Regulus–Eta Leo–Algieba–Adhafera–Rasalas–Ras Elased Australis`, `Algieba–Zosma–Denebola–Chertan–Regulus`, plus `Zosma–Chertan`. Use 8 spherical segments per link, width `0.024°`, alpha `0.33·lines·show`. While Leo is shown, use `starfield` `spec.hole` centred at bearing `90°`, altitude `8°`, radius `19°`.

| Panel | `aasky` `time`, `night`, sun | Palette and overlays |
|---|---|---|
| 20 | `dusk`, `0.25`, off | Dusk, ambient `0.58`, key `0.66`, west tint `#E6A076` |
| 21 | `night`, `1.00`, off | Night, ambient `0.30`, starfield alpha `0.86`, Leo 0 |
| 22 | `night`, `0.83→0.69`, off | Pre-dawn east glow `0–8°` altitude, bearing `65–115°`, starfield `0.68→0.46`, Leo `show=0.88,lines=0.82,rise=0→1` |
| 23 | `dusk`, `0.42`, off | `55%` dusk, `45%` pre-dawn, ambient `0.49`, starfield `0.13`, Leo 0 |
| 24 | `afternoon`, `0`, on | Dawn override, sun bearing `90°`, altitude `1.8°`, disc `0.53°`, tint `#FFD29C`, ambient `0.60`, key `1.03`, stars 0 |

## 8. Builder tasks

3 disjoint files. Position/yaw/scale default to `(0,0,0)`/`0°`/`1`. Apply placements once. Animated keys default to 0 in `[0,1]`. Budgets include detail. Duplicate `B` verbatim in Sphinx and site files.

| File | Kinds and static spec defaults | Animated keys | Triangle caps |
|---|---|---|---|
| `props-eg-sphinx.js` | `sphinx` (`stele=true`, `flakeAt=[5.40,0.76,3.22]`) | `rough,flake,wet` | 116k |
| `props-eg-sphinxpit.js` | `sphinxpit` (`match=false`), `sphinxtemple` (`era='ruin',match=false`), `khafrevalley` (none) | `wet,flow,quarry` / `build` / none | 112k / 54k / 30k |
| `props-eg-sphinx-fx.js` | `savanna` (`cover=true,storm=true`), `hiddenhall`, `saltslice`, `surveykit`, `leo` (last 4 none) | `gust` / `lamp` / `damp,grow,pop` / `roll,drill` / `show,lines,rise` | 86k / 46k / 31k / 24k / 0.4k |

- **Sphinx done when** bounds are `29.20 × 8.00 × 7.60 m`, heading east, paw gap `1.88 m`, 6 bed ledges intact, nose and beard absent. Check 1 stele and casing at `rough=0`, joined quarry at `rough=1`, 12 chips and 32 wet traces.
- **Site done when** 62 grooves have relief, 4 shelf blocks remain attached, 28 water ribbons follow ledges, east opening meets the temple terrace and the witness seam error is `≤0.010 m`. Check quarry/build endpoints, Valley Temple to the south, and causeway at Khafre's miniature.
- **FX done when** 8 acacias, 1,800 tufts, 6 hall lamps and 120 shelf objects render in 3D, 31 salt clusters precede 1 flake release, the solid core remains visible and the 2 grip anchors follow the cart. Leo has 9 stars and 10 links, spacing error `≤0.02°`, and centre bearing `90°`. Check 9 kinds at <150k tris each, <60 MB total canvas and identical geometry at equal params in any order.
