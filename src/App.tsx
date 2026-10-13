import React, { useCallback, useRef, useState } from 'react';
import {
  CapturedPhoto,
  INITIAL_LANDMARKS,
  INITIAL_WILDLIFE,
  Landmark,
  TelemetryState,
  VehicleCustomization,
  VEHICLE_SPECS,
  WildlifeSpecies,
} from './types/game';
import { ControlActionsRef, ExplorationScene } from './components/ExplorationScene';
import { GameHud } from './components/GameHud';
import { GarageModal } from './components/GarageModal';
import { JournalModal } from './components/JournalModal';
import { soundManager } from './utils/sound';
import { Compass, Play, Volume2, VolumeX, Wrench, X } from 'lucide-react';

export default function App() {
  const [customization, setCustomization] = useState<VehicleCustomization>({
    vehicleId: 'trail_jeep',
    paintColor: 'olive_green',
    wheelStyle: 'steel_classic',
    tireStyle: 'all_terrain',
    bumperStyle: 'heavy_expedition',
    roofAccessory: 'expedition_rack',
    hasAuxiliaryLights: true,
    hasSpareTire: true,
    hasWinch: true,
    hasSnorkelAndAntenna: true,
    trailerType: 'utility_trailer',
  });

  const [showTitleCard, setShowTitleCard] = useState<boolean>(false);
  const [isGarageOpen, setIsGarageOpen] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'follow' | 'close' | 'photo'>('follow');

  const [landmarks, setLandmarks] = useState<Landmark[]>(INITIAL_LANDMARKS);
  const [wildlife, setWildlife] = useState<WildlifeSpecies[]>(INITIAL_WILDLIFE);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [photoToast, setPhotoToast] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.35);

  const [telemetry, setTelemetry] = useState<TelemetryState>({
    speedKmh: 0,
    rpm: 850,
    gear: 'N',
    fuelPercent: 100,
    surfaceType: 'Golden Grass',
    pitchDeg: 0,
    rollDeg: 0,
    allWheelDrive: true,
    lowRange: false,
    diffLock: false,
    headlightsOn: true,
    winchMode: false,
    winchAttached: false,
    winchAnchorLabel: null,
    winchCableLength: 0,
    winchPulling: false,
    winchPayingOut: false,
    hoveredAnchor: null,
    trailerAttached: true,
    nearbyTrailerSpot: null,
    nearbyLandmark: INITIAL_LANDMARKS[3],
    nearbyWildlife: null,
    headingDeg: 0,
    altitudeM: 318,
    positionX: 18,
    positionZ: 16,
  });

  const actionsRef = useRef<ControlActionsRef | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setPhotoToast(msg);
    setTimeout(() => {
      setPhotoToast((prev) => (prev === msg ? null : prev));
    }, 4200);
  }, []);

  const handleDiscoverLandmark = useCallback(
    (landmarkId: string) => {
      setLandmarks((prev) =>
        prev.map((lm) => {
          if (lm.id === landmarkId && !lm.discovered) {
            triggerToast(`Landmark Charted: ${lm.name}`);
            return { ...lm, discovered: true };
          }
          return lm;
        })
      );
    },
    [triggerToast]
  );

  const handlePhotoCaptured = useCallback(
    (photo: CapturedPhoto, wildlifeId?: string, landmarkId?: string) => {
      setPhotos((prev) => [photo, ...prev]);

      if (wildlifeId) {
        setWildlife((prev) =>
          prev.map((w) => (w.id === wildlifeId ? { ...w, photographed: true } : w))
        );
        triggerToast(`Wildlife Photographed: ${photo.subjectName}`);
      } else if (landmarkId) {
        setLandmarks((prev) =>
          prev.map((l) =>
            l.id === landmarkId ? { ...l, discovered: true, photographed: true } : l
          )
        );
        triggerToast(`Scenic Landmark Photographed: ${photo.subjectName}`);
      } else {
        triggerToast(`Photograph Saved to Field Journal`);
      }
    },
    [triggerToast]
  );

  const handleCycleCameraMode = () => {
    setCameraMode((prev) =>
      prev === 'follow' ? 'close' : prev === 'close' ? 'photo' : 'follow'
    );
    actionsRef.current?.toggleCameraDistance();
  };

  const toggleAudioMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  return (
    <main id="top" className="relative w-screen h-screen overflow-hidden bg-stone-950 select-none">
      {/* Full-Viewport 3D Off-Road Exploration Canvas */}
      <ExplorationScene
        customization={customization}
        isPaused={isJournalOpen || isSettingsOpen || showTitleCard}
        isGarageOpen={isGarageOpen}
        cameraMode={cameraMode}
        landmarks={landmarks}
        wildlifeList={wildlife}
        onUpdateTelemetry={setTelemetry}
        onDiscoverLandmark={handleDiscoverLandmark}
        onPhotoCaptured={handlePhotoCaptured}
        actionsRef={actionsRef}
      />

      {/* Semantic HUD Overlay */}
      <GameHud
        telemetry={telemetry}
        customization={customization}
        landmarks={landmarks}
        cameraMode={cameraMode}
        photoToast={photoToast}
        onOpenGarage={() => {
          setIsJournalOpen(false);
          setIsSettingsOpen(false);
          setIsGarageOpen((prev) => !prev);
        }}
        onOpenJournal={() => {
          setIsGarageOpen(false);
          setIsSettingsOpen(false);
          setIsJournalOpen(true);
        }}
        onOpenSettings={() => {
          setIsGarageOpen(false);
          setIsJournalOpen(false);
          setIsSettingsOpen(true);
        }}
        onCycleCameraMode={handleCycleCameraMode}
        actionsRef={actionsRef}
      />

      {/* Garage & Retro Vehicle Customization Drawer */}
      {isGarageOpen && (
        <GarageModal
          customization={customization}
          onChange={setCustomization}
          onClose={() => setIsGarageOpen(false)}
        />
      )}

      {/* Field Discovery & Wildlife Photography Journal */}
      {isJournalOpen && (
        <JournalModal
          landmarks={landmarks}
          wildlife={wildlife}
          photos={photos}
          onTakePhotoNow={() => actionsRef.current?.takePhotograph()}
          onClose={() => setIsJournalOpen(false)}
        />
      )}

      {/* Settings, Audio & Controls Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-30 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <p className="text-xs text-amber-400">Expedition Configuration</p>
                <h2 className="text-xl font-bold font-display text-stone-100">
                  Settings, Audio & Driving Controls
                </h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Resume</span>
              </button>
            </div>

            {/* Quick Vehicle Switcher in Pause Menu */}
            <div>
              <h3 className="text-xs font-semibold text-stone-300 mb-2">
                Quick Select Retro 4x4 Chassis
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_SPECS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() =>
                      setCustomization((prev) => ({
                        ...prev,
                        vehicleId: v.id,
                        paintColor: v.defaultColor,
                        roofAccessory: v.defaultRoof,
                      }))
                    }
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      customization.vehicleId === v.id
                        ? 'bg-stone-800 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-stone-950/50 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="text-stone-400">{v.subtitle}</div>
                    <div className="truncate mt-0.5">{v.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-between gap-4 pt-3 border-t border-stone-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAudioMute}
                  className="px-3.5 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-red-400" />
                      <span>Unmute Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <span>Engine & Trail Audio Active</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <span className="text-xs text-stone-400">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    soundManager.setVolume(v);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Keyboard & Mouse Reference */}
            <div className="pt-3 border-t border-stone-800">
              <h3 className="text-xs font-semibold text-stone-300 mb-2.5">
                Off-Road Driving & Winch Controls
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-stone-400">
                <div className="flex justify-between">
                  <span>Drive / Steer</span>
                  <span className="font-mono text-stone-200">W A S D / Arrows</span>
                </div>
                <div className="flex justify-between">
                  <span>Handbrake</span>
                  <span className="font-mono text-stone-200">Spacebar</span>
                </div>
                <div className="flex justify-between">
                  <span>Winch Aim Mode</span>
                  <span className="font-mono text-stone-200">V / Click Anchor</span>
                </div>
                <div className="flex justify-between">
                  <span>Quick-Hook Winch</span>
                  <span className="font-mono text-stone-200">E</span>
                </div>
                <div className="flex justify-between">
                  <span>Winch Pull / Slack</span>
                  <span className="font-mono text-stone-200">Hold F / Hold G</span>
                </div>
                <div className="flex justify-between">
                  <span>Release Winch</span>
                  <span className="font-mono text-stone-200">X</span>
                </div>
                <div className="flex justify-between">
                  <span>Hitch / Unhitch Trailer</span>
                  <span className="font-mono text-stone-200">T</span>
                </div>
                <div className="flex justify-between">
                  <span>Low Range / Diff Lock</span>
                  <span className="font-mono text-stone-200">L / K</span>
                </div>
                <div className="flex justify-between">
                  <span>Snap Wildlife Photo</span>
                  <span className="font-mono text-stone-200">P</span>
                </div>
                <div className="flex justify-between">
                  <span>Orbit / Reset Camera</span>
                  <span className="font-mono text-stone-200">Drag Mouse / R</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-800">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsGarageOpen(true);
                }}
                className="px-4 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Open 3D Garage</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Continue Expedition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional Main Menu Overlay when requested */}
      {showTitleCard && (
        <div className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-stone-900/95 border border-stone-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
            <div className="inline-flex items-center gap-2 text-xs text-amber-400">
              <Compass className="w-4 h-4" />
              <span>Stylized Retro 4x4 Off-Road Exploration</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-stone-100">
              Over the Ridge
            </h1>
            <p className="text-sm text-stone-300 leading-relaxed">
              Drive classic rounded vintage 4x4 vehicles across golden mountain grasslands,
              winch up steep alpine passes, tow expedition trailers, and photograph native
              wildlife.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowTitleCard(false)}
                className="px-6 py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors cursor-pointer"
              >
                Continue Trail
              </button>
              <button
                onClick={() => {
                  setShowTitleCard(false);
                  setIsGarageOpen(true);
                }}
                className="px-5 py-2.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                Customize 4x4 Rig
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
