import React, { useState } from 'react';
import { CapturedPhoto, Landmark, WildlifeSpecies } from '../types/game';
import { Camera, Check, Compass, MapPin, Sparkles, X } from 'lucide-react';

interface JournalModalProps {
  landmarks: Landmark[];
  wildlife: WildlifeSpecies[];
  photos: CapturedPhoto[];
  onTakePhotoNow: () => void;
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  landmarks,
  wildlife,
  photos,
  onTakePhotoNow,
  onClose,
}) => {
  const [tab, setTab] = useState<'landmarks' | 'wildlife' | 'photos'>('landmarks');

  const discoveredCount = landmarks.filter((l) => l.discovered).length;
  const photographedSpeciesCount = wildlife.filter((w) => w.photographed).length;

  return (
    <div className="fixed inset-0 z-30 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <span>Expedition Logbook</span>
              <span aria-hidden="true">·</span>
              <span>
                {discoveredCount}/{landmarks.length} Landmarks Charted
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {photographedSpeciesCount}/{wildlife.length} Wildlife Species Photographed
              </span>
            </div>
            <h2 className="text-2xl font-bold font-display text-stone-100 mt-0.5">
              Field Discovery & Wildlife Journal
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onClose();
                setTimeout(onTakePhotoNow, 120);
              }}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Snap Field Photo (P)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-stone-950/50 border-b border-stone-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-stone-900 rounded-lg border border-stone-800">
            <button
              onClick={() => setTab('landmarks')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'landmarks'
                  ? 'bg-stone-800 text-amber-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Scenic Landmarks ({discoveredCount}/{landmarks.length})
            </button>
            <button
              onClick={() => setTab('wildlife')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'wildlife'
                  ? 'bg-stone-800 text-amber-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Wildlife Guide ({photographedSpeciesCount}/{wildlife.length})
            </button>
            <button
              onClick={() => setTab('photos')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'photos'
                  ? 'bg-stone-800 text-amber-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Captured Photographs ({photos.length})
            </button>
          </div>

          <p className="text-xs text-stone-400 hidden sm:block">
            Drive near landmarks to chart them, or aim the camera and press P to photograph wildlife.
          </p>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'landmarks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {landmarks.map((lm, index) => (
                <div
                  key={lm.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    lm.discovered
                      ? 'bg-stone-950/70 border-amber-500/40'
                      : 'bg-stone-950/30 border-stone-800/70 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <span>0{index + 1}. {lm.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          ({lm.x}m, {lm.z}m)
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{lm.elevation}m ASL</span>
                      </div>
                      <h3 className="text-base font-semibold text-stone-100 mt-1">
                        {lm.name}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 ${
                        lm.discovered ? 'text-emerald-400' : 'text-stone-500'
                      }`}
                    >
                      {lm.discovered ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Charted
                        </>
                      ) : (
                        <>
                          <Compass className="w-3.5 h-3.5" /> Unexplored
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    {lm.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === 'wildlife' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wildlife.map((sp) => (
                <div
                  key={sp.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    sp.photographed
                      ? 'bg-stone-950/70 border-emerald-500/50'
                      : 'bg-stone-950/35 border-stone-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-9 h-9 rounded-lg border border-white/15 shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: sp.colorHex }}
                      >
                        <Sparkles className="w-4 h-4 text-white/80" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <span className="italic">{sp.scientificName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{sp.habitat}</span>
                        </div>
                        <h3 className="text-base font-semibold text-stone-100 mt-0.5">
                          {sp.name}
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                        sp.photographed ? 'text-emerald-400' : 'text-amber-400/80'
                      }`}
                    >
                      {sp.photographed ? 'Photographed' : 'Sighting Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                    {sp.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === 'photos' && (
            <div>
              {photos.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-800 rounded-xl">
                  <Camera className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-stone-200">
                    No Expedition Photographs Yet
                  </h3>
                  <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                    Explore the trails, approach grazing wildlife or scenic overlooks, and press
                    P (or click Snap Field Photo) to record snapshots in your journal.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden flex flex-col"
                    >
                      <div className="aspect-video bg-stone-900 relative overflow-hidden">
                        <img
                          src={p.dataUrl}
                          alt={p.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-stone-400">
                          <span>{p.subjectType}</span>
                          <span aria-hidden="true">·</span>
                          <span>{p.timestamp}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-stone-100 mt-0.5 truncate">
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{p.locationName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
