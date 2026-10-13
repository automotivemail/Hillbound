export type VehicleId = 'trail_jeep' | 'expedition_wagon' | 'open_top' | 'camping_rig' | 'bronco_1966' | 'scout_1972' | 'wagoneer_1968' | 'landcruiser_40' | 'k5_blazer' | 'datsun_240z' | 'type2_van' | 'defender_110' | 'pajero_1985' | 'lada_niva' | 'peugeot_504' | 'escort_rs' | 'citroen_2cv' | 'impreza_wrx' | 'lancer_evo' | 'landcruiser_80';

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
export type RoofAccessoryId = 'none' | 'expedition_rack' | 'jerry_cans_boxes' | 'rooftop_tent' | 'roof_cargo_box' | 'safari_basket' | 'side_awning';
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
    id: 'bronco_1966', name: '1966 Ford Bronco Gen I', subtitle: '1960s Compact 4x4', era: '1960s',
    description: 'Short-wheelbase utility 4x4 with upright glass, chunky all-terrain tires and a removable-roof silhouette.',
    wheelbase: 2.35, trackWidth: 1.48, powerRating: 105, gripFactor: 92, groundClearance: 94, defaultColor: 'muted_yellow', defaultRoof: 'safari_basket',
  },
  {
    id: 'scout_1972', name: '1972 International Scout II', subtitle: '1970s Trail Utility', era: '1970s',
    description: 'Square-shouldered two-door utility truck with a high stance and broad glasshouse.',
    wheelbase: 2.55, trackWidth: 1.52, powerRating: 125, gripFactor: 91, groundClearance: 92, defaultColor: 'dusty_red', defaultRoof: 'expedition_rack',
  },
  {
    id: 'wagoneer_1968', name: '1968 Jeep Wagoneer', subtitle: 'Heritage 4x4 Wagon', era: '1960s',
    description: 'Long-roof family 4x4 with wood-trim character and comfortable touring proportions.',
    wheelbase: 2.72, trackWidth: 1.54, powerRating: 115, gripFactor: 87, groundClearance: 82, defaultColor: 'vintage_cream', defaultRoof: 'roof_cargo_box',
  },
  {
    id: 'landcruiser_40', name: '1978 Toyota Land Cruiser 40', subtitle: 'Classic Rock Crawler', era: '1970s',
    description: 'Rugged short-wheelbase 4x4 with a tall stance and exposed recovery hardware.',
    wheelbase: 2.32, trackWidth: 1.48, powerRating: 98, gripFactor: 96, groundClearance: 98, defaultColor: 'forest_green', defaultRoof: 'safari_basket',
  },
  {
    id: 'k5_blazer', name: '1978 Chevrolet K5 Blazer', subtitle: 'Full-Size Trail SUV', era: '1970s',
    description: 'Wide-track full-size utility with a long bonnet and removable-top profile.',
    wheelbase: 2.78, trackWidth: 1.62, powerRating: 150, gripFactor: 88, groundClearance: 91, defaultColor: 'retro_orange', defaultRoof: 'expedition_rack',
  },
  {
    id: 'datsun_240z', name: '1972 Datsun 240Z', subtitle: 'Rear-Wheel-Drive Sports Classic', era: '1970s · RWD',
    description: 'Low fastback sports coupe with long bonnet, sloped glass and road-biased tires; best on dry trails.',
    wheelbase: 2.30, trackWidth: 1.48, powerRating: 130, gripFactor: 72, groundClearance: 38, defaultColor: 'dusty_red', defaultRoof: 'none',
  },
  {
    id: 'type2_van', name: '1974 Volkswagen Type 2', subtitle: 'Rear-Wheel-Drive Adventure Van', era: '1970s · RWD',
    description: 'Cab-forward camper van with upright windshield, spacious cabin and modest ground clearance.',
    wheelbase: 2.40, trackWidth: 1.52, powerRating: 65, gripFactor: 68, groundClearance: 45, defaultColor: 'pale_blue', defaultRoof: 'rooftop_tent',
  },
  {
    id: 'defender_110', name: '1987 Land Rover Defender 110', subtitle: 'Expedition 4x4', era: '1980s',
    description: 'Tall, slab-sided utility wagon with long-travel suspension and practical roof loadout.',
    wheelbase: 2.80, trackWidth: 1.56, powerRating: 112, gripFactor: 97, groundClearance: 96, defaultColor: 'forest_green', defaultRoof: 'safari_basket',
  },
  {
    id: 'pajero_1985', name: '1985 Mitsubishi Pajero', subtitle: 'Rally-Bred 4x4', era: '1980s',
    description: 'Compact rally utility with balanced wheelbase and nimble mixed-terrain handling.',
    wheelbase: 2.42, trackWidth: 1.52, powerRating: 105, gripFactor: 91, groundClearance: 88, defaultColor: 'vintage_cream', defaultRoof: 'expedition_rack',
  },
  {
    id: 'lada_niva', name: '1982 Lada Niva', subtitle: 'Compact Mountain 4x4', era: '1980s',
    description: 'Short, light-bodied compact 4x4 with upright greenhouse and narrow trail footprint.',
    wheelbase: 2.20, trackWidth: 1.44, powerRating: 75, gripFactor: 89, groundClearance: 80, defaultColor: 'muted_yellow', defaultRoof: 'none',
  },
  {
    id: 'peugeot_504', name: '1979 Peugeot 504', subtitle: 'Rear-Wheel-Drive Safari Saloon', era: '1970s · RWD',
    description: 'Classic long-bonnet rear-drive saloon adapted for light safari tracks, not rock crawling.',
    wheelbase: 2.74, trackWidth: 1.50, powerRating: 96, gripFactor: 66, groundClearance: 42, defaultColor: 'pale_blue', defaultRoof: 'none',
  },
  {
    id: 'escort_rs', name: '1986 Ford Escort RS', subtitle: 'Rear-Wheel-Drive Rally Classic', era: '1980s · RWD',
    description: 'Compact rally coupe with a low center of gravity and road-focused grip.',
    wheelbase: 2.40, trackWidth: 1.50, powerRating: 130, gripFactor: 74, groundClearance: 40, defaultColor: 'retro_orange', defaultRoof: 'none',
  },
  {
    id: 'citroen_2cv', name: '1980 Citroën 2CV', subtitle: 'Lightweight Classic (FWD)', era: '1980s · FWD',
    description: 'Lightweight soft-suspension classic. Standard 2CV is front-wheel drive, not rear-wheel drive.',
    wheelbase: 2.40, trackWidth: 1.42, powerRating: 29, gripFactor: 62, groundClearance: 25, defaultColor: 'vintage_cream', defaultRoof: 'none',
  },
  {
    id: 'impreza_wrx', name: '2002 Subaru Impreza WRX', subtitle: 'All-Wheel-Drive Rally Car', era: '1990s+ · AWD',
    description: 'Turbo rally sedan with all-wheel-drive traction and road-rally suspension.',
    wheelbase: 2.52, trackWidth: 1.54, powerRating: 227, gripFactor: 95, groundClearance: 62, defaultColor: 'pale_blue', defaultRoof: 'none',
  },
  {
    id: 'lancer_evo', name: '2005 Mitsubishi Lancer Evolution', subtitle: 'All-Wheel-Drive Rally Sedan', era: '1990s+ · AWD',
    description: 'Wide-track performance sedan with quick steering and strong all-weather traction.',
    wheelbase: 2.62, trackWidth: 1.58, powerRating: 276, gripFactor: 96, groundClearance: 60, defaultColor: 'vintage_cream', defaultRoof: 'none',
  },
  {
    id: 'landcruiser_80', name: '1995 Toyota Land Cruiser 80', subtitle: 'Full-Size Expedition Wagon', era: '1990s+ · AWD', 
    description: 'Long-wheelbase expedition wagon with broad cabin, high ride height and heavy-duty trail hardware.',
    wheelbase: 2.85, trackWidth: 1.62, powerRating: 212, gripFactor: 96, groundClearance: 94, defaultColor: 'forest_green', defaultRoof: 'safari_basket',
  },

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
