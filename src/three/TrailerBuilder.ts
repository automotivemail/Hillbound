import * as THREE from 'three';
import { TrailerTypeId, WheelStyleId, TireStyleId } from '../types/game';
import { buildOffRoadWheel, createRoundedBox } from './RetroVehicleBuilder';

export interface BuiltTrailer {
  root: THREE.Group;
  wheels: THREE.Group[]; // [Left, Right]
  hitchOffsetZ: number;
  axleZ: number;
}

/**
 * Builds an articulated vintage off-road trailer with tongue hitch, fenders,
 * rotating off-road wheels, and custom expedition cargo/camper geometry.
 */
export function buildRetroTrailer(
  trailerType: TrailerTypeId,
  wheelStyle: WheelStyleId,
  tireStyle: TireStyleId,
  accentHex: string
): BuiltTrailer | null {
  if (trailerType === 'none') return null;

  const root = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.68,
    metalness: 0.14,
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xdfd7c2,
    roughness: 0.62,
    metalness: 0.08,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x262523,
    roughness: 0.65,
    metalness: 0.45,
  });

  const woodPlankMat = new THREE.MeshStandardMaterial({
    color: 0x7c5836,
    roughness: 0.85,
    metalness: 0.05,
  });

  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xc9be9f,
    roughness: 0.88,
  });

  // Origin of `root` is the hitch coupler point (0, 0.64, 0) in local Y, or we place hitch at (0, 0.56, 0)
  // Let's keep root at ground-aligned Y=0 under the hitch ball, with the trailer extending along -Z.
  const hitchY = 0.58;
  const axleZ = -1.75;
  const trackWidth = 1.42;

  // 1. A-Frame Drawbar Tongue connecting (0, hitchY, 0) to trailer frame at z = -0.9
  [-1, 1].forEach((side) => {
    const tongueGeo = new THREE.CylinderGeometry(0.032, 0.032, 1.15, 8);
    tongueGeo.rotateX(Math.PI / 2);
    const bar = new THREE.Mesh(tongueGeo, darkSteelMat);
    bar.position.set(side * 0.24, hitchY, -0.52);
    bar.rotation.y = side * -0.38;
    bar.castShadow = true;
    root.add(bar);
  });

  // Hitch coupler socket at (0, hitchY, 0)
  const couplerGeo = createRoundedBox(0.14, 0.12, 0.22, 0.03, 2);
  const coupler = new THREE.Mesh(couplerGeo, darkSteelMat);
  coupler.position.set(0, hitchY + 0.02, -0.05);
  root.add(coupler);

  // Solid trailer axle
  const axleGeo = new THREE.CylinderGeometry(0.045, 0.045, trackWidth * 0.94, 10);
  axleGeo.rotateZ(Math.PI / 2);
  const axle = new THREE.Mesh(axleGeo, darkSteelMat);
  axle.position.set(0, 0.38, axleZ);
  root.add(axle);

  // Rounded trailer wheel fenders
  [-1, 1].forEach((side) => {
    const fenderGeo = createRoundedBox(0.26, 0.28, 0.76, 0.1, 3);
    const fender = new THREE.Mesh(fenderGeo, bodyMat);
    fender.position.set(side * (trackWidth * 0.46), 0.64, axleZ);
    fender.castShadow = true;
    root.add(fender);
  });

  // 2 Trailer Off-Road Wheels
  const wheels: THREE.Group[] = [];
  [-trackWidth / 2, trackWidth / 2].forEach((wx) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, 0.38, axleZ);
    const wheelMesh = buildOffRoadWheel(wheelStyle, tireStyle, accentHex, 0.38, 0.24);
    wGroup.add(wheelMesh);
    root.add(wGroup);
    wheels.push(wheelMesh);
  });

  // 3. Specific Trailer Body Geometry
  if (trailerType === 'utility_trailer') {
    // Vintage Bantam M416 style rounded tub trailer with canvas tarp & supplies
    const tubGeo = createRoundedBox(1.12, 0.48, 1.56, 0.08, 3);
    const tub = new THREE.Mesh(tubGeo, bodyMat);
    tub.position.set(0, 0.82, axleZ);
    tub.castShadow = true;
    tub.receiveShadow = true;
    root.add(tub);

    const tarpGeo = createRoundedBox(1.16, 0.18, 1.6, 0.06, 3);
    const tarp = new THREE.Mesh(tarpGeo, canvasMat);
    tarp.position.set(0, 1.1, axleZ);
    tarp.castShadow = true;
    root.add(tarp);
  } else if (trailerType === 'teardrop_camper') {
    // Classic rounded vintage Teardrop Camper with circular porthole windows & roof vent
    const lowerCamperGeo = createRoundedBox(1.22, 0.56, 1.85, 0.14, 4);
    const lowerCamper = new THREE.Mesh(lowerCamperGeo, bodyMat);
    lowerCamper.position.set(0, 0.86, axleZ - 0.05);
    lowerCamper.castShadow = true;
    root.add(lowerCamper);

    const upperCamperGeo = createRoundedBox(1.18, 0.58, 1.55, 0.24, 5);
    const upperCamper = new THREE.Mesh(upperCamperGeo, creamMat);
    upperCamper.position.set(0, 1.32, axleZ - 0.12);
    upperCamper.castShadow = true;
    root.add(upperCamper);

    // Circular porthole window on both sides
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x8bb2bd,
      roughness: 0.15,
      metalness: 0.3,
    });
    [-1, 1].forEach((side) => {
      const portGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 18);
      portGeo.rotateZ(Math.PI / 2);
      const port = new THREE.Mesh(portGeo, glassMat);
      port.position.set(side * 0.59, 1.28, axleZ + 0.08);
      root.add(port);
    });
  } else if (trailerType === 'open_cargo') {
    // Timber stake-side open cargo trailer carrying wooden crates & fuel barrels
    const bedGeo = createRoundedBox(1.18, 0.12, 1.72, 0.03, 2);
    const bed = new THREE.Mesh(bedGeo, woodPlankMat);
    bed.position.set(0, 0.64, axleZ);
    bed.castShadow = true;
    root.add(bed);

    const crateGeo = createRoundedBox(0.52, 0.44, 0.56, 0.03, 2);
    const crate1 = new THREE.Mesh(crateGeo, woodPlankMat);
    crate1.position.set(-0.24, 0.9, axleZ + 0.25);
    crate1.castShadow = true;
    root.add(crate1);

    const barrelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.62, 16);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x9e3b2e, roughness: 0.5 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0.26, 0.98, axleZ - 0.2);
    barrel.castShadow = true;
    root.add(barrel);
  } else if (trailerType === 'recovery_rig') {
    // Heavy expedition equipment trailer with spare tires, generator & high-lift jack
    const deckGeo = createRoundedBox(1.16, 0.22, 1.65, 0.05, 3);
    const deck = new THREE.Mesh(deckGeo, darkSteelMat);
    deck.position.set(0, 0.7, axleZ);
    deck.castShadow = true;
    root.add(deck);

    const rackHoopGeo = new THREE.TorusGeometry(0.52, 0.035, 8, 18, Math.PI);
    [-0.5, 0.4].forEach((zHoop) => {
      const hoop = new THREE.Mesh(rackHoopGeo, darkSteelMat);
      hoop.position.set(0, 0.8, axleZ + zHoop);
      root.add(hoop);
    });

    const genMat = new THREE.MeshStandardMaterial({ color: 0xc89d46, roughness: 0.55 });
    const genBox = new THREE.Mesh(createRoundedBox(0.64, 0.42, 0.52, 0.04, 2), genMat);
    genBox.position.set(0, 1.02, axleZ + 0.15);
    genBox.castShadow = true;
    root.add(genBox);
  }

  return {
    root,
    wheels,
    hitchOffsetZ: 0,
    axleZ,
  };
}
