import React, { useState } from 'react';
import {
  BumperStyleId,
  PAINT_SWATCHES,
  RoofAccessoryId,
  TireStyleId,
  TrailerTypeId,
  VehicleCustomization,
  VEHICLE_SPECS,
  WheelStyleId,
} from '../types/game';
import { Check, Compass, Shield, Truck, Wrench, X } from 'lucide-react';

interface GarageModalProps {
  customization: VehicleCustomization;
  onChange: (updated: VehicleCustomization) => void;
  onClose: () => void;
}

type GarageTab = 'vehicles' | 'paint_wheels' | 'expedition_gear' | 'trailers';

export const GarageModal: React.FC<GarageModalProps> = ({
  customization,
  onChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GarageTab>('vehicles');

  const activeSpec =
    VEHICLE_SPECS.find((v) => v.id === customization.vehicleId) || VEHICLE_SPECS[0];

  const updateField = <K extends keyof VehicleCustomization>(
    key: K,
    value: VehicleCustomization[K]
  ) => {
    onChange({ ...customization, [key]: value });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full max-w-md bg-stone-950/90 backdrop-blur-md border-l border-stone-800/80 text-stone-100 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800/80">
        <div>
          <p className="text-xs text-amber-400/90 tracking-wide">
            Basecamp Outfitter · Live 3D Preview
          </p>
          <h2 className="text-xl font-bold font-display text-stone-100">
            Retro 4x4 Garage & Rigging
          </h2>
        </div>
        <button
          onClick={onClose}
          className="px-3.5 py-2 text-xs font-medium text-stone-200 bg-stone-800/90 hover:bg-stone-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Back to Trail</span>
        </button>
      </div>

      {/* Interactive Segmented Tab Bar */}
      <div className="px-6 pt-4 pb-2">
        <div className="grid grid-cols-4 gap-1 p-1 bg-stone-900 rounded-lg border border-stone-800/70">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-amber-600 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            4x4 Chassis
          </button>
          <button
            onClick={() => setActiveTab('paint_wheels')}
            className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'paint_wheels'
                ? 'bg-amber-600 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            Paint & Tires
          </button>
          <button
            onClick={() => setActiveTab('expedition_gear')}
            className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'expedition_gear'
                ? 'bg-amber-600 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            Roof & Winch
          </button>
          <button
            onClick={() => setActiveTab('trailers')}
            className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'trailers'
                ? 'bg-amber-600 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            Trailers
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <p className="text-xs text-stone-400 leading-relaxed">
              Select a vintage recreational off-road chassis. Each model features distinct
              rounded bodywork, wheelbase geometry, and suspension travel.
            </p>
            <div className="space-y-3">
              {VEHICLE_SPECS.map((v) => {
                const isSelected = customization.vehicleId === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() =>
                      onChange({
                        ...customization,
                        vehicleId: v.id,
                        paintColor: v.defaultColor,
                        roofAccessory: v.defaultRoof,
                      })
                    }
                    className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 border-amber-500/80'
                        : 'bg-stone-900/40 border-stone-800/80 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <span>{v.subtitle}</span>
                          <span aria-hidden="true">·</span>
                          <span>{v.era}</span>
                        </div>
                        <h3 className="text-base font-semibold text-stone-100 mt-0.5">
                          {v.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <span className="text-xs font-medium text-amber-400 flex items-center gap-1 whitespace-nowrap shrink-0">
                          <Check className="w-4 h-4" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                      {v.description}
                    </p>
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-stone-800/60 text-xs">
                      <div>
                        <span className="text-stone-500 block">Torque</span>
                        <span className="font-mono text-stone-200">{v.powerRating} Nm</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Traction</span>
                        <span className="font-mono text-stone-200">{v.gripFactor}%</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Clearance</span>
                        <span className="font-mono text-stone-200">{v.groundClearance} cm</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'paint_wheels' && (
          <div className="space-y-6">
            {/* Vintage Paint Swatches */}
            <div>
              <h3 className="text-sm font-semibold text-stone-200 mb-1">
                01. Heritage Matte Body Paint
              </h3>
              <p className="text-xs text-stone-400 mb-3">
                Restrained vintage finishes with limestone cream roof and bezel accents.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {PAINT_SWATCHES.map((swatch) => {
                  const active = customization.paintColor === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      onClick={() => updateField('paintColor', swatch.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-stone-900 border-amber-500'
                          : 'bg-stone-900/40 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-md shrink-0 border border-white/20"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <span className="text-xs font-medium text-stone-200 truncate">
                        {swatch.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wheel Rim Style */}
            <div className="pt-4 border-t border-stone-800/70">
              <h3 className="text-sm font-semibold text-stone-200 mb-2.5">
                02. Vintage Wheel Rim Style
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'steel_classic', label: 'Cream Steelie' },
                    { id: 'spoked_rally', label: '6-Spoke Alloy' },
                    { id: 'heavy_beadlock', label: 'Trail Beadlock' },
                  ] as { id: WheelStyleId; label: string }[]
                ).map((w) => (
                  <button
                    key={w.id}
                    onClick={() => updateField('wheelStyle', w.id)}
                    className={`px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      customization.wheelStyle === w.id
                        ? 'bg-stone-800 border-amber-500 text-amber-300'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Off-Road Tire Tread */}
            <div className="pt-4 border-t border-stone-800/70">
              <h3 className="text-sm font-semibold text-stone-200 mb-2.5">
                03. Off-Road Tire Compound & Tread
              </h3>
              <div className="space-y-2">
                {(
                  [
                    {
                      id: 'all_terrain',
                      label: 'All-Terrain Radial',
                      desc: 'Balanced grip across golden grass, dirt trails, and rock.',
                    },
                    {
                      id: 'mud_knobby',
                      label: 'Deep-Lug Mud Knobby',
                      desc: 'Aggressive shoulder lugs (+18% traction in lakeside mud).',
                    },
                    {
                      id: 'vintage_ribbed',
                      label: '1960s Military Ribbed',
                      desc: 'Narrow classic sidewall profile for authentic period look.',
                    },
                  ] as { id: TireStyleId; label: string; desc: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateField('tireStyle', t.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      customization.tireStyle === t.id
                        ? 'bg-stone-900 border-amber-500'
                        : 'bg-stone-900/40 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-200">{t.label}</span>
                      {customization.tireStyle === t.id && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expedition_gear' && (
          <div className="space-y-6">
            {/* Roof Rack & Overland Luggage */}
            <div>
              <h3 className="text-sm font-semibold text-stone-200 mb-2.5 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>01. Roof Rack & Camping Cargo</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'none', label: 'Clean Roofline' },
                    { id: 'expedition_rack', label: 'Cargo Box & Duffel' },
                    { id: 'jerry_cans_boxes', label: 'Fuel Cans & Boxes' },
                    { id: 'rooftop_tent', label: 'Overland Roof Tent' },
                  ] as { id: RoofAccessoryId; label: string }[]
                ).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => updateField('roofAccessory', r.id)}
                    className={`px-3 py-2.5 text-xs font-medium rounded-lg border text-left transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      customization.roofAccessory === r.id
                        ? 'bg-stone-800 border-amber-500 text-amber-300'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bumper Style */}
            <div className="pt-4 border-t border-stone-800/70">
              <h3 className="text-sm font-semibold text-stone-200 mb-2.5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>02. Front & Rear Bumpers</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'tubular_vintage', label: 'Classic Steel' },
                    { id: 'brush_guard', label: 'A-Bar Guard' },
                    { id: 'heavy_expedition', label: 'Winch Bullbar' },
                  ] as { id: BumperStyleId; label: string }[]
                ).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => updateField('bumperStyle', b.id)}
                    className={`px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      customization.bumperStyle === b.id
                        ? 'bg-stone-800 border-amber-500 text-amber-300'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware Toggles */}
            <div className="pt-4 border-t border-stone-800/70 space-y-2.5">
              <h3 className="text-sm font-semibold text-stone-200 mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>03. Recovery & Trail Hardware</span>
              </h3>

              {[
                {
                  key: 'hasWinch' as const,
                  title: 'Front Electric Recovery Winch',
                  desc: 'Roller fairlead, steel cable drum, and red tow hook for steep climbs.',
                },
                {
                  key: 'hasSpareTire' as const,
                  title: 'Rear Tailgate Spare Wheel & Fuel Can',
                  desc: 'Full-size matching off-road wheel and auxiliary steel jerry can.',
                },
                {
                  key: 'hasAuxiliaryLights' as const,
                  title: 'Amber Rally Fog Lamps',
                  desc: 'Twin chrome-housing halogen lamps mounted on the front bumper.',
                },
                {
                  key: 'hasSnorkelAndAntenna' as const,
                  title: 'Raised Air Snorkel & Whip Antenna',
                  desc: 'Deep-water intake pipe and flexible rear radio whip with trail flag.',
                },
              ].map((item) => {
                const enabled = customization[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => updateField(item.key, !enabled)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      enabled
                        ? 'bg-stone-900 border-amber-500/70'
                        : 'bg-stone-900/40 border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-200">{item.title}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{item.desc}</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                        enabled
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-stone-800 text-stone-500'
                      }`}
                    >
                      {enabled ? 'Installed' : 'Removed'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'trailers' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Trailers couple to the rear hitch ball and articulate naturally over uneven
                terrain. Press T while driving to unhitch or re-hitch.
              </span>
            </div>

            <div className="space-y-2.5">
              {(
                [
                  {
                    id: 'none',
                    name: 'No Trailer Attached',
                    sub: 'Solo 4x4 Nimble Setup',
                    desc: 'Maximum departure angle and minimal weight for steep rock crawling.',
                  },
                  {
                    id: 'utility_trailer',
                    name: 'Vintage Bantam Utility Trailer',
                    sub: 'Canvas-Topped Expedition Tub',
                    desc: 'Compact 2-wheel military-heritage tub trailer with weathered canvas tarp.',
                  },
                  {
                    id: 'teardrop_camper',
                    name: '1965 Alpine Teardrop Camper',
                    sub: 'Rounded Vintage Sleeper Trailer',
                    desc: 'Two-tone curved sleeper cabin with circular porthole windows and galley.',
                  },
                  {
                    id: 'open_cargo',
                    name: 'Timber Stake Cargo Trailer',
                    sub: 'Expedition Crates & Fuel Drums',
                    desc: 'Hardwood plank flatbed carrying wooden supply crates and reserve fuel.',
                  },
                  {
                    id: 'recovery_rig',
                    name: 'Heavy Field Recovery Trailer',
                    sub: 'Generator & Trail Repair Rig',
                    desc: 'Tubular steel equipment frame carrying a field generator and tool chests.',
                  },
                ] as { id: TrailerTypeId; name: string; sub: string; desc: string }[]
              ).map((tr) => {
                const selected = customization.trailerType === tr.id;
                return (
                  <button
                    key={tr.id}
                    onClick={() => updateField('trailerType', tr.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-stone-900 border-amber-500'
                        : 'bg-stone-900/40 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-stone-400">{tr.sub}</span>
                        <h4 className="text-sm font-semibold text-stone-100">{tr.name}</h4>
                      </div>
                      {selected && (
                        <span className="text-xs font-medium text-amber-400 whitespace-nowrap shrink-0">
                          Hitched
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">{tr.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="px-6 py-4 border-t border-stone-800/80 bg-stone-950 flex items-center justify-between gap-4">
        <div className="text-xs text-stone-400 truncate">
          <span className="text-stone-200 font-medium">{activeSpec.name}</span>
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          <span>
            {customization.trailerType === 'none' ? 'Solo Rig' : 'Towing Trailer'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Drive This Rig
        </button>
      </div>
    </div>
  );
};
