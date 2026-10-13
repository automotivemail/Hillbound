import React from 'react';
import {
  Anchor,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Compass,
  Fuel,
  RotateCcw,
  Sun,
  Truck,
} from 'lucide-react';
import { Landmark, TelemetryState, VehicleCustomization, VEHICLE_SPECS } from '../types/game';
import { ControlActionsRef } from './ExplorationScene';

interface GameHudProps {
  telemetry: TelemetryState;
  customization: VehicleCustomization;
  landmarks: Landmark[];
  cameraMode: 'follow' | 'close' | 'photo';
  photoToast: string | null;
  onOpenGarage: () => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
  onCycleCameraMode: () => void;
  actionsRef: React.MutableRefObject<ControlActionsRef | null>;
}

export const GameHud: React.FC<GameHudProps> = ({
  telemetry,
  customization,
  landmarks,
  cameraMode,
  photoToast,
  onOpenGarage,
  onOpenJournal,
  onOpenSettings,
  onCycleCameraMode,
  actionsRef,
}) => {
  const activeVehicle =
    VEHICLE_SPECS.find((v) => v.id === customization.vehicleId) || VEHICLE_SPECS[0];
  const discoveredCount = landmarks.filter((l) => l.discovered).length;

  // Next undiscovered landmark for subtle exploration guidance
  const nextLandmark = landmarks.find((l) => !l.discovered);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="pointer-events-auto flex items-center justify-between gap-8 px-6 py-3.5 bg-stone-950/65 backdrop-blur-md border-b border-white/10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            actionsRef.current?.resetCamera();
          }}
          className="text-lg font-bold tracking-tight font-display text-stone-100 whitespace-nowrap shrink-0"
        >
          Over the Ridge
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-300">
          <button
            onClick={onOpenGarage}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Garage
          </button>
          <button
            onClick={onOpenJournal}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Field Journal
          </button>
          <button
            onClick={onCycleCameraMode}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Camera View
          </button>
          <button
            onClick={onOpenSettings}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Settings & Controls
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => actionsRef.current?.takePhotograph()}
            className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap Photo (P)</span>
          </button>
        </div>
      </header>

      {/* Upper HUD Strip: Exploration Telemetry & Active Sightings */}
      <div className="px-6 pt-3 flex flex-wrap items-start justify-between gap-4">
        {/* Left: Compass, Surface, and Expedition Objective */}
        <div className="bg-stone-950/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 max-w-sm pointer-events-auto">
          <div className="flex items-center gap-2 text-xs text-stone-300 font-mono">
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>HDG {telemetry.headingDeg}°</span>
            <span aria-hidden="true">·</span>
            <span>{telemetry.altitudeM}m ASL</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300 font-sans font-medium">
              {telemetry.surfaceType}
            </span>
          </div>

          <div className="mt-1.5 text-xs text-stone-300">
            <span className="text-stone-400">Expedition Progress: </span>
            <span className="font-mono text-stone-100">
              {discoveredCount}/{landmarks.length} Landmarks
            </span>
            {nextLandmark && (
              <span className="block text-stone-400 mt-0.5 truncate">
                Next Trail Target: {nextLandmark.name} ({nextLandmark.x}m, {nextLandmark.z}m)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/10 md:hidden">
            <button
              onClick={onOpenGarage}
              className="px-2.5 py-1 text-xs font-medium bg-stone-800 text-stone-200 rounded whitespace-nowrap shrink-0 cursor-pointer"
            >
              Garage
            </button>
            <button
              onClick={onOpenJournal}
              className="px-2.5 py-1 text-xs font-medium bg-stone-800 text-stone-200 rounded whitespace-nowrap shrink-0 cursor-pointer"
            >
              Journal
            </button>
            <button
              onClick={onOpenSettings}
              className="px-2.5 py-1 text-xs font-medium bg-stone-800 text-stone-200 rounded whitespace-nowrap shrink-0 cursor-pointer"
            >
              Controls
            </button>
          </div>
        </div>

        {/* Center/Right Notifications: Nearby Landmark, Wildlife Sighting, or Photo Toast */}
        <div className="flex flex-col items-end gap-2">
          {photoToast && (
            <div className="bg-stone-950/85 backdrop-blur-md border border-amber-400/60 text-stone-100 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg">
              {photoToast}
            </div>
          )}

          {telemetry.nearbyLandmark && (
            <div className="bg-stone-950/75 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl max-w-xs text-right">
              <div className="text-xs text-amber-400">
                Scenic Location · {telemetry.nearbyLandmark.category}
              </div>
              <div className="text-sm font-semibold font-display text-stone-100">
                {telemetry.nearbyLandmark.name}
              </div>
            </div>
          )}

          {telemetry.nearbyWildlife && (
            <div className="bg-stone-950/75 backdrop-blur-md border border-emerald-500/40 px-4 py-2 rounded-xl text-xs text-stone-200 flex items-center gap-2 pointer-events-auto">
              <span>Wildlife Nearby: {telemetry.nearbyWildlife}</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => actionsRef.current?.takePhotograph()}
                className="text-amber-300 hover:underline font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Photograph (P)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom HUD Strip: Winch & Trailer Controls (Left), Mobile Steering (Center), Speedometer & 4x4 Gearing (Right) */}
      <div className="p-6 flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4">
        {/* Bottom-Left: Interactive Physics Winch & Trailer Recovery Deck */}
        <div className="bg-stone-950/65 backdrop-blur-md border border-white/10 rounded-xl p-4 pointer-events-auto max-w-md">
          <div className="flex items-center justify-between gap-4 mb-2.5">
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <Anchor className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-stone-100">Front Bumper Winch</span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-400 truncate">
                {!customization.hasWinch
                  ? 'Not Installed (Enable in Garage)'
                  : telemetry.winchAttached
                  ? `Hooked: ${telemetry.winchAnchorLabel} (${telemetry.winchCableLength}m)`
                  : telemetry.winchAnchorLabel
                  ? `Ready: ${telemetry.winchAnchorLabel}`
                  : 'Drive within 28m of tree or boulder'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => actionsRef.current?.toggleWinchMode()}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                telemetry.winchMode
                  ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold'
                  : 'bg-stone-900/80 text-stone-200 border-white/10 hover:bg-stone-800'
              }`}
            >
              Aim Winch (V)
            </button>

            <button
              onClick={() => actionsRef.current?.attachNearestWinch()}
              className="px-3 py-1.5 text-xs font-medium bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Hook Anchor (E)
            </button>

            <button
              onPointerDown={() => actionsRef.current?.setWinchReel(true)}
              onPointerUp={() => actionsRef.current?.setWinchReel(false)}
              onPointerLeave={() => actionsRef.current?.setWinchReel(false)}
              disabled={!telemetry.winchAttached}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                telemetry.winchPulling
                  ? 'bg-emerald-500 text-stone-950 border-emerald-400 font-semibold'
                  : telemetry.winchAttached
                  ? 'bg-stone-900/90 hover:bg-stone-800 text-emerald-300 border-emerald-500/40'
                  : 'bg-stone-900/40 text-stone-600 border-white/5 cursor-not-allowed'
              }`}
            >
              Pull / Reel In (F)
            </button>

            <button
              onPointerDown={() => actionsRef.current?.setWinchPayout(true)}
              onPointerUp={() => actionsRef.current?.setWinchPayout(false)}
              onPointerLeave={() => actionsRef.current?.setWinchPayout(false)}
              disabled={!telemetry.winchAttached}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                telemetry.winchAttached
                  ? 'bg-stone-900/80 hover:bg-stone-800 text-stone-300 border-white/10'
                  : 'bg-stone-900/40 text-stone-600 border-white/5 cursor-not-allowed'
              }`}
            >
              Slack (G)
            </button>

            {telemetry.winchAttached && (
              <button
                onClick={() => actionsRef.current?.releaseWinch()}
                className="px-2.5 py-1.5 text-xs font-medium bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Release (X)
              </button>
            )}
          </div>

          {/* Trailer & Recovery Sub-Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              {customization.trailerType !== 'none' && (
                <button
                  onClick={() => actionsRef.current?.toggleTrailerAttached()}
                  className="px-2.5 py-1 text-xs font-medium bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-white/10 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {telemetry.trailerAttached ? 'Unhitch Trailer (T)' : 'Hitch Trailer (T)'}
                  </span>
                </button>
              )}

              <button
                onClick={() => actionsRef.current?.recoverVehicle()}
                className="px-2.5 py-1 text-xs font-medium bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-white/10 rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Recover to Camp</span>
              </button>
            </div>

            <span className="text-stone-400 hidden sm:inline">
              WASD / Arrows to Drive · Drag Mouse to Orbit Camera
            </span>
          </div>
        </div>

        {/* Center: On-Screen Touch / Pointer Driving Pad for Mobile or Mouse Play */}
        <div className="flex items-center justify-center gap-2 pointer-events-auto lg:pb-1">
          <div className="flex items-center gap-1.5 bg-stone-950/60 backdrop-blur-sm border border-white/10 p-1.5 rounded-xl">
            <button
              onPointerDown={() => actionsRef.current?.setMobileInput('left', true)}
              onPointerUp={() => actionsRef.current?.setMobileInput('left', false)}
              onPointerLeave={() => actionsRef.current?.setMobileInput('left', false)}
              aria-label="Steer Left"
              className="w-10 h-10 rounded-lg bg-stone-900/90 hover:bg-stone-800 active:bg-amber-500 active:text-stone-950 text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col gap-1.5">
              <button
                onPointerDown={() => actionsRef.current?.setMobileInput('forward', true)}
                onPointerUp={() => actionsRef.current?.setMobileInput('forward', false)}
                onPointerLeave={() => actionsRef.current?.setMobileInput('forward', false)}
                aria-label="Accelerate"
                className="w-10 h-10 rounded-lg bg-stone-900/90 hover:bg-stone-800 active:bg-amber-500 active:text-stone-950 text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onPointerDown={() => actionsRef.current?.setMobileInput('backward', true)}
                onPointerUp={() => actionsRef.current?.setMobileInput('backward', false)}
                onPointerLeave={() => actionsRef.current?.setMobileInput('backward', false)}
                aria-label="Reverse"
                className="w-10 h-10 rounded-lg bg-stone-900/90 hover:bg-stone-800 active:bg-amber-500 active:text-stone-950 text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
            <button
              onPointerDown={() => actionsRef.current?.setMobileInput('right', true)}
              onPointerUp={() => actionsRef.current?.setMobileInput('right', false)}
              onPointerLeave={() => actionsRef.current?.setMobileInput('right', false)}
              aria-label="Steer Right"
              className="w-10 h-10 rounded-lg bg-stone-900/90 hover:bg-stone-800 active:bg-amber-500 active:text-stone-950 text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom-Right: Vintage Speedometer, Transfer Case & Inclinometer */}
        <div className="bg-stone-950/65 backdrop-blur-md border border-white/10 rounded-xl p-4 pointer-events-auto flex items-center gap-5">
          {/* Speed & Gear Readout */}
          <div className="pr-4 border-r border-white/10">
            <div className="text-xs text-stone-400 truncate max-w-[150px]">
              {activeVehicle.name}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-bold font-mono text-stone-100 tracking-tight">
                {telemetry.speedKmh}
              </span>
              <span className="text-xs text-stone-400 font-mono">km/h</span>
              <span className="ml-2 px-2 py-0.5 text-xs font-mono font-bold bg-stone-800 text-amber-400 rounded">
                {telemetry.gear}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-stone-400 font-mono">
              <span>Pitch {telemetry.pitchDeg}°</span>
              <span aria-hidden="true">·</span>
              <span>Roll {telemetry.rollDeg}°</span>
            </div>
          </div>

          {/* 4x4 Transfer Case Controls & Fuel */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => actionsRef.current?.toggleLowRange()}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  telemetry.lowRange
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                    : 'bg-stone-900/80 text-stone-300 border-white/10 hover:bg-stone-800'
                }`}
              >
                LOW GEAR (L)
              </button>
              <button
                onClick={() => actionsRef.current?.toggleDiffLock()}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  telemetry.diffLock
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                    : 'bg-stone-900/80 text-stone-300 border-white/10 hover:bg-stone-800'
                }`}
              >
                DIFF LOCK (K)
              </button>
              <button
                onClick={() => actionsRef.current?.toggleHeadlights()}
                aria-label="Toggle Headlights"
                className={`p-1.5 rounded border transition-colors cursor-pointer ${
                  telemetry.headlightsOn
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400/50'
                    : 'bg-stone-900/80 text-stone-500 border-white/10'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fuel Bar & Camera Distance Indicator */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-stone-300 font-mono">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                <span>{telemetry.fuelPercent}%</span>
                {telemetry.fuelPercent < 25 && (
                  <button
                    onClick={() => actionsRef.current?.refuelVehicle()}
                    className="text-amber-400 underline ml-1 font-sans cursor-pointer"
                  >
                    Jerry Can Refill
                  </button>
                )}
              </div>
              <span className="text-stone-400">
                Cam: {cameraMode === 'follow' ? 'Trail' : cameraMode === 'close' ? 'Close' : 'Photo'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
