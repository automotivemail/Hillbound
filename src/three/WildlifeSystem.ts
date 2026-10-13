import * as THREE from 'three';
import { INITIAL_WILDLIFE, WildlifeSpecies } from '../types/game';
import { getTerrainHeight, WATER_LEVEL } from './WorldBuilder';
import { createRoundedBox } from './RetroVehicleBuilder';

export interface WildlifeActor {
  species: WildlifeSpecies;
  group: THREE.Group;
  headGroup: THREE.Group;
  legs: THREE.Mesh[];
  x: number;
  z: number;
  heading: number;
  targetHeading: number;
  walkCycle: number;
  state: 'grazing' | 'walking' | 'alert';
  stateTimer: number;
  homeX: number;
  homeZ: number;
}

/**
 * Builds a charming low-poly stylized animal mesh with animated legs, head, ears/antlers/horns, and tail.
 */
function createAnimalMesh(species: WildlifeSpecies): {
  group: THREE.Group;
  headGroup: THREE.Group;
  legs: THREE.Mesh[];
} {
  const group = new THREE.Group();
  const s = species.scale;

  const coatMat = new THREE.MeshStandardMaterial({
    color: species.colorHex,
    roughness: 0.82,
    flatShading: true,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: species.secondaryHex,
    roughness: 0.78,
    flatShading: true,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x241f1c,
    roughness: 0.6,
  });

  // Torso
  const torsoGeo = createRoundedBox(0.55 * s, 0.52 * s, 1.15 * s, 0.14 * s, 3);
  const torso = new THREE.Mesh(torsoGeo, coatMat);
  torso.position.set(0, 0.72 * s, 0);
  torso.castShadow = true;
  group.add(torso);

  // Chest underbelly patch
  const bellyGeo = createRoundedBox(0.46 * s, 0.18 * s, 0.92 * s, 0.06 * s, 2);
  const belly = new THREE.Mesh(bellyGeo, secondaryMat);
  belly.position.set(0, 0.52 * s, 0.04 * s);
  group.add(belly);

  // Neck & Head Group (pivots for grazing / looking at player)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.92 * s, 0.48 * s);
  group.add(headGroup);

  const neckGeo = createRoundedBox(0.28 * s, 0.45 * s, 0.3 * s, 0.08 * s, 2);
  const neck = new THREE.Mesh(neckGeo, coatMat);
  neck.position.set(0, 0.12 * s, 0.06 * s);
  neck.rotation.x = 0.35;
  headGroup.add(neck);

  const snoutGeo = createRoundedBox(0.32 * s, 0.28 * s, 0.46 * s, 0.08 * s, 2);
  const snout = new THREE.Mesh(snoutGeo, coatMat);
  snout.position.set(0, 0.32 * s, 0.22 * s);
  snout.castShadow = true;
  headGroup.add(snout);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 8, 8), darkMat);
  nose.position.set(0, 0.34 * s, 0.45 * s);
  headGroup.add(nose);

  // Species-specific antlers, curved ibex horns, or bushy fox tail
  if (species.id === 'red_stag') {
    [-1, 1].forEach((side) => {
      const beamGeo = new THREE.CylinderGeometry(0.025 * s, 0.035 * s, 0.58 * s, 6);
      const beam = new THREE.Mesh(beamGeo, secondaryMat);
      beam.position.set(side * 0.16 * s, 0.65 * s, 0.12 * s);
      beam.rotation.z = side * -0.42;
      beam.rotation.x = -0.25;
      headGroup.add(beam);

      const tineGeo = new THREE.CylinderGeometry(0.018 * s, 0.025 * s, 0.32 * s, 6);
      const tine = new THREE.Mesh(tineGeo, secondaryMat);
      tine.position.set(side * 0.24 * s, 0.72 * s, 0.24 * s);
      tine.rotation.x = 0.55;
      headGroup.add(tine);
    });
  } else if (species.id === 'mountain_ibex') {
    [-1, 1].forEach((side) => {
      const hornGeo = new THREE.TorusGeometry(0.28 * s, 0.045 * s, 6, 12, Math.PI * 1.1);
      const horn = new THREE.Mesh(hornGeo, secondaryMat);
      horn.position.set(side * 0.12 * s, 0.55 * s, -0.02 * s);
      horn.rotation.y = Math.PI / 2 + side * 0.15;
      headGroup.add(horn);
    });
  } else if (species.id === 'red_fox' || species.id === 'timber_wolf') {
    // Pointed ears & bushy tail
    [-1, 1].forEach((side) => {
      const earGeo = new THREE.ConeGeometry(0.07 * s, 0.18 * s, 4);
      const ear = new THREE.Mesh(earGeo, coatMat);
      ear.position.set(side * 0.11 * s, 0.5 * s, 0.12 * s);
      headGroup.add(ear);
    });

    const tailGeo = new THREE.ConeGeometry(0.14 * s, 0.62 * s, 6);
    tailGeo.rotateX(-Math.PI * 0.65);
    const tail = new THREE.Mesh(tailGeo, secondaryMat);
    tail.position.set(0, 0.68 * s, -0.72 * s);
    group.add(tail);
  }

  // 4 Articulated Legs
  const legs: THREE.Mesh[] = [];
  const legGeo = createRoundedBox(0.13 * s, 0.58 * s, 0.14 * s, 0.03 * s, 2);
  legGeo.translate(0, -0.26 * s, 0);

  const legOffsets: [number, number][] = [
    [-0.18 * s, 0.36 * s],
    [0.18 * s, 0.36 * s],
    [-0.18 * s, -0.36 * s],
    [0.18 * s, -0.36 * s],
  ];

  legOffsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, coatMat);
    leg.position.set(lx, 0.54 * s, lz);
    leg.castShadow = true;
    group.add(leg);
    legs.push(leg);
  });

  return { group, headGroup, legs };
}

/**
 * Spawns and updates all wildlife actors across the stylized world.
 */
export class WildlifeSystem {
  public actors: WildlifeActor[] = [];
  public group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.spawnAll();
  }

  private spawnAll() {
    const habitats: Record<string, { x: number; z: number }[]> = {
      red_stag: [
        { x: 35, z: -32 },
        { x: 52, z: -55 },
      ],
      timber_wolf: [
        { x: -58, z: -42 },
        { x: -45, z: -68 },
      ],
      mountain_ibex: [
        { x: -16, z: -98 },
        { x: 82, z: 38 },
      ],
      red_fox: [
        { x: 28, z: 8 },
        { x: -15, z: 32 },
      ],
      brown_bear: [
        { x: -38, z: 58 },
      ],
    };

    INITIAL_WILDLIFE.forEach((species) => {
      const spots = habitats[species.id] || [{ x: 20, z: -20 }];
      spots.forEach((spot, idx) => {
        const { group, headGroup, legs } = createAnimalMesh(species);
        const y = getTerrainHeight(spot.x, spot.z);
        group.position.set(spot.x, y, spot.z);
        this.group.add(group);

        this.actors.push({
          species,
          group,
          headGroup,
          legs,
          x: spot.x,
          z: spot.z,
          heading: idx * 1.7,
          targetHeading: idx * 1.7,
          walkCycle: 0,
          state: 'walking',
          stateTimer: 4 + idx * 3,
          homeX: spot.x,
          homeZ: spot.z,
        });
      });
    });
  }

  public update(dt: number, vehicleX: number, vehicleZ: number): WildlifeActor | null {
    let closestActor: WildlifeActor | null = null;
    let closestDist = Infinity;

    for (const actor of this.actors) {
      const distToVehicle = Math.hypot(actor.x - vehicleX, actor.z - vehicleZ);
      if (distToVehicle < closestDist) {
        closestDist = distToVehicle;
        closestActor = actor;
      }

      actor.stateTimer -= dt;

      // Subtle reaction to vehicle: if within 16m, move gently away; if within 28m, look alert
      if (distToVehicle < 15) {
        actor.state = 'walking';
        actor.targetHeading = Math.atan2(actor.x - vehicleX, actor.z - vehicleZ);
      } else if (actor.stateTimer <= 0) {
        if (actor.state === 'walking') {
          actor.state = 'grazing';
          actor.stateTimer = 3.5 + Math.random() * 4;
        } else {
          actor.state = 'walking';
          actor.stateTimer = 4.5 + Math.random() * 5;
          // Roam near home habitat
          const toHomeX = actor.homeX - actor.x;
          const toHomeZ = actor.homeZ - actor.z;
          if (Math.hypot(toHomeX, toHomeZ) > 26) {
            actor.targetHeading = Math.atan2(toHomeX, toHomeZ);
          } else {
            actor.targetHeading = actor.heading + (Math.random() - 0.5) * 2.2;
          }
        }
      }

      // Smooth heading turn
      let diff = actor.targetHeading - actor.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      actor.heading += diff * Math.min(1, dt * 3.5);

      if (actor.state === 'walking') {
        const moveSpeed = distToVehicle < 15 ? actor.species.speed * 1.35 : actor.species.speed * 0.65;
        const nx = actor.x + Math.sin(actor.heading) * moveSpeed * dt;
        const nz = actor.z + Math.cos(actor.heading) * moveSpeed * dt;
        const ny = getTerrainHeight(nx, nz);

        if (ny > WATER_LEVEL + 0.3) {
          actor.x = nx;
          actor.z = nz;
        } else {
          actor.targetHeading += Math.PI * 0.8;
        }

        actor.walkCycle += dt * moveSpeed * 3.2;
        const swing = Math.sin(actor.walkCycle) * 0.45;
        actor.legs[0].rotation.x = swing;
        actor.legs[3].rotation.x = swing;
        actor.legs[1].rotation.x = -swing;
        actor.legs[2].rotation.x = -swing;
        actor.headGroup.rotation.x = Math.sin(actor.walkCycle * 2) * 0.08;
      } else {
        // Grazing pose
        actor.legs.forEach((l) => {
          l.rotation.x *= 0.85;
        });
        actor.headGroup.rotation.x = THREE.MathUtils.lerp(actor.headGroup.rotation.x, 0.55, dt * 3);
      }

      const groundY = getTerrainHeight(actor.x, actor.z);
      actor.group.position.set(actor.x, groundY, actor.z);
      actor.group.rotation.y = actor.heading;
    }

    return closestDist < 38 ? closestActor : null;
  }
}
