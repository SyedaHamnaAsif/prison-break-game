import {
  Briefcase,
  CheckCircle2,
  Coins,
  EyeOff,
  Footprints,
  Hammer,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { RefObject } from 'react';
import { canCraft, CRAFTING_RECIPES, ITEMS, TRADER_OFFERS } from '../game/items';
import { CraftingRecipe, EscapeRouteGuide, GameState, HUDTelemetry, ItemId } from '../game/types';

interface GameHUDProps {
  gameState: GameState;
  telemetry: HUDTelemetry;
  escapeRoutes: EscapeRouteGuide[];
  totalLevels: number;
  muted: boolean;
  showCraftDrawer: boolean;
  showMinimap: boolean;
  minimapRef: RefObject<HTMLCanvasElement | null>;
  isTouchDevice: boolean;
  onToggleCraftDrawer: () => void;
  onToggleMinimap: () => void;
  onToggleMute: () => void;
  onPauseToggle: () => void;
  onRestartLevel: () => void;
  onNextLevel: () => void;
  onReturnMenu: () => void;
  onInteract: () => void;
  onToggleCrouch: () => void;
  onUseHotbar: (slot: number) => void;
  onCraft: (recipe: CraftingRecipe) => void;
  onTriggerMinigameHit: () => void;
  onCancelMinigame: () => void;
  onCloseDialog: () => void;
  onBuyTrade: (offerId: string) => void;
  onTouchJoystick: (dx: number, dy: number) => void;
}

const MATERIAL_KEYS: ItemId[] = [
  'scrap',
  'wire',
  'tape',
  'battery',
  'cloth',
  'keycard',
  'lockpick',
  'cutters',
  'screwdriver',
  'shovel',
];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function computeStealthRating(t: HUDTelemetry): string {
  if (t.alarmsTriggered === 0 && t.guardsAlertedCount === 0) return 'Ghost';
  if (t.alarmsTriggered === 0 && t.guardsAlertedCount <= 2) return 'Shadow';
  if (t.alarmsTriggered <= 1) return 'Survivor';
  return 'Fugitive';
}

export function GameHUD({
  gameState,
  telemetry,
  escapeRoutes,
  totalLevels,
  muted,
  showCraftDrawer,
  showMinimap,
  minimapRef,
  isTouchDevice,
  onToggleCraftDrawer,
  onToggleMinimap,
  onToggleMute,
  onPauseToggle,
  onRestartLevel,
  onNextLevel,
  onReturnMenu,
  onInteract,
  onToggleCrouch,
  onUseHotbar,
  onCraft,
  onTriggerMinigameHit,
  onCancelMinigame,
  onCloseDialog,
  onBuyTrade,
  onTouchJoystick,
}: GameHUDProps) {
  const alertColor =
    telemetry.alertStatus === 'Lockdown' || telemetry.alertStatus === 'Alerted'
      ? 'text-rose-400'
      : telemetry.alertStatus === 'Suspicious'
        ? 'text-amber-400'
        : 'text-emerald-400';

  const hotbarItems: Array<{ slot: number; id: ItemId; label: string }> = [
    { slot: 1, id: 'coin', label: 'Coin Decoy' },
    { slot: 2, id: 'ration', label: 'Ration' },
    { slot: 3, id: 'disguise', label: 'Disguise' },
    { slot: 4, id: 'emp', label: 'EMP' },
    { slot: 5, id: 'smoke', label: 'Smoke' },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between select-none">
      {/* Top Tactical Bar */}
      <div className="p-3 sm:p-4 flex items-start justify-between gap-3">
        <div className="pointer-events-auto bg-[#0B0E14]/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-md flex flex-wrap items-center gap-x-5 gap-y-2">
          <div>
            <div className="font-display text-lg font-bold text-slate-100 leading-tight">
              {telemetry.levelName}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 font-mono-tabular">
              <span>{telemetry.clockText}</span>
              <span aria-hidden="true">·</span>
              <span>{telemetry.schedulePhase}</span>
              <span aria-hidden="true">·</span>
              <span className={alertColor}>
                {telemetry.alertStatus}
                {telemetry.lockdownTimer > 0 ? ` (${telemetry.lockdownTimer}s)` : ''}
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800 hidden sm:block" />

          {/* Health & Stamina Bars with explicit labels */}
          <div className="flex items-center gap-4">
            <div className="w-28">
              <div className="flex justify-between text-[11px] text-slate-300 font-mono-tabular mb-1">
                <span>HP</span>
                <span>
                  {telemetry.hp}/{telemetry.maxHp}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${(telemetry.hp / telemetry.maxHp) * 100}%` }}
                />
              </div>
            </div>

            <div className="w-24">
              <div className="flex justify-between text-[11px] text-slate-300 font-mono-tabular mb-1">
                <span>Stamina</span>
                <span>{telemetry.stamina}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-150"
                  style={{ width: `${(telemetry.stamina / telemetry.maxStamina) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active Buff Statuses */}
          {(telemetry.disguiseActive || telemetry.powerDownTimer > 0 || telemetry.hiding) && (
            <>
              <div className="h-7 w-px bg-slate-800 hidden md:block" />
              <div className="flex items-center gap-3 text-xs font-mono-tabular">
                {telemetry.disguiseActive && (
                  <span className="text-sky-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Disguise {telemetry.disguiseTimer}s
                  </span>
                )}
                {telemetry.powerDownTimer > 0 && (
                  <span className="text-cyan-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Grid Off {telemetry.powerDownTimer}s
                  </span>
                )}
                {telemetry.hiding && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5" />
                    Hidden
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Top-Right Controls & Minimap */}
        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex items-center gap-2 bg-[#0B0E14]/90 border border-slate-800 rounded-xl p-1.5 backdrop-blur-md">
            <button
              onClick={onToggleCraftDrawer}
              title="Crafting & Escape Guide (Tab)"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showCraftDrawer
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Craft & Bag</span>
            </button>

            <button
              onClick={onToggleMinimap}
              title="Toggle Minimap (M)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showMinimap ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>

            <button
              onClick={onToggleMute}
              title="Toggle Audio"
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onPauseToggle}
              title="Pause (Esc)"
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {gameState === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>

          {showMinimap && (
            <div className="pointer-events-auto bg-[#0B0E14]/90 border border-slate-800 rounded-xl p-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 px-0.5">
                <span>Radar</span>
                <span className="text-emerald-400">Green = Exit</span>
              </div>
              <canvas
                ref={minimapRef}
                width={176}
                height={118}
                className="rounded border border-slate-800/80 block"
              />
            </div>
          )}
        </div>
      </div>

      {/* Center Toast Notification */}
      {telemetry.activeToast && (
        <div className="mx-auto px-4 max-w-xl">
          <div className="bg-[#0B0E14]/92 border border-amber-500/50 text-slate-100 text-xs sm:text-sm px-4 py-2 rounded-lg text-center shadow-lg">
            {telemetry.activeToast}
          </div>
        </div>
      )}

      {/* Bottom Action & Hotbar Dock */}
      <div className="p-3 sm:p-4 flex items-end justify-between gap-4">
        {/* Touch D-Pad (shown on touch devices) or Quiet Controls Hint */}
        <div className="pointer-events-auto">
          {isTouchDevice ? (
            <div className="grid grid-cols-3 gap-1 w-28 h-28 bg-[#0B0E14]/80 border border-slate-800 rounded-xl p-1.5">
              <div />
              <button
                onPointerDown={() => onTouchJoystick(0, -1)}
                onPointerUp={() => onTouchJoystick(0, 0)}
                onPointerLeave={() => onTouchJoystick(0, 0)}
                className="bg-slate-800 rounded flex items-center justify-center text-xs font-bold"
              >
                ▲
              </button>
              <div />
              <button
                onPointerDown={() => onTouchJoystick(-1, 0)}
                onPointerUp={() => onTouchJoystick(0, 0)}
                onPointerLeave={() => onTouchJoystick(0, 0)}
                className="bg-slate-800 rounded flex items-center justify-center text-xs font-bold"
              >
                ◀
              </button>
              <div />
              <button
                onPointerDown={() => onTouchJoystick(1, 0)}
                onPointerUp={() => onTouchJoystick(0, 0)}
                onPointerLeave={() => onTouchJoystick(0, 0)}
                className="bg-slate-800 rounded flex items-center justify-center text-xs font-bold"
              >
                ▶
              </button>
              <div />
              <button
                onPointerDown={() => onTouchJoystick(0, 1)}
                onPointerUp={() => onTouchJoystick(0, 0)}
                onPointerLeave={() => onTouchJoystick(0, 0)}
                className="bg-slate-800 rounded flex items-center justify-center text-xs font-bold"
              >
                ▼
              </button>
              <div />
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2.5 bg-[#0B0E14]/85 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400">
              <span>Click Map or WASD to Move</span>
              <span aria-hidden="true">·</span>
              <span>[E] Interact</span>
              <span aria-hidden="true">·</span>
              <span>[Shift] Sprint</span>
              <span aria-hidden="true">·</span>
              <span>[C] Sneak</span>
            </div>
          )}
        </div>

        {/* Center Hotbar */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#0B0E14]/92 border border-slate-800 rounded-xl p-1.5 backdrop-blur-md">
          {hotbarItems.map((slot) => {
            const count = telemetry.inventory[slot.id] ?? 0;
            return (
              <button
                key={slot.id}
                onClick={() => onUseHotbar(slot.slot)}
                disabled={count <= 0}
                className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer min-w-[68px] ${
                  count > 0
                    ? 'bg-slate-900 border-slate-700 hover:border-amber-400 text-slate-100'
                    : 'bg-slate-950/60 border-slate-800/70 text-slate-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono-tabular">
                  <span className="text-amber-400">[{slot.slot}]</span>
                  <span>x{count}</span>
                </div>
                <div className="text-[11px] font-medium truncate mt-0.5">{slot.label}</div>
              </button>
            );
          })}
        </div>

        {/* Right Context Action & Sneak Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleCrouch}
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              telemetry.crouching
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-[#0B0E14]/90 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>{telemetry.crouching ? 'Sneaking' : 'Sneak [C]'}</span>
          </button>

          {telemetry.interactionPrompt && (
            <button
              onClick={onInteract}
              disabled={!telemetry.interactionPrompt.canInteract}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                telemetry.interactionPrompt.canInteract
                  ? 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950'
                  : 'bg-slate-900/95 border-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div>[E] {telemetry.interactionPrompt.label}</div>
              {(telemetry.interactionPrompt.reason || telemetry.interactionPrompt.sublabel) && (
                <div className="text-[10px] opacity-80 font-normal">
                  {telemetry.interactionPrompt.reason ?? telemetry.interactionPrompt.sublabel}
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Slide-over Crafting, Inventory & Escape Routes Drawer */}
      {showCraftDrawer && gameState === 'PLAYING' && (
        <div className="pointer-events-auto fixed inset-y-0 left-0 w-full max-w-md bg-[#0E121A]/98 border-r border-slate-800 z-40 flex flex-col shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-100">
                Inventory & Crafting
              </h2>
              <p className="text-xs text-slate-400">
                Loot containers and forge escape gear.
              </p>
            </div>
            <button
              onClick={onToggleCraftDrawer}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Bag Materials & Tools */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Materials & Tools</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {MATERIAL_KEYS.map((id) => {
                  const def = ITEMS[id];
                  const qty = telemetry.inventory[id] ?? 0;
                  return (
                    <div
                      key={id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                        qty > 0
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-slate-950/60 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <span>{def.name}</span>
                      <span className="font-mono-tabular font-semibold">x{qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Crafting Workbench */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5" />
                <span>Craft Escape Gear</span>
              </h3>
              <div className="space-y-2.5">
                {CRAFTING_RECIPES.map((recipe) => {
                  const craftable = canCraft(telemetry.inventory, recipe);
                  const owned = telemetry.inventory[recipe.output] ?? 0;
                  const ingText = Object.entries(recipe.ingredients)
                    .map(([id, n]) => `${n} ${ITEMS[id as ItemId].shortLabel}`)
                    .join(' + ');
                  return (
                    <div
                      key={recipe.id}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">
                            {recipe.label}
                          </span>
                          {owned > 0 && (
                            <span className="text-xs text-emerald-400 font-mono-tabular">
                              (Owned: {owned})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{recipe.summary}</p>
                        <p className="text-[11px] text-amber-400 font-mono-tabular mt-1">
                          Needs: {ingText}
                        </p>
                      </div>
                      <button
                        onClick={() => onCraft(recipe)}
                        disabled={!craftable}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                          craftable
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Craft
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Escape Routes Checklist */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Facility Escape Routes
              </h3>
              <div className="space-y-2.5">
                {escapeRoutes.map((route) => (
                  <div
                    key={route.title}
                    className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg"
                  >
                    <p className="text-sm font-semibold text-emerald-400">{route.title}</p>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{route.steps}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lockpick / Hacking Timing Minigame Modal */}
      {telemetry.minigame && (
        <div className="pointer-events-auto fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121620] border border-slate-700 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-2xl font-bold text-slate-100">
                {telemetry.minigame.title}
              </h3>
              <span className="text-xs font-mono-tabular text-amber-400">
                Stage {telemetry.minigame.stage}/{telemetry.minigame.totalStages}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-6">{telemetry.minigame.subtitle}</p>

            {/* Timing Track */}
            <div className="relative h-8 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden mb-6">
              <div
                className="absolute inset-y-0 bg-amber-500/35 border-x-2 border-amber-400"
                style={{
                  left: `${telemetry.minigame.zoneStart * 100}%`,
                  width: `${telemetry.minigame.zoneWidth * 100}%`,
                }}
              />
              <div
                className="absolute inset-y-0 w-1.5 bg-white shadow-[0_0_8px_#fff]"
                style={{ left: `calc(${telemetry.minigame.cursor * 100}% - 3px)` }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onTriggerMinigameHit}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg cursor-pointer"
              >
                Pick Pin [Space / E]
              </button>
              <button
                onClick={onCancelMinigame}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inmate Dialog & Black Market Trader Modal */}
      {telemetry.dialog && (
        <div className="pointer-events-auto fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121620] border border-slate-700 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-2xl font-bold text-slate-100">
                {telemetry.dialog.inmateName}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-mono-tabular text-amber-400">
                <Coins className="w-4 h-4" />
                <span>{telemetry.inventory.coin} Coins</span>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/80 border border-slate-800 rounded-lg p-4 mb-5">
              "{telemetry.dialog.message}"
            </p>

            {telemetry.dialog.intelAvailable && (
              <p className="text-xs text-emerald-400 mb-4 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Location pinned onto your Radar Minimap.</span>
              </p>
            )}

            {telemetry.dialog.isTrader && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Black Market Stash
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {TRADER_OFFERS.map((offer) => {
                    const canAfford = telemetry.inventory.coin >= offer.costCoins;
                    return (
                      <div
                        key={offer.id}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{offer.label}</p>
                          <p className="text-xs text-slate-400">{offer.description}</p>
                        </div>
                        <button
                          onClick={() => onBuyTrade(offer.id)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono-tabular shrink-0 cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Buy ({offer.costCoins}c)
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={onCloseDialog}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <div className="pointer-events-auto fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121620] border border-slate-700 rounded-xl p-6 text-center">
            <h2 className="font-display text-3xl font-bold text-slate-100 mb-1">Game Paused</h2>
            <p className="text-sm text-slate-400 mb-6">{telemetry.levelName}</p>
            <div className="space-y-2.5">
              <button
                onClick={onPauseToggle}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg cursor-pointer"
              >
                Resume Breakout
              </button>
              <button
                onClick={onRestartLevel}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Facility</span>
              </button>
              <button
                onClick={onReturnMenu}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm rounded-lg cursor-pointer"
              >
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Busted / Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <div className="pointer-events-auto fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121620] border border-rose-500/40 rounded-xl p-6 text-center">
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
              Captured
            </p>
            <h2 className="font-display text-4xl font-bold text-slate-100 mb-2">Busted</h2>
            <p className="text-sm text-slate-300 mb-6">
              {telemetry.bustReason ?? 'You were caught by facility security.'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-left bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 mb-6 text-xs">
              <div>
                <span className="text-slate-400">Time Survived</span>
                <p className="text-slate-100 font-mono-tabular font-semibold mt-0.5">
                  {formatDuration(telemetry.elapsedSeconds)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Containers Looted</span>
                <p className="text-slate-100 font-mono-tabular font-semibold mt-0.5">
                  {telemetry.containersSearched}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onRestartLevel}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg cursor-pointer"
              >
                Play Again
              </button>
              <button
                onClick={onReturnMenu}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-lg cursor-pointer"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete / Victory Modal */}
      {(gameState === 'LEVEL_COMPLETE' || gameState === 'VICTORY') && (
        <div className="pointer-events-auto fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121620] border border-emerald-500/40 rounded-xl p-6 text-center">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              {gameState === 'VICTORY' ? 'All Facilities Breached' : 'Breakout Successful'}
            </p>
            <h2 className="font-display text-4xl font-bold text-slate-100 mb-2">
              {gameState === 'VICTORY' ? 'Total Freedom' : 'Escaped!'}
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Escaped {telemetry.levelName} via {telemetry.escapeMethodUsed ?? 'Perimeter Breach'}.
            </p>

            <div className="grid grid-cols-3 gap-2.5 bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 mb-6 text-xs">
              <div>
                <span className="text-slate-400">Time</span>
                <p className="text-slate-100 font-mono-tabular font-semibold mt-0.5">
                  {formatDuration(telemetry.elapsedSeconds)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Stealth Rank</span>
                <p className="text-emerald-400 font-semibold mt-0.5">
                  {computeStealthRating(telemetry)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Alarms</span>
                <p className="text-slate-100 font-mono-tabular font-semibold mt-0.5">
                  {telemetry.alarmsTriggered}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {telemetry.levelId < totalLevels && (
                <button
                  onClick={onNextLevel}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg cursor-pointer"
                >
                  Next Facility
                </button>
              )}
              <button
                onClick={onRestartLevel}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg cursor-pointer"
              >
                Play Again
              </button>
              <button
                onClick={onReturnMenu}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm rounded-lg cursor-pointer"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
