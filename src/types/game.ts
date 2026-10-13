export type VehicleId = 'trail_jeep' | 'expedition_wagon' | 'open_top' | 'camping_rig';

export type PaintColorId =
  | 'olive_green'
  | 'vintage_cream'
  | 'dusty_red'
  | 'muted_yellow'
  | 'pale_blue'
  | 'forest_green'
  | 'retro_orange';

export type WheelStyleId = 'steel_classic' | 'spoked_rally' | 'heavy_beadlock';
export type TireStyleId = 'all_terrain' | 'mud_knobby' | 'vintage_ribbed';
export type BumperStyleId = 'tubular_vintage' | 'heavy_expedition' | 'brush_guard';
export type RoofAccessoryId = 'none' | 'expedition_rack' | 'jerry_cans_boxes' | 'rooftop_tent';
export type TrailerTypeId = 'none' | 'utility_trailer' | 'teardrop_camper' | 'open_cargo' | 'recovery_rig';

export interface VehicleCustomization {
  vehicleId: VehicleId;
  paintColor: PaintColorId;
  wheelStyle: WheelStyleId;
  tireStyle: TireStyleId;
  bumperStyle: BumperStyleId;
  roofAccessory: RoofAccessoryId;
  hasAuxiliaryLights: boolean;
  hasSpareTire: boolean;
  hasWinch: boolean;
  hasSnorkelAndAntenna: boolean;
  trailerType: TrailerTypeId;
}

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  subtitle: string;
  era: string;
  description: string;
  wheelbase: number;
  trackWidth: number;
  powerRating: number;
  gripFactor: number;
  groundClearance: number;
  defaultColor: PaintColorId;
  defaultRoof: RoofAccessoryId;
}

export interface PaintSwatch {
  id: PaintColorId;
  name: string;
  hex: string;
  secondaryHex: string;
  roughness: number;
}

export interface Landmark {
  id: string;
  name: string;
  category: 'Viewpoint' | 'Cabin' | 'Campsite' | 'Lakeside' | 'Rock Formation' | 'Mountain Pass';
  description: string;
  x: number;
  z: number;
  radius: number;
  discovered: boolean;
  photographed: boolean;
  elevation: number;
}

export interface WildlifeSpecies {
  id: string;
  name: string;
  scientificName: string;
  habitat: string;
  description: string;
  colorHex: string;
  secondaryHex: string;
  scale: number;
  speed: number;
  photographed: boolean;
  bestDistance?: number;
  photoTimestamp?: string;
}

export interface CapturedPhoto {
  id: string;
  title: string;
  subjectType: 'Wildlife' | 'Landmark' | 'Expedition';
  subjectName: string;
  timestamp: string;
  dataUrl: string;
  locationName: string;
}

export interface WinchAnchor {
  id: string;
  type: 'pine_tree' | 'boulder' | 'fallen_log';
  x: number;
  y: number;
  z: number;
  label: string;
}

export interface TelemetryState {
  speedKmh: number;
  rpm: number;
  gear: string;
  fuelPercent: number;
  surfaceType: 'Dirt Trail' | 'Golden Grass' | 'Deep Mud' | 'Shallow Water' | 'Alpine Rock';
  pitchDeg: number;
  rollDeg: number;
  allWheelDrive: boolean;
  lowRange: boolean;
  diffLock: boolean;
  headlightsOn: boolean;
  winchMode: boolean;
  winchAttached: boolean;
  winchAnchorLabel: string | null;
  winchCableLength: number;
  winchPulling: boolean;
  winchPayingOut: boolean;
  hoveredAnchor: WinchAnchor | null;
  trailerAttached: boolean;
  nearbyTrailerSpot: string | null;
  nearbyLandmark: Landmark | null;
  nearbyWildlife: string | null;
  headingDeg: number;
  altitudeM: number;
  positionX: number;
  positionZ: number;
}

export const PAINT_SWATCHES: PaintSwatch[] = [
  { id: 'olive_green', name: 'Matte Olive Green', hex: '#556347', secondaryHex: '#dcd6c8', roughness: 0.72 },
  { id: 'vintage_cream', name: 'Vintage Limestone Cream', hex: '#dfd7c2', secondaryHex: '#6b6558', roughness: 0.65 },
  { id: 'dusty_red', name: 'Canyon Dusty Red', hex: '#9e473b', secondaryHex: '#e2dac7', roughness: 0.68 },
  { id: 'muted_yellow', name: 'Ochre Safari Yellow', hex: '#c89d46', secondaryHex: '#ebe4d3', roughness: 0.66 },
  { id: 'pale_blue', name: 'Glacier Pale Blue', hex: '#6c8b99', secondaryHex: '#e6e2d8', roughness: 0.64 },
  { id: 'forest_green', name: 'Deep Pine Green', hex: '#2e4a3b', secondaryHex: '#d8d0be', roughness: 0.7 },
  { id: 'retro_orange', name: 'Warm Sunset Orange', hex: '#c46433', secondaryHex: '#e6dfd1', roughness: 0.67 },
];

export const VEHICLE_SPECS: VehicleSpec[] = [
  {
    id: 'trail_jeep',
    name: '1964 Willys Scout 4x4',
    subtitle: 'Classic Trail Jeep',
    era: '1964 Series II',
    description: 'Compact wheelbase, iconic rounded front fenders, vertical 7-slot vintage grille with round headlamps, upright split frame windshield, and nimble mountain climb capability.',
    wheelbase: 2.35,
    trackWidth: 1.48,
    powerRating: 82,
    gripFactor: 94,
    groundClearance: 92,
    defaultColor: 'olive_green',
    defaultRoof: 'expedition_rack',
  },
  {
    id: 'expedition_wagon',
    name: '1968 Overland Cruiser Wagon',
    subtitle: 'Vintage Expedition Wagon',
    era: '1968 Alpine Touring',
    description: 'Rounded long-cabin off-road station wagon with curved alpine roof windows, two-tone heritage trim, generous cargo capacity, and stable long-wheelbase suspension.',
    wheelbase: 2.75,
    trackWidth: 1.54,
    powerRating: 88,
    gripFactor: 90,
    groundClearance: 86,
    defaultColor: 'pale_blue',
    defaultRoof: 'jerry_cans_boxes',
  },
  {
    id: 'open_top',
    name: '1962 Ridge Runner Roadster',
    subtitle: 'Classic Open-Top Off-Roader',
    era: '1962 Trail Special',
    description: 'Open-air vintage trail hopper featuring exposed tubular roll bars, fold-down windshield hinges, wide mud-terrain tires, and unmatched visibility for wildlife photography.',
    wheelbase: 2.28,
    trackWidth: 1.52,
    powerRating: 85,
    gripFactor: 96,
    groundClearance: 95,
    defaultColor: 'retro_orange',
    defaultRoof: 'none',
  },
  {
    id: 'camping_rig',
    name: '1971 Nomad Basecamp 4x4',
    subtitle: 'Retro Camping Vehicle',
    era: '1971 Trans-Continental',
    description: 'High-roof vintage overland camper fitted with canvas pop-top sleep quarters, side-mounted recovery boards, auxiliary fuel jerry cans, and heavy-duty towing hitch.',
    wheelbase: 2.68,
    trackWidth: 1.56,
    powerRating: 92,
    gripFactor: 91,
    groundClearance: 89,
    defaultColor: 'muted_yellow',
    defaultRoof: 'rooftop_tent',
  },
];

export const INITIAL_LANDMARKS: Landmark[] = [
  {
    id: 'golden_overlook',
    name: 'Sunlit Crest Overlook',
    category: 'Viewpoint',
    description: 'A high timber ridge offering panoramic views across the golden grasslands and distant alpine peaks.',
    x: 48,
    z: -65,
    radius: 18,
    discovered: false,
    photographed: false,
    elevation: 420,
  },
  {
    id: 'whispering_pines_cabin',
    name: 'Ranger Watch Cabin',
    category: 'Cabin',
    description: 'A weathered timber fire-lookout cabin tucked beside towering Douglas firs and stacked firewood.',
    x: -72,
    z: -54,
    radius: 18,
    discovered: false,
    photographed: false,
    elevation: 365,
  },
  {
    id: 'mirror_tarn_lake',
    name: 'Mirror Tarn Basin',
    category: 'Lakeside',
    description: 'A tranquil alpine lake fed by mountain snowmelt with muddy banks and shallow river crossings.',
    x: -55,
    z: 62,
    radius: 22,
    discovered: false,
    photographed: false,
    elevation: 295,
  },
  {
    id: 'nomad_basecamp',
    name: 'Old Timberline Campsite',
    category: 'Campsite',
    description: 'An expedition outfitter camp featuring canvas A-frame tents, warm campfire embers, and a trailer depot.',
    x: 18,
    z: 22,
    radius: 16,
    discovered: true,
    photographed: false,
    elevation: 318,
  },
  {
    id: 'sentinel_monolith',
    name: 'Redstone Arch & Spires',
    category: 'Rock Formation',
    description: 'Weathered granite and sandstone monoliths rising steeply above a winding boulder-strewn trail.',
    x: 92,
    z: 45,
    radius: 20,
    discovered: false,
    photographed: false,
    elevation: 455,
  },
  {
    id: 'eagle_pass',
    name: 'Highland Devil’s Pass',
    category: 'Mountain Pass',
    description: 'A steep, rocky switchback climb where low-range gearing and front winch anchors prove essential.',
    x: -10,
    z: -115,
    radius: 20,
    discovered: false,
    photographed: false,
    elevation: 512,
  },
];

export const INITIAL_WILDLIFE: WildlifeSpecies[] = [
  {
    id: 'red_stag',
    name: 'Highland Red Stag',
    scientificName: 'Cervus elaphus',
    habitat: 'Golden Grasslands & Pine Clearings',
    description: 'Majestic antlered elk frequently seen grazing along warm sunlit ridges at dusk.',
    colorHex: '#8c583a',
    secondaryHex: '#d9c09e',
    scale: 1.15,
    speed: 3.2,
    photographed: false,
  },
  {
    id: 'timber_wolf',
    name: 'Northern Timber Wolf',
    scientificName: 'Canis lupus',
    habitat: 'Deep Pine Forests & Ridge Trails',
    description: 'Elusive silver-grey pack hunter that observes passing vehicles quietly from rocky outcrops.',
    colorHex: '#6e7378',
    secondaryHex: '#cfd4d8',
    scale: 0.78,
    speed: 4.5,
    photographed: false,
  },
  {
    id: 'mountain_ibex',
    name: 'Alpine Horned Ibex',
    scientificName: 'Capra ibex',
    habitat: 'High Crags & Mountain Passes',
    description: 'Sure-footed mountain goat with sweeping curved horns, thriving on steep granite ledges.',
    colorHex: '#9c8669',
    secondaryHex: '#4a3f35',
    scale: 0.9,
    speed: 3.6,
    photographed: false,
  },
  {
    id: 'red_fox',
    name: 'Meadow Red Fox',
    scientificName: 'Vulpes vulpes',
    habitat: 'Tall Grass & Campsite Edges',
    description: 'Nimble russet fox with a white-tipped tail, darting through tall golden grass.',
    colorHex: '#c85a28',
    secondaryHex: '#f2ece1',
    scale: 0.58,
    speed: 4.8,
    photographed: false,
  },
  {
    id: 'brown_bear',
    name: 'Grizzly Mountain Bear',
    scientificName: 'Ursus arctos',
    habitat: 'Lakeside & River Crossings',
    description: 'Powerful foraging bear found near Mirror Tarn Basin and fallen forest logs.',
    colorHex: '#593e2b',
    secondaryHex: '#7a5940',
    scale: 1.35,
    speed: 2.6,
    photographed: false,
  },
];
