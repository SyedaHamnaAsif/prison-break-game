export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'VICTORY'
  | 'GAME_OVER';

export type ItemId =
  | 'scrap'
  | 'wire'
  | 'tape'
  | 'battery'
  | 'cloth'
  | 'coin'
  | 'ration'
  | 'keycard'
  | 'lockpick'
  | 'cutters'
  | 'screwdriver'
  | 'shovel'
  | 'disguise'
  | 'emp'
  | 'smoke';

export type Inventory = Record<ItemId, number>;

export interface ItemDef {
  id: ItemId;
  name: string;
  shortLabel: string;
  category: 'material' | 'tool' | 'gadget' | 'key';
  description: string;
  color: string;
  hotkey?: number;
}

export interface CraftingRecipe {
  id: string;
  output: ItemId;
  outputCount: number;
  ingredients: Partial<Record<ItemId, number>>;
  label: string;
  summary: string;
}

export interface TradeOffer {
  id: string;
  item: ItemId;
  costCoins: number;
  label: string;
  description: string;
}

export type TileType =
  | 'void'
  | 'cell_floor'
  | 'hall_floor'
  | 'cafeteria_floor'
  | 'yard_grass'
  | 'yard_dirt'
  | 'asphalt'
  | 'water'
  | 'wood_floor'
  | 'vent_floor'
  | 'wall'
  | 'bars'
  | 'fence'
  | 'electric_fence'
  | 'weak_floor';

export type InteractableType =
  | 'door_cell'
  | 'door_keycard'
  | 'desk'
  | 'locker'
  | 'toolbox'
  | 'med_cabinet'
  | 'laundry'
  | 'vent'
  | 'fence_weak'
  | 'power_box'
  | 'security_terminal'
  | 'dig_spot'
  | 'safe'
  | 'inmate'
  | 'escape_zone';

export interface Interactable {
  id: string;
  type: InteractableType;
  tx: number;
  ty: number;
  label: string;
  /** Optional linking ID for vents */
  linkId?: string;
  /** Loot inside searchable containers */
  loot?: Partial<Record<ItemId, number>>;
  searched?: boolean;
  /** Door / gate state */
  open?: boolean;
  locked?: boolean;
  /** Vent unscrewed state */
  unscrewed?: boolean;
  /** Fence cut state */
  cut?: boolean;
  /** Power / Terminal disabled state */
  disabled?: boolean;
  /** Dig spot progress 0..100 */
  digProgress?: number;
  /** Inmate specific data */
  inmateName?: string;
  inmateTip?: string;
  intelRevealed?: boolean;
  isTrader?: boolean;
  /** Optional zone label for map intel */
  intelTarget?: { tx: number; ty: number; label: string };
}

export type GuardRole = 'officer' | 'warden' | 'riot' | 'k9';

export interface GuardDef {
  id: string;
  role: GuardRole;
  waypoints: Array<{ tx: number; ty: number }>;
  speed: number;
  fovDeg: number;
  viewDist: number;
}

export interface GuardEntity extends GuardDef {
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  wpIndex: number;
  waitTimer: number;
  suspicion: number; // 0..100
  state: 'patrol' | 'suspicious' | 'alerted' | 'stunned';
  stunTimer: number;
  investigateTarget: { x: number; y: number } | null;
  investigateTimer: number;
  path: Array<{ tx: number; ty: number }>;
  pathIndex: number;
  pathRecalcTimer: number;
  walkPhase: number;
  whistleCooldown: number;
}

export interface CameraDef {
  id: string;
  tx: number;
  ty: number;
  baseAngleDeg: number;
  sweepDeg: number;
  sweepSpeed: number;
  range: number;
}

export interface CameraEntity extends CameraDef {
  x: number;
  y: number;
  angle: number;
  phase: number;
  disabledTimer: number;
  permanentlyDisabled: boolean;
  alertLevel: number; // 0..100
}

export interface SearchlightDef {
  id: string;
  tx: number;
  ty: number;
  targetTx: number;
  targetTy: number;
  sweepRadiusTiles: number;
  speed: number;
  beamRadius: number;
}

export interface SearchlightEntity extends SearchlightDef {
  originX: number;
  originY: number;
  spotX: number;
  spotY: number;
  phase: number;
  disabledTimer: number;
  permanentlyDisabled: boolean;
}

export interface PropDeco {
  type: 'bunk' | 'table' | 'bench' | 'washer' | 'crate' | 'generator' | 'server' | 'watchtower' | 'van' | 'boat' | 'bush' | 'lamp';
  tx: number;
  ty: number;
  wTiles?: number;
  hTiles?: number;
  rot?: number;
}

export interface ZoneRect {
  name: string;
  tx: number;
  ty: number;
  w: number;
  h: number;
}

export interface EscapeRouteGuide {
  title: string;
  steps: string;
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  securityRating: string;
  description: string;
  difficulty: 'Standard' | 'Hard' | 'Extreme';
  width: number;
  height: number;
  playerStart: { tx: number; ty: number };
  startClockMinutes: number; // e.g., 21 * 60 = 21:00
  tiles: TileType[][];
  zones: ZoneRect[];
  interactables: Interactable[];
  guards: GuardDef[];
  cameras: CameraDef[];
  searchlights: SearchlightDef[];
  props: PropDeco[];
  escapeRoutes: EscapeRouteGuide[];
  startingInventory: Partial<Record<ItemId, number>>;
}

export interface SoundRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export interface SmokeCloud {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface MinigameState {
  active: boolean;
  kind: 'lockpick' | 'hack';
  title: string;
  subtitle: string;
  targetId: string;
  cursor: number; // 0..1
  direction: 1 | -1;
  speed: number;
  zoneStart: number;
  zoneWidth: number;
  stage: number;
  totalStages: number;
}

export interface DialogState {
  active: boolean;
  inmateId: string;
  inmateName: string;
  message: string;
  isTrader: boolean;
  intelAvailable: boolean;
}

export interface HUDTelemetry {
  levelId: number;
  levelName: string;
  levelSubtitle: string;
  clockText: string;
  schedulePhase: 'Roll Call' | 'Yard Time' | 'Evening Lockup' | 'Lights Out';
  isNight: boolean;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  suspicionMax: number;
  alertStatus: 'Clear' | 'Suspicious' | 'Alerted' | 'Lockdown';
  lockdownTimer: number;
  powerDownTimer: number;
  disguiseActive: boolean;
  disguiseTimer: number;
  hiding: boolean;
  inVent: boolean;
  crouching: boolean;
  sprinting: boolean;
  inventory: Inventory;
  elapsedSeconds: number;
  alarmsTriggered: number;
  guardsAlertedCount: number;
  containersSearched: number;
  interactionPrompt: {
    label: string;
    sublabel?: string;
    canInteract: boolean;
    reason?: string;
  } | null;
  activeToast: string | null;
  minigame: MinigameState | null;
  dialog: DialogState | null;
  discoveredIntel: Array<{ tx: number; ty: number; label: string }>;
  escapeMethodUsed: string | null;
  bustReason: string | null;
}

export interface SaveProgress {
  completedLevels: number[];
  bestTimes: Record<number, number>;
  bestRatings: Record<number, string>;
}
