import * as THREE from 'three';
import {
  PAINT_SWATCHES,
  VEHICLE_SPECS,
  VehicleCustomization,
  WheelStyleId,
  TireStyleId,
} from '../types/game';

export interface BuiltVehicleMeshes {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  wheels: THREE.Group[]; // [FL, FR, RL, RR]
  steeringKnuckles: THREE.Group[]; // [FL, FR]
  suspensionStruts: THREE.Mesh[]; // [FL, FR, RL, RR]
  headlightBeams: THREE.SpotLight[];
  headlightBulbs: THREE.Mesh[];
  winchFairleadPos: THREE.Vector3;
  hitchWorldOffset: THREE.Vector3;
  antennaTip?: THREE.Object3D;
}

/**
 * Helper to create a rounded box geometry with smooth beveled edges
 * so vehicles have charming vintage curves instead of sharp boxy corners.
 */
export function createRoundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  smoothness: number = 4
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const r = Math.min(radius, width / 2 - eps, height / 2 - eps);
  const w = width - r * 2;
  const h = height - r * 2;

  shape.absarc(w / 2, h / 2, r, 0, Math.PI / 2, false);
  shape.absarc(-w / 2, h / 2, r, Math.PI / 2, Math.PI, false);
  shape.absarc(-w / 2, -h / 2, r, Math.PI, Math.PI * 1.5, false);
  shape.absarc(w / 2, -h / 2, r, Math.PI * 1.5, Math.PI * 2, false);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: Math.max(0.01, depth - r * 2),
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: r,
    bevelThickness: r,
    curveSegments: smoothness,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  return geo;
}

/**
 * Builds an off-road wheel with visible tread blocks, sidewall profile, and vintage rim.
 */
export function buildOffRoadWheel(
  wheelStyle: WheelStyleId,
  tireStyle: TireStyleId,
  accentHex: string,
  radius: number = 0.44,
  width: number = 0.28
): THREE.Group {
  const wheelGroup = new THREE.Group();

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1e1d1b,
    roughness: 0.88,
    metalness: 0.05,
  });

  const treadMat = new THREE.MeshStandardMaterial({
    color: 0x151413,
    roughness: 0.92,
    metalness: 0.05,
  });

  // Main rounded tire carcass using a torus + cylinder core
  const coreGeo = new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, width * 0.92, 24);
  coreGeo.rotateZ(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, rubberMat);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  wheelGroup.add(coreMesh);

  // Bulging rounded tire shoulders
  const shoulderGeo = new THREE.TorusGeometry(radius * 0.72, radius * 0.24, 14, 28);
  shoulderGeo.rotateY(Math.PI / 2);
  const leftShoulder = new THREE.Mesh(shoulderGeo, rubberMat);
  leftShoulder.scale.set(1, 1, 0.85);
  leftShoulder.position.x = -width * 0.2;
  wheelGroup.add(leftShoulder);

  const rightShoulder = leftShoulder.clone();
  rightShoulder.position.x = width * 0.2;
  wheelGroup.add(rightShoulder);

  // Visible 3D off-road tread lugs around the circumference
  const lugCount = tireStyle === 'mud_knobby' ? 16 : tireStyle === 'all_terrain' ? 22 : 28;
  const lugHeight = tireStyle === 'mud_knobby' ? 0.048 : tireStyle === 'all_terrain' ? 0.032 : 0.022;
  const lugWidth = tireStyle === 'mud_knobby' ? width * 0.96 : width * 0.88;
  const lugDepth = tireStyle === 'mud_knobby' ? 0.075 : 0.05;

  const lugGeo = new THREE.BoxGeometry(lugWidth, lugHeight, lugDepth);
  for (let i = 0; i < lugCount; i++) {
    const angle = (i / lugCount) * Math.PI * 2;
    const lug = new THREE.Mesh(lugGeo, treadMat);
    const rPos = radius - lugHeight * 0.35;
    lug.position.set(
      (i % 2 === 0 ? 1 : -1) * (tireStyle === 'mud_knobby' ? 0.018 : 0.008),
      Math.cos(angle) * rPos,
      Math.sin(angle) * rPos
    );
    lug.rotation.x = -angle;
    lug.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.12;
    wheelGroup.add(lug);
  }

  // Rim styling
  const rimColor =
    wheelStyle === 'steel_classic'
      ? 0xe2dac7
      : wheelStyle === 'spoked_rally'
      ? 0xc8c4ba
      : new THREE.Color(accentHex).getHex();

  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    roughness: wheelStyle === 'spoked_rally' ? 0.35 : 0.55,
    metalness: wheelStyle === 'spoked_rally' ? 0.65 : 0.35,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x2b2a27,
    roughness: 0.5,
    metalness: 0.6,
  });

  const rimRadius = radius * 0.56;
  const rimDishGeo = new THREE.CylinderGeometry(rimRadius, rimRadius * 0.9, width * 0.86, 20);
  rimDishGeo.rotateZ(Math.PI / 2);
  const rimDish = new THREE.Mesh(rimDishGeo, rimMat);
  wheelGroup.add(rimDish);

  // Center hub cap & lug nuts on both outer faces
  [-1, 1].forEach((side) => {
    const hubGeo = new THREE.CylinderGeometry(rimRadius * 0.38, rimRadius * 0.44, 0.06, 16);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, wheelStyle === 'steel_classic' ? rimMat : darkMetalMat);
    hub.position.x = side * (width * 0.43);
    wheelGroup.add(hub);

    // Manual locking hub dial (classic 4x4 touch)
    const dialGeo = new THREE.CylinderGeometry(rimRadius * 0.18, rimRadius * 0.2, 0.08, 12);
    dialGeo.rotateZ(Math.PI / 2);
    const dial = new THREE.Mesh(
      dialGeo,
      new THREE.MeshStandardMaterial({ color: 0xb84a39, roughness: 0.4, metalness: 0.5 })
    );
    dial.position.x = side * (width * 0.45);
    wheelGroup.add(dial);

    if (wheelStyle === 'spoked_rally') {
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        const spokeGeo = new THREE.BoxGeometry(0.04, rimRadius * 1.75, 0.055);
        const spoke = new THREE.Mesh(spokeGeo, rimMat);
        spoke.position.x = side * (width * 0.41);
        spoke.rotation.x = a;
        wheelGroup.add(spoke);
      }
    } else if (wheelStyle === 'heavy_beadlock') {
      const ringGeo = new THREE.TorusGeometry(rimRadius * 0.92, 0.028, 10, 20);
      ringGeo.rotateY(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, darkMetalMat);
      ring.position.x = side * (width * 0.43);
      wheelGroup.add(ring);
    }
  });

  return wheelGroup;
}

/**
 * Builds the complete retro 4x4 vehicle with rounded vintage geometry,
 * curved fenders, round headlights, vertical slotted grille, suspension, winch, and accessories.
 */
export function buildRetroVehicle(config: VehicleCustomization): BuiltVehicleMeshes {
  const root = new THREE.Group();
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const swatch = PAINT_SWATCHES.find((s) => s.id === config.paintColor) || PAINT_SWATCHES[0];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: swatch.hex,
    roughness: swatch.roughness,
    metalness: 0.14,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: swatch.secondaryHex,
    roughness: 0.62,
    metalness: 0.08,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8d4cb,
    roughness: 0.28,
    metalness: 0.78,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x262523,
    roughness: 0.65,
    metalness: 0.45,
  });

  const chassisFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1c1b19,
    roughness: 0.75,
    metalness: 0.35,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xa8c3c8,
    transparent: true,
    opacity: 0.42,
    roughness: 0.12,
    metalness: 0.1,
    transmission: 0.4,
  });

  const seatLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c3c28,
    roughness: 0.72,
    metalness: 0.05,
  });

  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xc9be9f,
    roughness: 0.88,
    metalness: 0.02,
  });

  const spec = VEHICLE_SPECS.find((v) => v.id === config.vehicleId) || VEHICLE_SPECS[0];
  const isLong = ['expedition_wagon', 'camping_rig', 'wagoneer_1968', 'k5_blazer', 'defender_110', 'peugeot_504', 'landcruiser_80', 'type2_van'].includes(config.vehicleId);
  const isOpenTop = config.vehicleId === 'open_top' || config.vehicleId === 'bronco_1966' || config.vehicleId === 'scout_1972' || config.vehicleId === 'landcruiser_40' || config.vehicleId === 'k5_blazer';
  const isCamper = config.vehicleId === 'camping_rig' || config.vehicleId === 'type2_van';
  const wb = spec.wheelbase;
  const halfWb = wb / 2;
  const track = spec.trackWidth;
  const halfTrack = track / 2;

  // 1. Ladder Frame Chassis & Solid Axles + Differentials (Visible underneath!)
  const railLength = wb + 1.05;
  const railGeo = createRoundedBox(0.11, 0.14, railLength, 0.03, 2);
  [-0.42, 0.42].forEach((xOff) => {
    const rail = new THREE.Mesh(railGeo, chassisFrameMat);
    rail.position.set(xOff, 0.56, 0);
    rail.castShadow = true;
    chassisGroup.add(rail);
  });

  // Solid front & rear axles with pumpkin differentials
  [halfWb, -halfWb].forEach((zAxle, idx) => {
    const axleGeo = new THREE.CylinderGeometry(0.055, 0.055, track * 0.92, 12);
    axleGeo.rotateZ(Math.PI / 2);
    const axle = new THREE.Mesh(axleGeo, chassisFrameMat);
    axle.position.set(0, 0.44, zAxle);
    chassisGroup.add(axle);

    const diffGeo = new THREE.SphereGeometry(0.13, 14, 12);
    const diff = new THREE.Mesh(diffGeo, chassisFrameMat);
    diff.position.set(idx === 0 ? 0.18 : -0.15, 0.44, zAxle);
    chassisGroup.add(diff);
  });

  // 2. Lower Tub / Body Sill with rounded vintage curves
  const bodyLength = Math.max(2.75, wb + 0.82);
  const bodyWidth = config.vehicleId === 'datsun_240z' || config.vehicleId === 'escort_rs' || config.vehicleId === 'citroen_2cv' || config.vehicleId === 'peugeot_504' ? 1.34 : track * 0.96;
  const lowerTubGeo = createRoundedBox(bodyWidth, 0.54, bodyLength * 0.66, 0.14, 4);
  const lowerTub = new THREE.Mesh(lowerTubGeo, bodyMat);
  lowerTub.position.set(0, 0.92, -0.22);
  lowerTub.castShadow = true;
  lowerTub.receiveShadow = true;
  chassisGroup.add(lowerTub);

  // Two-tone side trim strip for Expedition Wagon & Camping Rig
  if (isLong) {
    const trimGeo = createRoundedBox(bodyWidth + 0.03, 0.16, bodyLength * 0.64, 0.05, 3);
    const trim = new THREE.Mesh(trimGeo, secondaryMat);
    trim.position.set(0, 0.96, -0.22);
    chassisGroup.add(trim);
  }

  // 3. Iconic Rounded Vintage Bonnet (Hood) & Cowl
  // Classic tapered, curved top hood (narrower at the nose like an FJ40 / Willys CJ)
  const hoodLength = 1.12;
  const hoodZ = bodyLength * 0.5 - hoodLength * 0.52;
  const hoodMainGeo = createRoundedBox(1.16, 0.48, hoodLength, 0.18, 5);
  const hoodMain = new THREE.Mesh(hoodMainGeo, bodyMat);
  hoodMain.position.set(0, 0.98, hoodZ);
  hoodMain.castShadow = true;
   hoodMain.receiveShadow = true;
  chassisGroup.add(hoodMain);

  // Raised center hood power dome with soft bevel
  const domeGeo = createRoundedBox(0.72, 0.12, hoodLength * 0.82, 0.05, 4);
  const dome = new THREE.Mesh(domeGeo, bodyMat);
  dome.position.set(0, 1.21, hoodZ - 0.04);
  dome.castShadow = true;
  chassisGroup.add(dome);

  // Hood side latches (authentic vintage clasps)
  [-0.59, 0.59].forEach((xSide) => {
    const latchGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.12, 8);
    const latch = new THREE.Mesh(latchGeo, chromeMat);
    latch.position.set(xSide, 1.02, hoodZ + 0.22);
    chassisGroup.add(latch);
  });

  // 4. Recognizable Vintage Front Grille & Circular Headlights
  const noseZ = hoodZ + hoodLength * 0.5 - 0.02;
  const grillePlateGeo = createRoundedBox(1.12, 0.46, 0.08, 0.12, 4);
  const grillePlate = new THREE.Mesh(
    grillePlateGeo,
    config.vehicleId === 'expedition_wagon' ? secondaryMat : bodyMat
  );
  grillePlate.position.set(0, 0.96, noseZ);
  chassisGroup.add(grillePlate);

  // White bezel surround around headlights & vertical grille slots (classic FJ40 / Willys motif)
  const bezelGeo = createRoundedBox(1.04, 0.34, 0.09, 0.14, 4);
  const bezel = new THREE.Mesh(bezelGeo, secondaryMat);
  bezel.position.set(0, 0.97, noseZ + 0.01);
  chassisGroup.add(bezel);

  // 7 Vertical recessed grille slots
  const slotGeo = createRoundedBox(0.042, 0.24, 0.1, 0.015, 2);
  for (let i = -3; i <= 3; i++) {
    const slot = new THREE.Mesh(slotGeo, darkSteelMat);
    slot.position.set(i * 0.075, 0.97, noseZ + 0.015);
    chassisGroup.add(slot);
  }

  // Circular Vintage Headlights with chrome rings & warm glass lenses
  const headlightBulbs: THREE.Mesh[] = [];
  const headlightBeams: THREE.SpotLight[] = [];

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffd27d,
    emissiveIntensity: 1.4,
    roughness: 0.15,
  });

  [-0.38, 0.38].forEach((xLight) => {
    const ringGeo = new THREE.TorusGeometry(0.115, 0.022, 12, 24);
    const ring = new THREE.Mesh(ringGeo, chromeMat);
    ring.position.set(xLight, 0.98, noseZ + 0.05);
    chassisGroup.add(ring);

    const lensGeo = new THREE.SphereGeometry(0.105, 16, 12);
    lensGeo.scale(1, 1, 0.45);
    const lens = new THREE.Mesh(lensGeo, bulbMat);
    lens.position.set(xLight, 0.98, noseZ + 0.045);
    chassisGroup.add(lens);
    headlightBulbs.push(lens);

    // Amber turn signal indicator below each headlight
    const blinkerGeo = new THREE.SphereGeometry(0.042, 12, 10);
    const blinkerMat = new THREE.MeshStandardMaterial({
      color: 0xe87a24,
      emissive: 0xc45100,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });
    const blinker = new THREE.Mesh(blinkerGeo, blinkerMat);
    blinker.position.set(xLight * 1.12, 0.81, noseZ + 0.045);
    chassisGroup.add(blinker);

    // Functional SpotLight beam
    const spot = new THREE.SpotLight(0xffe6b0, 4.5, 38, Math.PI / 5.5, 0.55, 1.4);
    spot.position.set(xLight, 0.98, noseZ + 0.1);
    const target = new THREE.Object3D();
    target.position.set(xLight * 1.2, 0.2, noseZ + 16);
    chassisGroup.add(target);
    spot.target = target;
    chassisGroup.add(spot);
    headlightBeams.push(spot);
  });

  // 5. Rounded Flared Front & Rear Fenders / Wheel Arches
  // Classic sweeping curved front fenders flanking the narrow hood
  [-1, 1].forEach((side) => {
    // Front curved fender arch
    const frontFenderGeo = createRoundedBox(0.34, 0.14, 0.92, 0.06, 4);
    const frontFender = new THREE.Mesh(frontFenderGeo, bodyMat);
    frontFender.position.set(side * 0.68, 0.94, halfWb + 0.04);
    frontFender.rotation.x = 0.08;
    frontFender.castShadow = true;
    chassisGroup.add(frontFender);

    // Front fender angled apron flare
    const frontSlopeGeo = createRoundedBox(0.32, 0.12, 0.42, 0.05, 3);
    const frontSlope = new THREE.Mesh(frontSlopeGeo, bodyMat);
    frontSlope.position.set(side * 0.67, 0.83, halfWb - 0.44);
    frontSlope.rotation.x = -0.52;
    chassisGroup.add(frontSlope);

    // Side running board step
    const stepGeo = createRoundedBox(0.22, 0.05, wb - 0.85, 0.02, 2);
    const step = new THREE.Mesh(stepGeo, darkSteelMat);
    step.position.set(side * 0.76, 0.67, 0);
    chassisGroup.add(step);

    // Rear rounded fender flare
    const rearFlareGeo = createRoundedBox(0.22, 0.42, 0.88, 0.12, 4);
    const rearFlare = new THREE.Mesh(rearFlareGeo, bodyMat);
    rearFlare.position.set(side * 0.72, 0.86, -halfWb);
    rearFlare.castShadow = true;
    chassisGroup.add(rearFlare);
  });

  // 6. Interior Cabin: Vintage Seats, Dashboard & Steering Wheel
  const dashGeo = createRoundedBox(bodyWidth - 0.14, 0.24, 0.28, 0.06, 3);
  const dash = new THREE.Mesh(dashGeo, bodyMat);
  dash.position.set(0, 1.15, hoodZ - hoodLength * 0.5 - 0.05);
  chassisGroup.add(dash);

  // Steering wheel (Left-hand drive)
  const wheelRimGeo = new THREE.TorusGeometry(0.16, 0.018, 10, 20);
  const steeringWheel = new THREE.Mesh(wheelRimGeo, darkSteelMat);
  steeringWheel.position.set(0.34, 1.24, dash.position.z - 0.18);
  steeringWheel.rotation.x = -0.45;
  chassisGroup.add(steeringWheel);

  // Front Bucket Seats with headrests
  [-0.34, 0.34].forEach((xSeat) => {
    const cushionGeo = createRoundedBox(0.44, 0.14, 0.46, 0.05, 3);
    const cushion = new THREE.Mesh(cushionGeo, seatLeatherMat);
    cushion.position.set(xSeat, 0.98, -0.05);
    chassisGroup.add(cushion);

    const backrestGeo = createRoundedBox(0.42, 0.52, 0.12, 0.05, 3);
    const backrest = new THREE.Mesh(backrestGeo, seatLeatherMat);
    backrest.position.set(xSeat, 1.24, -0.24);
    backrest.rotation.x = -0.14;
    chassisGroup.add(backrest);
  });

  // 7. Curved / Upright Thin-Framed Windshield, Wipers & Side Mirrors
  const windshieldZ = dash.position.z + 0.04;
  const wsGroup = new THREE.Group();
  wsGroup.position.set(0, 1.22, windshieldZ);
  wsGroup.rotation.x = -0.22; // Slight vintage rake
  chassisGroup.add(wsGroup);

  const wsFrameGeo = createRoundedBox(bodyWidth - 0.06, 0.56, 0.06, 0.06, 3);
  const wsFrame = new THREE.Mesh(wsFrameGeo, bodyMat);
  wsGroup.add(wsFrame);

  // Twin divided glass panes
  [-0.31, 0.31].forEach((xPane) => {
    const paneGeo = createRoundedBox(0.54, 0.42, 0.07, 0.04, 2);
    const pane = new THREE.Mesh(paneGeo, glassMat);
    pane.position.set(xPane, 0.02, 0);
    wsGroup.add(pane);

    // Windshield Wiper
    const wiperGeo = new THREE.BoxGeometry(0.018, 0.28, 0.02);
    const wiper = new THREE.Mesh(wiperGeo, darkSteelMat);
    wiper.position.set(xPane - 0.05, -0.04, 0.04);
    wiper.rotation.z = -0.28;
    wsGroup.add(wiper);
  });

  // Side Mirrors on chromed arms & Door Handles
  [-1, 1].forEach((side) => {
    const armGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8);
    armGeo.rotateZ(Math.PI / 2);
    const arm = new THREE.Mesh(armGeo, chromeMat);
    arm.position.set(side * (bodyWidth * 0.5 + 0.09), 1.32, windshieldZ - 0.08);
    chassisGroup.add(arm);

    const mirrorHeadGeo = createRoundedBox(0.04, 0.16, 0.11, 0.02, 2);
    const mirrorHead = new THREE.Mesh(mirrorHeadGeo, chromeMat);
    mirrorHead.position.set(side * (bodyWidth * 0.5 + 0.19), 1.35, windshieldZ - 0.08);
    chassisGroup.add(mirrorHead);

    // Vintage exterior door seam & chrome handle
    const handleGeo = createRoundedBox(0.04, 0.035, 0.14, 0.01, 2);
    const handle = new THREE.Mesh(handleGeo, chromeMat);
    handle.position.set(side * (bodyWidth * 0.5 + 0.015), 1.02, -0.15);
    chassisGroup.add(handle);
  });

  // 8. Cabin Roof / Roll Bars / Camper Shell based on Vehicle Silhouette
  const cabinRearZ = -bodyLength * 0.5 + 0.12;
  const cabinSpan = windshieldZ - cabinRearZ;
  const cabinCenterZ = (windshieldZ + cabinRearZ) * 0.5 - 0.06;

  if (isOpenTop) {
    // Vehicle C: Classic Open-Top Off-Roader with tubular roll cage
    const barMat = darkSteelMat;
    const hoopWidth = bodyWidth - 0.18;

    // Main B-pillar hoop
    const bPillarGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.65, 12);
    [-hoopWidth / 2, hoopWidth / 2].forEach((xBar) => {
      const post = new THREE.Mesh(bPillarGeo, barMat);
      post.position.set(xBar, 1.42, -0.35);
      chassisGroup.add(post);

      // Angled rear downbars
      const rearBarGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.92, 12);
      const rearBar = new THREE.Mesh(rearBarGeo, barMat);
      rearBar.position.set(xBar, 1.38, -0.78);
      rearBar.rotation.x = 0.62;
      chassisGroup.add(rearBar);
    });

    const crossBarGeo = new THREE.CylinderGeometry(0.036, 0.036, hoopWidth, 12);
    crossBarGeo.rotateZ(Math.PI / 2);
    const topCross = new THREE.Mesh(crossBarGeo, barMat);
    topCross.position.set(0, 1.73, -0.35);
    chassisGroup.add(topCross);
  } else {
    // Hardtop / Camper Cabin with gently rounded roof cap & side windows
    const cabinWallHeight = isCamper ? 0.62 : 0.52;
    const cabinWallsGeo = createRoundedBox(bodyWidth - 0.06, cabinWallHeight, cabinSpan, 0.12, 4);
    const cabinWalls = new THREE.Mesh(cabinWallsGeo, bodyMat);
    cabinWalls.position.set(0, 1.44, cabinCenterZ);
    cabinWalls.castShadow = true;
    chassisGroup.add(cabinWalls);

    // Side & rear windows
    const sideWinGeo = createRoundedBox(bodyWidth + 0.02, 0.34, cabinSpan * 0.74, 0.06, 3);
    const sideWin = new THREE.Mesh(sideWinGeo, glassMat);
    sideWin.position.set(0, 1.46, cabinCenterZ - 0.04);
    chassisGroup.add(sideWin);

    // B-pillar and C-pillar vertical window dividers
    [-1, 1].forEach((side) => {
      const pillarGeo = createRoundedBox(0.05, 0.42, 0.09, 0.02, 2);
      const bPillar = new THREE.Mesh(pillarGeo, bodyMat);
      bPillar.position.set(side * (bodyWidth * 0.48), 1.45, cabinCenterZ + 0.25);
      chassisGroup.add(bPillar);

      if (isLong) {
        const cPillar = new THREE.Mesh(pillarGeo, bodyMat);
        cPillar.position.set(side * (bodyWidth * 0.48), 1.45, cabinCenterZ - 0.35);
        chassisGroup.add(cPillar);
      }
    });

    // Gently rounded vintage white/cream roof cap
    const roofHeight = isCamper ? 0.24 : 0.15;
    const roofCapGeo = createRoundedBox(bodyWidth - 0.02, roofHeight, cabinSpan + 0.06, 0.07, 4);
    const roofCap = new THREE.Mesh(roofCapGeo, secondaryMat);
    roofCap.position.set(0, isCamper ? 1.82 : 1.74, cabinCenterZ);
    roofCap.castShadow = true;
    chassisGroup.add(roofCap);

    // If Retro Camping Vehicle (Vehicle D), add raised canvas pop-top & side awning
    if (isCamper) {
      const popTopGeo = createRoundedBox(bodyWidth - 0.22, 0.26, cabinSpan * 0.78, 0.06, 3);
      const popTop = new THREE.Mesh(popTopGeo, canvasMat);
      popTop.position.set(0, 1.98, cabinCenterZ - 0.08);
      popTop.castShadow = true;
      chassisGroup.add(popTop);

      const popLidGeo = createRoundedBox(bodyWidth - 0.16, 0.08, cabinSpan * 0.82, 0.04, 3);
      const popLid = new THREE.Mesh(popLidGeo, secondaryMat);
      popLid.position.set(0, 2.11, cabinCenterZ - 0.08);
      chassisGroup.add(popLid);

      // Rolled side canvas awning tube
      const awningGeo = new THREE.CylinderGeometry(0.055, 0.055, cabinSpan * 0.85, 12);
      awningGeo.rotateX(Math.PI / 2);
      const awning = new THREE.Mesh(awningGeo, canvasMat);
      awning.position.set(bodyWidth * 0.5 + 0.04, 1.78, cabinCenterZ);
      chassisGroup.add(awning);
    }
  }

  // 9. Rear Taillights & License Plate
  const rearZ = -bodyLength * 0.5 + 0.06;
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xc92a2a,
    emissive: 0x991b1b,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  [-0.54, 0.54].forEach((xTail) => {
    const tailGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 16);
    tailGeo.rotateX(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, tailLightMat);
    tail.position.set(xTail, 0.84, rearZ);
    chassisGroup.add(tail);
  });

  // 10. Rear-Mounted Spare Tire
  if (config.hasSpareTire) {
    const spareWheel = buildOffRoadWheel(
      config.wheelStyle,
      config.tireStyle,
      swatch.hex,
      0.41,
      0.25
    );
    spareWheel.rotation.y = Math.PI / 2;
    spareWheel.position.set(0.18, 1.05, rearZ - 0.16);
    chassisGroup.add(spareWheel);

    // Jerry can mounted next to the spare wheel
    const jerryMat = new THREE.MeshStandardMaterial({
      color: 0x8f3428,
      roughness: 0.55,
      metalness: 0.25,
    });
    const jerryGeo = createRoundedBox(0.28, 0.42, 0.16, 0.03, 2);
    const jerryCan = new THREE.Mesh(jerryGeo, jerryMat);
    jerryCan.position.set(-0.36, 1.02, rearZ - 0.11);
    jerryCan.castShadow = true;
    chassisGroup.add(jerryCan);
  }

  // 11. Front & Rear Metal Bumpers + Brush Guard
  const frontBumperZ = noseZ + 0.16;
  const rearBumperZ = rearZ - 0.08;

  const frontBumperGeo = createRoundedBox(1.56, 0.13, 0.18, 0.04, 3);
  const frontBumper = new THREE.Mesh(frontBumperGeo, darkSteelMat);
  frontBumper.position.set(0, 0.66, frontBumperZ);
  frontBumper.castShadow = true;
  chassisGroup.add(frontBumper);

  if (config.bumperStyle === 'brush_guard' || config.bumperStyle === 'heavy_expedition') {
    const hoopGeo = new THREE.TorusGeometry(0.28, 0.03, 10, 20, Math.PI);
    const bullBar = new THREE.Mesh(hoopGeo, darkSteelMat);
    bullBar.position.set(0, 0.72, frontBumperZ + 0.04);
    chassisGroup.add(bullBar);
  }

  if (config.bumperStyle === 'heavy_expedition') {
    // Tow shackles (D-rings)
    [-0.45, 0.45].forEach((xShackle) => {
      const shackleGeo = new THREE.TorusGeometry(0.045, 0.015, 8, 14);
      const shackle = new THREE.Mesh(
        shackleGeo,
        new THREE.MeshStandardMaterial({ color: 0xd9482b, roughness: 0.4 })
      );
      shackle.position.set(xShackle, 0.65, frontBumperZ + 0.09);
      chassisGroup.add(shackle);
    });
  }

  const rearBumper = new THREE.Mesh(frontBumperGeo, darkSteelMat);
  rearBumper.position.set(0, 0.66, rearBumperZ);
  rearBumper.castShadow = true;
  chassisGroup.add(rearBumper);

  // Rear Trailer Hitch Receiver Ball
  const hitchBallGeo = new THREE.SphereGeometry(0.055, 12, 12);
  const hitchBall = new THREE.Mesh(hitchBallGeo, chromeMat);
  hitchBall.position.set(0, 0.64, rearBumperZ - 0.12);
  chassisGroup.add(hitchBall);

  // 12. Front Winch Housing, Fairlead, Cable Drum & Red Hook
  const winchFairleadPos = new THREE.Vector3(0, 0.74, frontBumperZ + 0.12);
  if (config.hasWinch) {
    const winchGroup = new THREE.Group();
    winchGroup.position.set(0, 0.75, frontBumperZ + 0.02);
    chassisGroup.add(winchGroup);

    // Metal housing sides
    [-0.18, 0.18].forEach((xSide) => {
      const sideBoxGeo = createRoundedBox(0.07, 0.16, 0.16, 0.02, 2);
      const sideBox = new THREE.Mesh(sideBoxGeo, darkSteelMat);
      sideBox.position.set(xSide, 0, 0);
      winchGroup.add(sideBox);
    });

    // Spool / Cable Drum wrapped in steel wire
    const drumGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.28, 16);
    drumGeo.rotateZ(Math.PI / 2);
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0x7a7872,
      roughness: 0.45,
      metalness: 0.75,
    });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    winchGroup.add(drum);

    // Roller Fairlead frame
    const fairleadGeo = createRoundedBox(0.24, 0.09, 0.04, 0.015, 2);
    const fairlead = new THREE.Mesh(fairleadGeo, chromeMat);
    fairlead.position.set(0, -0.01, 0.09);
    winchGroup.add(fairlead);

    // Bright Red Recovery Winch Hook
    const hookGeo = new THREE.TorusGeometry(0.045, 0.016, 8, 16, Math.PI * 1.4);
    const hookMat = new THREE.MeshStandardMaterial({
      color: 0xe03131,
      roughness: 0.35,
      metalness: 0.4,
    });
    const hook = new THREE.Mesh(hookGeo, hookMat);
    hook.position.set(0, -0.02, 0.13);
    hook.rotation.y = Math.PI / 2;
    winchGroup.add(hook);
  }

  // 13. Auxiliary Fog / Rally Lights
  if (config.hasAuxiliaryLights) {
    [-0.24, 0.24].forEach((xAux) => {
      const auxHousingGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.08, 16);
      auxHousingGeo.rotateX(Math.PI / 2);
      const auxHousing = new THREE.Mesh(auxHousingGeo, chromeMat);
      auxHousing.position.set(xAux, 0.82, frontBumperZ + 0.04);
      chassisGroup.add(auxHousing);

      const auxLensGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.02, 16);
      auxLensGeo.rotateX(Math.PI / 2);
      const auxLens = new THREE.Mesh(
        auxLensGeo,
        new THREE.MeshStandardMaterial({
          color: 0xffd43b,
          emissive: 0xf59f00,
          emissiveIntensity: 1.2,
        })
      );
      auxLens.position.set(xAux, 0.82, frontBumperZ + 0.08);
      chassisGroup.add(auxLens);
      headlightBulbs.push(auxLens);
    });
  }

  // 14. Snorkel & Flexible Whip Antenna
  let antennaTip: THREE.Object3D | undefined;
  if (config.hasSnorkelAndAntenna) {
    // Raised desert/water intake snorkel on right A-pillar
    const snorkelPipeGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.72, 10);
    const snorkel = new THREE.Mesh(snorkelPipeGeo, darkSteelMat);
    snorkel.position.set(-bodyWidth * 0.5 - 0.04, 1.48, windshieldZ - 0.05);
    snorkel.rotation.x = -0.18;
    chassisGroup.add(snorkel);

    const intakeHeadGeo = createRoundedBox(0.11, 0.12, 0.16, 0.03, 2);
    const intakeHead = new THREE.Mesh(intakeHeadGeo, darkSteelMat);
    intakeHead.position.set(-bodyWidth * 0.5 - 0.04, 1.84, windshieldZ - 0.11);
    chassisGroup.add(intakeHead);

    // Tall whip radio antenna on rear quarter with orange pennant flag
    const antGroup = new THREE.Group();
    antGroup.position.set(bodyWidth * 0.5 + 0.02, 1.15, rearZ + 0.25);
    chassisGroup.add(antGroup);

    const whipGeo = new THREE.CylinderGeometry(0.006, 0.015, 1.35, 8);
    whipGeo.translate(0, 0.675, 0);
    const whip = new THREE.Mesh(whipGeo, chromeMat);
    antGroup.add(whip);

    const flagGeo = new THREE.BufferGeometry();
    const flagVerts = new Float32Array([
      0, 1.32, 0,
      0, 1.18, 0,
      0, 1.25, -0.26,
    ]);
    flagGeo.setAttribute('position', new THREE.BufferAttribute(flagVerts, 3));
    flagGeo.computeVertexNormals();
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xe8590c,
      side: THREE.DoubleSide,
      roughness: 0.6,
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    antGroup.add(flag);
    antennaTip = antGroup;
  }

  // 15. Roof Rack & Expedition Equipment (Camping gear, luggage, jerry cans, storage boxes)
  const roofBaseY = isCamper ? 2.16 : isOpenTop ? 1.76 : 1.83;
  if (config.roofAccessory !== 'none') {
    const rackWidth = bodyWidth - 0.14;
    const rackLength = cabinSpan * 0.84;
    const rackGroup = new THREE.Group();
    rackGroup.position.set(0, roofBaseY, cabinCenterZ - 0.04);
    chassisGroup.add(rackGroup);

    // Tubular roof basket rails
    const railLongGeo = new THREE.CylinderGeometry(0.022, 0.022, rackLength, 10);
    railLongGeo.rotateX(Math.PI / 2);
    [-rackWidth / 2, rackWidth / 2].forEach((xR) => {
      const rLow = new THREE.Mesh(railLongGeo, darkSteelMat);
      rLow.position.set(xR, 0, 0);
      rackGroup.add(rLow);

      const rHigh = new THREE.Mesh(railLongGeo, darkSteelMat);
      rHigh.position.set(xR, 0.11, 0);
      rackGroup.add(rHigh);
    });

    const railCrossGeo = new THREE.CylinderGeometry(0.02, 0.02, rackWidth, 10);
    railCrossGeo.rotateZ(Math.PI / 2);
    [-rackLength / 2, 0, rackLength / 2].forEach((zC) => {
      const cBar = new THREE.Mesh(railCrossGeo, darkSteelMat);
      cBar.position.set(0, 0.05, zC);
      rackGroup.add(cBar);
    });

    if (config.roofAccessory === 'jerry_cans_boxes' || config.roofAccessory === 'expedition_rack') {
      // Vintage olive metal cargo box
      const boxGeo = createRoundedBox(0.56, 0.24, 0.68, 0.04, 2);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x4b5338, roughness: 0.75 });
      const cargoBox = new THREE.Mesh(boxGeo, boxMat);
      cargoBox.position.set(-0.26, 0.13, -0.12);
      cargoBox.castShadow = true;
      rackGroup.add(cargoBox);

      // Tan canvas duffel roll
      const duffelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.58, 12);
      duffelGeo.rotateZ(Math.PI / 2);
      const duffel = new THREE.Mesh(duffelGeo, canvasMat);
      duffel.position.set(0.24, 0.14, 0.22);
      duffel.castShadow = true;
      rackGroup.add(duffel);
    }

    if (config.roofAccessory === 'jerry_cans_boxes') {
      // Twin red fuel cans + orange sand recovery tracks
      const canMat = new THREE.MeshStandardMaterial({ color: 0xa63228, roughness: 0.55 });
      const canGeo = createRoundedBox(0.18, 0.32, 0.26, 0.03, 2);
      [-0.14, 0.12].forEach((zCan) => {
        const can = new THREE.Mesh(canGeo, canMat);
        can.position.set(0.32, 0.16, zCan - 0.18);
        can.castShadow = true;
        rackGroup.add(can);
      });
    }

    if (config.roofAccessory === 'roof_cargo_box') {
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x343936, roughness: 0.42, metalness: 0.22 });
      const box = new THREE.Mesh(createRoundedBox(rackWidth * 0.82, 0.36, rackLength * 0.82, 0.12, 5), boxMat);
      box.position.y = 0.2; box.castShadow = true; rackGroup.add(box);
      const lidSeam = new THREE.Mesh(new THREE.BoxGeometry(rackWidth * 0.78, 0.018, 0.76), darkSteelMat);
      lidSeam.position.set(0, 0.385, 0); rackGroup.add(lidSeam);
    }

    if (config.roofAccessory === 'safari_basket') {
      const basketFloor = new THREE.Mesh(new THREE.BoxGeometry(rackWidth * 0.9, 0.06, rackLength * 0.9), darkSteelMat);
      basketFloor.position.y = 0.09; rackGroup.add(basketFloor);
      const basketRail = new THREE.CylinderGeometry(0.024, 0.024, rackLength * 0.9, 8);
      basketRail.rotateX(Math.PI / 2);
      [-rackWidth * 0.44, rackWidth * 0.44].forEach((x) => {
        const rail = new THREE.Mesh(basketRail, chromeMat); rail.position.set(x, 0.22, 0); rackGroup.add(rail);
      });
      [-rackLength * 0.45, rackLength * 0.45].forEach((z) => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, rackWidth * 0.9, 8), chromeMat);
        rail.rotation.z = Math.PI / 2; rail.position.set(0, 0.22, z); rackGroup.add(rail);
      });
      for (let i = 0; i < 3; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(rackWidth * 0.82, 0.035, 0.08), secondaryMat);
        slat.position.set(0, 0.14, -rackLength * 0.3 + i * rackLength * 0.3); rackGroup.add(slat);
      }
    }

    if (config.roofAccessory === 'side_awning') {
      const awningRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, rackLength * 0.86, 12), darkSteelMat);
      awningRoll.rotation.x = Math.PI / 2; awningRoll.position.set(bodyWidth * 0.55, 0.06, 0); rackGroup.add(awningRoll);
      const fabric = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.045, rackLength * 0.78), canvasMat);
      fabric.position.set(bodyWidth * 0.55 + 0.45, 0.02, 0); fabric.castShadow = true; rackGroup.add(fabric);
      [-rackLength * 0.34, rackLength * 0.34].forEach((z) => {
        const support = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.45, 8), darkSteelMat);
        support.position.set(bodyWidth * 0.55 + 0.9, -0.68, z); rackGroup.add(support);
      });
    }

    if (config.roofAccessory === 'rooftop_tent') {
      // Folded canvas overland rooftop tent pack with ladder on top
      const tentPackGeo = createRoundedBox(rackWidth - 0.08, 0.28, rackLength - 0.1, 0.06, 3);
      const tentPack = new THREE.Mesh(tentPackGeo, canvasMat);
      tentPack.position.set(0, 0.15, 0);
      tentPack.castShadow = true;
      rackGroup.add(tentPack);

      // Aluminum telescoping ladder strapped on top
      const ladderRailGeo = new THREE.BoxGeometry(0.03, 0.03, rackLength * 0.78);
      [-0.18, 0.18].forEach((xLad) => {
        const lRail = new THREE.Mesh(ladderRailGeo, chromeMat);
        lRail.position.set(xLad, 0.31, 0);
        rackGroup.add(lRail);
      });
    }
  }

  // 16. 4 Independent Wheels, Steering Knuckles & Visible Suspension Coil Struts
  const wheels: THREE.Group[] = [];
  const steeringKnuckles: THREE.Group[] = [];
  const suspensionStruts: THREE.Mesh[] = [];

  const wheelCoords: [number, number, boolean][] = [
    [halfTrack, halfWb, true],   // Front Left
    [-halfTrack, halfWb, true],  // Front Right
    [halfTrack, -halfWb, false], // Rear Left
    [-halfTrack, -halfWb, false],// Rear Right
  ];

  const springMat = new THREE.MeshStandardMaterial({
    color: 0xc94a29,
    roughness: 0.45,
    metalness: 0.5,
  });

  wheelCoords.forEach(([wx, wz, isFront]) => {
    // Suspension coil spring strut connecting chassis to wheel axle
    const strutGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.38, 10);
    const strut = new THREE.Mesh(strutGeo, springMat);
    strut.position.set(wx * 0.72, 0.62, wz);
    root.add(strut);
    suspensionStruts.push(strut);

    const knuckle = new THREE.Group();
    knuckle.position.set(wx, 0.44, wz);
    root.add(knuckle);

    const wheelMesh = buildOffRoadWheel(
      config.wheelStyle,
      config.tireStyle,
      swatch.hex,
      0.44,
      0.29
    );
    knuckle.add(wheelMesh);
    wheels.push(wheelMesh);

    if (isFront) {
      steeringKnuckles.push(knuckle);
    }
  });

  const hitchWorldOffset = new THREE.Vector3(0, 0.64, rearBumperZ - 0.12);

  return {
    root,
    chassisGroup,
    wheels,
    steeringKnuckles,
    suspensionStruts,
    headlightBeams,
    headlightBulbs,
    winchFairleadPos,
    hitchWorldOffset,
    antennaTip,
  };
}
