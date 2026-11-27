import { soundEngine } from './audio';
import { canCraft, createEmptyInventory, ITEMS, TRADER_OFFERS } from './items';
import {
  CameraEntity,
  CraftingRecipe,
  DialogState,
  FloatingText,
  GuardEntity,
  HUDTelemetry,
  Interactable,
  Inventory,
  ItemId,
  LevelDef,
  MinigameState,
  Particle,
  SearchlightEntity,
  SmokeCloud,
  SoundRipple,
  TileType,
} from './types';

export const TILE_SIZE = 44;

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  crouch: boolean;
  touchX: number;
  touchY: number;
}

export class PrisonBreakEngine {
  level: LevelDef;
  tiles: TileType[][];
  interactables: Interactable[];
  guards: GuardEntity[];
  cameras: CameraEntity[];
  searchlights: SearchlightEntity[];

  player = {
    x: 0,
    y: 0,
    radius: 13,
    angle: 0,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    crouching: false,
    sprinting: false,
    hidingInId: null as string | null,
    inVentFade: 0,
    walkPhase: 0,
    hitCooldown: 0,
    disguiseTimer: 0,
  };

  inventory: Inventory;
  clockMinutes: number;
  elapsedSeconds = 0;
  lockdownTimer = 0;
  powerDownTimer = 0;
  alarmsTriggered = 0;
  guardsAlertedSet = new Set<string>();
  containersSearched = 0;
  discoveredIntel: Array<{ tx: number; ty: number; label: string }> = [];

  ripples: SoundRipple[] = [];
  smokes: SmokeCloud[] = [];
  particles: Particle[] = [];
  floatingTexts: FloatingText[] = [];

  // Click-to-move A* path
  movePath: Array<{ tx: number; ty: number }> = [];
  pendingInteractId: string | null = null;
  clickMarker: { x: number; y: number; timer: number } | null = null;
  hoveredInteractId: string | null = null;

  // Overlays / Minigames
  minigame: MinigameState | null = null;
  dialog: DialogState | null = null;
  activeToast: string | null = null;
  toastTimer = 0;

  // End States
  escaped = false;
  escapeMethodUsed: string | null = null;
  busted = false;
  bustReason: string | null = null;

  // Camera tracking
  camX = 0;
  camY = 0;
  screenShake = 0;
  alarmPulseTimer = 0;

  constructor(level: LevelDef) {
    this.level = level;
    this.tiles = level.tiles.map((row) => [...row]);
    this.interactables = level.interactables.map((it) => ({
      ...it,
      loot: it.loot ? { ...it.loot } : undefined,
      intelTarget: it.intelTarget ? { ...it.intelTarget } : undefined,
    }));
    this.inventory = createEmptyInventory();
    for (const [k, v] of Object.entries(level.startingInventory)) {
      this.inventory[k as ItemId] = v ?? 0;
    }

    this.player.x = (level.playerStart.tx + 0.5) * TILE_SIZE;
    this.player.y = (level.playerStart.ty + 0.5) * TILE_SIZE;
    this.camX = this.player.x;
    this.camY = this.player.y;
    this.clockMinutes = level.startClockMinutes;

    this.guards = level.guards.map((g) => {
      const start = g.waypoints[0];
      return {
        ...g,
        waypoints: g.waypoints.map((w) => ({ ...w })),
        x: (start.tx + 0.5) * TILE_SIZE,
        y: (start.ty + 0.5) * TILE_SIZE,
        angle: 0,
        targetAngle: 0,
        wpIndex: 1 % g.waypoints.length,
        waitTimer: 0.4,
        suspicion: 0,
        state: 'patrol',
        stunTimer: 0,
        investigateTarget: null,
        investigateTimer: 0,
        path: [],
        pathIndex: 0,
        pathRecalcTimer: 0,
        walkPhase: Math.random() * Math.PI * 2,
        whistleCooldown: 0,
      };
    });

    this.cameras = level.cameras.map((c, idx) => ({
      ...c,
      x: (c.tx + 0.5) * TILE_SIZE,
      y: (c.ty + 0.5) * TILE_SIZE,
      angle: (c.baseAngleDeg * Math.PI) / 180,
      phase: idx * 1.4,
      disabledTimer: 0,
      permanentlyDisabled: false,
      alertLevel: 0,
    }));

    this.searchlights = level.searchlights.map((s, idx) => ({
      ...s,
      originX: (s.tx + 0.5) * TILE_SIZE,
      originY: (s.ty + 0.5) * TILE_SIZE,
      spotX: (s.targetTx + 0.5) * TILE_SIZE,
      spotY: (s.targetTy + 0.5) * TILE_SIZE,
      phase: idx * 2.1,
      disabledTimer: 0,
      permanentlyDisabled: false,
    }));

    this.showToast(`Welcome to ${level.name}. Press [E] or click objects to interact.`);
  }

  showToast(msg: string, duration = 3.8) {
    this.activeToast = msg;
    this.toastTimer = duration;
  }

  addFloatingText(x: number, y: number, text: string, color = '#FBBF24') {
    this.floatingTexts.push({ x, y, text, color, life: 1.4, maxLife: 1.4 });
  }

  spawnParticles(x: number, y: number, color: string, count = 10, speed = 75) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 2 + Math.random() * 2.5,
        color,
      });
    }
  }

  emitSound(x: number, y: number, maxRadius: number, color = 'rgba(251, 191, 36, 0.55)', lureGuards = false) {
    this.ripples.push({ x, y, radius: 8, maxRadius, alpha: 0.85, color });
    for (const g of this.guards) {
      if (g.state === 'stunned' || g.state === 'alerted') continue;
      const dist = Math.hypot(g.x - x, g.y - y);
      if (dist <= maxRadius) {
        if (lureGuards || g.state === 'suspicious' || dist < maxRadius * 0.68) {
          g.state = 'suspicious';
          g.suspicion = Math.max(g.suspicion, lureGuards ? 52 : 38);
          g.investigateTarget = { x, y };
          g.investigateTimer = 5.5;
          g.path = this.findPath(
            Math.floor(g.x / TILE_SIZE),
            Math.floor(g.y / TILE_SIZE),
            Math.floor(x / TILE_SIZE),
            Math.floor(y / TILE_SIZE),
            true
          );
          g.pathIndex = 0;
          soundEngine.playSuspicious();
        }
      }
    }
  }

  getInteractableAt(tx: number, ty: number): Interactable | undefined {
    return this.interactables.find((it) => it.tx === tx && it.ty === ty);
  }

  isTileWalkable(tx: number, ty: number, isGuard = false): boolean {
    if (tx < 0 || ty < 0 || tx >= this.level.width || ty >= this.level.height) return false;
    const t = this.tiles[ty][tx];
    const it = this.getInteractableAt(tx, ty);
    if (it) {
      if (it.type === 'door_cell' || it.type === 'door_keycard') {
        if (it.open) return true;
        if (isGuard && it.type === 'door_cell' && !it.locked) return true;
        return false;
      }
      if (it.type === 'fence_weak') {
        return Boolean(it.cut);
      }
    }
    if (
      t === 'wall' ||
      t === 'bars' ||
      t === 'fence' ||
      t === 'electric_fence' ||
      t === 'water' ||
      t === 'void'
    ) {
      return false;
    }
    return true;
  }

  isTileOpaque(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.level.width || ty >= this.level.height) return true;
    const t = this.tiles[ty][tx];
    if (t === 'wall' || t === 'void') return true;
    const it = this.getInteractableAt(tx, ty);
    if (it && (it.type === 'door_cell' || it.type === 'door_keycard') && !it.open) {
      // Cell bars are see-through, solid security doors block sight
      return it.type === 'door_keycard';
    }
    return false;
  }

  hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return true;
    const steps = Math.ceil(dist / 10);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      if (this.isTileOpaque(tx, ty)) return false;
      // Check smoke clouds
      for (const s of this.smokes) {
        if (Math.hypot(px - s.x, py - s.y) < s.radius * 0.85) return false;
      }
    }
    return true;
  }

  // Lightweight A* on tile grid for click-to-move & guard navigation
  findPath(
    startTx: number,
    startTy: number,
    goalTx: number,
    goalTy: number,
    isGuard = false
  ): Array<{ tx: number; ty: number }> {
    const w = this.level.width;
    const h = this.level.height;
    if (startTx < 0 || startTy < 0 || startTx >= w || startTy >= h) return [];
    if (startTx === goalTx && startTy === goalTy) return [];
    if (goalTx < 0 || goalTy < 0 || goalTx >= w || goalTy >= h) return [];

    // If goal tile isn't directly walkable (e.g. player clicked a locker/wall), allow adjacent walkable tile
    let actualGoalX = goalTx;
    let actualGoalY = goalTy;
    if (!this.isTileWalkable(goalTx, goalTy, isGuard)) {
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      let bestDist = Infinity;
      let found = false;
      for (const [ox, oy] of dirs) {
        const nx = goalTx + ox;
        const ny = goalTy + oy;
        if (this.isTileWalkable(nx, ny, isGuard)) {
          const d = Math.hypot(nx - startTx, ny - startTy);
          if (d < bestDist) {
            bestDist = d;
            actualGoalX = nx;
            actualGoalY = ny;
            found = true;
          }
        }
      }
      if (!found) return [];
    }

    const key = (x: number, y: number) => y * w + x;
    const open: number[] = [key(startTx, startTy)];
    const cameFrom = new Int32Array(w * h).fill(-1);
    const gScore = new Float32Array(w * h).fill(Infinity);
    const fScore = new Float32Array(w * h).fill(Infinity);
    const closed = new Uint8Array(w * h);

    const startKey = key(startTx, startTy);
    const goalKey = key(actualGoalX, actualGoalY);
    gScore[startKey] = 0;
    fScore[startKey] = Math.abs(actualGoalX - startTx) + Math.abs(actualGoalY - startTy);

    const dirs = [
      [1, 0, 1],
      [-1, 0, 1],
      [0, 1, 1],
      [0, -1, 1],
      [1, 1, 1.414],
      [-1, 1, 1.414],
      [1, -1, 1.414],
      [-1, -1, 1.414],
    ];

    let iterations = 0;
    while (open.length > 0 && iterations < 1200) {
      iterations++;
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if (fScore[open[i]] < fScore[open[bestIdx]]) bestIdx = i;
      }
      const current = open.splice(bestIdx, 1)[0];
      if (current === goalKey) {
        const path: Array<{ tx: number; ty: number }> = [];
        let cur = current;
        while (cur !== -1 && cur !== startKey) {
          path.push({ tx: cur % w, ty: Math.floor(cur / w) });
          cur = cameFrom[cur];
        }
        path.reverse();
        return path;
      }
      closed[current] = 1;
      const cx = current % w;
      const cy = Math.floor(current / w);

      for (const [dx, dy, cost] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!this.isTileWalkable(nx, ny, isGuard)) continue;
        // Prevent corner clipping on diagonal moves
        if (dx !== 0 && dy !== 0) {
          if (!this.isTileWalkable(cx + dx, cy, isGuard) || !this.isTileWalkable(cx, cy + dy, isGuard)) {
            continue;
          }
        }
        const nKey = key(nx, ny);
        if (closed[nKey]) continue;
        const tentative = gScore[current] + cost;
        if (tentative < gScore[nKey]) {
          cameFrom[nKey] = current;
          gScore[nKey] = tentative;
          fScore[nKey] = tentative + Math.abs(actualGoalX - nx) + Math.abs(actualGoalY - ny);
          if (!open.includes(nKey)) open.push(nKey);
        }
      }
    }
    return [];
  }

  handleCanvasClick(worldX: number, worldY: number) {
    if (this.minigame || this.dialog || this.escaped || this.busted) return;

    // Exit hiding if clicking to move away
    if (this.player.hidingInId) {
      this.player.hidingInId = null;
      this.showToast('Stepped out of cover.', 1.8);
    }

    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);

    // Check if user clicked near an interactable
    let clickedInteractable: Interactable | null = null;
    let bestD = 36;
    for (const it of this.interactables) {
      const ix = (it.tx + 0.5) * TILE_SIZE;
      const iy = (it.ty + 0.5) * TILE_SIZE;
      const d = Math.hypot(worldX - ix, worldY - iy);
      if (d < bestD) {
        bestD = d;
        clickedInteractable = it;
      }
    }

    if (clickedInteractable) {
      const distToPlayer = Math.hypot(
        this.player.x - (clickedInteractable.tx + 0.5) * TILE_SIZE,
        this.player.y - (clickedInteractable.ty + 0.5) * TILE_SIZE
      );
      if (distToPlayer <= TILE_SIZE * 1.65) {
        this.interactWith(clickedInteractable);
        return;
      }
      this.pendingInteractId = clickedInteractable.id;
    } else {
      this.pendingInteractId = null;
    }

    const ptx = Math.floor(this.player.x / TILE_SIZE);
    const pty = Math.floor(this.player.y / TILE_SIZE);
    const path = this.findPath(ptx, pty, tx, ty, false);
    if (path.length > 0) {
      this.movePath = path;
      const last = path[path.length - 1];
      this.clickMarker = {
        x: (last.tx + 0.5) * TILE_SIZE,
        y: (last.ty + 0.5) * TILE_SIZE,
        timer: 0.7,
      };
    } else if (clickedInteractable) {
      this.showToast('Path blocked — find another route or unlock the door first!', 2.4);
    }
  }

  updateHover(worldX: number, worldY: number) {
    let best: string | null = null;
    let bestD = 34;
    for (const it of this.interactables) {
      const ix = (it.tx + 0.5) * TILE_SIZE;
      const iy = (it.ty + 0.5) * TILE_SIZE;
      const d = Math.hypot(worldX - ix, worldY - iy);
      if (d < bestD) {
        bestD = d;
        best = it.id;
      }
    }
    this.hoveredInteractId = best;
  }

  getNearestInteractable(): Interactable | null {
    let best: Interactable | null = null;
    let bestDist = TILE_SIZE * 1.68;
    for (const it of this.interactables) {
      const ix = (it.tx + 0.5) * TILE_SIZE;
      const iy = (it.ty + 0.5) * TILE_SIZE;
      const d = Math.hypot(this.player.x - ix, this.player.y - iy);
      if (d < bestDist) {
        bestDist = d;
        best = it;
      }
    }
    return best;
  }

  getInteractionPrompt(): HUDTelemetry['interactionPrompt'] {
    if (this.player.hidingInId) {
      return { label: 'Exit Hiding Spot', sublabel: 'Press E or Move', canInteract: true };
    }
    const it = this.getNearestInteractable();
    if (!it) return null;

    switch (it.type) {
      case 'door_cell':
        return {
          label: it.open ? `Close ${it.label}` : `Open ${it.label}`,
          sublabel: it.locked ? 'Locked (Needs Lockpick)' : undefined,
          canInteract: !it.locked || this.inventory.lockpick > 0,
          reason: it.locked && this.inventory.lockpick === 0 ? 'Requires Lockpick' : undefined,
        };
      case 'door_keycard':
        if (it.open) return { label: `Close ${it.label}`, canInteract: true };
        if (this.inventory.keycard > 0) {
          return { label: `Swipe Keycard: ${it.label}`, sublabel: 'Instant Unlock', canInteract: true };
        }
        if (this.inventory.lockpick > 0) {
          return { label: `Pick Lock: ${it.label}`, sublabel: 'Minigame', canInteract: true };
        }
        return { label: it.label, canInteract: false, reason: 'Needs Keycard or Lockpick' };
      case 'desk':
      case 'toolbox':
      case 'med_cabinet':
        return it.searched
          ? { label: `${it.label} (Empty)`, canInteract: false }
          : { label: `Search ${it.label}`, canInteract: true };
      case 'locker':
      case 'laundry':
        if (!it.searched) {
          return { label: `Search ${it.label}`, sublabel: 'Also usable to Hide', canInteract: true };
        }
        return { label: `Hide in ${it.label}`, sublabel: 'Invisible to guards', canInteract: true };
      case 'vent':
        if (!it.unscrewed) {
          return this.inventory.screwdriver > 0
            ? { label: `Unscrew ${it.label}`, sublabel: 'Uses Screwdriver', canInteract: true }
            : { label: it.label, canInteract: false, reason: 'Requires Screwdriver' };
        }
        return { label: `Crawl Through ${it.label}`, sublabel: 'Shortcut Duct', canInteract: true };
      case 'fence_weak': {
        if (it.cut) return { label: 'Fence Breached', canInteract: false };
        const isElectric = this.tiles[it.ty][it.tx] === 'electric_fence' && this.powerDownTimer <= 0;
        if (isElectric) {
          return { label: it.label, canInteract: false, reason: 'Electrified! Disable Power Box first' };
        }
        return this.inventory.cutters > 0
          ? { label: `Cut ${it.label}`, sublabel: 'Uses Wire Cutters', canInteract: true }
          : { label: it.label, canInteract: false, reason: 'Requires Wire Cutters' };
      }
      case 'power_box':
        return this.powerDownTimer > 0
          ? { label: 'Power Grid Offline', sublabel: `${Math.ceil(this.powerDownTimer)}s left`, canInteract: false }
          : { label: `Sabotage ${it.label}`, sublabel: 'Drops electric fences & spotlights', canInteract: true };
      case 'security_terminal':
        return it.disabled
          ? { label: 'CCTV System Hacked', canInteract: false }
          : { label: `Hack ${it.label}`, sublabel: 'Disables all CCTV cameras', canInteract: true };
      case 'dig_spot': {
        const prog = it.digProgress ?? 0;
        if (prog >= 100) {
          return { label: `Enter Tunnel (${it.label})`, sublabel: 'Crawl to other side', canInteract: true };
        }
        return this.inventory.shovel > 0
          ? { label: `Dig Tunnel (${prog}%)`, sublabel: 'Press E to excavate', canInteract: true }
          : { label: it.label, canInteract: false, reason: 'Requires Trench Shovel' };
      }
      case 'safe':
        if (it.searched) return { label: `${it.label} (Empty)`, canInteract: false };
        return this.inventory.lockpick > 0 || this.inventory.keycard > 0
          ? { label: `Crack ${it.label}`, sublabel: 'High-value loot', canInteract: true }
          : { label: it.label, canInteract: false, reason: 'Requires Lockpick or Keycard' };
      case 'inmate':
        return {
          label: `Talk to ${it.inmateName ?? it.label}`,
          sublabel: it.isTrader ? 'Tips & Black Market' : 'Get Escape Intel',
          canInteract: true,
        };
      case 'escape_zone':
        return { label: `Escape via ${it.label}!`, sublabel: 'Finish Breakout', canInteract: true };
      default:
        return null;
    }
  }

  interact() {
    if (this.minigame) {
      this.triggerMinigameHit();
      return;
    }
    if (this.dialog) {
      this.dialog = null;
      return;
    }
    if (this.player.hidingInId) {
      this.player.hidingInId = null;
      this.showToast('Stepped out of hiding spot.', 1.8);
      return;
    }
    const it = this.getNearestInteractable();
    if (it) this.interactWith(it);
  }

  private interactWith(it: Interactable) {
    const ix = (it.tx + 0.5) * TILE_SIZE;
    const iy = (it.ty + 0.5) * TILE_SIZE;

    switch (it.type) {
      case 'door_cell': {
        if (it.locked) {
          if (this.inventory.lockpick > 0) {
            this.startMinigame('lockpick', `Pick ${it.label}`, 'Press SPACE or Click in the amber zone', it.id, 2);
          } else {
            this.showToast('Locked! Craft a Lockpick Set first.', 2.5);
          }
          return;
        }
        it.open = !it.open;
        soundEngine.playDoor();
        break;
      }
      case 'door_keycard': {
        const nextOpen = !it.open;
        if (!nextOpen) {
          it.open = false;
          soundEngine.playDoor();
          return;
        }
        if (this.inventory.keycard > 0) {
          it.locked = false;
          it.open = true;
          // Open twin double-door tile if adjacent
          const twin = this.interactables.find(
            (o) =>
              o.id !== it.id &&
              o.type === 'door_keycard' &&
              o.ty === it.ty &&
              Math.abs(o.tx - it.tx) === 1
          );
          if (twin) {
            twin.locked = false;
            twin.open = true;
          }
          soundEngine.playLockpickSuccess();
          this.addFloatingText(ix, iy - 12, 'Keycard Accepted', '#38BDF8');
          this.showToast(`${it.label} unlocked with Keycard!`, 2.2);
        } else if (this.inventory.lockpick > 0) {
          this.startMinigame('lockpick', `Pick ${it.label}`, 'Hit the amber sweet spot to unlock', it.id, 2);
        } else {
          soundEngine.playLockpickFail();
          this.showToast('Requires Security Keycard or Lockpick Set.', 2.5);
        }
        break;
      }
      case 'desk':
      case 'toolbox':
      case 'med_cabinet':
      case 'locker':
      case 'laundry': {
        if (!it.searched) {
          this.collectLoot(it);
        } else if (it.type === 'locker' || it.type === 'laundry') {
          this.player.hidingInId = it.id;
          this.movePath = [];
          soundEngine.playDoor();
          this.showToast(`Hiding inside ${it.label}. Guards cannot see you.`, 2.5);
        }
        break;
      }
      case 'vent': {
        if (!it.unscrewed) {
          if (this.inventory.screwdriver <= 0) {
            this.showToast('Requires a Screwdriver to open this vent!', 2.4);
            soundEngine.playLockpickFail();
            return;
          }
          it.unscrewed = true;
          const pair = this.interactables.find((o) => o.id === it.linkId);
          if (pair) pair.unscrewed = true;
          soundEngine.playCraft();
          this.spawnParticles(ix, iy, '#94A3B8', 12);
          this.addFloatingText(ix, iy - 10, 'Vent Opened!', '#FBBF24');
          this.showToast('Vent unscrewed! Press [E] again to crawl through.', 2.6);
          return;
        }
        const target = this.interactables.find((o) => o.id === it.linkId);
        if (target) {
          this.player.x = (target.tx + 0.5) * TILE_SIZE;
          this.player.y = (target.ty + 0.5) * TILE_SIZE;
          this.player.inVentFade = 0.65;
          this.movePath = [];
          soundEngine.playSmoke();
          this.spawnParticles(this.player.x, this.player.y, '#CBD5E1', 14);
          this.showToast(`Emerged at ${target.label}!`, 2.4);
        }
        break;
      }
      case 'fence_weak': {
        if (it.cut) return;
        const isElectric = this.tiles[it.ty][it.tx] === 'electric_fence' && this.powerDownTimer <= 0;
        if (isElectric) {
          soundEngine.playEMP();
          this.player.hp = Math.max(10, this.player.hp - 15);
          this.screenShake = 0.25;
          this.showToast('ZAP! Fence is electrified! Sabotage the Power Box first!', 3.2);
          return;
        }
        if (this.inventory.cutters <= 0) {
          this.showToast('Requires Wire Cutters! Craft them or find a stash.', 2.6);
          return;
        }
        it.cut = true;
        soundEngine.playSnip();
        this.spawnParticles(ix, iy, '#F59E0B', 16, 110);
        this.addFloatingText(ix, iy - 12, 'Fence Cut!', '#34D399');
        this.showToast('Perimeter fence breached! Slip through to freedom!', 3.2);
        break;
      }
      case 'power_box': {
        if (this.powerDownTimer > 0) return;
        this.powerDownTimer = 60;
        for (const cam of this.cameras) cam.disabledTimer = Math.max(cam.disabledTimer, 60);
        for (const sl of this.searchlights) sl.disabledTimer = Math.max(sl.disabledTimer, 60);
        soundEngine.playEMP();
        this.spawnParticles(ix, iy, '#22D3EE', 20, 120);
        this.addFloatingText(ix, iy - 14, 'GRID OFFLINE (60s)', '#22D3EE');
        this.showToast('Power Grid sabotaged! Electric fences, cameras & spotlights offline for 60s!', 4.0);
        break;
      }
      case 'security_terminal': {
        if (it.disabled) return;
        this.startMinigame('hack', 'Hack Security Core', 'Hit the amber zone to disable all CCTV', it.id, 2);
        break;
      }
      case 'dig_spot': {
        const prog = it.digProgress ?? 0;
        if (prog >= 100) {
          const dest = this.interactables.find((o) => o.id === it.linkId);
          if (dest) {
            this.player.x = (dest.tx + 0.5) * TILE_SIZE;
            this.player.y = (dest.ty + 0.5) * TILE_SIZE;
            this.player.inVentFade = 0.65;
            this.movePath = [];
            soundEngine.playDig();
            this.spawnParticles(this.player.x, this.player.y, '#92400E', 16);
            this.showToast(`Crawled through tunnel to ${dest.label}!`, 2.6);
          }
          return;
        }
        if (this.inventory.shovel <= 0) {
          this.showToast('Requires a Trench Shovel to excavate this tunnel!', 2.6);
          return;
        }
        const next = Math.min(100, prog + 34);
        it.digProgress = next;
        soundEngine.playDig();
        this.spawnParticles(ix, iy, '#92400E', 14, 90);
        this.emitSound(ix, iy, 120, 'rgba(146, 64, 14, 0.5)');
        if (next >= 100) {
          const dest = this.interactables.find((o) => o.id === it.linkId);
          if (dest) dest.digProgress = 100;
          this.addFloatingText(ix, iy - 14, 'Tunnel Complete!', '#34D399');
          this.showToast('Tunnel broken through! Press [E] to crawl underneath the perimeter!', 3.2);
        } else {
          this.addFloatingText(ix, iy - 12, `Digging ${next}%`, '#FBBF24');
        }
        break;
      }
      case 'safe': {
        if (it.searched) return;
        if (this.inventory.keycard > 0) {
          this.collectLoot(it);
          soundEngine.playLockpickSuccess();
        } else if (this.inventory.lockpick > 0) {
          this.startMinigame('lockpick', `Crack ${it.label}`, '3-pin high-security safe lock', it.id, 3);
        } else {
          this.showToast('Safe locked! Needs Lockpick Set or Keycard.', 2.5);
        }
        break;
      }
      case 'inmate': {
        if (it.intelTarget && !it.intelRevealed) {
          it.intelRevealed = true;
          this.discoveredIntel.push({ ...it.intelTarget });
          soundEngine.playLoot();
        }
        this.dialog = {
          active: true,
          inmateId: it.id,
          inmateName: it.inmateName ?? it.label,
          message: it.inmateTip ?? 'Stay low and watch guard patrol loops.',
          isTrader: Boolean(it.isTrader),
          intelAvailable: Boolean(it.intelTarget),
        };
        break;
      }
      case 'escape_zone': {
        this.triggerEscape(it.label);
        break;
      }
    }
  }

  private collectLoot(it: Interactable) {
    it.searched = true;
    this.containersSearched++;
    const ix = (it.tx + 0.5) * TILE_SIZE;
    const iy = (it.ty + 0.5) * TILE_SIZE;
    const found: string[] = [];
    if (it.loot) {
      for (const [k, v] of Object.entries(it.loot)) {
        const qty = v ?? 0;
        if (qty > 0) {
          const itemId = k as ItemId;
          this.inventory[itemId] = (this.inventory[itemId] ?? 0) + qty;
          found.push(`+${qty} ${ITEMS[itemId].shortLabel}`);
        }
      }
    }
    soundEngine.playLoot();
    this.spawnParticles(ix, iy, '#FBBF24', 10);
    if (found.length > 0) {
      const summary = found.join(', ');
      this.addFloatingText(ix, iy - 12, summary, '#34D399');
      this.showToast(`Found in ${it.label}: ${summary}`, 3.0);
    } else {
      this.addFloatingText(ix, iy - 12, 'Empty', '#94A3B8');
    }
  }

  private startMinigame(
    kind: 'lockpick' | 'hack',
    title: string,
    subtitle: string,
    targetId: string,
    totalStages: number
  ) {
    this.movePath = [];
    this.minigame = {
      active: true,
      kind,
      title,
      subtitle,
      targetId,
      cursor: 0.1,
      direction: 1,
      speed: kind === 'hack' ? 1.25 : 1.05,
      zoneStart: 0.32 + Math.random() * 0.25,
      zoneWidth: kind === 'hack' ? 0.22 : 0.24,
      stage: 1,
      totalStages,
    };
  }

  triggerMinigameHit() {
    const mg = this.minigame;
    if (!mg) return;
    const inside = mg.cursor >= mg.zoneStart && mg.cursor <= mg.zoneStart + mg.zoneWidth;
    if (inside) {
      soundEngine.playLockpickTick();
      if (mg.stage >= mg.totalStages) {
        // Success!
        const target = this.interactables.find((i) => i.id === mg.targetId);
        this.minigame = null;
        if (target) {
          if (mg.kind === 'lockpick') {
            if (target.type === 'safe') {
              target.locked = false;
              this.collectLoot(target);
            } else {
              target.locked = false;
              target.open = true;
              const twin = this.interactables.find(
                (o) =>
                  o.id !== target.id &&
                  o.type === 'door_keycard' &&
                  o.ty === target.ty &&
                  Math.abs(o.tx - target.tx) === 1
              );
              if (twin) {
                twin.locked = false;
                twin.open = true;
              }
            }
            soundEngine.playLockpickSuccess();
            this.showToast(`${target.label} unlocked!`, 2.5);
          } else {
            target.disabled = true;
            for (const cam of this.cameras) cam.permanentlyDisabled = true;
            soundEngine.playEMP();
            this.showToast('Security Core hacked! All CCTV cameras permanently disabled!', 3.8);
          }
        }
      } else {
        mg.stage++;
        mg.speed += 0.22;
        mg.zoneStart = 0.18 + Math.random() * 0.5;
        mg.zoneWidth = Math.max(0.16, mg.zoneWidth - 0.02);
      }
    } else {
      // Failed pin — makes noise!
      soundEngine.playLockpickFail();
      this.emitSound(this.player.x, this.player.y, 200, 'rgba(239, 68, 68, 0.7)');
      this.showToast('Slip! Made noise — try hitting inside the amber bar!', 2.2);
      mg.cursor = 0.05;
      mg.direction = 1;
    }
  }

  cancelMinigame() {
    this.minigame = null;
  }

  craftRecipe(recipe: CraftingRecipe): boolean {
    if (!canCraft(this.inventory, recipe)) return false;
    for (const [k, qty] of Object.entries(recipe.ingredients)) {
      this.inventory[k as ItemId] -= qty ?? 0;
    }
    this.inventory[recipe.output] += recipe.outputCount;
    soundEngine.playCraft();
    this.addFloatingText(this.player.x, this.player.y - 18, `Crafted ${recipe.label}`, '#FBBF24');
    this.showToast(`Crafted ${recipe.label}!`, 2.6);
    return true;
  }

  buyTradeOffer(offerId: string): boolean {
    const offer = TRADER_OFFERS.find((o) => o.id === offerId);
    if (!offer) return false;
    if (this.inventory.coin < offer.costCoins) {
      this.showToast('Not enough Commissary Coins!', 2.0);
      return false;
    }
    this.inventory.coin -= offer.costCoins;
    this.inventory[offer.item] += 1;
    soundEngine.playLoot();
    this.addFloatingText(this.player.x, this.player.y - 18, `+1 ${offer.label}`, '#34D399');
    return true;
  }

  useHotbarItem(slotIndex: number) {
    // 1: Coin Decoy, 2: Ration, 3: Guard Disguise, 4: EMP Jammer, 5: Smoke Bomb
    if (slotIndex === 1) {
      if (this.inventory.coin <= 0) {
        this.showToast('No Coins left to toss as decoy!', 2.0);
        return;
      }
      this.inventory.coin--;
      const tx = this.player.x + Math.cos(this.player.angle) * 110;
      const ty = this.player.y + Math.sin(this.player.angle) * 110;
      soundEngine.playCoin();
      this.spawnParticles(tx, ty, '#FBBF24', 8, 50);
      this.emitSound(tx, ty, 275, 'rgba(251, 191, 36, 0.75)', true);
      this.addFloatingText(tx, ty - 10, 'Clink!', '#FBBF24');
      this.showToast('Tossed coin decoy — nearby guards will investigate!', 2.4);
    } else if (slotIndex === 2) {
      if (this.inventory.ration <= 0) {
        this.showToast('No Energy Rations in bag.', 1.8);
        return;
      }
      this.inventory.ration--;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 45);
      this.player.stamina = this.player.maxStamina;
      soundEngine.playLoot();
      this.addFloatingText(this.player.x, this.player.y - 18, '+45 HP & Stamina', '#34D399');
    } else if (slotIndex === 3) {
      if (this.inventory.disguise <= 0) {
        this.showToast('No Guard Uniform crafted! Craft one with Cloth + Tape.', 2.2);
        return;
      }
      this.inventory.disguise--;
      this.player.disguiseTimer = 35;
      soundEngine.playCraft();
      this.addFloatingText(this.player.x, this.player.y - 18, 'Disguise Equipped (35s)', '#60A5FA');
      this.showToast('Wearing Guard Uniform — guards barely notice you at range!', 2.8);
    } else if (slotIndex === 4) {
      if (this.inventory.emp <= 0) {
        this.showToast('No EMP Jammer in bag.', 2.0);
        return;
      }
      this.inventory.emp--;
      soundEngine.playEMP();
      this.emitSound(this.player.x, this.player.y, 170, 'rgba(34, 211, 238, 0.7)');
      this.spawnParticles(this.player.x, this.player.y, '#22D3EE', 24, 150);
      for (const cam of this.cameras) cam.disabledTimer = Math.max(cam.disabledTimer, 18);
      for (const sl of this.searchlights) sl.disabledTimer = Math.max(sl.disabledTimer, 18);
      this.addFloatingText(this.player.x, this.player.y - 18, 'EMP Pulse (18s)', '#22D3EE');
      this.showToast('EMP active! All CCTV cameras & searchlights disabled for 18s!', 2.8);
    } else if (slotIndex === 5) {
      if (this.inventory.smoke <= 0) {
        this.showToast('No Smoke Bombs in bag.', 2.0);
        return;
      }
      this.inventory.smoke--;
      soundEngine.playSmoke();
      this.smokes.push({ x: this.player.x, y: this.player.y, radius: 105, timer: 9, maxTimer: 9 });
      this.spawnParticles(this.player.x, this.player.y, '#CBD5E1', 20, 85);
      // Drop pursuing guards back to suspicious
      for (const g of this.guards) {
        if (g.state === 'alerted' && Math.hypot(g.x - this.player.x, g.y - this.player.y) < 220) {
          g.state = 'suspicious';
          g.suspicion = 55;
        }
      }
      this.addFloatingText(this.player.x, this.player.y - 18, 'Smoke Cover!', '#CBD5E1');
    }
  }

  private triggerEscape(methodLabel: string) {
    if (this.escaped || this.busted) return;
    this.escaped = true;
    this.escapeMethodUsed = methodLabel;
    soundEngine.playEscape();
  }

  step(input: InputState, rawDt: number) {
    if (this.escaped || this.busted) return;
    const dt = Math.min(0.05, Math.max(0.001, rawDt));
    this.elapsedSeconds += dt;
    this.clockMinutes = (this.clockMinutes + dt * 1.15) % (24 * 60);

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.activeToast = null;
    }

    if (this.player.inVentFade > 0) this.player.inVentFade = Math.max(0, this.player.inVentFade - dt);
    if (this.player.hitCooldown > 0) this.player.hitCooldown = Math.max(0, this.player.hitCooldown - dt);
    if (this.player.disguiseTimer > 0) this.player.disguiseTimer = Math.max(0, this.player.disguiseTimer - dt);
    if (this.powerDownTimer > 0) this.powerDownTimer = Math.max(0, this.powerDownTimer - dt);
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt);
    if (this.clickMarker) {
      this.clickMarker.timer -= dt;
      if (this.clickMarker.timer <= 0) this.clickMarker = null;
    }

    if (this.lockdownTimer > 0) {
      this.lockdownTimer = Math.max(0, this.lockdownTimer - dt);
      this.alarmPulseTimer -= dt;
      if (this.alarmPulseTimer <= 0) {
        this.alarmPulseTimer = 1.1;
        soundEngine.playAlarmPulse();
      }
    }

    // Minigame animation
    if (this.minigame) {
      const mg = this.minigame;
      mg.cursor += mg.direction * mg.speed * dt;
      if (mg.cursor >= 0.96) {
        mg.cursor = 0.96;
        mg.direction = -1;
      } else if (mg.cursor <= 0.04) {
        mg.cursor = 0.04;
        mg.direction = 1;
      }
      return; // Pause world slightly while picking lock/hacking
    }

    if (this.dialog) return;

    // Update particles, ripples, smokes, floating texts
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 220 * dt;
      r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);
      if (r.radius >= r.maxRadius) this.ripples.splice(i, 1);
    }
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      this.smokes[i].timer -= dt;
      if (this.smokes[i].timer <= 0) this.smokes.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.y -= 24 * dt;
      f.life -= dt;
      if (f.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Movement Input
    let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0) + input.touchX;
    let my = (input.down ? 1 : 0) - (input.up ? 1 : 0) + input.touchY;

    if (Math.hypot(mx, my) > 0.1) {
      this.movePath = [];
      this.pendingInteractId = null;
      if (this.player.hidingInId) {
        this.player.hidingInId = null;
      }
    } else if (this.movePath.length > 0 && !this.player.hidingInId) {
      const next = this.movePath[0];
      const nx = (next.tx + 0.5) * TILE_SIZE;
      const ny = (next.ty + 0.5) * TILE_SIZE;
      const dx = nx - this.player.x;
      const dy = ny - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        this.movePath.shift();
        if (this.movePath.length === 0 && this.pendingInteractId) {
          const target = this.interactables.find((i) => i.id === this.pendingInteractId);
          this.pendingInteractId = null;
          if (target) this.interactWith(target);
        }
      } else {
        mx = dx / dist;
        my = dy / dist;
      }
    }

    const moving = Math.hypot(mx, my) > 0.05 && !this.player.hidingInId;
    this.player.crouching = input.crouch;
    this.player.sprinting = input.sprint && !input.crouch && moving && this.player.stamina > 4;

    if (this.player.sprinting) {
      this.player.stamina = Math.max(0, this.player.stamina - 24 * dt);
    } else {
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 16 * dt);
    }

    if (moving) {
      const len = Math.hypot(mx, my);
      if (len > 1) {
        mx /= len;
        my /= len;
      }
      const speed = this.player.sprinting ? 195 : this.player.crouching ? 88 : 138;
      this.moveCircleWithCollision(this.player, mx * speed * dt, my * speed * dt);
      this.player.angle = Math.atan2(my, mx);
      this.player.walkPhase += dt * (this.player.sprinting ? 14 : this.player.crouching ? 6 : 10);
      soundEngine.playStep(this.player.sprinting, this.player.crouching);

      if (this.player.sprinting && Math.random() < dt * 3.5) {
        this.emitSound(this.player.x, this.player.y, 130, 'rgba(226, 232, 240, 0.35)', false);
      }
    }

    // Check auto-escape if stepping right onto escape zone
    for (const it of this.interactables) {
      if (it.type === 'escape_zone') {
        const ex = (it.tx + 0.5) * TILE_SIZE;
        const ey = (it.ty + 0.5) * TILE_SIZE;
        if (Math.hypot(this.player.x - ex, this.player.y - ey) < TILE_SIZE * 0.9) {
          this.triggerEscape(it.label);
          return;
        }
      }
    }

    // Smooth camera follow
    this.camX += (this.player.x - this.camX) * Math.min(1, dt * 8);
    this.camY += (this.player.y - this.camY) * Math.min(1, dt * 8);

    // Update Cameras
    let spottedByTech = false;
    for (const cam of this.cameras) {
      if (cam.permanentlyDisabled) continue;
      if (cam.disabledTimer > 0) {
        cam.disabledTimer = Math.max(0, cam.disabledTimer - dt);
        continue;
      }
      cam.phase += dt * cam.sweepSpeed;
      const base = (cam.baseAngleDeg * Math.PI) / 180;
      const sweep = ((cam.sweepDeg * Math.PI) / 180) * 0.5;
      cam.angle = base + Math.sin(cam.phase) * sweep;

      if (!this.player.hidingInId && this.isPointInCone(this.player.x, this.player.y, cam.x, cam.y, cam.angle, 0.52, cam.range)) {
        const disguiseMult = this.player.disguiseTimer > 0 ? 0.28 : 1;
        cam.alertLevel = Math.min(100, cam.alertLevel + 80 * disguiseMult * dt);
        if (cam.alertLevel >= 100) {
          spottedByTech = true;
          this.triggerLockdown(this.player.x, this.player.y, 'CCTV Camera spotted you!');
          cam.alertLevel = 55;
        }
      } else {
        cam.alertLevel = Math.max(0, cam.alertLevel - 40 * dt);
      }
    }

    // Update Searchlights
    let inSearchlight = false;
    for (const sl of this.searchlights) {
      if (sl.permanentlyDisabled) continue;
      if (sl.disabledTimer > 0) {
        sl.disabledTimer = Math.max(0, sl.disabledTimer - dt);
        continue;
      }
      sl.phase += dt * sl.speed;
      const cx = (sl.targetTx + 0.5) * TILE_SIZE;
      const cy = (sl.targetTy + 0.5) * TILE_SIZE;
      sl.spotX = cx + Math.cos(sl.phase) * sl.sweepRadiusTiles * TILE_SIZE;
      sl.spotY = cy + Math.sin(sl.phase * 0.7) * (sl.sweepRadiusTiles * 0.45) * TILE_SIZE;

      if (
        !this.player.hidingInId &&
        this.player.disguiseTimer <= 0 &&
        Math.hypot(this.player.x - sl.spotX, this.player.y - sl.spotY) < sl.beamRadius * 0.85
      ) {
        inSearchlight = true;
      }
    }

    if (inSearchlight && !spottedByTech) {
      // Alert nearest guard toward spotlight
      for (const g of this.guards) {
        if (g.state !== 'alerted' && Math.hypot(g.x - this.player.x, g.y - this.player.y) < 420) {
          g.suspicion = Math.min(100, g.suspicion + 52 * dt);
          if (g.suspicion >= 40 && g.state === 'patrol') {
            g.state = 'suspicious';
            g.investigateTarget = { x: this.player.x, y: this.player.y };
            g.investigateTimer = 4.5;
          }
        }
      }
    }

    // Update Guards
    const { isNight } = this.getScheduleInfo();
    for (const g of this.guards) {
      if (g.whistleCooldown > 0) g.whistleCooldown = Math.max(0, g.whistleCooldown - dt);
      if (g.stunTimer > 0) {
        g.stunTimer -= dt;
        if (g.stunTimer <= 0) g.state = 'suspicious';
        continue;
      }

      const distToPlayer = Math.hypot(this.player.x - g.x, this.player.y - g.y);
      const halfFov = ((g.fovDeg * Math.PI) / 180) * 0.5;
      const effectiveDist = g.viewDist * (isNight && !inSearchlight ? 0.86 : 1) * (this.player.crouching ? 0.78 : 1);

      const seesPlayer =
        !this.player.hidingInId &&
        this.isPointInCone(this.player.x, this.player.y, g.x, g.y, g.angle, halfFov, effectiveDist);

      if (seesPlayer) {
        let rate = distToPlayer < 95 ? 165 : distToPlayer < 170 ? 95 : 52;
        if (this.player.disguiseTimer > 0 && g.role !== 'k9') {
          rate *= distToPlayer < 80 ? 0.65 : 0.2;
        }
        if (inSearchlight) rate *= 1.45;
        if (this.lockdownTimer > 0) rate *= 1.3;

        const prevState = g.state;
        g.suspicion = Math.min(100, g.suspicion + rate * dt);
        g.investigateTarget = { x: this.player.x, y: this.player.y };
        g.investigateTimer = 5.0;

        if (g.suspicion >= 85) {
          g.state = 'alerted';
          if (prevState !== 'alerted') {
            this.guardsAlertedSet.add(g.id);
            if (g.whistleCooldown <= 0) {
              g.whistleCooldown = 6;
              soundEngine.playWhistle();
              this.emitSound(g.x, g.y, 240, 'rgba(239, 68, 68, 0.55)', false);
            }
          }
        } else if (g.suspicion >= 35 && g.state === 'patrol') {
          g.state = 'suspicious';
          soundEngine.playSuspicious();
        }
      } else {
        // Decay suspicion when out of sight
        const decay = g.state === 'alerted' ? 14 : 20;
        g.suspicion = Math.max(0, g.suspicion - decay * dt);
        if (g.state === 'alerted' && g.suspicion < 45) {
          g.state = 'suspicious';
        } else if (g.state === 'suspicious' && g.suspicion <= 5 && g.investigateTimer <= 0) {
          g.state = 'patrol';
          g.investigateTarget = null;
        }
      }

      // Guard Movement
      const prevGx = g.x;
      const prevGy = g.y;
      if (g.state === 'alerted') {
        g.pathRecalcTimer -= dt;
        if (g.pathRecalcTimer <= 0) {
          g.pathRecalcTimer = 0.35;
          g.path = this.findPath(
            Math.floor(g.x / TILE_SIZE),
            Math.floor(g.y / TILE_SIZE),
            Math.floor(this.player.x / TILE_SIZE),
            Math.floor(this.player.y / TILE_SIZE),
            true
          );
          g.pathIndex = 0;
        }
        this.followGuardPath(g, g.speed * 1.24, dt);

        // Melee Catch
        if (distToPlayer < 25 && this.player.hitCooldown <= 0 && !this.player.hidingInId) {
          this.player.hp = Math.max(0, this.player.hp - 34);
          this.player.hitCooldown = 1.25;
          this.screenShake = 0.32;
          soundEngine.playHit();
          this.spawnParticles(this.player.x, this.player.y, '#EF4444', 14, 110);
          this.addFloatingText(this.player.x, this.player.y - 16, '-34 HP', '#EF4444');
          if (this.player.hp <= 0) {
            this.busted = true;
            this.bustReason =
              g.role === 'k9'
                ? 'Intercepted by K9 Patrol Unit.'
                : g.role === 'warden'
                  ? 'Apprehended by the Prison Warden.'
                  : 'Tackled by Facility Security Guard.';
            soundEngine.playBusted();
            return;
          } else {
            this.showToast('Hit by guard! Use a Smoke Bomb [5] or break line of sight!', 2.5);
          }
        }
      } else if (g.state === 'suspicious' && g.investigateTarget) {
        g.investigateTimer -= dt;
        if (g.path.length === 0) {
          g.path = this.findPath(
            Math.floor(g.x / TILE_SIZE),
            Math.floor(g.y / TILE_SIZE),
            Math.floor(g.investigateTarget.x / TILE_SIZE),
            Math.floor(g.investigateTarget.y / TILE_SIZE),
            true
          );
          g.pathIndex = 0;
        }
        const arrived = this.followGuardPath(g, g.speed * 0.85, dt);
        if (arrived) {
          g.angle += Math.sin(this.elapsedSeconds * 3) * 1.8 * dt;
          if (g.investigateTimer <= 0) {
            g.state = 'patrol';
            g.investigateTarget = null;
          }
        }
      } else if (g.waypoints.length > 0) {
        // Regular Patrol
        if (g.waitTimer > 0) {
          g.waitTimer -= dt;
        } else {
          const wp = g.waypoints[g.wpIndex];
          const wx = (wp.tx + 0.5) * TILE_SIZE;
          const wy = (wp.ty + 0.5) * TILE_SIZE;
          const dx = wx - g.x;
          const dy = wy - g.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 12) {
            g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
            g.waitTimer = 0.65;
            g.path = [];
          } else if (this.hasClearCorridor(g.x, g.y, wx, wy, true)) {
            g.path = [];
            const step = Math.min(dist, g.speed * dt);
            this.moveCircleWithCollision(g, (dx / dist) * step, (dy / dist) * step, true);
            g.targetAngle = Math.atan2(dy, dx);
            g.angle = this.lerpAngle(g.angle, g.targetAngle, dt * 8);
            g.walkPhase += dt * 7;
          } else {
            if (g.path.length === 0 || g.pathIndex >= g.path.length) {
              const gx = Math.floor(g.x / TILE_SIZE);
              const gy = Math.floor(g.y / TILE_SIZE);
              g.path = this.findPath(gx, gy, wp.tx, wp.ty, true);
              g.pathIndex = 0;
              if (g.path.length === 0) {
                // Skip unreachable waypoint
                g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
              }
            }
            const finished = this.followGuardPath(g, g.speed, dt);
            if (finished) {
              g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
              g.waitTimer = 0.65;
              g.path = [];
            }
          }
        }
      }

      // Auto-recover if a guard is wedged on any corner
      if (g.waitTimer <= 0 && Math.hypot(g.x - prevGx, g.y - prevGy) < 0.2) {
        g.pathRecalcTimer -= dt * 2;
        if (g.pathRecalcTimer <= -0.8) {
          g.pathRecalcTimer = 0.35;
          g.path = [];
          if (g.state === 'patrol' && g.waypoints.length > 0) {
            g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
          } else if (g.state === 'suspicious') {
            g.state = 'patrol';
            g.investigateTarget = null;
          }
        }
      }
    }
  }

  private hasClearCorridor(x1: number, y1: number, x2: number, y2: number, isGuard: boolean): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return true;
    const nx = -dy / dist;
    const ny = dx / dist;
    const offsets = [0, 11, -11];
    const steps = Math.ceil(dist / 12);
    for (const off of offsets) {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t + nx * off;
        const py = y1 + dy * t + ny * off;
        const tx = Math.floor(px / TILE_SIZE);
        const ty = Math.floor(py / TILE_SIZE);
        if (!this.isTileWalkable(tx, ty, isGuard)) return false;
      }
    }
    return true;
  }

  private followGuardPath(g: GuardEntity, speed: number, dt: number): boolean {
    if (g.pathIndex >= g.path.length) return true;
    const node = g.path[g.pathIndex];
    const nx = (node.tx + 0.5) * TILE_SIZE;
    const ny = (node.ty + 0.5) * TILE_SIZE;
    const dx = nx - g.x;
    const dy = ny - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      g.pathIndex++;
      return g.pathIndex >= g.path.length;
    }
    const step = Math.min(dist, speed * dt);
    this.moveCircleWithCollision(g, (dx / dist) * step, (dy / dist) * step, true);
    g.targetAngle = Math.atan2(dy, dx);
    g.angle = this.lerpAngle(g.angle, g.targetAngle, dt * 9);
    g.walkPhase += dt * 9;
    return false;
  }

  private triggerLockdown(x: number, y: number, reason: string) {
    if (this.lockdownTimer <= 2) {
      this.alarmsTriggered++;
      this.showToast(`LOCKDOWN: ${reason}`, 3.5);
    }
    this.lockdownTimer = 22;
    for (const g of this.guards) {
      if (Math.hypot(g.x - x, g.y - y) < 420) {
        g.state = 'suspicious';
        g.suspicion = Math.max(g.suspicion, 70);
        g.investigateTarget = { x, y };
        g.investigateTimer = 7;
        g.path = [];
      }
    }
  }

  private isPointInCone(
    px: number,
    py: number,
    ox: number,
    oy: number,
    coneAngle: number,
    halfFov: number,
    range: number
  ): boolean {
    const dx = px - ox;
    const dy = py - oy;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;
    const angleToP = Math.atan2(dy, dx);
    let diff = angleToP - coneAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > halfFov) return false;
    return this.hasLineOfSight(ox, oy, px, py);
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * Math.min(1, t);
  }

  private moveCircleWithCollision(
    entity: { x: number; y: number },
    dx: number,
    dy: number,
    isGuard = false
  ) {
    const r = isGuard ? 10 : 11;
    // Separate X and Y axis resolution for buttery wall sliding
    const nextX = entity.x + dx;
    if (!this.collidesAt(nextX, entity.y, r, isGuard)) {
      entity.x = nextX;
    }
    const nextY = entity.y + dy;
    if (!this.collidesAt(entity.x, nextY, r, isGuard)) {
      entity.y = nextY;
    }
  }

  private collidesAt(x: number, y: number, r: number, isGuard: boolean): boolean {
    const minTx = Math.floor((x - r) / TILE_SIZE);
    const maxTx = Math.floor((x + r) / TILE_SIZE);
    const minTy = Math.floor((y - r) / TILE_SIZE);
    const maxTy = Math.floor((y + r) / TILE_SIZE);
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (!this.isTileWalkable(tx, ty, isGuard)) {
          return true;
        }
      }
    }
    return false;
  }

  getScheduleInfo(): { clockText: string; schedulePhase: HUDTelemetry['schedulePhase']; isNight: boolean } {
    const total = Math.floor(this.clockMinutes) % (24 * 60);
    const hrs = Math.floor(total / 60);
    const mins = total % 60;
    const clockText = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    let schedulePhase: HUDTelemetry['schedulePhase'] = 'Lights Out';
    if (hrs >= 6 && hrs < 12) schedulePhase = 'Roll Call';
    else if (hrs >= 12 && hrs < 18) schedulePhase = 'Yard Time';
    else if (hrs >= 18 && hrs < 22) schedulePhase = 'Evening Lockup';
    const isNight = hrs >= 20 || hrs < 6;
    return { clockText, schedulePhase, isNight };
  }

  getTelemetry(): HUDTelemetry {
    const { clockText, schedulePhase, isNight } = this.getScheduleInfo();
    let maxSusp = 0;
    let anyAlert = false;
    let anySusp = false;
    for (const g of this.guards) {
      if (g.suspicion > maxSusp) maxSusp = g.suspicion;
      if (g.state === 'alerted') anyAlert = true;
      else if (g.state === 'suspicious') anySusp = true;
    }
    const alertStatus: HUDTelemetry['alertStatus'] =
      this.lockdownTimer > 0
        ? 'Lockdown'
        : anyAlert
          ? 'Alerted'
          : anySusp
            ? 'Suspicious'
            : 'Clear';

    return {
      levelId: this.level.id,
      levelName: this.level.name,
      levelSubtitle: this.level.subtitle,
      clockText,
      schedulePhase,
      isNight,
      hp: Math.round(this.player.hp),
      maxHp: this.player.maxHp,
      stamina: Math.round(this.player.stamina),
      maxStamina: this.player.maxStamina,
      suspicionMax: Math.round(maxSusp),
      alertStatus,
      lockdownTimer: Math.ceil(this.lockdownTimer),
      powerDownTimer: Math.ceil(this.powerDownTimer),
      disguiseActive: this.player.disguiseTimer > 0,
      disguiseTimer: Math.ceil(this.player.disguiseTimer),
      hiding: Boolean(this.player.hidingInId),
      inVent: this.player.inVentFade > 0,
      crouching: this.player.crouching,
      sprinting: this.player.sprinting,
      inventory: { ...this.inventory },
      elapsedSeconds: this.elapsedSeconds,
      alarmsTriggered: this.alarmsTriggered,
      guardsAlertedCount: this.guardsAlertedSet.size,
      containersSearched: this.containersSearched,
      interactionPrompt: this.getInteractionPrompt(),
      activeToast: this.activeToast,
      minigame: this.minigame ? { ...this.minigame } : null,
      dialog: this.dialog ? { ...this.dialog } : null,
      discoveredIntel: [...this.discoveredIntel],
      escapeMethodUsed: this.escapeMethodUsed,
      bustReason: this.bustReason,
    };
  }
}
