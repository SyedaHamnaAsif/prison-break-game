import { LevelDef, TileType } from './types';

const CHAR_TO_TILE: Record<string, TileType> = {
  ' ': 'void',
  W: 'wall',
  '=': 'bars',
  F: 'fence',
  E: 'electric_fence',
  '~': 'water',
  '.': 'hall_floor',
  c: 'cell_floor',
  m: 'cafeteria_floor',
  g: 'yard_grass',
  d: 'yard_dirt',
  a: 'asphalt',
  w: 'wood_floor',
  v: 'vent_floor',
  _: 'weak_floor',
};

function parseGrid(rows: string[], expectedWidth: number): TileType[][] {
  return rows.map((row) => {
    const padded = row.padEnd(expectedWidth, ' ').slice(0, expectedWidth);
    return Array.from(padded).map((ch) => CHAR_TO_TILE[ch] ?? 'wall');
  });
}

// ============================================================================
// FACILITY 1: PINEBROOK COUNTY JAIL (40 x 28)
// ============================================================================
const LEVEL_1_ROWS = [
  //0123456789012345678901234567890123456789
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 0  Freedom Road
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 1  Getaway Van at (35, 1)
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 2
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', // 3  Outer Fence (weak at 8,3 & 34,3; gate at 20,3)
  'gddddddddddddddddddddddddddddddddddddddg', // 4  North Perimeter Path
  'gggggggggggggggggggggggggggggggggggggggg', // 5
  'ggggWWWWWWggggggggddddggggggWWWWWWgggggg', // 6  West Shed (4..9) & Guard Booth (28..33)
  'ggggW....WggggggggddddggggggW....Wgggggg', // 7
  'ggggW....WggggggggddddggggggW....Wgggggg', // 8
  'ggggWW.WWWggggggggddddggggggWWW.WWgggggg', // 9  Shed Door (6,9), Booth Door (31,9)
  'ggggggggggggggggdddddggggggggggggggggggg', // 10
  'ggggggggggggggggddddgggggggggggggggggggg', // 11
  'WWWWWWWWWWWWWWWWWW.WWWWWWWWWWWWW.WWWWWWW', // 12 Main Building North Wall (Yard Door 18,12; Side Door 32,12)
  'Wccccc=.....W............W.............W', // 13 Cell 1 (1..5), Hall (7..11), North Hall (13..24), Workshop (26..38)
  'Wccccc=.....W............W.............W', // 14
  'Wccccc.................................W', // 15 Open corridor archways
  'Wccccc=.....W............W.............W', // 16
  'Wccccc=.....WmmmmmmmmmmmmW.............W', // 17 Mess Hall (13..24)
  'WWWW=WW.....WmmmmmmmmmmmmWWWWWWWW..WWWWW', // 18 Cell 1 bar wall; Workshop bottom archway at 33..34
  'Wccccc=......mmmmmmmmmmmm..............W', // 19 Cell 2 (1..5), Mess Hall doorways (12 & 25)
  'Wccccc=.....WmmmmmmmmmmmmW.............W', // 20
  'Wccccc......WmmmmmmmmmmmmWWWWWW.WWWWWWWW', // 21 Hall -> Cell 2; Warden Door (31,21)
  'Wccccc=.....WWWWWW..WWWWWWwwwwwwwwwwwwwW', // 22 Laundry & Guard Post south of Mess Hall; Warden Office (26..38)
  'Wccccc=.....W......W.....=wwwwwwwwwwwwwW', // 23
  'Wccccc=.....W............WwwwwwwwwwwwwwW', // 24 Open archway between Laundry & Guard Post (19,24)
  'Wccccc=.....W......W.....WwwwwwwwwwwwwwW', // 25
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 26
  '                                        ', // 27
];

// ============================================================================
// FACILITY 2: BLACKGATE PENITENTIARY (48 x 32)
// ============================================================================
const LEVEL_2_ROWS = [
  //012345678901234567890123456789012345678901234567
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 0  Freedom Highway
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 1  Getaway Van at (42, 1)
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 2
  'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', // 3  Electrified Outer Fence (weak/gate at 24,3 & 9,3 & 40,3)
  'dddddddddddddddddddddddddddddddddddddddddddddddd', // 4  Outer Patrol Strip
  'ggggggggggggggggggggddddgggggggggggggggggggggggg', // 5
  'ggggWWWWWWggggggggggddddggggggggggWWWWWWgggggggg', // 6  West Maintenance Shed (4..9) & East Watchhouse (34..39)
  'ggggW....WggggggggggddddggggggggggW....Wgggggggg', // 7
  'ggggW....WggggggggggddddggggggggggW....Wgggggggg', // 8
  'ggggWWW.WWggggggggggddddggggggggggWW.WWWgggggggg', // 9  Shed Door (7,9), Watchhouse Door (36,9)
  'ggggggggggggggggggggddddgggggggggggggggggggggggg', // 10
  'gggggggggggggggggddddddddddggggggggggggggggggggg', // 11
  'gggggggggggggggggddddddddddggggggggggggggggggggg', // 12 Central Yard
  'WWWWWWWWWWWWWWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWW', // 13 North Prison Wall (Yard Gate 20..21,13)
  'Wccccc=......WmmmmmmmmmmmmmmW..................W', // 14 West Cells, Mess Hall (14..27), East Wing (29..46)
  'Wccccc=......WmmmmmmmmmmmmmmW..................W', // 15
  'Wccccc........mmmmmmmmmmmmmm...................W', // 16 Open doorways into Mess Hall & East Wing
  'Wccccc=......WmmmmmmmmmmmmmmW..................W', // 17
  'WWWW=WW......WmmmmmmmmmmmmmmWWWWWWWWWW..WWWWWWWW', // 18 East Workshop archway at 38..39
  'Wccccc=.......mmmmmmmmmmmmmm...................W', // 19 Cell 2 (1..5), Hall (7..12)
  'Wccccc=......WmmmmmmmmmmmmmmW..................W', // 20
  'Wccccc.......WWWWWWW..WWWWWWW..................W', // 21 Mess Hall south doorway (20..21)
  'Wccccc=......W.......W......WWWWWWW.WWWWWWWWWWWW', // 22 Security Hub (14..20), Generator Room (22..27), Warden Door (35,22)
  'Wccccc=......W..............WwwwwwwwwwwwwwwwwwwW', // 23 Warden Wing (29..46), Generator archway (21,23)
  'WWWW=WW......................wwwwwwwwwwwwwwwwwwW', // 24 Security Hub doorway (13,24)
  'Wccccc=......W.......W......WwwwwwwwwwwwwwwwwwwW', // 25 Cell 3 (1..5)
  'Wccccc=......W.......W......WwwwwwwwwwwwwwwwwwwW', // 26
  'Wccccc.......W.......W......WwwwwwwwwwwwwwwwwwwW', // 27 Cell 3 Door (6,27)
  'Wccccc=......WWWWWWWWWWWWWWWWwwwwwwwwwwwwwwwwwwW', // 28
  'Wccccc=........................................W', // 29 South Maintenance Corridor
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 30
  '                                                ', // 31
];

// ============================================================================
// FACILITY 3: IRONHOLD ISLAND BASTION (52 x 34)
// ============================================================================
const LEVEL_3_ROWS = [
  //0123456789012345678901234567890123456789012345678901
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 0  Ocean North
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 1
  '~~dddddddddddddddddddddddddddddddddddddddddddddddd~~', // 2  Rocky Coastline
  '~~dEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEd~', // 3  Electrified Sea Wall Fence
  '~~dggggggggggggggggggddddgggggggggggggggggggggggggd~', // 4  North Yard
  '~~dggggWWWWWWggggggggddddggggggggWWWWWWgggggggggggd~', // 5  North-West Dock Shed & North-East Guard Tower
  '~~dggggW....WggggggggddddggggggggW....Wgggggggggggd~', // 6
  '~~dggggW....WggggggggddddggggggggW....Wgggggggggggd~', // 7
  '~~dggggWWW.WWggggggggddddggggggggWW.WWWgggggggggggd~', // 8
  '~~dggggggggggggggggggddddgggggggggggggggggggggggggd~', // 9
  '~~dWWWWWWWWWWWWWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWWd~', // 10 Fortress North Wall (22..23, 10)
  '~~dWccccc=.....W..............W..................Wd~', // 11 High-Sec Cells (4..8), Security Hub (16..29), Power Plant (31..48)
  '~~dWccccc=.....W..............W..................Wd~', // 12
  '~~dWccccc........................................Wd~', // 13 Open doorways across Cellblock -> Security -> Power Plant
  '~~dWccccc=.....W..............W..................Wd~', // 14
  '~~dWWWW=WW.....W..............WWWWWWWWWWW..WWWWWWWd~', // 15 Foundry archway at 41..42
  '~~dWccccc=.......................................Wd~', // 16 Cell 2 (4..8), Open corridor
  '~~dWccccc=.....W..............W..................Wd~', // 17
  '~~dWccccc......W..............W..................Wd~', // 18 Cell 2 Door (9,18)
  '~~dWccccc=.....WWWWWW..WWWWWWWWWWWWWWW.WWWWWWWWWWWd~', // 19 Citadel Door (38,19)
  '~~dWccccc=.....W............WwwwwwwwwwwwwwwwwwwwwWd~', // 20 Solitary/Storage, Warden Bastion (29..48)
  '~~dWWWW=WW..................WwwwwwwwwwwwwwwwwwwwwWd~', // 21 Open archway into Storage; Warden Citadel sealed behind door at (38,19)
  '~~dWccccc=.....W............WwwwwwwwwwwwwwwwwwwwwWd~', // 22 Cell 3 (4..8)
  '~~dWccccc......W............WwwwwwwwwwwwwwwwwwwwwWd~', // 23 Cell 3 Door (9,23)
  '~~dWccccc=.....W............WwwwwwwwwwwwwwwwwwwwwWd~', // 24
  '~~dWWWWWWWWWWWWWWWWW..WWWWWWWWWWWWWWWWWWWWWWWWWWWWd~', // 25 South Wall Gate (20..21, 25)
  '~~dddddddddddddddddd..dddddddddddddddddddddddddddd~~', // 26 South Cliff Path
  '~~EEEEEEEEEEEEEEEEEE..EEEEEEEEEEEEEEEEEEEEEEEEEEEE~~', // 27 South Electric Fence (Gate 20..21,27; Weak 41,27)
  '~~dddddddddddddddddddddddddddddddddddddddddddddddd~~', // 28 Coastal Trail
  '~~~~~~~~~~~~~~~~~~~~wwwwww~~~~~~~~~~~~~~~~~~~~~~~~~~', // 29 Wooden Escape Pier (20..25, 29..31)
  '~~~~~~~~~~~~~~~~~~~~wwwwww~~~~~~~~~~~~~~~~~~~~~~~~~~', // 30 Speedboat at (22, 31)
  '~~~~~~~~~~~~~~~~~~~~wwwwww~~~~~~~~~~~~~~~~~~~~~~~~~~', // 31
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 32
  '                                                    ', // 33
];

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Pinebrook County Jail',
    subtitle: 'Minimum Security · Cellblock A',
    securityRating: 'Low Security',
    description:
      'A regional county lockup with light patrols and a single yard camera. Gather scrap, craft tools, or bribe a fellow inmate to slip past the north perimeter.',
    difficulty: 'Standard',
    width: 40,
    height: 28,
    playerStart: { tx: 3, ty: 15 },
    startClockMinutes: 20 * 60 + 30,
    tiles: parseGrid(LEVEL_1_ROWS, 40),
    zones: [
      { name: 'Cellblock A', tx: 1, ty: 13, w: 11, h: 13 },
      { name: 'Mess Hall', tx: 13, ty: 13, w: 12, h: 9 },
      { name: 'Laundry & Security', tx: 13, ty: 22, w: 12, h: 4 },
      { name: 'Workshop', tx: 26, ty: 13, w: 13, h: 8 },
      { name: 'Warden Office', tx: 26, ty: 22, w: 13, h: 4 },
      { name: 'Exercise Yard', tx: 1, ty: 4, w: 38, h: 8 },
      { name: 'Freedom Highway', tx: 0, ty: 0, w: 40, h: 3 },
    ],
    escapeRoutes: [
      {
        title: 'Wire Cutters Breach',
        steps: 'Loot Scrap & Tape in Workshop/Cells, craft Wire Cutters, then snip the weak fence at the north yard.',
      },
      {
        title: 'Air Vent Shortcut',
        steps: 'Craft a Screwdriver to open your cell vent, crawl to the Yard Shed, then cut or unlock your way to the van.',
      },
      {
        title: 'Keycard Main Gate',
        steps: 'Grab a Keycard from the Guard Post or Warden Safe, then walk straight through the north security gate.',
      },
    ],
    startingInventory: { coin: 1, ration: 1 },
    props: [
      { type: 'bunk', tx: 1.3, ty: 13.3 },
      { type: 'bunk', tx: 1.3, ty: 19.3 },
      { type: 'bunk', tx: 1.3, ty: 23.8 },
      { type: 'table', tx: 15.5, ty: 17.5, wTiles: 3, hTiles: 1.2 },
      { type: 'table', tx: 20.0, ty: 17.5, wTiles: 3, hTiles: 1.2 },
      { type: 'washer', tx: 13.5, ty: 24.5 },
      { type: 'washer', tx: 15.2, ty: 24.5 },
      { type: 'crate', tx: 28, ty: 14 },
      { type: 'crate', tx: 34, ty: 15 },
      { type: 'generator', tx: 36, ty: 14 },
      { type: 'watchtower', tx: 28.5, ty: 6.5 },
      { type: 'van', tx: 34.5, ty: 0.7 },
      { type: 'bush', tx: 2, ty: 5 },
      { type: 'bush', tx: 13, ty: 6 },
      { type: 'bush', tx: 24, ty: 5 },
    ],
    interactables: [
      // Cell doors
      { id: 'l1_c1_door', type: 'door_cell', tx: 6, ty: 15, label: 'Cell 1 Door', open: true, locked: false },
      { id: 'l1_c2_door', type: 'door_cell', tx: 6, ty: 21, label: 'Cell 2 Door', open: false, locked: false },
      // Building exterior doors
      { id: 'l1_yard_door', type: 'door_cell', tx: 18, ty: 12, label: 'Yard Exit Door', open: false, locked: false },
      { id: 'l1_side_door', type: 'door_keycard', tx: 32, ty: 12, label: 'Workshop Yard Door', open: false, locked: true },
      { id: 'l1_shed_door', type: 'door_cell', tx: 6, ty: 9, label: 'Yard Shed Door', open: false, locked: false },
      { id: 'l1_booth_door', type: 'door_keycard', tx: 31, ty: 9, label: 'Guard Booth Door', open: false, locked: true },
      { id: 'l1_warden_door', type: 'door_keycard', tx: 31, ty: 21, label: 'Warden Office Door', open: false, locked: true },
      // Perimeter exits
      { id: 'l1_main_gate', type: 'door_keycard', tx: 20, ty: 3, label: 'Main Perimeter Gate', open: false, locked: true },
      { id: 'l1_fence_w', type: 'fence_weak', tx: 8, ty: 3, label: 'Weak Chain-Link Fence', cut: false },
      { id: 'l1_fence_e', type: 'fence_weak', tx: 34, ty: 3, label: 'Rusty Perimeter Fence', cut: false },
      // Escape Zone
      { id: 'l1_escape_van', type: 'escape_zone', tx: 35, ty: 1, label: 'Getaway Van' },
      // Vents
      {
        id: 'l1_vent_cell',
        type: 'vent',
        tx: 2,
        ty: 17,
        label: 'Cell Floor Vent',
        linkId: 'l1_vent_shed',
        unscrewed: false,
      },
      {
        id: 'l1_vent_shed',
        type: 'vent',
        tx: 5,
        ty: 7,
        label: 'Yard Shed Vent',
        linkId: 'l1_vent_cell',
        unscrewed: false,
      },
      // Containers
      {
        id: 'l1_desk_c1',
        type: 'desk',
        tx: 4,
        ty: 13,
        label: 'Cell 1 Desk',
        loot: { scrap: 1, wire: 1, coin: 1 },
      },
      {
        id: 'l1_locker_c2',
        type: 'locker',
        tx: 2,
        ty: 23,
        label: 'Cell 2 Locker',
        loot: { tape: 1, cloth: 1 },
      },
      {
        id: 'l1_med_mess',
        type: 'med_cabinet',
        tx: 14,
        ty: 14,
        label: 'First-Aid Cabinet',
        loot: { ration: 1, battery: 1 },
      },
      {
        id: 'l1_laundry_1',
        type: 'laundry',
        tx: 17,
        ty: 24,
        label: 'Laundry Hamper',
        loot: { cloth: 2, tape: 1 },
      },
      {
        id: 'l1_guard_locker',
        type: 'locker',
        tx: 23,
        ty: 23,
        label: 'Guard Locker',
        loot: { keycard: 1, battery: 1, coin: 1 },
      },
      {
        id: 'l1_toolbox_1',
        type: 'toolbox',
        tx: 30,
        ty: 14,
        label: 'Workshop Toolbox',
        loot: { scrap: 2, wire: 1, tape: 1 },
      },
      {
        id: 'l1_toolbox_2',
        type: 'toolbox',
        tx: 36,
        ty: 17,
        label: 'Maintenance Crate',
        loot: { scrap: 1, battery: 1, coin: 1 },
      },
      {
        id: 'l1_shed_box',
        type: 'toolbox',
        tx: 8,
        ty: 7,
        label: 'Shed Supply Box',
        loot: { cutters: 1 },
      },
      {
        id: 'l1_safe_warden',
        type: 'safe',
        tx: 36,
        ty: 24,
        label: 'Warden Wall Safe',
        locked: true,
        loot: { keycard: 1, coin: 3, emp: 1 },
      },
      // Tech / Sabotage
      {
        id: 'l1_power_box',
        type: 'power_box',
        tx: 37,
        ty: 14,
        label: 'Facility Power Junction',
        disabled: false,
      },
      {
        id: 'l1_sec_term',
        type: 'security_terminal',
        tx: 22,
        ty: 25,
        label: 'Security Terminal',
        disabled: false,
      },
      // Inmates
      {
        id: 'l1_inmate_sly',
        type: 'inmate',
        tx: 18,
        ty: 19,
        label: 'Inmate "Sly"',
        inmateName: 'Sly (Cellmate)',
        inmateTip:
          'Psst! There is a loose vent in Cell 1 that connects straight to the Yard Shed—and spare Wire Cutters are stashed inside the shed!',
        isTrader: false,
        intelTarget: { tx: 8, ty: 7, label: 'Stashed Cutters' },
      },
      {
        id: 'l1_inmate_torque',
        type: 'inmate',
        tx: 29,
        ty: 16,
        label: 'Torque (Trader)',
        inmateName: 'Torque (Workshop)',
        inmateTip: 'Got Commissary Coins? I can hook you up with contraband tools right here.',
        isTrader: true,
      },
    ],
    guards: [
      {
        id: 'l1_g1',
        role: 'officer',
        speed: 82,
        fovDeg: 78,
        viewDist: 230,
        waypoints: [
          { tx: 9, ty: 14 },
          { tx: 9, ty: 24 },
          { tx: 9, ty: 19 },
          { tx: 16, ty: 19 },
          { tx: 16, ty: 14 },
        ],
      },
      {
        id: 'l1_g2',
        role: 'officer',
        speed: 85,
        fovDeg: 76,
        viewDist: 240,
        waypoints: [
          { tx: 27, ty: 15 },
          { tx: 35, ty: 15 },
          { tx: 35, ty: 17 },
          { tx: 27, ty: 17 },
        ],
      },
      {
        id: 'l1_g3',
        role: 'officer',
        speed: 88,
        fovDeg: 80,
        viewDist: 255,
        waypoints: [
          { tx: 12, ty: 5 },
          { tx: 26, ty: 5 },
          { tx: 26, ty: 10 },
          { tx: 12, ty: 10 },
        ],
      },
      {
        id: 'l1_g4',
        role: 'warden',
        speed: 78,
        fovDeg: 84,
        viewDist: 250,
        waypoints: [
          { tx: 28, ty: 23 },
          { tx: 36, ty: 23 },
          { tx: 36, ty: 24 },
          { tx: 28, ty: 24 },
        ],
      },
    ],
    cameras: [
      {
        id: 'l1_cam1',
        tx: 18,
        ty: 11,
        baseAngleDeg: -90,
        sweepDeg: 110,
        sweepSpeed: 0.75,
        range: 250,
      },
    ],
    searchlights: [
      {
        id: 'l1_spot1',
        tx: 29,
        ty: 7,
        targetTx: 19,
        targetTy: 6,
        sweepRadiusTiles: 6,
        speed: 0.65,
        beamRadius: 110,
      },
    ],
  },

  // ============================================================================
  // FACILITY 2: BLACKGATE PENITENTIARY (48 x 32)
  // ============================================================================
  {
    id: 2,
    name: 'Blackgate Penitentiary',
    subtitle: 'Medium Security · North & East Wings',
    securityRating: 'High Security',
    description:
      'An expansive penitentiary protected by electrified perimeter fencing, sweeping yard searchlights, CCTV cameras, and patrolling guards. Shut down the power grid or tunnel beneath the wall.',
    difficulty: 'Hard',
    width: 48,
    height: 32,
    playerStart: { tx: 3, ty: 16 },
    startClockMinutes: 21 * 60 + 45,
    tiles: parseGrid(LEVEL_2_ROWS, 48),
    zones: [
      { name: 'West Cellblock', tx: 1, ty: 14, w: 12, h: 16 },
      { name: 'Mess Hall', tx: 14, ty: 14, w: 14, h: 7 },
      { name: 'Security & Generator', tx: 14, ty: 22, w: 14, h: 7 },
      { name: 'East Workshop', tx: 29, ty: 14, w: 18, h: 8 },
      { name: 'Warden Suite', tx: 29, ty: 23, w: 18, h: 6 },
      { name: 'Courtyard', tx: 1, ty: 4, w: 46, h: 9 },
      { name: 'Freedom Highway', tx: 0, ty: 0, w: 48, h: 3 },
    ],
    escapeRoutes: [
      {
        title: 'Blackout & Fence Cut',
        steps: 'Sabotage the Generator Room Power Box to drop the electric fence, then cut through at the north perimeter.',
      },
      {
        title: 'Subterranean Tunnel',
        steps: 'Craft or buy a Trench Shovel, dig at the West Shed dirt patch to tunnel under the electrified fence!',
      },
      {
        title: 'Warden Clearance',
        steps: 'Crack the Warden Safe for a Keycard, hack the Security Terminal, and walk out the Main Gate in a Guard Disguise.',
      },
    ],
    startingInventory: { coin: 2, ration: 1 },
    props: [
      { type: 'bunk', tx: 1.3, ty: 14.3 },
      { type: 'bunk', tx: 1.3, ty: 19.3 },
      { type: 'bunk', tx: 1.3, ty: 25.3 },
      { type: 'table', tx: 17, ty: 17, wTiles: 3.5, hTiles: 1.2 },
      { type: 'table', tx: 22.5, ty: 17, wTiles: 3.5, hTiles: 1.2 },
      { type: 'server', tx: 15, ty: 23 },
      { type: 'generator', tx: 24, ty: 24 },
      { type: 'generator', tx: 24, ty: 26 },
      { type: 'crate', tx: 33, ty: 15 },
      { type: 'crate', tx: 42, ty: 16 },
      { type: 'watchtower', tx: 35.5, ty: 6.5 },
      { type: 'van', tx: 42, ty: 0.7 },
      { type: 'bush', tx: 14, ty: 6 },
      { type: 'bush', tx: 28, ty: 6 },
    ],
    interactables: [
      { id: 'l2_c1_door', type: 'door_cell', tx: 6, ty: 16, label: 'Cell 1 Door', open: true, locked: false },
      { id: 'l2_c2_door', type: 'door_cell', tx: 6, ty: 21, label: 'Cell 2 Door', open: false, locked: false },
      { id: 'l2_c3_door', type: 'door_cell', tx: 6, ty: 27, label: 'Cell 3 Door', open: false, locked: true },
      { id: 'l2_yard_gate_l', type: 'door_keycard', tx: 20, ty: 13, label: 'North Yard Gate', open: false, locked: true },
      { id: 'l2_yard_gate_r', type: 'door_keycard', tx: 21, ty: 13, label: 'North Yard Gate', open: false, locked: true },
      { id: 'l2_shed_door', type: 'door_cell', tx: 7, ty: 9, label: 'Maintenance Shed Door', open: false, locked: false },
      { id: 'l2_watch_door', type: 'door_keycard', tx: 36, ty: 9, label: 'Watchhouse Door', open: false, locked: true },
      { id: 'l2_warden_door', type: 'door_keycard', tx: 35, ty: 22, label: 'Warden Wing Door', open: false, locked: true },
      { id: 'l2_gen_door', type: 'door_cell', tx: 21, ty: 24, label: 'Generator Door', open: false, locked: false },
      // Perimeter exits
      { id: 'l2_main_gate', type: 'door_keycard', tx: 24, ty: 3, label: 'Main Electric Gate', open: false, locked: true },
      { id: 'l2_fence_w', type: 'fence_weak', tx: 9, ty: 3, label: 'West Electric Fence', cut: false },
      { id: 'l2_fence_e', type: 'fence_weak', tx: 40, ty: 3, label: 'East Electric Fence', cut: false },
      { id: 'l2_escape_van', type: 'escape_zone', tx: 42, ty: 1, label: 'Getaway Van' },
      // Vents
      { id: 'l2_vent_cell', type: 'vent', tx: 2, ty: 29, label: 'South Hall Vent', linkId: 'l2_vent_shed', unscrewed: false },
      { id: 'l2_vent_shed', type: 'vent', tx: 5, ty: 7, label: 'Maintenance Vent', linkId: 'l2_vent_cell', unscrewed: false },
      { id: 'l2_vent_work', type: 'vent', tx: 45, ty: 15, label: 'Workshop Duct', linkId: 'l2_vent_watch', unscrewed: false },
      { id: 'l2_vent_watch', type: 'vent', tx: 38, ty: 7, label: 'Watchhouse Duct', linkId: 'l2_vent_work', unscrewed: false },
      // Tunnel Dig Spot
      { id: 'l2_dig_in', type: 'dig_spot', tx: 8, ty: 7, label: 'Soft Earth Patch', linkId: 'l2_dig_out', digProgress: 0 },
      { id: 'l2_dig_out', type: 'dig_spot', tx: 8, ty: 2, label: 'Tunnel Exit Hole', linkId: 'l2_dig_in', digProgress: 100 },
      // Loot Containers
      { id: 'l2_desk_1', type: 'desk', tx: 4, ty: 14, label: 'Cell 1 Desk', loot: { scrap: 1, wire: 1, tape: 1 } },
      { id: 'l2_locker_2', type: 'locker', tx: 2, ty: 20, label: 'Cell 2 Locker', loot: { cloth: 1, coin: 1 } },
      { id: 'l2_locker_3', type: 'locker', tx: 3, ty: 26, label: 'Cell 3 Locker', loot: { battery: 1, wire: 1, smoke: 1 } },
      { id: 'l2_med_mess', type: 'med_cabinet', tx: 15, ty: 15, label: 'Infirmary Cabinet', loot: { ration: 2, cloth: 1 } },
      { id: 'l2_laundry', type: 'laundry', tx: 10, ty: 29, label: 'Laundry Bin', loot: { cloth: 2, tape: 1 } },
      { id: 'l2_work_1', type: 'toolbox', tx: 31, ty: 15, label: 'Machinist Chest', loot: { scrap: 2, wire: 1 } },
      { id: 'l2_work_2', type: 'toolbox', tx: 41, ty: 19, label: 'Electrical Crate', loot: { battery: 2, tape: 1, coin: 1 } },
      { id: 'l2_sec_locker', type: 'locker', tx: 19, ty: 23, label: 'Armory Locker', loot: { disguise: 1, emp: 1 } },
      { id: 'l2_warden_safe', type: 'safe', tx: 44, ty: 26, label: 'Warden Safe', locked: true, loot: { keycard: 1, coin: 3 } },
      // Power & Security
      { id: 'l2_power', type: 'power_box', tx: 26, ty: 26, label: 'Main Power Grid', disabled: false },
      { id: 'l2_terminal', type: 'security_terminal', tx: 16, ty: 24, label: 'CCTV Server Terminal', disabled: false },
      // Inmates
      {
        id: 'l2_inmate_1',
        type: 'inmate',
        tx: 20,
        ty: 19,
        label: 'Inmate "Ghost"',
        inmateName: 'Ghost (Mess Hall)',
        inmateTip:
          'Two things: the South Hall vent bypasses the locked Yard Gate into the Maintenance Shed, and the dirt patch inside that shed is soft enough to tunnel straight under the electric fence!',
        isTrader: false,
        intelTarget: { tx: 8, ty: 7, label: 'Tunnel Spot' },
      },
      {
        id: 'l2_inmate_2',
        type: 'inmate',
        tx: 36,
        ty: 17,
        label: 'Vance (Trader)',
        inmateName: 'Vance (Black Market)',
        inmateTip: 'Electric fences fry anyone who touches them while power is live. Need a Shovel or EMP?',
        isTrader: true,
      },
      {
        id: 'l2_inmate_3',
        type: 'inmate',
        tx: 11,
        ty: 25,
        label: 'Inmate "Milo"',
        inmateName: 'Milo (Cellblock)',
        inmateTip: 'The Guard Armory Locker near the CCTV room holds a spare Guard Uniform and an EMP Jammer!',
        isTrader: false,
        intelTarget: { tx: 19, ty: 23, label: 'Uniform Stash' },
      },
    ],
    guards: [
      {
        id: 'l2_g1',
        role: 'officer',
        speed: 88,
        fovDeg: 78,
        viewDist: 235,
        waypoints: [
          { tx: 9, ty: 15 },
          { tx: 9, ty: 29 },
          { tx: 15, ty: 29 },
          { tx: 9, ty: 29 },
          { tx: 10, ty: 15 },
        ],
      },
      {
        id: 'l2_g2',
        role: 'officer',
        speed: 90,
        fovDeg: 78,
        viewDist: 245,
        waypoints: [
          { tx: 16, ty: 16 },
          { tx: 26, ty: 16 },
          { tx: 26, ty: 20 },
          { tx: 16, ty: 20 },
        ],
      },
      {
        id: 'l2_g3',
        role: 'officer',
        speed: 92,
        fovDeg: 80,
        viewDist: 250,
        waypoints: [
          { tx: 31, ty: 16 },
          { tx: 44, ty: 16 },
          { tx: 44, ty: 20 },
          { tx: 31, ty: 20 },
        ],
      },
      {
        id: 'l2_g4',
        role: 'warden',
        speed: 86,
        fovDeg: 86,
        viewDist: 260,
        waypoints: [
          { tx: 31, ty: 24 },
          { tx: 43, ty: 24 },
          { tx: 43, ty: 27 },
          { tx: 31, ty: 27 },
        ],
      },
      {
        id: 'l2_g5',
        role: 'riot',
        speed: 95,
        fovDeg: 82,
        viewDist: 265,
        waypoints: [
          { tx: 12, ty: 5 },
          { tx: 30, ty: 5 },
          { tx: 30, ty: 11 },
          { tx: 12, ty: 11 },
        ],
      },
      {
        id: 'l2_g6',
        role: 'officer',
        speed: 88,
        fovDeg: 78,
        viewDist: 240,
        waypoints: [
          { tx: 15, ty: 25 },
          { tx: 19, ty: 25 },
          { tx: 19, ty: 27 },
          { tx: 15, ty: 27 },
        ],
      },
    ],
    cameras: [
      { id: 'l2_cam1', tx: 20, ty: 12, baseAngleDeg: -90, sweepDeg: 115, sweepSpeed: 0.85, range: 265 },
      { id: 'l2_cam2', tx: 24, ty: 22, baseAngleDeg: 90, sweepDeg: 95, sweepSpeed: 0.9, range: 225 },
      { id: 'l2_cam3', tx: 35, ty: 22, baseAngleDeg: 90, sweepDeg: 100, sweepSpeed: 0.75, range: 220 },
    ],
    searchlights: [
      { id: 'l2_spot1', tx: 37, ty: 7, targetTx: 23, targetTy: 8, sweepRadiusTiles: 8, speed: 0.72, beamRadius: 115 },
      { id: 'l2_spot2', tx: 37, ty: 7, targetTx: 14, targetTy: 5, sweepRadiusTiles: 6, speed: 0.9, beamRadius: 100 },
    ],
  },

  // ============================================================================
  // FACILITY 3: IRONHOLD ISLAND BASTION (52 x 34)
  // ============================================================================
  {
    id: 3,
    name: 'Ironhold Island Bastion',
    subtitle: 'Maximum Security · Coastal Fortress',
    securityRating: 'Maximum Security',
    description:
      'An inescapable offshore stone bastion ringed by ocean currents, K9 patrol dogs, riot squads, and sweeping tower spotlights. Reach the hidden south pier speedboat to vanish into the night.',
    difficulty: 'Extreme',
    width: 52,
    height: 34,
    playerStart: { tx: 5, ty: 13 },
    startClockMinutes: 23 * 60 + 15,
    tiles: parseGrid(LEVEL_3_ROWS, 52),
    zones: [
      { name: 'High-Sec Cellblock', tx: 3, ty: 11, w: 12, h: 14 },
      { name: 'Security Core', tx: 16, ty: 11, w: 14, h: 14 },
      { name: 'Power & Foundry', tx: 31, ty: 11, w: 18, h: 8 },
      { name: 'Warden Citadel', tx: 29, ty: 20, w: 20, h: 5 },
      { name: 'North Rampart', tx: 3, ty: 4, w: 46, h: 6 },
      { name: 'South Pier & Boat', tx: 3, ty: 26, w: 46, h: 6 },
    ],
    escapeRoutes: [
      {
        title: 'South Pier Speedboat',
        steps: 'Breach the South Fortress Gate (Keycard or Lockpick), cut or disable the South Electric Fence, and board the speedboat.',
      },
      {
        title: 'Tunnel Beneath the Cliff',
        steps: 'Tunnel from the Solitary Storage Room straight to the South Pier Trail using a Trench Shovel!',
      },
      {
        title: 'Full Grid Sabotage',
        steps: 'Shut down the Power Plant, hack the Security Core, and slip through the blackout in a Guard Disguise.',
      },
    ],
    startingInventory: { coin: 2, ration: 1, lockpick: 1 },
    props: [
      { type: 'bunk', tx: 4.3, ty: 11.3 },
      { type: 'bunk', tx: 4.3, ty: 16.3 },
      { type: 'bunk', tx: 4.3, ty: 22.3 },
      { type: 'server', tx: 18, ty: 12 },
      { type: 'server', tx: 22, ty: 12 },
      { type: 'generator', tx: 45, ty: 12 },
      { type: 'generator', tx: 45, ty: 16 },
      { type: 'crate', tx: 34, ty: 13 },
      { type: 'crate', tx: 17, ty: 21 },
      { type: 'watchtower', tx: 35.5, ty: 6 },
      { type: 'boat', tx: 21.5, ty: 30.8 },
      { type: 'bush', tx: 14, ty: 6 },
      { type: 'bush', tx: 43, ty: 6 },
    ],
    interactables: [
      { id: 'l3_c1_door', type: 'door_cell', tx: 9, ty: 13, label: 'Cell 1 Door', open: true, locked: false },
      { id: 'l3_c2_door', type: 'door_cell', tx: 9, ty: 18, label: 'Cell 2 Door', open: false, locked: false },
      { id: 'l3_c3_door', type: 'door_keycard', tx: 9, ty: 23, label: 'Solitary Door', open: false, locked: true },
      { id: 'l3_n_gate1', type: 'door_keycard', tx: 22, ty: 10, label: 'North Fortress Gate', open: false, locked: true },
      { id: 'l3_n_gate2', type: 'door_keycard', tx: 23, ty: 10, label: 'North Fortress Gate', open: false, locked: true },
      { id: 'l3_s_gate1', type: 'door_keycard', tx: 20, ty: 25, label: 'South Cliff Gate', open: false, locked: true },
      { id: 'l3_s_gate2', type: 'door_keycard', tx: 21, ty: 25, label: 'South Cliff Gate', open: false, locked: true },
      { id: 'l3_s_elec1', type: 'door_keycard', tx: 20, ty: 27, label: 'Pier Security Gate', open: false, locked: true },
      { id: 'l3_s_elec2', type: 'door_keycard', tx: 21, ty: 27, label: 'Pier Security Gate', open: false, locked: true },
      { id: 'l3_fence_s', type: 'fence_weak', tx: 41, ty: 27, label: 'South Electric Fence', cut: false },
      { id: 'l3_shed_nw', type: 'door_cell', tx: 10, ty: 8, label: 'North-West Armory', open: false, locked: false },
      { id: 'l3_shed_ne', type: 'door_keycard', tx: 36, ty: 8, label: 'Watchtower Door', open: false, locked: true },
      { id: 'l3_warden_door', type: 'door_keycard', tx: 38, ty: 19, label: 'Warden Citadel Door', open: false, locked: true },
      { id: 'l3_escape_boat', type: 'escape_zone', tx: 22, ty: 31, label: 'Escape Speedboat' },
      // Vents
      { id: 'l3_vent_c1', type: 'vent', tx: 5, ty: 14, label: 'Cell 1 Duct', linkId: 'l3_vent_nw', unscrewed: false },
      { id: 'l3_vent_nw', type: 'vent', tx: 8, ty: 6, label: 'North Armory Duct', linkId: 'l3_vent_c1', unscrewed: false },
      { id: 'l3_vent_pwr', type: 'vent', tx: 33, ty: 17, label: 'Foundry Duct', linkId: 'l3_vent_cit', unscrewed: false },
      { id: 'l3_vent_cit', type: 'vent', tx: 46, ty: 23, label: 'Citadel Duct', linkId: 'l3_vent_pwr', unscrewed: false },
      // Underground Tunnel
      { id: 'l3_dig_in', type: 'dig_spot', tx: 20, ty: 23, label: 'Weak Floor Drain', linkId: 'l3_dig_out', digProgress: 0 },
      { id: 'l3_dig_out', type: 'dig_spot', tx: 26, ty: 28, label: 'Cliff Tunnel Exit', linkId: 'l3_dig_in', digProgress: 100 },
      // Containers
      { id: 'l3_desk_1', type: 'desk', tx: 7, ty: 11, label: 'Cell 1 Footlocker', loot: { scrap: 2, tape: 1, wire: 1 } },
      { id: 'l3_locker_2', type: 'locker', tx: 5, ty: 19, label: 'Cell 2 Locker', loot: { cloth: 2, coin: 1 } },
      { id: 'l3_locker_3', type: 'locker', tx: 5, ty: 24, label: 'Solitary Locker', loot: { shovel: 1, battery: 1 } },
      { id: 'l3_armory_nw', type: 'locker', tx: 11, ty: 6, label: 'Armory Rack', loot: { disguise: 1, smoke: 1, cutters: 1 } },
      { id: 'l3_med_sec', type: 'med_cabinet', tx: 17, ty: 14, label: 'Security Medkit', loot: { ration: 2, battery: 1 } },
      { id: 'l3_work_1', type: 'toolbox', tx: 36, ty: 12, label: 'Foundry Toolbox', loot: { scrap: 2, wire: 2, tape: 1 } },
      { id: 'l3_work_2', type: 'toolbox', tx: 42, ty: 17, label: 'Generator Parts', loot: { battery: 2, emp: 1, coin: 2 } },
      { id: 'l3_safe_warden', type: 'safe', tx: 46, ty: 21, label: 'Citadel Master Safe', locked: true, loot: { keycard: 2, coin: 3 } },
      // Tech
      { id: 'l3_power', type: 'power_box', tx: 47, ty: 14, label: 'Island Power Plant', disabled: false },
      { id: 'l3_term', type: 'security_terminal', tx: 25, ty: 13, label: 'Fortress Security Hub', disabled: false },
      // Inmates
      {
        id: 'l3_inmate_1',
        type: 'inmate',
        tx: 13,
        ty: 17,
        label: 'Inmate "Rook"',
        inmateName: 'Rook (Cellblock)',
        inmateTip:
          'Cell 1 has a duct straight into the North Armory—there is a Guard Uniform and Wire Cutters hidden inside. Also watch out for the K9 dog in the North Rampart!',
        isTrader: false,
        intelTarget: { tx: 11, ty: 6, label: 'Armory Stash' },
      },
      {
        id: 'l3_inmate_2',
        type: 'inmate',
        tx: 25,
        ty: 21,
        label: 'Kestrel (Trader)',
        inmateName: 'Kestrel (Smuggler)',
        inmateTip: 'The Weak Floor Drain right nearby tunnels all the way out past the South Electric Fence!',
        isTrader: true,
        intelTarget: { tx: 20, ty: 23, label: 'Cliff Tunnel' },
      },
    ],
    guards: [
      {
        id: 'l3_g1',
        role: 'officer',
        speed: 92,
        fovDeg: 80,
        viewDist: 245,
        waypoints: [
          { tx: 11, ty: 12 },
          { tx: 11, ty: 23 },
          { tx: 14, ty: 23 },
          { tx: 14, ty: 12 },
        ],
      },
      {
        id: 'l3_g2',
        role: 'riot',
        speed: 95,
        fovDeg: 82,
        viewDist: 260,
        waypoints: [
          { tx: 18, ty: 15 },
          { tx: 28, ty: 15 },
          { tx: 28, ty: 18 },
          { tx: 18, ty: 18 },
        ],
      },
      {
        id: 'l3_g3',
        role: 'officer',
        speed: 94,
        fovDeg: 80,
        viewDist: 255,
        waypoints: [
          { tx: 33, ty: 14 },
          { tx: 43, ty: 14 },
          { tx: 43, ty: 17 },
          { tx: 33, ty: 17 },
        ],
      },
      {
        id: 'l3_g4',
        role: 'warden',
        speed: 90,
        fovDeg: 88,
        viewDist: 270,
        waypoints: [
          { tx: 31, ty: 21 },
          { tx: 44, ty: 21 },
          { tx: 44, ty: 23 },
          { tx: 31, ty: 23 },
        ],
      },
      {
        id: 'l3_k9_1',
        role: 'k9',
        speed: 122,
        fovDeg: 95,
        viewDist: 235,
        waypoints: [
          { tx: 14, ty: 5 },
          { tx: 31, ty: 5 },
          { tx: 31, ty: 9 },
          { tx: 14, ty: 9 },
        ],
      },
      {
        id: 'l3_g5',
        role: 'riot',
        speed: 96,
        fovDeg: 84,
        viewDist: 270,
        waypoints: [
          { tx: 18, ty: 26 },
          { tx: 38, ty: 26 },
        ],
      },
      {
        id: 'l3_g6',
        role: 'officer',
        speed: 92,
        fovDeg: 80,
        viewDist: 250,
        waypoints: [
          { tx: 14, ty: 28 },
          { tx: 32, ty: 28 },
          { tx: 23, ty: 28 },
        ],
      },
    ],
    cameras: [
      { id: 'l3_cam1', tx: 22, ty: 9, baseAngleDeg: -90, sweepDeg: 120, sweepSpeed: 0.9, range: 265 },
      { id: 'l3_cam2', tx: 23, ty: 15, baseAngleDeg: -90, sweepDeg: 110, sweepSpeed: 0.85, range: 235 },
      { id: 'l3_cam3', tx: 40, ty: 19, baseAngleDeg: 90, sweepDeg: 105, sweepSpeed: 0.8, range: 235 },
      { id: 'l3_cam4', tx: 21, ty: 26, baseAngleDeg: 90, sweepDeg: 120, sweepSpeed: 0.95, range: 250 },
    ],
    searchlights: [
      { id: 'l3_spot1', tx: 37, ty: 6, targetTx: 22, targetTy: 7, sweepRadiusTiles: 9, speed: 0.78, beamRadius: 120 },
      { id: 'l3_spot2', tx: 37, ty: 6, targetTx: 44, targetTy: 27, sweepRadiusTiles: 7, speed: 0.65, beamRadius: 110 },
      { id: 'l3_spot3', tx: 37, ty: 6, targetTx: 22, targetTy: 28, sweepRadiusTiles: 6, speed: 0.85, beamRadius: 105 },
    ],
  },
];
