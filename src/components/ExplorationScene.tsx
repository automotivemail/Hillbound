import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  CapturedPhoto,
  Landmark,
  PAINT_SWATCHES,
  TelemetryState,
  VehicleCustomization,
  VEHICLE_SPECS,
  WildlifeSpecies,
  WinchAnchor,
} from '../types/game';
import { buildRetroVehicle, BuiltVehicleMeshes } from '../three/RetroVehicleBuilder';
import { buildRetroTrailer, BuiltTrailer } from '../three/TrailerBuilder';
import {
  buildStylizedWorld,
  getSurfaceType,
  getTerrainHeight,
  WATER_LEVEL,
} from '../three/WorldBuilder';
import { WildlifeSystem } from '../three/WildlifeSystem';
import { soundManager } from '../utils/sound';

export interface ControlActionsRef {
  toggleWinchMode: () => void;
  attachNearestWinch: () => void;
  releaseWinch: () => void;
  setWinchReel: (reeling: boolean) => void;
  setWinchPayout: (payingOut: boolean) => void;
  toggleTrailerAttached: () => void;
  toggleLowRange: () => void;
  toggleDiffLock: () => void;
  toggleHeadlights: () => void;
  toggleCameraDistance: () => void;
  resetCamera: () => void;
  recoverVehicle: () => void;
  refuelVehicle: () => void;
  takePhotograph: () => CapturedPhoto | null;
  setMobileInput: (key: 'forward' | 'backward' | 'left' | 'right' | 'brake', val: boolean) => void;
}

interface ExplorationSceneProps {
  customization: VehicleCustomization;
  isPaused: boolean;
  isGarageOpen: boolean;
  cameraMode: 'follow' | 'close' | 'photo';
  landmarks: Landmark[];
  wildlifeList: WildlifeSpecies[];
  onUpdateTelemetry: (telemetry: TelemetryState) => void;
  onDiscoverLandmark: (landmarkId: string) => void;
  onPhotoCaptured: (photo: CapturedPhoto, wildlifeId?: string, landmarkId?: string) => void;
  actionsRef: React.MutableRefObject<ControlActionsRef | null>;
}

interface ParticleItem {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const ExplorationScene: React.FC<ExplorationSceneProps> = ({
  customization,
  isPaused,
  isGarageOpen,
  cameraMode,
  landmarks,
  onUpdateTelemetry,
  onDiscoverLandmark,
  onPhotoCaptured,
  actionsRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep latest props in refs for the animation loop
  const customRef = useRef(customization);
  customRef.current = customization;
  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;
  const garageOpenRef = useRef(isGarageOpen);
  garageOpenRef.current = isGarageOpen;
  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;
  const landmarksRef = useRef(landmarks);
  landmarksRef.current = landmarks;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Sky & Atmospheric Sunset Fog
    const scene = new THREE.Scene();
    const skyColor = new THREE.Color('#e8b878'); // Warm golden-hour horizon
    scene.background = skyColor;
    scene.fog = new THREE.FogExp2('#e4b476', 0.0048);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.2,
      450
    );

    // 3. Renderer (preserveDrawingBuffer enabled for in-game wildlife photography!)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // WebGL Context Loss safety
    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    // 4. Golden Hour Sunset Lighting
    const hemiLight = new THREE.HemisphereLight(0xffdfad, 0x4f5942, 0.85);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffbd6b, 2.2);
    sunLight.position.set(85, 68, -75);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 260;
    const d = 65;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Glowing low sun disc in the sky
    const sunDiscGeo = new THREE.SphereGeometry(14, 24, 24);
    const sunDiscMat = new THREE.MeshBasicMaterial({ color: 0xffe49e, fog: false });
    const sunDisc = new THREE.Mesh(sunDiscGeo, sunDiscMat);
    sunDisc.position.set(170, 82, -165);
    scene.add(sunDisc);

    // 5. Build Stylized Low-Poly World & Wildlife
    const world = buildStylizedWorld();
    scene.add(world.group);

    const wildlifeSystem = new WildlifeSystem();
    scene.add(wildlifeSystem.group);

    // 6. Build Winch Visuals (Anchor Highlight Rings + Active Cable + Hook)
    const anchorRingGeo = new THREE.TorusGeometry(0.65, 0.07, 10, 24);
    anchorRingGeo.rotateX(Math.PI / 2);
    const anchorValidMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const anchorHoverMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const anchorMarkerGroup = new THREE.Group();
    scene.add(anchorMarkerGroup);
    const anchorMeshes: Map<string, THREE.Mesh> = new Map();

    world.winchAnchors.forEach((anc) => {
      const ring = new THREE.Mesh(anchorRingGeo, anchorValidMat);
      ring.position.set(anc.x, anc.y, anc.z);
      ring.visible = false;
      ring.userData = { anchor: anc };
      anchorMarkerGroup.add(ring);
      anchorMeshes.set(anc.id, ring);
    });

    // Dynamic Steel Winch Cable Cylinder
    const cableGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    cableGeo.rotateX(Math.PI / 2);
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.35,
      metalness: 0.8,
    });
    const winchCableMesh = new THREE.Mesh(cableGeo, cableMat);
    winchCableMesh.visible = false;
    scene.add(winchCableMesh);

    const hookMarkerMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.6 })
    );
    hookMarkerMesh.visible = false;
    scene.add(hookMarkerMesh);

    // 7. Dust / Mud / Water Splash Particle Pool
    const particles: ParticleItem[] = [];
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);
    const partGeo = new THREE.DodecahedronGeometry(0.14, 0);
    const dustMat = new THREE.MeshLambertMaterial({ color: 0xc29b68, transparent: true, opacity: 0.65 });
    const mudMat = new THREE.MeshLambertMaterial({ color: 0x4a3523, transparent: true, opacity: 0.8 });
    const waterSplashMat = new THREE.MeshLambertMaterial({ color: 0xd0eef5, transparent: true, opacity: 0.75 });

    const spawnParticle = (
      x: number,
      y: number,
      z: number,
      surface: TelemetryState['surfaceType'],
      speedRatio: number
    ) => {
      if (particles.length > 75) return;
      const mat =
        surface === 'Shallow Water'
          ? waterSplashMat
          : surface === 'Deep Mud'
          ? mudMat
          : dustMat;
      const mesh = new THREE.Mesh(partGeo, mat);
      const s = 0.6 + Math.random() * 0.9 * speedRatio;
      mesh.scale.set(s, s, s);
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.25,
        y + 0.1,
        z + (Math.random() - 0.5) * 0.25
      );
      particleGroup.add(mesh);
      particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 1.4,
        vy: 0.8 + Math.random() * 1.6,
        vz: (Math.random() - 0.5) * 1.4,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
      });
    };

    // 8. Vehicle & Trailer State
    let builtVehicle: BuiltVehicleMeshes = buildRetroVehicle(customRef.current);
    scene.add(builtVehicle.root);

    let builtTrailer: BuiltTrailer | null = null;
    let trailerAttached = customRef.current.trailerType !== 'none';

    const rebuildVehicleAndTrailer = (cfg: VehicleCustomization) => {
      scene.remove(builtVehicle.root);
      builtVehicle = buildRetroVehicle(cfg);
      scene.add(builtVehicle.root);

      if (builtTrailer) {
        scene.remove(builtTrailer.root);
        builtTrailer = null;
      }
      if (cfg.trailerType !== 'none') {
        const swatch = PAINT_SWATCHES.find((s) => s.id === cfg.paintColor) || PAINT_SWATCHES[0];
        builtTrailer = buildRetroTrailer(
          cfg.trailerType,
          cfg.wheelStyle,
          cfg.tireStyle,
          swatch.hex
        );
        if (builtTrailer) {
          scene.add(builtTrailer.root);
          trailerAttached = true;
        }
      } else {
        trailerAttached = false;
      }
    };

    rebuildVehicleAndTrailer(customRef.current);

    // Physics State Variables
    const phys = {
      x: 18,
      z: 16,
      y: getTerrainHeight(18, 16),
      vx: 0,
      vz: 0,
      speed: 0,
      heading: Math.PI, // Facing North toward the trail & mountain pass
      steerAngle: 0,
      wheelRotation: 0,
      pitch: 0,
      roll: 0,
      pitchVel: 0,
      rollVel: 0,
      chassisBounceY: 0,
      chassisBounceVel: 0,
      fuel: 100,
      lowRange: false,
      diffLock: false,
      headlightsOn: true,
      winchMode: false,
      winchAnchor: null as WinchAnchor | null,
      hoveredAnchor: null as WinchAnchor | null,
      winchCableLen: 0,
      winchReeling: false,
      winchPayingOut: false,
      trailerX: 18,
      trailerZ: 19.5,
      trailerHeading: Math.PI,
      parkedTrailerX: world.trailerDepotPos.x,
      parkedTrailerZ: world.trailerDepotPos.z,
      parkedTrailerHeading: 0.4,
    };

    // Camera Orbit State
    const camState = {
      yawOffset: 0,
      pitchOffset: 0.28,
      distance: 7.4,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      currentPos: new THREE.Vector3(18, 6, 24),
      currentLookAt: new THREE.Vector3(18, 2, 16),
    };

    // Keyboard & Touch Input State
    const keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false,
    };

    // Raycaster for clicking winch anchors in the 3D viewport
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();

    const findBestForwardAnchor = (): WinchAnchor | null => {
      if (!customRef.current.hasWinch) return null;
      let best: WinchAnchor | null = null;
      let bestScore = Infinity;
      const forwardX = Math.sin(phys.heading);
      const forwardZ = Math.cos(phys.heading);

      for (const anc of world.winchAnchors) {
        const dx = anc.x - phys.x;
        const dz = anc.z - phys.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 2.2 || dist > 28) continue;
        const dot = (dx * forwardX + dz * forwardZ) / dist;
        const score = dist * (1.35 - dot * 0.5);
        if (score < bestScore) {
          bestScore = score;
          best = anc;
        }
      }
      return best;
    };

    // Expose actions to HUD & keyboard shortcuts
    const capturePhotograph = (): CapturedPhoto | null => {
      soundManager.init();
      soundManager.playCameraShutter();

      // Check if any wildlife or landmark is in front of the camera
      const camForward = new THREE.Vector3();
      camera.getWorldDirection(camForward);

      let bestWildlife: WildlifeSpecies | undefined;
      let bestWildlifeDist = 45;

      for (const actor of wildlifeSystem.actors) {
        const aPos = new THREE.Vector3(actor.x, actor.group.position.y + 0.8, actor.z);
        const toActor = aPos.clone().sub(camera.position);
        const dist = toActor.length();
        if (dist < bestWildlifeDist) {
          const angle = camForward.angleTo(toActor.normalize());
          if (angle < 0.55) {
            bestWildlifeDist = dist;
            bestWildlife = actor.species;
          }
        }
      }

      let bestLandmark: Landmark | undefined;
      let bestLandmarkDist = 65;
      for (const lm of landmarksRef.current) {
        const ly = getTerrainHeight(lm.x, lm.z) + 2;
        const lPos = new THREE.Vector3(lm.x, ly, lm.z);
        const toLm = lPos.clone().sub(camera.position);
        const dist = toLm.length();
        if (dist < bestLandmarkDist) {
          const angle = camForward.angleTo(toLm.normalize());
          if (angle < 0.65) {
            bestLandmarkDist = dist;
            bestLandmark = lm;
          }
        }
      }

      const dataUrl = renderer.domElement.toDataURL('image/jpeg', 0.82);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const photo: CapturedPhoto = {
        id: `photo_${Date.now()}`,
        title: bestWildlife
          ? `${bestWildlife.name} Sighting`
          : bestLandmark
          ? bestLandmark.name
          : 'Golden Ridge Trail Expedition',
        subjectType: bestWildlife ? 'Wildlife' : bestLandmark ? 'Landmark' : 'Expedition',
        subjectName: bestWildlife
          ? bestWildlife.name
          : bestLandmark
          ? bestLandmark.name
          : VEHICLE_SPECS.find((v) => v.id === customRef.current.vehicleId)?.name || 'Retro 4x4',
        timestamp: nowStr,
        dataUrl,
        locationName: bestLandmark?.name || getSurfaceType(phys.x, phys.z),
      };

      onPhotoCaptured(photo, bestWildlife?.id, bestLandmark?.id);
      return photo;
    };

    actionsRef.current = {
      toggleWinchMode: () => {
        if (!customRef.current.hasWinch) return;
        phys.winchMode = !phys.winchMode;
        soundManager.playWinchClick();
      },
      attachNearestWinch: () => {
        if (!customRef.current.hasWinch) return;
        const target = phys.hoveredAnchor || findBestForwardAnchor();
        if (target) {
          phys.winchAnchor = target;
          phys.winchCableLen = Math.hypot(target.x - phys.x, target.z - phys.z);
          phys.winchMode = true;
          soundManager.playWinchClick();
        }
      },
      releaseWinch: () => {
        phys.winchAnchor = null;
        phys.winchReeling = false;
        phys.winchPayingOut = false;
        soundManager.playWinchClick();
      },
      setWinchReel: (reeling: boolean) => {
        phys.winchReeling = reeling;
      },
      setWinchPayout: (payingOut: boolean) => {
        phys.winchPayingOut = payingOut;
      },
      toggleTrailerAttached: () => {
        if (!builtTrailer) return;
        if (trailerAttached) {
          trailerAttached = false;
          phys.parkedTrailerX = phys.trailerX;
          phys.parkedTrailerZ = phys.trailerZ;
          phys.parkedTrailerHeading = phys.trailerHeading;
          soundManager.playHitchClank();
        } else {
          const distToParked = Math.hypot(
            phys.x - phys.parkedTrailerX,
            phys.z - phys.parkedTrailerZ
          );
          if (distToParked < 12) {
            trailerAttached = true;
            soundManager.playHitchClank();
          }
        }
      },
      toggleLowRange: () => {
        phys.lowRange = !phys.lowRange;
        soundManager.playWinchClick();
      },
      toggleDiffLock: () => {
        phys.diffLock = !phys.diffLock;
        soundManager.playWinchClick();
      },
      toggleHeadlights: () => {
        phys.headlightsOn = !phys.headlightsOn;
      },
      toggleCameraDistance: () => {
        camState.distance = camState.distance < 6.0 ? 8.2 : 5.2;
      },
      resetCamera: () => {
        camState.yawOffset = 0;
        camState.pitchOffset = 0.28;
        camState.distance = 7.4;
      },
      recoverVehicle: () => {
        phys.x = 18;
        phys.z = 16;
        phys.y = getTerrainHeight(18, 16);
        phys.vx = 0;
        phys.vz = 0;
        phys.speed = 0;
        phys.heading = Math.PI;
        phys.winchAnchor = null;
        phys.fuel = 100;
      },
      refuelVehicle: () => {
        phys.fuel = 100;
      },
      takePhotograph: capturePhotograph,
      setMobileInput: (key, val) => {
        soundManager.init();
        keys[key] = val;
      },
    };

    // Keyboard Event Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      if (pausedRef.current || garageOpenRef.current) return;
      soundManager.init();
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') keys.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') keys.right = true;
      if (code === 'Space') keys.brake = true;
      if (code === 'KeyV') actionsRef.current?.toggleWinchMode();
      if (code === 'KeyE') actionsRef.current?.attachNearestWinch();
      if (code === 'KeyF') phys.winchReeling = true;
      if (code === 'KeyG') phys.winchPayingOut = true;
      if (code === 'KeyX') actionsRef.current?.releaseWinch();
      if (code === 'KeyL') actionsRef.current?.toggleLowRange();
      if (code === 'KeyK') actionsRef.current?.toggleDiffLock();
      if (code === 'KeyH') actionsRef.current?.toggleHeadlights();
      if (code === 'KeyT') actionsRef.current?.toggleTrailerAttached();
      if (code === 'KeyC') actionsRef.current?.toggleCameraDistance();
      if (code === 'KeyR') actionsRef.current?.resetCamera();
      if (code === 'KeyP') capturePhotograph();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') keys.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') keys.right = false;
      if (code === 'Space') keys.brake = false;
      if (code === 'KeyF') phys.winchReeling = false;
      if (code === 'KeyG') phys.winchPayingOut = false;
    };

    // Pointer / Mouse Orbit & Winch Anchor Selection
    const onPointerDown = (e: PointerEvent) => {
      soundManager.init();
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (phys.winchMode && customRef.current.hasWinch) {
        raycaster.setFromCamera(mouseNDC, camera);
        const visibleRings = Array.from(anchorMeshes.values()).filter((m) => m.visible);
        const hits = raycaster.intersectObjects(visibleRings, false);
        if (hits.length > 0) {
          const picked = hits[0].object.userData.anchor as WinchAnchor;
          if (picked) {
            phys.winchAnchor = picked;
            phys.winchCableLen = Math.hypot(picked.x - phys.x, picked.z - phys.z);
            soundManager.playWinchClick();
            return;
          }
        }
      }

      camState.isDragging = true;
      camState.lastMouseX = e.clientX;
      camState.lastMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (camState.isDragging) {
        const dx = e.clientX - camState.lastMouseX;
        const dy = e.clientY - camState.lastMouseY;
        camState.lastMouseX = e.clientX;
        camState.lastMouseY = e.clientY;

        camState.yawOffset -= dx * 0.0065;
        camState.pitchOffset = Math.max(0.08, Math.min(0.85, camState.pitchOffset + dy * 0.005));
      } else if (phys.winchMode) {
        raycaster.setFromCamera(mouseNDC, camera);
        const visibleRings = Array.from(anchorMeshes.values()).filter((m) => m.visible);
        const hits = raycaster.intersectObjects(visibleRings, false);
        phys.hoveredAnchor =
          hits.length > 0 ? (hits[0].object.userData.anchor as WinchAnchor) : null;
      }
    };

    const onPointerUp = () => {
      camState.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      camState.distance = Math.max(4.2, Math.min(13.5, camState.distance + e.deltaY * 0.005));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: true });

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Track customization changes dynamically
    let lastCustomJson = JSON.stringify(customRef.current);

    // 9. Main Simulation & Rendering Loop
    let lastTime = performance.now();
    let telemetryTimer = 0;
    let animFrameId = 0;

    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Rebuild vehicle/trailer immediately if customized in Garage
      const curCustomJson = JSON.stringify(customRef.current);
      if (curCustomJson !== lastCustomJson) {
        lastCustomJson = curCustomJson;
        rebuildVehicleAndTrailer(customRef.current);
      }

      const spec =
        VEHICLE_SPECS.find((v) => v.id === customRef.current.vehicleId) || VEHICLE_SPECS[0];
      const surface = getSurfaceType(phys.x, phys.z);

      // Update Headlights visibility
      builtVehicle.headlightBeams.forEach((b) => {
        b.visible = phys.headlightsOn;
      });
      builtVehicle.headlightBulbs.forEach((bulb) => {
        const mat = bulb.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = phys.headlightsOn ? 1.5 : 0.1;
      });

      if (!pausedRef.current && !garageOpenRef.current) {
        // --- A. Off-Road Driving Physics ---
        const hasFuel = phys.fuel > 0.1;
        const throttleInput = hasFuel ? (keys.forward ? 1 : keys.backward ? -0.75 : 0) : 0;

        // Steering response
        const targetSteer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
        const maxSteer = 0.56;
        phys.steerAngle = THREE.MathUtils.lerp(phys.steerAngle, targetSteer * maxSteer, dt * 7.5);

        // Surface grip & rolling resistance
        const tireBonus =
          customRef.current.tireStyle === 'mud_knobby'
            ? 1.18
            : customRef.current.tireStyle === 'all_terrain'
            ? 1.06
            : 0.95;

        let surfaceGrip = 1.0;
        let surfaceDrag = 1.65;
        if (surface === 'Deep Mud') {
          surfaceGrip = (phys.diffLock ? 0.82 : 0.52) * tireBonus;
          surfaceDrag = 3.8;
        } else if (surface === 'Shallow Water') {
          surfaceGrip = (phys.diffLock ? 0.78 : 0.58) * tireBonus;
          surfaceDrag = 4.2;
        } else if (surface === 'Golden Grass') {
          surfaceGrip = 0.88 * tireBonus;
          surfaceDrag = 2.0;
        } else if (surface === 'Alpine Rock') {
          surfaceGrip = (phys.diffLock ? 0.98 : 0.76) * tireBonus;
          surfaceDrag = 1.9;
        }

        // Vehicle-specific grip: rally cars and low-slung RWD classics are less capable
        // on loose dirt/water than high-clearance 4x4s.
        surfaceGrip *= THREE.MathUtils.clamp(spec.gripFactor / 92, 0.58, 1.08);
        if (spec.groundClearance < 55 && surface !== 'Dirt Trail') {
          surfaceGrip *= THREE.MathUtils.clamp(spec.groundClearance / 70, 0.42, 0.82);
          surfaceDrag *= 1.22;
        }

        // Terrain Slope Gravity Along Vehicle Heading
        const forwardX = Math.sin(phys.heading);
        const forwardZ = Math.cos(phys.heading);
        const hFront = getTerrainHeight(phys.x + forwardX * 1.3, phys.z + forwardZ * 1.3);
        const hBack = getTerrainHeight(phys.x - forwardX * 1.3, phys.z - forwardZ * 1.3);
        const slopeRise = (hFront - hBack) / 2.6;

        // Engine Force (Low Range multiplies climbing torque, caps top speed)
        const baseEnginePower = (spec.powerRating / 85) * 16.5;
        const powerSpeed = THREE.MathUtils.clamp(spec.powerRating / 95, 0.72, 1.35);
        const clearanceSpeed = spec.groundClearance < 55 && surface !== 'Dirt Trail' ? 0.68 : 1;
        const maxSpeed = (phys.lowRange ? 9.5 : 19.5) * powerSpeed * clearanceSpeed;
        const torqueMult = phys.lowRange ? 1.65 : 1.0;

        const engineAccel = throttleInput * baseEnginePower * torqueMult * surfaceGrip;
        const slopeGravityAccel = -slopeRise * 13.5;

        let prevSpeed = phys.speed;
        phys.speed += (engineAccel + slopeGravityAccel) * dt;

        // Braking & Drag
        if (keys.brake) {
          phys.speed *= Math.max(0, 1 - dt * 6.5);
        } else if (Math.abs(throttleInput) < 0.05) {
          // Hold on mild hills if brake or low-range engine braking
          phys.speed *= Math.max(0, 1 - dt * (phys.lowRange ? 3.5 : 2.1));
        }
        phys.speed *= Math.max(0, 1 - dt * surfaceDrag * 0.45);
        phys.speed = Math.max(-maxSpeed * 0.55, Math.min(maxSpeed, phys.speed));

        // --- B. Interactive Physics-Driven Winch Force ---
        if (phys.winchAnchor && customRef.current.hasWinch) {
          const toAncX = phys.winchAnchor.x - phys.x;
          const toAncZ = phys.winchAnchor.z - phys.z;
          const distToAnc = Math.hypot(toAncX, toAncZ);

          if (phys.winchReeling && distToAnc > 1.8) {
            phys.winchCableLen = Math.max(1.8, distToAnc - dt * 5.5);
            // Apply real pulling physics velocity toward the anchor
            const pullStrength = 9.5 * dt;
            phys.x += (toAncX / distToAnc) * pullStrength;
            phys.z += (toAncZ / distToAnc) * pullStrength;
            // Also align heading slightly toward the winch pull line
            const pullHeading = Math.atan2(toAncX, toAncZ);
            let hDiff = pullHeading - phys.heading;
            while (hDiff > Math.PI) hDiff -= Math.PI * 2;
            while (hDiff < -Math.PI) hDiff += Math.PI * 2;
            phys.heading += hDiff * dt * 1.4;
          } else if (phys.winchPayingOut) {
            phys.winchCableLen = Math.min(30, phys.winchCableLen + dt * 6.0);
          } else if (distToAnc > phys.winchCableLen && distToAnc > 0.1) {
            // Cable taut constraint holds vehicle on steep hills!
            const excess = distToAnc - phys.winchCableLen;
            phys.x += (toAncX / distToAnc) * excess * 0.85;
            phys.z += (toAncZ / distToAnc) * excess * 0.85;
          }
        }

        // Heading turn rate based on wheelbase & speed
        const turnFactor = Math.min(1, Math.abs(phys.speed) / 2.2);
        const dirSign = phys.speed >= -0.05 ? 1 : -1;
        const angularVel =
          (phys.steerAngle * phys.speed * 0.52) / Math.max(2.1, spec.wheelbase) *
          (0.45 + 0.55 * turnFactor) *
          dirSign;

        if (Math.abs(phys.speed) > 0.08) {
          phys.heading += angularVel * dt * 2.2;
        }

        // Integrate Position & Tree/Boulder Collider Pushback
        let nextX = phys.x + Math.sin(phys.heading) * phys.speed * dt;
        let nextZ = phys.z + Math.cos(phys.heading) * phys.speed * dt;

        // World boundary clamp
        const radialDist = Math.hypot(nextX, nextZ);
        if (radialDist > 165) {
          nextX *= 165 / radialDist;
          nextZ *= 165 / radialDist;
          phys.speed *= 0.5;
        }

        // Simple smooth circle collision resolution against trees & boulders
        for (const col of world.colliders) {
          const dx = nextX - col.x;
          const dz = nextZ - col.z;
          const minSep = col.radius + 1.05;
          const d = Math.hypot(dx, dz);
          if (d < minSep && d > 0.001) {
            const push = minSep - d;
            nextX += (dx / d) * push;
            nextZ += (dz / d) * push;
            phys.speed *= 0.72;
          }
        }

        phys.x = nextX;
        phys.z = nextZ;

        // Fuel consumption
        if (Math.abs(throttleInput) > 0.1) {
          phys.fuel = Math.max(0, phys.fuel - dt * 0.18);
        }

        // --- C. 4-Wheel Independent Suspension & Body Roll / Pitch ---
        const halfWb = spec.wheelbase * 0.5;
        const halfTrack = spec.trackWidth * 0.5;
        const cosH = Math.cos(phys.heading);
        const sinH = Math.sin(phys.heading);

        const localWheels: [number, number][] = [
          [halfTrack, halfWb],   // FL
          [-halfTrack, halfWb],  // FR
          [halfTrack, -halfWb], // RL
          [-halfTrack, -halfWb], // RR
        ];

        const wheelGroundHeights: number[] = [];
        localWheels.forEach(([lx, lz]) => {
          const wx = phys.x + lx * cosH + lz * sinH;
          const wz = phys.z - lx * sinH + lz * cosH;
          wheelGroundHeights.push(getTerrainHeight(wx, wz));
        });

        const avgGroundY =
          (wheelGroundHeights[0] +
            wheelGroundHeights[1] +
            wheelGroundHeights[2] +
            wheelGroundHeights[3]) *
          0.25;

        // Suspension spring-damper vertical bounce over bumps
        const targetY = avgGroundY;
        const yError = targetY - phys.y;
        phys.chassisBounceVel += yError * 48 * dt;
        phys.chassisBounceVel *= Math.max(0, 1 - dt * 8.5);
        phys.y += phys.chassisBounceVel * dt;
        if (Math.abs(phys.y - targetY) > 0.35) {
          phys.y = THREE.MathUtils.lerp(phys.y, targetY, 0.5);
        }

        // Terrain pitch & roll + Dynamic acceleration squat & cornering body roll
        const terrainPitch = Math.atan2(
          (wheelGroundHeights[2] + wheelGroundHeights[3]) * 0.5 -
            (wheelGroundHeights[0] + wheelGroundHeights[1]) * 0.5,
          spec.wheelbase
        );
        const terrainRoll = Math.atan2(
          (wheelGroundHeights[1] + wheelGroundHeights[3]) * 0.5 -
            (wheelGroundHeights[0] + wheelGroundHeights[2]) * 0.5,
          spec.trackWidth
        );

        const accelG = (phys.speed - prevSpeed) / Math.max(0.01, dt);
        const dynamicPitchSquat = -Math.max(-0.09, Math.min(0.09, accelG * 0.008));
        const dynamicCornerRoll = Math.max(
          -0.11,
          Math.min(0.11, phys.steerAngle * (phys.speed / 12) * 0.14)
        );

        phys.pitch = THREE.MathUtils.lerp(phys.pitch, terrainPitch, dt * 10);
        phys.roll = THREE.MathUtils.lerp(phys.roll, terrainRoll, dt * 10);

        builtVehicle.root.position.set(phys.x, phys.y, phys.z);
        builtVehicle.root.rotation.order = 'YXZ';
        builtVehicle.root.rotation.y = phys.heading;
        builtVehicle.root.rotation.x = phys.pitch;
        builtVehicle.root.rotation.z = phys.roll;

        // Subtle secondary body roll & pitch on the upper chassis group
        builtVehicle.chassisGroup.rotation.x = THREE.MathUtils.lerp(
          builtVehicle.chassisGroup.rotation.x,
          dynamicPitchSquat,
          dt * 8
        );
        builtVehicle.chassisGroup.rotation.z = THREE.MathUtils.lerp(
          builtVehicle.chassisGroup.rotation.z,
          dynamicCornerRoll,
          dt * 8
        );
        builtVehicle.chassisGroup.position.y = Math.sin(now * 0.018) * Math.min(0.025, Math.abs(phys.speed) * 0.003);

        // Whip antenna oscillation
        if (builtVehicle.antennaTip) {
          builtVehicle.antennaTip.rotation.x =
            -phys.speed * 0.03 + Math.sin(now * 0.015) * 0.08;
          builtVehicle.antennaTip.rotation.z =
            dynamicCornerRoll * 1.8 + Math.cos(now * 0.012) * 0.06;
        }

        // Wheel spin, steering knuckle yaw, and individual wheel suspension travel
        const tireCircumference = 0.44;
        const slipMultiplier = surface === 'Deep Mud' && Math.abs(throttleInput) > 0.5 ? 1.65 : 1.0;
        phys.wheelRotation += (phys.speed * slipMultiplier * dt) / tireCircumference;

        builtVehicle.steeringKnuckles.forEach((knuckle) => {
          knuckle.rotation.y = phys.steerAngle;
        });

        builtVehicle.wheels.forEach((wMesh, idx) => {
          wMesh.rotation.x = phys.wheelRotation;
          // Vertical wheel suspension travel relative to average chassis height
          const relTravel = Math.max(
            -0.14,
            Math.min(0.16, wheelGroundHeights[idx] - avgGroundY)
          );
          if (wMesh.parent) {
            wMesh.parent.position.y = 0.44 + relTravel;
          }
          if (builtVehicle.suspensionStruts[idx]) {
            builtVehicle.suspensionStruts[idx].scale.y = 1 - relTravel * 1.4;
          }
        });

        // Emit tire dust / mud / water splash particles
        if (Math.abs(phys.speed) > 1.8) {
          const speedRatio = Math.min(1, Math.abs(phys.speed) / 14);
          if (Math.random() < speedRatio * 0.75) {
            [2, 3].forEach((rIdx) => {
              const [lx, lz] = localWheels[rIdx];
              const wx = phys.x + lx * cosH + lz * sinH;
              const wz = phys.z - lx * sinH + lz * cosH;
              spawnParticle(wx, wheelGroundHeights[rIdx], wz, surface, speedRatio);
            });
          }
        }

        // --- D. Articulated Trailer Hitch & Kinematics ---
        if (builtTrailer) {
          if (trailerAttached) {
            // Hitch ball world coordinate behind vehicle
            const hitchLocalZ = builtVehicle.hitchWorldOffset.z;
            const hitchX = phys.x + sinH * hitchLocalZ;
            const hitchZ = phys.z + cosH * hitchLocalZ;
            const hitchY = getTerrainHeight(hitchX, hitchZ);

            // Trailer axle follows hitch at distance |axleZ|
            const towLen = Math.abs(builtTrailer.axleZ);
            const axleX = hitchX - Math.sin(phys.trailerHeading) * towLen;
            const axleZ = hitchZ - Math.cos(phys.trailerHeading) * towLen;

            // Smooth trailer yaw articulation (prevents jackknifing beyond 75 degrees)
            const targetYaw = Math.atan2(hitchX - axleX, hitchZ - axleZ);
            let yawDiff = targetYaw - phys.heading;
            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            const clampedDiff = Math.max(-1.25, Math.min(1.25, yawDiff));
            phys.trailerHeading = phys.heading + clampedDiff;

            phys.trailerX = hitchX;
            phys.trailerZ = hitchZ;

            const trailerAxleWorldX = hitchX - Math.sin(phys.trailerHeading) * towLen;
            const trailerAxleWorldZ = hitchZ - Math.cos(phys.trailerHeading) * towLen;
            const trailerAxleY = getTerrainHeight(trailerAxleWorldX, trailerAxleWorldZ);
            const trailerPitch = Math.atan2(trailerAxleY - hitchY, towLen);

            builtTrailer.root.position.set(hitchX, hitchY, hitchZ);
            builtTrailer.root.rotation.order = 'YXZ';
            builtTrailer.root.rotation.y = phys.trailerHeading;
            builtTrailer.root.rotation.x = trailerPitch;
            builtTrailer.root.rotation.z = phys.roll * 0.65;

            builtTrailer.wheels.forEach((tw) => {
              tw.rotation.x = phys.wheelRotation * 1.12;
            });
          } else {
            // Parked trailer
            const py = getTerrainHeight(phys.parkedTrailerX, phys.parkedTrailerZ);
            builtTrailer.root.position.set(phys.parkedTrailerX, py, phys.parkedTrailerZ);
            builtTrailer.root.rotation.set(0, phys.parkedTrailerHeading, 0);
          }
        }

        // Update Engine Audio
        const rpmNorm = Math.min(
          1,
          Math.abs(phys.speed) / (phys.lowRange ? 9 : 18) + Math.abs(throttleInput) * 0.25
        );
        soundManager.updateEngine(rpmNorm, Math.abs(throttleInput), false);
      } else {
        soundManager.updateEngine(0, 0, true);
      }

      // --- E. Update Winch Anchor Markers & Cable Mesh ---
      const bestAutoAnchor = findBestForwardAnchor();
      world.winchAnchors.forEach((anc) => {
        const ring = anchorMeshes.get(anc.id);
        if (!ring) return;
        const dist = Math.hypot(anc.x - phys.x, anc.z - phys.z);
        const showRing =
          customRef.current.hasWinch &&
          (phys.winchMode || phys.winchAnchor?.id === anc.id) &&
          dist < 28;
        ring.visible = showRing;
        if (showRing) {
          const isHoveredOrActive =
            phys.hoveredAnchor?.id === anc.id ||
            phys.winchAnchor?.id === anc.id ||
            bestAutoAnchor?.id === anc.id;
          ring.material = isHoveredOrActive ? anchorHoverMat : anchorValidMat;
          const pulse = 1 + Math.sin(now * 0.008) * 0.14;
          ring.scale.set(pulse, pulse, 1);
        }
      });

      if (phys.winchAnchor && customRef.current.hasWinch) {
        const startWorld = builtVehicle.winchFairleadPos.clone();
        builtVehicle.root.localToWorld(startWorld);
        const endWorld = new THREE.Vector3(
          phys.winchAnchor.x,
          phys.winchAnchor.y,
          phys.winchAnchor.z
        );

        const cableVec = endWorld.clone().sub(startWorld);
        const cableLen = cableVec.length();
        const midPoint = startWorld.clone().addScaledVector(cableVec, 0.5);

        winchCableMesh.visible = true;
        winchCableMesh.position.copy(midPoint);
        winchCableMesh.scale.set(1, 1, cableLen);
        winchCableMesh.lookAt(endWorld);

        hookMarkerMesh.visible = true;
        hookMarkerMesh.position.copy(endWorld);
      } else {
        winchCableMesh.visible = false;
        hookMarkerMesh.visible = false;
      }

      // --- F. Update Particles & Wildlife ---
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particleGroup.remove(p.mesh);
          particles.splice(i, 1);
        } else {
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          const s = (1 - p.life / p.maxLife) * 1.1;
          p.mesh.scale.set(s, s, s);
        }
      }

      const closestWildlife = wildlifeSystem.update(dt, phys.x, phys.z);

      // Keep shadow frustum centered near player
      sunLight.position.set(phys.x + 75, phys.y + 68, phys.z - 65);
      sunLight.target.position.set(phys.x, phys.y, phys.z);

      // --- G. Smooth Third-Person Follow / Garage Showroom Camera ---
      if (garageOpenRef.current) {
        // Slowly orbit the vehicle at a flattering 3/4 vintage showroom angle
        const garageAngle = phys.heading + 2.45 + Math.sin(now * 0.0004) * 0.35;
        const garageDist = 5.4;
        const desiredCam = new THREE.Vector3(
          phys.x + Math.sin(garageAngle) * garageDist,
          phys.y + 2.15,
          phys.z + Math.cos(garageAngle) * garageDist
        );
        const desiredLook = new THREE.Vector3(phys.x, phys.y + 1.05, phys.z);
        camState.currentPos.lerp(desiredCam, dt * 5);
        camState.currentLookAt.lerp(desiredLook, dt * 6);
      } else {
        // Auto-center yaw gently while driving forward if user isn't dragging mouse
        if (!camState.isDragging && Math.abs(phys.speed) > 1.5) {
          camState.yawOffset = THREE.MathUtils.lerp(camState.yawOffset, 0, dt * 1.35);
        }

        const effectiveDist =
          cameraModeRef.current === 'close'
            ? 5.0
            : cameraModeRef.current === 'photo'
            ? 3.8
            : camState.distance;

        const camYaw = phys.heading + Math.PI + camState.yawOffset;
        const horizDist = Math.cos(camState.pitchOffset) * effectiveDist;
        const vertHeight = Math.sin(camState.pitchOffset) * effectiveDist + 1.1;

        const desiredX = phys.x + Math.sin(camYaw) * horizDist;
        const desiredZ = phys.z + Math.cos(camYaw) * horizDist;
        const groundAtCam = getTerrainHeight(desiredX, desiredZ);
        const desiredY = Math.max(groundAtCam + 0.85, phys.y + vertHeight);

        camState.currentPos.lerp(new THREE.Vector3(desiredX, desiredY, desiredZ), dt * 7.5);

        const lookAhead = Math.max(-1.5, Math.min(3.2, phys.speed * 0.16));
        const targetLook = new THREE.Vector3(
          phys.x + Math.sin(phys.heading) * lookAhead,
          phys.y + 1.25,
          phys.z + Math.cos(phys.heading) * lookAhead
        );
        camState.currentLookAt.lerp(targetLook, dt * 9.5);
      }

      camera.position.copy(camState.currentPos);
      camera.lookAt(camState.currentLookAt);

      // --- H. Landmark Discovery & Telemetry Updates ---
      telemetryTimer += dt;
      if (telemetryTimer >= 0.08) {
        telemetryTimer = 0;

        let activeLandmark: Landmark | null = null;
        for (const lm of landmarksRef.current) {
          const dLm = Math.hypot(lm.x - phys.x, lm.z - phys.z);
          if (dLm <= lm.radius) {
            activeLandmark = lm;
            if (!lm.discovered) {
              soundManager.playDiscoveryChime();
              onDiscoverLandmark(lm.id);
            }
            break;
          }
        }

        const distToParkedTrailer =
          builtTrailer && !trailerAttached
            ? Math.hypot(phys.x - phys.parkedTrailerX, phys.z - phys.parkedTrailerZ)
            : Infinity;

        const speedKmh = Math.round(Math.abs(phys.speed) * 3.6);
        const gearLabel =
          phys.speed < -0.4
            ? 'R'
            : Math.abs(phys.speed) < 0.3
            ? 'N'
            : phys.lowRange
            ? 'L1'
            : speedKmh < 18
            ? '1'
            : speedKmh < 38
            ? '2'
            : '3';

        const degHeading =
          ((Math.round((-phys.heading * 180) / Math.PI) % 360) + 360) % 360;

        onUpdateTelemetry({
          speedKmh,
          rpm: Math.round(850 + (speedKmh / (phys.lowRange ? 32 : 68)) * 3400),
          gear: gearLabel,
          fuelPercent: Math.round(phys.fuel),
          surfaceType: surface,
          pitchDeg: Math.round((phys.pitch * 180) / Math.PI),
          rollDeg: Math.round((phys.roll * 180) / Math.PI),
          allWheelDrive: true,
          lowRange: phys.lowRange,
          diffLock: phys.diffLock,
          headlightsOn: phys.headlightsOn,
          winchMode: phys.winchMode,
          winchAttached: Boolean(phys.winchAnchor),
          winchAnchorLabel:
            phys.winchAnchor?.label ||
            phys.hoveredAnchor?.label ||
            bestAutoAnchor?.label ||
            null,
          winchCableLength: phys.winchAnchor
            ? Number(
                Math.hypot(
                  phys.winchAnchor.x - phys.x,
                  phys.winchAnchor.z - phys.z
                ).toFixed(1)
              )
            : 0,
          winchPulling: phys.winchReeling,
          winchPayingOut: phys.winchPayingOut,
          hoveredAnchor: phys.hoveredAnchor || bestAutoAnchor,
          trailerAttached,
          nearbyTrailerSpot:
            distToParkedTrailer < 12 ? 'Press T to Hitch Trailer' : null,
          nearbyLandmark: activeLandmark,
          nearbyWildlife: closestWildlife ? closestWildlife.species.name : null,
          headingDeg: degHeading,
          altitudeM: Math.round(310 + phys.y * 8.5),
          positionX: Math.round(phys.x),
          positionZ: Math.round(phys.z),
        });
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      aria-label="3D Retro Off-Road Exploration Viewport"
    />
  );
};
