import { CraftingRecipe, Inventory, ItemDef, ItemId, TradeOffer } from './types';

export const ITEMS: Record<ItemId, ItemDef> = {
  scrap: {
    id: 'scrap',
    name: 'Scrap Metal',
    shortLabel: 'Scrap',
    category: 'material',
    description: 'Bent steel plates and brackets used to forge escape tools.',
    color: '#94A3B8',
  },
  wire: {
    id: 'wire',
    name: 'Copper Wire',
    shortLabel: 'Wire',
    category: 'material',
    description: 'Salvaged electrical wiring for lockpicks and EMP jammers.',
    color: '#F59E0B',
  },
  tape: {
    id: 'tape',
    name: 'Duct Tape',
    shortLabel: 'Tape',
    category: 'material',
    description: 'Heavy industrial tape for binding tools and disguises.',
    color: '#CBD5E1',
  },
  battery: {
    id: 'battery',
    name: 'Battery Cell',
    shortLabel: 'Battery',
    category: 'material',
    description: 'High-voltage cell for electronic countermeasures.',
    color: '#22D3EE',
  },
  cloth: {
    id: 'cloth',
    name: 'Prison Cloth',
    shortLabel: 'Cloth',
    category: 'material',
    description: 'Sturdy fabric useful for disguises or smoke fuses.',
    color: '#FB923C',
  },
  coin: {
    id: 'coin',
    name: 'Commissary Coin',
    shortLabel: 'Coin',
    category: 'gadget',
    description: 'Toss to create a sound ripple that lures guards away, or spend with traders.',
    color: '#FBBF24',
    hotkey: 1,
  },
  ration: {
    id: 'ration',
    name: 'Energy Ration',
    shortLabel: 'Ration',
    category: 'gadget',
    description: 'Restores +45 HP and full stamina immediately.',
    color: '#34D399',
    hotkey: 2,
  },
  keycard: {
    id: 'keycard',
    name: 'Security Keycard',
    shortLabel: 'Keycard',
    category: 'key',
    description: 'Opens locked security gates and reinforces a Guard Disguise.',
    color: '#38BDF8',
  },
  lockpick: {
    id: 'lockpick',
    name: 'Lockpick Set',
    shortLabel: 'Lockpick',
    category: 'tool',
    description: 'Picks locked cell doors, security doors, and the Warden Safe.',
    color: '#E2E8F0',
  },
  cutters: {
    id: 'cutters',
    name: 'Wire Cutters',
    shortLabel: 'Cutters',
    category: 'tool',
    description: 'Slices through perimeter chain-link fences cleanly.',
    color: '#F87171',
  },
  screwdriver: {
    id: 'screwdriver',
    name: 'Screwdriver',
    shortLabel: 'Driver',
    category: 'tool',
    description: 'Unscrews ventilation grates so you can crawl between wings.',
    color: '#FBBF24',
  },
  shovel: {
    id: 'shovel',
    name: 'Trench Shovel',
    shortLabel: 'Shovel',
    category: 'tool',
    description: 'Excavates subterranean escape tunnels under prison walls.',
    color: '#A78BFA',
  },
  disguise: {
    id: 'disguise',
    name: 'Guard Uniform',
    shortLabel: 'Disguise',
    category: 'gadget',
    description: 'Wear for 35s to dramatically reduce guard detection speed at range.',
    color: '#60A5FA',
    hotkey: 3,
  },
  emp: {
    id: 'emp',
    name: 'EMP Jammer',
    shortLabel: 'EMP',
    category: 'gadget',
    description: 'Triggers an electromagnetic pulse disabling cameras & searchlights for 18s.',
    color: '#22D3EE',
    hotkey: 4,
  },
  smoke: {
    id: 'smoke',
    name: 'Smoke Bomb',
    shortLabel: 'Smoke',
    category: 'gadget',
    description: 'Drops a dense smoke screen that blocks guard and camera sightlines for 9s.',
    color: '#9CA3AF',
    hotkey: 5,
  },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_lockpick',
    output: 'lockpick',
    outputCount: 1,
    ingredients: { scrap: 1, wire: 1 },
    label: 'Lockpick Set',
    summary: 'Opens locked doors & safes without a keycard.',
  },
  {
    id: 'craft_screwdriver',
    output: 'screwdriver',
    outputCount: 1,
    ingredients: { scrap: 1, tape: 1 },
    label: 'Screwdriver',
    summary: 'Unscrews wall & floor ventilation grates.',
  },
  {
    id: 'craft_cutters',
    output: 'cutters',
    outputCount: 1,
    ingredients: { scrap: 2, tape: 1 },
    label: 'Wire Cutters',
    summary: 'Cuts through weak outer perimeter fences.',
  },
  {
    id: 'craft_shovel',
    output: 'shovel',
    outputCount: 1,
    ingredients: { scrap: 2, wire: 1, tape: 1 },
    label: 'Trench Shovel',
    summary: 'Digs underground tunnels beneath prison walls.',
  },
  {
    id: 'craft_disguise',
    output: 'disguise',
    outputCount: 1,
    ingredients: { cloth: 2, tape: 1 },
    label: 'Guard Uniform',
    summary: 'Activate [3] to blend in as a guard for 35 seconds.',
  },
  {
    id: 'craft_emp',
    output: 'emp',
    outputCount: 1,
    ingredients: { wire: 1, battery: 1, scrap: 1 },
    label: 'EMP Jammer',
    summary: 'Activate [4] to shut down nearby cameras & spotlights.',
  },
  {
    id: 'craft_smoke',
    output: 'smoke',
    outputCount: 1,
    ingredients: { cloth: 1, battery: 1, tape: 1 },
    label: 'Smoke Bomb',
    summary: 'Activate [5] to drop cover that breaks chase sightlines.',
  },
];

export const TRADER_OFFERS: TradeOffer[] = [
  {
    id: 'trade_cutters',
    item: 'cutters',
    costCoins: 3,
    label: 'Wire Cutters',
    description: 'Smuggled heavy-duty fence snips.',
  },
  {
    id: 'trade_keycard',
    item: 'keycard',
    costCoins: 4,
    label: 'Security Keycard',
    description: 'Cloned guard clearance badge.',
  },
  {
    id: 'trade_shovel',
    item: 'shovel',
    costCoins: 3,
    label: 'Trench Shovel',
    description: 'Collapsible steel digging spade.',
  },
  {
    id: 'trade_emp',
    item: 'emp',
    costCoins: 2,
    label: 'EMP Jammer',
    description: 'Disables cameras and searchlights for 18s.',
  },
  {
    id: 'trade_ration',
    item: 'ration',
    costCoins: 1,
    label: 'Energy Ration',
    description: 'Restores health and full stamina.',
  },
];

export function createEmptyInventory(): Inventory {
  return {
    scrap: 0,
    wire: 0,
    tape: 0,
    battery: 0,
    cloth: 0,
    coin: 0,
    ration: 0,
    keycard: 0,
    lockpick: 0,
    cutters: 0,
    screwdriver: 0,
    shovel: 0,
    disguise: 0,
    emp: 0,
    smoke: 0,
  };
}

export function canCraft(inv: Inventory, recipe: CraftingRecipe): boolean {
  for (const [key, qty] of Object.entries(recipe.ingredients)) {
    const itemId = key as ItemId;
    if ((inv[itemId] ?? 0) < (qty ?? 0)) return false;
  }
  return true;
}
