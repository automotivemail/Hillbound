import * as THREE from 'three';
import { WinchAnchor } from '../types/game';
import { createRoundedBox } from './RetroVehicleBuilder';

export interface WorldEnvironment {
  group: THREE.Group;
  winchAnchors: WinchAnchor[];
  colliders: { x: number; z: number; radius: number }[];
  trailerDepotPos: { x: number; z: number };
  campfireLight: THREE.PointLight;
  waterMesh: THREE.Mesh;
}

/**
 * Deterministic pseudo-random helper
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Computes how close (0..1) a world coordinate (x, z) is to the winding dirt trail network.
 */
export function getTrailFactor(x: number, z: number): number {
  // Main loop trail + spur trails to landmarks
  // 1. Ring trail around radius ~68 with organic wave
  const distFromCenter = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  const ringRadius = 64 + Math.sin(angle * 3) * 10 + Math.cos(angle * 2) * 8;
  const dRing = Math.abs(distFromCenter - ringRadius);

  // 2. North-South central mountain pass trail (leads to Eagle Pass at x=-10, z=-115)
  const pathNSX = -10 + Math.sin(z * 0.045) * 16;
  const dNS = Math.abs(x - pathNSX);

  // 3. East-West cross trail connecting Cabin (-72,-54), Basecamp (18,22), and Redstone Arch (92,45)
  const pathEWZ = 15 + Math.sin(x * 0.035) * 24;
  const dEW = Math.abs(z - pathEWZ);

  const minDist = Math.min(dRing, dNS, dEW);
  const trailHalfWidth = 4.2;
  if (minDist > trailHalfWidth * 1.8) return 0;
  return Math.max(0, Math.min(1, 1 - minDist / (trailHalfWidth * 1.5)));
}

/**
 * Computes terrain elevation at any (x, z) coordinate in meters.
 * Designed for smooth, natural driving physics with varied hills, valleys, lake basin, and mountain pass.
 */
export function getTerrainHeight(x: number, z: number): number {
  // Broad rolling hills
  let h =
    Math.sin(x * 0.022) * Math.cos(z * 0.022) * 5.2 +
    Math.sin(x * 0.055 + 1.2) * Math.sin(z * 0.048) * 2.1 +
    Math.cos((x + z) * 0.015) * 3.8;

  // Sunlit Crest Overlook ridge around (48, -65)
  const dOverlook = Math.hypot(x - 48, z + 65);
  if (dOverlook < 45) {
    const t = 1 - dOverlook / 45;
    h += t * t * 11.5;
  }

  // Highland Devil's Pass steep ridge around (-10, -115)
  const dPass = Math.hypot(x + 10, z + 115);
  if (dPass < 55) {
    const t = 1 - dPass / 55;
    h += t * t * 16.5;
  }

  // Redstone Arch plateau around (92, 45)
  const dArch = Math.hypot(x - 92, z - 45);
  if (dArch < 48) {
    const t = 1 - dArch / 48;
    h += t * t * 9.0;
  }

  // Mirror Tarn Lake Basin depression around (-55, 62)
  const dLake = Math.hypot(x + 55, z - 62);
  if (dLake < 38) {
    const t = 1 - dLake / 38;
    h -= t * t * 9.5;
  }

  // Flatten slightly around spawn / Nomad Basecamp (18, 22)
  const dCamp = Math.hypot(x - 18, z - 22);
  if (dCamp < 24) {
    const flatten = 1 - dCamp / 24;
    h = h * (1 - flatten * 0.65) + 1.2 * (flatten * 0.65);
  }

  // Outer perimeter mountain ring beyond radius 145
  const r = Math.hypot(x, z);
  if (r > 135) {
    const mountainT = (r - 135) / 65;
    const ridgeNoise =
      Math.abs(Math.sin(Math.atan2(z, x) * 7) * 12) +
      Math.abs(Math.cos(Math.atan2(z, x) * 13) * 8);
    h += mountainT * mountainT * (28 + ridgeNoise);
  }

  // Slightly depress dirt trails into the earth
  const trail = getTrailFactor(x, z);
  h -= trail * 0.22;

  return h;
}

export const WATER_LEVEL = -3.4;

/**
 * Computes terrain surface normal at (x, z) for accurate vehicle pitch and roll alignment.
 */
export function getTerrainNormal(x: number, z: number): THREE.Vector3 {
  const eps = 0.45;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);

  const normal = new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
  return normal;
}

/**
 * Classifies the ground surface at (x, z) for physics grip, tire slip, and HUD display.
 */
export function getSurfaceType(
  x: number,
  z: number
): 'Dirt Trail' | 'Golden Grass' | 'Deep Mud' | 'Shallow Water' | 'Alpine Rock' {
  const h = getTerrainHeight(x, z);
  if (h < WATER_LEVEL + 0.15) return 'Shallow Water';
  if (h < WATER_LEVEL + 1.25) return 'Deep Mud';
  if (h > 11.5) return 'Alpine Rock';
  if (getTrailFactor(x, z) > 0.38) return 'Dirt Trail';
  return 'Golden Grass';
}

/**
 * Builds the complete stylized low-poly world with golden grasslands, pine forests,
 * mountain silhouettes, lake, cabins, campsites, instanced grass/rocks, and winch anchors.
 */
export function buildStylizedWorld(): WorldEnvironment {
  const group = new THREE.Group();
  const winchAnchors: WinchAnchor[] = [];
  const colliders: { x: number; z: number; radius: number }[] = [];

  // 1. Low-Poly Vertex-Colored Terrain Mesh (380m x 380m)
  const size = 380;
  const segments = 170;
  const terrainGeo = new THREE.PlaneGeometry(size, size, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const cGoldenGrass = new THREE.Color('#c89c46'); // Warm golden grassland
  const cLushMeadow = new THREE.Color('#7f8c3e');  // Olive-gold meadow transition
  const cDirtTrail = new THREE.Color('#8f6843');   // Natural warm dirt path
  const cMudBank = new THREE.Color('#4d3928');     // Dark wet mud near lake
  const cAlpineRock = new THREE.Color('#7c7770');  // High mountain granite
  const cSnowPeak = new THREE.Color('#e6e2d8');    // Distant high mountain ridge

  const tmpColor = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const vy = getTerrainHeight(vx, vz);
    posAttr.setY(i, vy);

    const trail = getTrailFactor(vx, vz);
    const noise = seededRandom(i * 0.37);

    if (vy < WATER_LEVEL + 1.1) {
      tmpColor.copy(cMudBank).lerp(cDirtTrail, Math.max(0, (vy - WATER_LEVEL) / 1.1));
    } else if (vy > 19) {
      tmpColor.copy(cAlpineRock).lerp(cSnowPeak, Math.min(1, (vy - 19) / 14));
    } else if (vy > 10.5) {
      tmpColor.copy(cGoldenGrass).lerp(cAlpineRock, Math.min(1, (vy - 10.5) / 8.5));
    } else {
      tmpColor.copy(cGoldenGrass).lerp(cLushMeadow, noise * 0.38);
    }

    if (trail > 0.05 && vy >= WATER_LEVEL + 0.5 && vy < 16) {
      tmpColor.lerp(cDirtTrail, Math.min(1, trail * 1.15));
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
    flatShading: true,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 2. Mirror Tarn Lake Water Plane
  const waterGeo = new THREE.CircleGeometry(46, 36);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b7a8c,
    transparent: true,
    opacity: 0.78,
    roughness: 0.15,
    metalness: 0.1,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(-55, WATER_LEVEL, 62);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // 3. Instanced Pine Forests (Layered Low-Poly Cones + Trunks)
  const treeCount = 260;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.2, 6);
  trunkGeo.translate(0, 1.1, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x543b28,
    roughness: 0.9,
    flatShading: true,
  });

  const foliageLowerGeo = new THREE.ConeGeometry(1.65, 3.2, 7);
  foliageLowerGeo.translate(0, 3.1, 0);
  const foliageMidGeo = new THREE.ConeGeometry(1.3, 2.8, 7);
  foliageMidGeo.translate(0, 4.7, 0);
  const foliageTopGeo = new THREE.ConeGeometry(0.88, 2.2, 7);
  foliageTopGeo.translate(0, 6.1, 0);

  const pineMat = new THREE.MeshStandardMaterial({
    color: 0x2a4736,
    roughness: 0.85,
    flatShading: true,
  });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const lowInst = new THREE.InstancedMesh(foliageLowerGeo, pineMat, treeCount);
  const midInst = new THREE.InstancedMesh(foliageMidGeo, pineMat, treeCount);
  const topInst = new THREE.InstancedMesh(foliageTopGeo, pineMat, treeCount);

  trunkInst.castShadow = true;
  lowInst.castShadow = true;
  midInst.castShadow = true;
  topInst.castShadow = true;

  const dummy = new THREE.Object3D();
  const treeColor = new THREE.Color();
  let placedTrees = 0;

  for (let i = 0; i < 650 && placedTrees < treeCount; i++) {
    const tx = (seededRandom(i * 1.13) - 0.5) * 260;
    const tz = (seededRandom(i * 2.47) - 0.5) * 260;

    // Keep trees off trails, out of deep water, and away from spawn basecamp center
    if (getTrailFactor(tx, tz) > 0.22) continue;
    if (Math.hypot(tx - 18, tz - 22) < 16) continue;
    const ty = getTerrainHeight(tx, tz);
    if (ty < WATER_LEVEL + 0.8 || ty > 18) continue;

    const scale = 0.82 + seededRandom(i * 3.91) * 0.65;
    dummy.position.set(tx, ty - 0.1, tz);
    dummy.rotation.set(0, seededRandom(i * 5.1) * Math.PI * 2, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();

    trunkInst.setMatrixAt(placedTrees, dummy.matrix);
    lowInst.setMatrixAt(placedTrees, dummy.matrix);
    midInst.setMatrixAt(placedTrees, dummy.matrix);
    topInst.setMatrixAt(placedTrees, dummy.matrix);

    // Subtle deep pine color variation
    treeColor.setHSL(0.39 + (seededRandom(i * 7.3) - 0.5) * 0.04, 0.34, 0.2 + seededRandom(i * 4.2) * 0.08);
    lowInst.setColorAt(placedTrees, treeColor);
    midInst.setColorAt(placedTrees, treeColor);
    topInst.setColorAt(placedTrees, treeColor);

    // Register stout trees as Winch Anchors & simple cylindrical colliders
    if (scale > 0.95 && Math.hypot(tx, tz) < 130) {
      winchAnchors.push({
        id: `tree_${placedTrees}`,
        type: 'pine_tree',
        x: tx,
        y: ty + 0.9,
        z: tz,
        label: 'Stout Pine Trunk',
      });
    }
    colliders.push({ x: tx, z: tz, radius: 0.45 * scale });

    placedTrees++;
  }

  trunkInst.count = placedTrees;
  lowInst.count = placedTrees;
  midInst.count = placedTrees;
  topInst.count = placedTrees;
  group.add(trunkInst, lowInst, midInst, topInst);

  // 4. Instanced Tall Golden Grass Tufts (No collision so vehicle drives smoothly through!)
  const grassCount = 1800;
  const bladeGeo = new THREE.ConeGeometry(0.18, 0.72, 4);
  bladeGeo.translate(0, 0.34, 0);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xd8a848,
    roughness: 0.85,
    flatShading: true,
  });
  const grassInst = new THREE.InstancedMesh(bladeGeo, grassMat, grassCount);
  const grassCol = new THREE.Color();
  let placedGrass = 0;

  for (let i = 0; i < 2600 && placedGrass < grassCount; i++) {
    const gx = (seededRandom(i * 4.19 + 10) - 0.5) * 230;
    const gz = (seededRandom(i * 8.31 + 20) - 0.5) * 230;
    if (getTrailFactor(gx, gz) > 0.45) continue;
    const gy = getTerrainHeight(gx, gz);
    if (gy < WATER_LEVEL + 0.4 || gy > 12.5) continue;

    const s = 0.75 + seededRandom(i * 6.17) * 0.85;
    dummy.position.set(gx, gy - 0.05, gz);
    dummy.rotation.set(
      (seededRandom(i * 2.1) - 0.5) * 0.25,
      seededRandom(i * 9.2) * Math.PI * 2,
      (seededRandom(i * 3.4) - 0.5) * 0.25
    );
    dummy.scale.set(s, s * (0.9 + seededRandom(i) * 0.4), s);
    dummy.updateMatrix();
    grassInst.setMatrixAt(placedGrass, dummy.matrix);

    grassCol.setHSL(0.11 + (seededRandom(i * 5.7) - 0.5) * 0.03, 0.65, 0.52 + seededRandom(i * 1.9) * 0.12);
    grassInst.setColorAt(placedGrass, grassCol);
    placedGrass++;
  }
  grassInst.count = placedGrass;
  group.add(grassInst);

  // 5. Instanced Stylized Rocks & Winch Boulders
  const rockCount = 140;
  const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x7b756d,
    roughness: 0.88,
    flatShading: true,
  });
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInst.castShadow = true;
  rockInst.receiveShadow = true;

  let placedRocks = 0;
  for (let i = 0; i < 300 && placedRocks < rockCount; i++) {
    const rx = (seededRandom(i * 9.13 + 50) - 0.5) * 240;
    const rz = (seededRandom(i * 3.71 + 80) - 0.5) * 240;
    if ( getTrailFactor(rx, rz) > 0.55 ) continue;
    if (Math.hypot(rx - 18, rz - 22) < 14) continue;

    const ry = getTerrainHeight(rx, rz);
    if (ry < WATER_LEVEL - 0.2) continue;

    const sx = 0.7 + seededRandom(i * 1.7) * 1.3;
    const sy = 0.55 + seededRandom(i * 2.9) * 0.95;
    const sz = 0.7 + seededRandom(i * 4.3) * 1.3;

    dummy.position.set(rx, ry + sy * 0.32, rz);
    dummy.rotation.set(
      seededRandom(i * 6.1) * Math.PI,
      seededRandom(i * 7.2) * Math.PI,
      seededRandom(i * 8.4) * Math.PI
    );
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    rockInst.setMatrixAt(placedRocks, dummy.matrix);

    if (sx > 1.15) {
      winchAnchors.push({
        id: `boulder_${placedRocks}`,
        type: 'boulder',
        x: rx,
        y: ry + sy * 0.5,
        z: rz,
        label: 'Granite Anchor Boulder',
      });
      colliders.push({ x: rx, z: rz, radius: Math.max(sx, sz) * 0.72 });
    }
    placedRocks++;
  }
  rockInst.count = placedRocks;
  group.add(rockInst);

  // Add strategic Winch Anchor Posts / Boulders along Highland Devil's Pass (-10, -115) & Mirror Tarn Mud
  const strategicAnchors: { x: number; z: number; label: string; type: 'pine_tree' | 'boulder' }[] = [
    { x: -7, z: -82, label: 'Pass Switchback Winch Post', type: 'pine_tree' },
    { x: -13, z: -98, label: 'Highland Crest Anchor Pine', type: 'pine_tree' },
    { x: -8, z: -112, label: 'Summit Ridge Boulder', type: 'boulder' },
    { x: -42, z: 52, label: 'Lakeside Recovery Pine', type: 'pine_tree' },
    { x: -64, z: 48, label: 'Tarn Mud Bank Anchor', type: 'boulder' },
    { x: 44, z: -58, label: 'Overlook Ridge Anchor', type: 'boulder' },
  ];

  const postMat = new THREE.MeshStandardMaterial({ color: 0x6e472b, roughness: 0.85 });
  const ringBandMat = new THREE.MeshStandardMaterial({ color: 0xd9482b, roughness: 0.4 });
  strategicAnchors.forEach((sa, idx) => {
    const ay = getTerrainHeight(sa.x, sa.z);
    const postGeo = new THREE.CylinderGeometry(0.22, 0.26, 1.5, 8);
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(sa.x, ay + 0.75, sa.z);
    post.castShadow = true;
    group.add(post);

    const bandGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.22, 8);
    const band = new THREE.Mesh(bandGeo, ringBandMat);
    band.position.set(sa.x, ay + 1.25, sa.z);
    group.add(band);

    winchAnchors.push({
      id: `strategic_${idx}`,
      type: sa.type,
      x: sa.x,
      y: ay + 1.1,
      z: sa.z,
      label: sa.label,
    });
  });

  // 6. Landmark Structures:
  // A. Ranger Watch Cabin at (-72, -54)
  const cabinX = -72;
  const cabinZ = -54;
  const cabinY = getTerrainHeight(cabinX, cabinZ);
  const cabinGroup = new THREE.Group();
  cabinGroup.position.set(cabinX, cabinY, cabinZ);
  cabinGroup.rotation.y = 0.45;
  group.add(cabinGroup);

  const logWallMat = new THREE.MeshStandardMaterial({ color: 0x6b462a, roughness: 0.85 });
  const roofShingleMat = new THREE.MeshStandardMaterial({ color: 0x382e29, roughness: 0.9 });
  const warmWindowMat = new THREE.MeshStandardMaterial({
    color: 0xffd885,
    emissive: 0xffa94d,
    emissiveIntensity: 1.5,
  });

  const cabinBase = new THREE.Mesh(createRoundedBox(5.2, 3.0, 4.4, 0.12, 2), logWallMat);
  cabinBase.position.y = 1.4;
  cabinBase.castShadow = true;
  cabinGroup.add(cabinBase);

  const cabinRoofGeo = new THREE.ConeGeometry(4.2, 2.2, 4);
  cabinRoofGeo.rotateY(Math.PI / 4);
  const cabinRoof = new THREE.Mesh(cabinRoofGeo, roofShingleMat);
  cabinRoof.position.y = 3.85;
  cabinRoof.scale.set(1.15, 1, 1);
  cabinRoof.castShadow = true;
  cabinGroup.add(cabinRoof);

  const winPane = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.1), warmWindowMat);
  winPane.position.set(1.2, 1.6, 2.22);
  cabinGroup.add(winPane);
  colliders.push({ x: cabinX, z: cabinZ, radius: 3.2 });

  // B. Old Timberline Campsite & Trailer Depot at (18, 22)
  const campX = 18;
  const campZ = 22;
  const campY = getTerrainHeight(campX, campZ);
  const campGroup = new THREE.Group();
  campGroup.position.set(campX, campY, campZ);
  group.add(campGroup);

  // Canvas A-Frame Tent
  const tentGeo = new THREE.ConeGeometry(2.1, 2.2, 4);
  tentGeo.rotateY(Math.PI / 4);
  const tentMat = new THREE.MeshStandardMaterial({ color: 0xd6c7a9, roughness: 0.88 });
  const tent = new THREE.Mesh(tentGeo, tentMat);
  tent.position.set(-4.5, 1.0, -3.2);
  tent.scale.set(0.85, 1, 1.35);
  tent.castShadow = true;
  campGroup.add(tent);

  // Glowing Campfire Ring
  const fireLight = new THREE.PointLight(0xff7b29, 5, 18);
  fireLight.position.set(-1.5, 0.85, -1.5);
  campGroup.add(fireLight);

  const emberGeo = new THREE.DodecahedronGeometry(0.42, 1);
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff5900,
    emissive: 0xff4800,
    emissiveIntensity: 2.2,
  });
  const ember = new THREE.Mesh(emberGeo, emberMat);
  ember.position.set(-1.5, 0.2, -1.5);
  campGroup.add(ember);

  // C. Redstone Arch & Spires at (92, 45)
  const archX = 92;
  const archZ = 45;
  const archY = getTerrainHeight(archX, archZ);
  const sandstoneMat = new THREE.MeshStandardMaterial({
    color: 0xa85538,
    roughness: 0.9,
    flatShading: true,
  });
  const archGroup = new THREE.Group();
  archGroup.position.set(archX, archY, archZ);
  group.add(archGroup);

  [-4.2, 4.2].forEach((xPillar) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.6, 8.5, 7), sandstoneMat);
    pillar.position.set(xPillar, 3.8, 0);
    pillar.castShadow = true;
    archGroup.add(pillar);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.4, 3.2), sandstoneMat);
  lintel.position.set(0, 7.6, 0);
  lintel.castShadow = true;
  archGroup.add(lintel);

  // D. Sunlit Crest Overlook Signpost at (48, -65)
  const ovX = 48;
  const ovZ = -65;
  const ovY = getTerrainHeight(ovX, ovZ);
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.4, 8), logWallMat);
  signPost.position.set(ovX, ovY + 1.2, ovZ);
  group.add(signPost);
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.12), logWallMat);
  signBoard.position.set(ovX, ovY + 2.1, ovZ);
  group.add(signBoard);

  return {
    group,
    winchAnchors,
    colliders,
    trailerDepotPos: { x: campX + 5.5, z: campZ + 1.5 },
    campfireLight: fireLight,
    waterMesh,
  };
}
