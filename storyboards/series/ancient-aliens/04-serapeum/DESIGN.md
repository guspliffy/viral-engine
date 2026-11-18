# Sixty tonnes. For one cow.

**66.00 s · 30 fps · 1,980 frames.** Match `egypt-04-sheet-1.png` (01–12) and `egypt-04-sheet-2.png` (13–24). Keep the beard under the chin and all 6 Djoser steps. [Historic account](https://oi.uchicago.edu/sites/default/files/uploads/shared/docs/stereoscope.pdf)

## 1. Palette

| Surface | Base, shadow, accents |
|---|---|
| Ink and dark | `#251E21` ink, `#111923` blue-black, `#36404B` bounce |
| Black granite | `#22242A`, `#13151C`, `#A08668`/ `#646873` grain, `#C8D6DE` polish, `#F6AE56` reflected amber |
| Red granite | `#81564F`, `#563938`, `#BA8576` feldspar, `#30282D` grain, `#DDB7AA` polish |
| Limestone | `#A68A6C`, `#665348`, `#CAB093` chips, `#3B3030` cracks, `#84654C` stains |
| Sand and dust | `#A1876B` tunnel, `#D6AE79` desert, `#B58B62` ridges, `#896249` wet, `#C8B292`/ `#907D65` dust |
| Lights | `#8F4C31` lamp clay, `#FFAB49` amber, `#FFF0BF` flame core, `#FFF1D3` headlamp, `#FFE5B5` daylight, `#88BBE3` day sky, `#ABC8CE` pour |
| Spud | `#E8B04A` skin, `#B8792F` shade, `#D87F55` cheeks, `#F4DBA8` glove, `#594537` boot, `#315B5B`/ `#203E42`/ `#568681` knit, `#8F7954` band, `#4E4840` lamp, `#79933D`/ `#A3B854` leaf |
| Pharaoh | `#E0A655` skin, `#B47A3C` shade, `#A46E34` freckles, `#F1E0BA` eye white, `#65452C` iris, `#302329` kohl, `#683D34` lip, `#453435`/ `#75564A` plait |
| Cloth and fittings | `#D9C3A0` linen, `#F0DBB5` fibre, `#AA906E` fold, `#765C49` tear, `#EDE1C9`/ `#B5A086` worker white, `#DCA83B`/ `#876328`/ `#F6D570` gold, `#26447B`/ `#1D2C52` lapis, `#3F9C9C` turquoise, `#A94830` carnelian, `#C78E43`/ `#472C24` leopard |
| Aliens | `#99ADB3`/ `#657C88` skin, `#C8581F`/ `#81391F` coveralls, `#E8D8B9` cuffs, `#247681` knob, `#76C4C2` beam, `#3A8787` spill |
| Apis and bier | `#232329`/ `#41424B` hide, `#424049` muzzle, `#19171B` hoof, `#D6C2A0`/ `#8D7762` horn, `#F7E7CD` diamond, `#C28C30`/ `#F5CC70` gilt, `#E7D4B2` drape |
| Temple and palms | `#DCB884` plaster, `#A67D57` relief, `#A65540`/ `#477C8F`/ `#548278`/ `#CA994E` pigments, `#8B6542` trunk, `#51653A`/ `#7B8545` fronds |
| Transport | `#73452F` hull, `#4B2E25` plank joints, `#AB7850` deck, `#BC9169` scuff, `#BB985C`/ `#715333` rope, `#E3C392`/ `#AB865E` sail, `#95804A` mat, `#A55235`/ `#653725` jar, `#D2A97B` splinter |
| Nile sunset | `#3D626B`/ `#253C4A` water, `#C38465` ripples, `#F9BE76` sun track, `#716681`→`#EB9775`→`#FFCC8D` sky, `#FFE4A0` sun |

## 2. Scale and render

- Masonry **0.55×**. Box L/W/H 4.00/2.30/3.30 → **2.200/1.265/1.815 m**, 2.06 Spud body heights. Corridor 3.00/5.00 → **1.650/2.750 m**. Final sizes X×Y×Z in metres, bottom-centre origins, +X right, +Y up, front +Z, yaw +90° turns front to +X. Cast 1.00×, body heights .88 Spud, .82 worker, .60 crew, 1.05 foreman.
- Scene frames `C` present gallery, `I` past interior, `S` desert, `M` Memphis, `Q` quarry, `N` Nile. Coordinates are scene-local. Use two native aspect projections, 1920×1080 and 1080×1920, near/far .03/300. Focal action in x=.333–.667 of **both** frames. Two-shots put the eye midpoint in that band, with each face inside .12–.88. Whole frame sharp.
- Anime ink at 1080 px width 1.6 px silhouette, .65–1.10 detail. Cel thresholds .32/.66, blend .04. 3D relief and pigment polygons. Projections only for far sky/hills. Bloom, sparkles, floating glyphs 0.
- For marks use `q(i,k)=fract((i+1)*.61803398875+(k+1)*.41421356237)`, with zero-based mark index and `k=faceID+19*instanceID`. UV `(.06+.88*q(i,k),.06+.88*q(i,k+7))`; use `k+11` size and `k+13` angle within ranges. Face order +Z,+X,−Z,−X,+Y,−Y, then inside. Clip at gaps. Time=frame/30, ease=smoothstep. Scale existing visible asset bounds to listed envelopes.

## 3. The Pharaoh

- **Plato rig** · Body .68×.93×.60, base y=.14, feet y=0. Sections [.29,.79,1,.83,.09] at height fractions [0,.18,.48,.76,1], x offsets [0,−.021,.013,−.014,0]. Add 17 cheek freckles Ø.002–.006, alpha .42, UV u=.22–.78, v=.40–.59. `size=.86, eyeU=.20, eyeV=.64, browV=.73`. eyeU is full spacing, V from body base. Eye centres at x=±.068,y=.735 on +Z skin. Whites .097×.055, iris Ø.033, pupil Ø.016. Upper lids cover 42%, slope −8°/+3° screen left/right, kohl .0045 m above/.0018 below. Right brow .023 m higher and +11° from left. Mouth centre (0,.624,.292), width .067, right corner +.004 m, line .003 m; talk gap .011–.026.
- **Linen** · 14 bands, .004 thick. 9 torso bands at y=.19+.054i, width .074+.004(i mod 3), front slopes [−12,18,−9,24,−16,10,−20,14,−8]° toward +X. 3 neck bands y=.520/.545/.575, width .034, angles −5°/7°/−4°. 2 shoulder cross-bands (±.29,.57,.19)→(∓.16,.28,.29), width .085. 6 coils per arm and four per ankle, widths .036/.031, rise .027/.023. 10 fibre strokes per strip (.013–.060 m, .0009 wide, alpha .38). 5 free ends at left shoulder, right shoulder, rear left hip, right hip, left shin, lengths [.13,.09,.12,.08,.06], widths [.031,.028,.037,.024,.023]. Each splits into 5 tips .010–.024 m long. 7 edge nicks .007–.018×.003–.007 and 12 dust stains Ø.014–.041, alpha .28. Hands .100×.076×.052 with three Ø.026×.043 fingers each, two .009 m wraps per finger. Feet .117×.067×.164 with .010 m wrapped sole.
- **Nemes** · Crown y=.77–1.095, width .705, z from −.307 to +.277. Front lappets at z=.236 fall to y=.365 and span |x|=.215–.405 at hem. Rear tail width .26 ends y=.44. 10 alternating bands, lapis first, five .049 m lapis and five .037 m gold widths along cloth. Separate .047 m gold band at y=.888. Seams .002 m, inset .005, two .012 m deep folds per lappet. Cobra centred (0,.923,.325), height .140, hood width .091, depth .029, 5 grooves .0018 wide, 2 carnelian eyes Ø.005.
- **Beard and collar** · Chin seam y=.559. Plait root (0,.558,.274), tip (0,.465,.269), width .041, depth .023, 3 strands, 5 crossings .0015 wide, gold tie .009. Preserve ≥.050 m lip clearance in silhouette during speech and ≥.018 m to collar. Collar ellipse ±.285 x, z=[−.199,.304]. Front row centres y=.430/.404/.378/.352 plus .060(x/.285)². Each row has 26 beads .015×.018×.009, gaps .002. Cycles gold/lapis/turquoise/lapis, carnelian/gold/turquoise, turquoise/lapis/carnelian/gold, gold/gold/carnelian. Edge binding .009 m.
- **Acting** · Two .29 m steps toward −X at 5.40–6.55, knee max 26°, bob .032 m. Pupils slide screen right .016 m at 14.94–15.18, hold to 16.30, lids cover 47%. At 42.13–42.42 head yaw to lens −10°→0°, pupils lock on lens. At 61.75–62.02 right glove to (0,.637,.343) rig-local, head pitch 11° down, recoil .025 m at 62.04, hand down by 62.85. Arms spread 63.72–64.40, abduction 78°, elbows 14°, palms to lens, fingers fan 11°. Smile .105 m and 70% lid coverage at 64.50.
- **Dust** · At 5.52 and 6.14 distribute 12 grains per end over .23 s. Ø.003–.009, alpha .39→0, spread .11 and fall .46 over .64 s. Cough at 62.04 yields 7 lobes from the glove, Ø.042→.159, drift .32 m screen right and .09 up, alpha .31 at 62.14→0 at 62.83, 21 wake grains Ø.003–.010.

## 4. The Serapeum set

- **Vault** · 12 paired bays z=−4.4i, i=0…11. Aisle x=±.825, y=0. Spring y=1.82, roof `y=1.82+.93*sqrt(1−(x/.825)^2)`, 18 segments, .28 shell. Floor .18 substrate, .028 sand, tread grooves at x=±.31, width .10 and depth .012. Cap z=−53.4. C foyer z=2.80–7.15 widens to ±1.95 over .70 m. I joins portal at z=0, flares to 1.650 over 1.20 m, adds a return at (x=.824,z=−6.22) with .020 nose bevel.
- **Chambers** · Each opening 2.75 along Z, spring/crown y=1.82/2.38 over 12 arch segments. Recess 2.22, back x=±3.045, floor y=−.18, tread .21, bevel .016. C right bay 0 jamb z=1.91. Box roots (±1.55,−.18,−4.4i), yaw −90° right/+90° left. Black in gallery. Readable pairs 02/14/21 = 8/7/8, from bay 0/1/0. Fade pools to .08× over the next two pitches. All 24 cavities empty in 21.
- **Marks** · Per bay, 23 cuts per aisle wall, 28 on vault, 13 per chamber face, lengths .040–.210, widths .002–.010, depths .002–.009, 18–78°, alpha .42. 8 chips per arch Ø.045–.13 by .013 deep, seven floor scuffs .04–.21×.016–.06 alpha .32, nine stains Ø.08–.26 alpha .22. Joint lips at bay centre offsets z=−.91/+1.63, width .004–.016, drift 7–15°. Crown crack follows (x,z) [(-.11,2.75),(.06,.38),(-.03,-2.38),(.11,-4.8),(-.05,-8.1),(.08,-12.4),(-.02,-15.7),(.11,-17.6),(-.07,-21.9),(.09,-29.4),(-.09,-39),(.05,-49)]. Subdivide at .28 m, x jitter ±.023 from q, width .012–.038, depth .018, .17/.23 m forks every fourth subdivision. Bay 4 branch reaches (1.46,2.35,−17.60) on its chamber roof.
- **Lighting** · Niches at x=±.825, z=−4.4i+1.60, base y=1.38, .30×.39 opening, depth .17, arch rise .10. C right bay 0 uses z=2.04. `oillamp` at x=±.91,y=1.40 facing aisle, envelope .20×.24×.17. Amber 110 lm, source radius .095, reach 2.50, flicker multiplier `1+.035*sin(2π*.67*t)+.018*sin(2π*1.3*t+.7*i)`. Blue-black fill .18× key. `headlamp` 1.00× on Spud’s brow, cone range 7, half angles 11°/17°, waist alpha .10. Per pool 24 motes and per headlamp 28, Ø.002–.007, speeds .028–.067 m/s, peak alpha .33, wrap at alpha 0.
- **Exit** · x=−1.24,z=7.15, arch width 1.28, spring y=1.70, rise .56. 12 risers .146 and treads .260 ascend +Z to y=1.752,z=10.27. Each tread 4 chips .024–.063 and 6 scuffs .041–.14. Day from (−2.5,5.8,12) toward (−.55,.25,5.4), .65 source, 1.25× exterior key, falls to .08× at z=2.8. Palms at x=−3.0/.8,z=15,y=1.752, height 3.60.

## 5. Granite boxes

- **Construction** · Body 2.200×1.480×1.265, bevel .018 and rim ease .008. Walls .165, base .220. Real cavity 1.870×1.260×.935, y=.220–1.480. Separate lid, same plan, .180 vertical sides and .155 sloped shoulders to 1.980×1.045 crown. Closed lid base y=1.480 and seam .004.
- **Material** · Roughness outer .18, bevel .12, inner .095, dust .73, metalness 0. Each outside face gets 160 mineral marks Ø.002–.014 alpha .33–.78 and eight wipe strokes .08–.27×.0015–.003 alpha .16. Each inside wall has 60 inclusions Ø.0015–.006 alpha .23, floor 17 sediment marks Ø.014–.085 alpha .39. 05 uses real clipped planar reflection on inner +X end wall (resolution 1024², mix .62, Fresnel .18→.68), Spud eye C(1.11,1.12,.33), include lamp. Red variant uses §1 red palette and outer roughness .21.
- **Contact** · `lidSlide` 0/.324111/1 maps to local Z shift 0/−.205/−.6325 m (closed/ajar/half aside). Ajar exposes .040 m of cavity. 21 uses .35+.30q(i,k), k=0 right or 1 left. In 05 use 1. Two footholds at x=.55,z=box-centre ±.25, tops y=.340, sizes .25×.340×.32 above aisle. Left hand braces box local (−.16,1.480,.6325); right fingertip follows (−.18,1.405,.465)→(.34,1.405,.465) in .85 s. In 20 use pads at lid local (±.17,.105,.6325), body pitch 18°, hands follow the lid y fixed.
- **Unfinished** · C root (.55,0,5.64), yaw 18°, roll −2° on 2 limestone shims .09. Body 2.29×1.51×1.33, lid 2.31×.34×1.36 offset (−.045,1.51,.033) and yaw −3°. Ridge ±.031, chips .033–.095, cavity .52 deep, .21 stepped wall, roughness .89, red palette. Each main face has 36 chisel marks .048–.194×.005–.016, depth .004–.018, 28–72°, alpha .58. Lid: 27 gouges, 8 facets Ø.07–.20, bevel .037–.084. 12 rubble pieces Ø.04–.16, height .025–.080, radii .65–1.13, angle 30°i+7°. Rubble x≥−1.02.

## 6. Past places

### Memphis · 04

- Court 15×.18×12, top y=0, 9×7 slabs, .007 lime joints, 5 cracks/slab .04–.28, alpha .28. Rear wall (0,0,−4.50), 15×4.30×.48. Columns at x=−5.55+2.05i, i=0…3, z=−3.65/−1.55. Plinth Ø.80×.22, taper shaft Ø.55→.43 over 2.83, 12 flutes, .016 deep. Capital Ø.86×.80, 12 blue/green lotus petals with .018 gold rims. Shaft registers at y=.48/.91/1.40/2.24/2.84, widths .06/.12/.32/.24/.10, 8 relief figures per figure band at .004 depth. Wall panels per 2.15 m carry three registers, y=.55/1.29/2.26 and heights .52/.81/.45, 5 profiles in centre and 9 incision groups each above/below, .006 cut depth and .66 pigment alpha. Six streaks per column .07–.29, 9 chips/panel Ø.017–.072. Cornice 8.20×.34×2.95 at y=3.85, 4 bands. Palms (x,z,height) [(3.1,−3.1,4.6),(5.2,−2.9,3.8),(6.4,−4,4.1)]. Palms use 12 trunk sections, .012 scar grooves, taper Ø.18→.09 scaled by height/4.0, 11 fronds .30×height with 36° droop, 18 paired blades/frond .07–.22 long. Sun azimuth +40° from +Z, elevation 51°, fill .43.
- Bier at origin, deck 2.12×.092×.92, top y=.53. Four gilt legs .105×.438×.105 at x=±.83,z=±.33. Two X-aligned poles Ø.058×2.48 at z=±.34. +Z fascia Ø.078 disc with 2 wings .56×.14, each 13 feathers .004 deep on lapis, 12 wear spots per long edge Ø.012–.032. Bull on left flank, head toward −X, nose to rump 1.84 m. Ribcage/shoulder/haunch sections .58/.66/.55; centres (.07,.83,−.025)/(−.35,.98,−.04)/(.58,.80,−.05). Poll (−.66,.79,.06), muzzle (−.91,.61,.20), curved neck Ø.37→.27. Four legs each with .23/.24 m segments and split hooves .097×.108×.087. Near joints at x=−.43/.60,z=.19/.16,y=.78, fold 94°/112° toward belly; far z offset −.16, fold 118°/123°. Tail Ø.032 taper over .44 with tuft .078. Horns .27 m curved length, Ø.081→.012, 43° out and up, 6 growth rings each. Ears .14×.079, closed eyes .004 line, two nostrils .023. Forehead diamond .117×.106 between eyes. 42 fur strokes .013–.062, alpha .29. Static. Drape centred x=.60, .83×.89, eight folds to .041 depth, hangs .37 over +Z. [Egyptian Ministry, Serapeum](https://egymonuments.gov.eg/monuments/serapeum)
- Workers x/z [(-1.50,.32),(-.98,-.83),(-.35,-.96),(.48,-.94),(.98,-.80),(1.35,.27)], face bier. Hair mesh 0, eight scalp flecks Ø.003. Robe .66 long, hem .58, 12 pleats .023 deep, sleeve .23×.17 with 4 folds. First/last kneel .23 below eye rest. Last wears leopard panel .54×.45 across left shoulder to right hip, 27 rosettes Ø.019–.066 and 18 fringe strands .021.

### Quarry · 08

- `aswanquarry` Q origin scale 1.00, `roughgranite` at origin envelope 2.27×1.85×1.35, `granitecutter` at origin envelope 3.00×2.78×1.94. Cut on +Z at z=.635, vertical x=−.46 then horizontal x=−1.10→1.10 at y=.05. Reveal finished block from §5. Crew feet (−1.55,0,.77)/(−1.03,0,1.08), foreman (−1.85,0,.09), face machine. Workers at x=1.23/1.78/2.31, z=.90/.93/.97, face cut, hold .19×.21×.15 pounders with 15 pecks Ø.008–.019 each.

### Nile · 09

- Barge base (0,−.42,0), X length 8.60, beam 2.84, mid deck y=.64 in N, tips y=1.21 at |x|=4.30. Loft 11 stations at x=−4+.8i with half-beam multipliers [.24,.52,.75,.91,.99,1,.99,.91,.75,.52,.24]. Bottom width .54× top. Nine strakes/side with .028 seams, 8 deck planks with 5 grain strokes each .08–.46 long, 18 Ø.015 dowels. Rail .36 high, 18 posts .057×.36×.062. Bow −X, eye at x=−3.58,z=1.01, .28×.13 in lapis and gilt.
- Box (.32,.66,0), yaw 0°, lid closed. Mat on y=2.475 with 22 strips along X, length 2.33, width .061, pitch .059 across Z, ends droop .14. Four Ø.035 ropes at x=−.50/.05/.63/1.18, deck eyes z=±.92, three turns each. Mast x=−1.90,z=−.31, Ø.13, rises y=.64→4.37. Square 2.65×2.65 sail, top y=4.17, yard Ø.068 along X, eight panels with .006 seams and .24 belly toward +Z. 8 oars, 4/side at x=−3/−2.2/2/2.8, 2.10 long, Ø.043 shafts and .39×.16 blades, ±18° cycle. Steering oar x=3.63,z=−1.05, length 2.42, blade .51×.20. 8 rowers and one steersman, seat y=.66.
- `nilewater` origin, plan 180×115, `reedboat` at (−16,0,−20), .75×. Banks start z=−29/+34, width 13, length 160, y=.04–1.10. Far 19 palms x=−54+6i,z=−30−1.6q(i,2), near 12 at x=−44+8i,z=35+2q(i,2), height 3.2+1.5q(i,3). Sun azimuth 11° toward +X from −Z, elevation 5°, disc 3.2°, key .85, fill .36. Reflection track width 3.20, 19 crests per 6 m, length .22–.82, alpha .45. Boat drift +.64 m X, roll ±1°, stroke period 1.36 s.

### Saqqara · 10–12

- Ground 64×.22×58, top y=0. 13 ridges .03–.21 high outside lanes. Cliff x=±15, height 4.2, centre z=−1.70, six rock strata .37–.81 thick. Portal at z=0, clear width/height **1.405/2.080**, frame 2.19×2.62×.31, five jamb courses and .32 lintel, 4 chips .03–.11 and 18 chisel cuts per stone. Yaw +90° clears .070 per box side, .0175 per sledge side, .075 overhead. Sun azimuth −38° from +Z, elev 48°, fill .38.
- Sledge 1.37×.19×2.82, two runners x=±.505, .20×.115×2.82, −Z noses lift .07 over .21. Four crossbeams 1.37×.075×.17 at z=±.92/±.32. Four Ø.034 lashings, 3 turns each. Tow eyes (±.48,.11,−1.32), two Ø.034 ropes sag .27 in 12. Sledge z=16.20 in 10, travels −1.83 in 11, cuts to z=1.10 in 12. Shot 10 pushers, x/z offsets [(-.68,.48),(-.24,.99),(.23,.99),(.67,.48)], shoulder lift .030 in .8 s, load movement 0. Shot 11 uses 2 groups of 20 from `haulteam`, fill with workers if needed, feet x=±.57,z=12.90−.55i−travel, 23° lean toward −Z. Separate pourer at (.97,0,14.44), jar .38 high, Ø.31 belly, neck Ø.105, lip Ø.135, two .095 high handles, 6 arcs .004 wide. Tip 68° toward (.39,0,14.39).
- Djoser 121×109×60 m at .11. Tiers X×Z×H [13.31×11.99×1.21,11.52×10.32×1.18,9.73×8.66×1.13,7.95×6.99×1.10,6.16×5.33×1.03,4.38×3.67×.95]. Stack centred, batters 6°, bevel .042, seven course lines .015 per tier, ±8% tone, 11 chips per face .04–.19. Place (−48,2.60,−40), yaw 14°, rise 2.60 over 16 m, six ledges visible. `camel` (−11,0,−18), .60×. [Egyptian Ministry, Djoser](https://egymonuments.gov.eg/en/monuments/the-step-pyramid-complex-of-djoser), [Lehner, The Complete Pyramids](https://peachv.org/images/MuslimGeo/EgyptTheCompletePyramids-Lehner-B.pdf)

## 7. Effects

- **07** · Turquoise spill at C(1.82,1.71,0), Ø.56, alpha .13→0 at 16.88–17.46. One knob Ø.041 on .063 stem clears the lid; lower .12 at 16.91–17.23. Hide the second antenna and body behind stone.
- **17** · Dust shaft from C(1.46,2.35,−17.60) to (1.54,1.635,−17.60), radii .039→.17, radial alpha .17(1−r/R)², 18 grains Ø.003–.009 drifting .045 m/s. Lid ellipse .31×.22, alpha .24. Ease both off 44.65–46.38. Depth-test against rock and lid.
- **13–15** · 8 wood levers 1.22 long, Ø.065→.047, six grain lines each. Fulcrums .23×.14×.23, .23 behind tip, hands .21 apart. Four workers per end in staggered rows of two; foot x=±.42, distances .31/.86 from load end; rods contact underside of sledge. Two attempts pivot 11°→−9°. In 15 box root I(.010,.211,−5.2465), yaw 80°, pitch 2°. Plan width 1.628, corner x=.824 at the return. At 39.32 lever 2 breaks .49 from tip, halves separate .31, tumble 43°/−63° and settle 40.06. 7 fibres .021–.092 on each break face. Workers fall .32–.64 away, planted palms y=.05, hips y=.18. Dust at return (.824,.21,−6.22) and break from 39.34, 11 lobes Ø.16→.51, rise .48, spread .44, alpha .34→0 at 40.91. 37 grains Ø.003–.020 and six chips .025–.062 settle by 40.40.
- **11** · Pour 27.36–28.68, four Ø.007–.014 streams and 11 Ø.006 drops, .26 down/.21 forward, alpha .62. Two wet patches centred x=±.34,z=13.84 grow to .61×2.02, 21 edge points with .023 scallops and .047 feather. Dry→wet in .44 s, roughness .88→.67, specular .14. Sledge eases 27.82–29.72, retain dark runner tracks. [Fall et al., slide tests](https://pure.uva.nl/ws/files/2365399/160672_Sliding_Friction_on_Wet_and_Dry_Sand.pdf)

## 8. Shot ledger and builder tasks

Camera `eye→aim`, vertical FOV **wide/tall** in degrees. P = Pharaoh. Cut at start. Feet y=0 by default. Face partner/action. Dialogue cues in seconds.

| Shot · start · set | Eye → aim · FOV | Blocking and cue |
|---|---|---|
| 01 · 0 · C | (−.61,1.10,.99)→(.69,.92,0) · 52/74 | Spud x/z .20/.37, beam to (.918,.94,−.17) at .70. Spud .85 “What needs a box that big?” |
| 02 · 3 · C | (0,1.31,2.62)→(0,1.10,−3.2) · 44/57 | Spud x/z 0/.93 faces −Z, 8 bays/side. |
| 03 · 5 · C | (−.32,1.16,3)→(.03,.74,1.45) · 54/78 | Spud x/z −.48/1.90. P steps (1.13,−.18,1.50)→(.55,0,1.50). P 5.80 “A sacred Apis bull. They buried them here.” |
| 04 · 8 · M | (−.80,1.27,3.85)→(−.05,.79,0) · 37/69 | Forehead diamond and gilt bier. P 8.60 “Apis was worshipped in Memphis. The bulls were mummified.” |
| 05 · 12 · C | (1.20,1.67,−.73)→(1.19,1.40,.43) · 49/65 | Right bay 0, Spud (.55,.34,.25), yaw 90°, trace at 12.65. Spud 12.32 “How did you get it this smooth?” |
| 06 · 14.5 · C | (−.50,1.01,2.34)→(.40,.83,1.08) · 30/43 | P x/z .40/1.08. P 14.60 “We had… good tools.” Pause .35 s. |
| 07 · 16 · C | (−.52,1.14,2.52)→(.40,.95,1.02) · 52/80 | P holds. Bay 0 right, knob at x/z 1.82/.11, duck and spill §7. |
| 08 · 18 · Q | (−.28,1.75,4.42)→(0,1.16,.08) · 43/85 | Cutter vertical 18.25→19.26, horizontal 19.26→20.23. P 18.40 “Granite was quarried at Aswan.” |
| 09 · 20.5 · N | (.20,2.16,10.9)→(.21,1.67,0) · 31/72 | Cross sun track, oars cycle. P 21.00 “The Nile was a transport route.” |
| 10 · 24 · S | (3.45,1.20,22.40)→(0,1.02,16.20) · 43/66 | Four pushers, Djoser left, mouth right. Spud 24.55 “How do you move sixty tonnes?” |
| 11 · 27 · S | (4.63,4.48,19.43)→(0,.84,14.39) · 47/65 | 40 on ropes and pourer. P 27.48 “A little water can help a sledge slide.” |
| 12 · 30 · S | (.06,1.12,5.20)→(0,1.03,.32) · 36/54 | Load z=1.10, ropes sag. Four workers at x=±1.03/±1.62,z=.72/1.44 respectively. Spud 30.42 “And through that?” |
| 13 · 32.5 · I | (−.66,.81,.46)→(.10,.70,−1.96) · 50/74 | Load z=−1.65→−2.60, eight lever workers, press at 33.00 and 34.50. P 32.92 “A lever multiplies force.” |
| 14 · 36 · I | (0,1.78,.39)→(0,1.12,−6.2) · 45/59 | Load z=−3.25, seven readable bays/side. Spud 36.35 “It’s moved three metres.” |
| 15 · 39 · I | (−.31,.83,−2.86)→(.15,.82,−5.21) · 48/71 | Jam, break, fall, dust §7. Hold 41–42. |
| 16 · 42 · C | (−.40,1.02,−11.68)→(.16,.84,−13.89) · 26/36 | P x/z .16/−13.89, stare at lens through 44. |
| 17 · 44 · C | (−.76,1.23,−13.55)→(.48,1.42,−17.2) · 43/64 | Spud x/z −.28/−14.83 yaw 180°→146° to right bay 4; shaft fades. |
| 18 · 46.5 · C | (−.16,1,−15.04)→(.05,.70,−18.38) · 40/61 | Crew x/z (−.30,−19.3),(.05,−18.64),(.29,−17.77), tiptoe −.62 z. Last turns 55° to lens, waves twice ±19° at 47.34–48.28. |
| 19 · 48.5 · C | (−.10,1.10,−14.81)→(0,.70,−16.50) · 47/76 | Spud x/z −.34/−16.50, P .34/−16.50. Yaw +16°/−13°, side-eye ±.014. Spud 49.00 “So what’s left?” P 50.25 “The boxes.” |
| 20 · 52 · C | (.99,2.07,−16.89)→(1.105,1.29,−17.60) · 47/67 | Spud (.55,.34,−17.35), right bay 4, lidSlide 0→.324111 at 52.55–53.65. Spud 54.00 “Empty.” |
| 21 · 55 · C | (0,1.35,2.68)→(0,1.21,−4.4) · 46/60 | Backs at x=±.33,z=.82, eight readable empty bays/side. |
| 22 · 58.5 · C | (−.12,1.12,−14.80)→(.03,1.41,−17.1) · 55/71 | Same pair as 19. Spud tilts lamp 29° up to the crack at 59.22. 59.50 “What was that light?” |
| 23 · 61.5 · C | (−.26,1.05,−15.13)→(.34,.80,−16.50) · 37/54 | Cough per §3, eyes close at 62.04. |
| 24 · 63.5 · C | (−.06,1.29,1.08)→(−.13,1.18,5.75) · 42/70 | P x/z .20/4.18 faces lens, spreads arms. P 64.36 “And here’s an unfinished one.” Spud x=−1.24, z=5.20→7.67, climbs two treads. Cut 66.00. |

Animated inputs clamp 0–1, default 0. Specs inherit earlier dimensions.

| Task and files | Kinds, defaults and animation | Done when |
|---|---|---|
| 1 · `costumes-pharaoh.js`, `characters/ancient-aliens/pharaoh.json` | `pharaoh, memphisPriest`. `height=.93, stripePairs=5, leopard=false`; priest height .82. `step, glance, lensLook, cough, spread, speech` drive §3. | 3-finger gloves follow rig, 14 body bands and 4 bead rows read, beard clears lips/collar, 6 priests fit. |
| 2 · `props-eg-serapeum.js` | `gallery, chamber, exitStairs, graniteBox`. `pairs=12, pitch=4.4, clearWidth=1.65, material=black, unfinished=false, reflection=false`. `lidSlide, lampPhase`; travel §5 and phase 0–2π. | 24 boxes, 12 treads, clear lid travel, 05 reflects Spud, 24 stair lane clear. |
| 3 · `props-eg-past.js` | `memphisCourt, palm, apisBier, nileBarge, saqqaraMouth, sledge, waterJar, djoser, pounder`. `bullLength=1.84, palmHeight=4, oars=8, clearWidth=1.405, tiers=6`. `row, drift, haul, pour` map to one oar cycle, .64 m, 1.83 m and 68°. | Diamond, 4 folded legs, secured freight, §6 clearances, 6 ledges. |
| 4 · `episode-eg04.js`, `effects-eg04.js` | `eg04, dust, turquoiseShaft, lever, wetSand`. `fps=30, duration=66, grainAlpha=.33, leverLength=1.22, wetLength=2.02`. `beam, slip, snap, wet, dustAge` drive §7; beam defaults to 1 when spawned, snap 0/1 joins/splits parts. | 24 cuts, 40 pullers plus pourer, 1 ducking knob, 3 departing aliens. Both crops keep focal beats. Seek and replay match. |
