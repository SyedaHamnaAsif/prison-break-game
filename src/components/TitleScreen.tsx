import { ArrowRight, Compass, Hammer, KeyRound, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { SaveProgress } from '../game/types';

interface TitleScreenProps {
  progress: SaveProgress;
  muted: boolean;
  onToggleMute: () => void;
  onStartLevel: (levelId: number) => void;
  onResetProgress: () => void;
}

const FACILITY_IMAGES: Record<number, { src: string; alt: string }> = {
  1: {
    src: '/src/assets/images/chapter_county_lockup_1795531916953.jpg',
    alt: 'Pinebrook County Jail cellblock and courtyard illustration',
  },
  2: {
    src: '/src/assets/images/prison_title_hero_1795531915463.jpg',
    alt: 'Blackgate Penitentiary watchtowers and perimeter fence at night',
  },
  3: {
    src: '/src/assets/images/chapter_alcatraz_bastion_1795531915335.jpg',
    alt: 'Ironhold Island Bastion coastal fortress and getaway boat',
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TitleScreen({
  progress,
  muted,
  onToggleMute,
  onStartLevel,
  onResetProgress,
}: TitleScreenProps) {
  const nextRecommended =
    LEVELS.find((l) => !progress.completedLevels.includes(l.id))?.id ?? 1;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E6E9EF] flex flex-col">
      {/* 3-Zone Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#0B0E14]/95 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-2xl font-bold tracking-wide text-slate-100 whitespace-nowrap shrink-0"
          >
            Ironhold Breakout
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
            <a
              href="#facilities"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Facilities
            </a>
            <a
              href="#controls"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Controls
            </a>
            <a
              href="#features"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Escape Systems
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              onClick={() => onStartLevel(nextRecommended)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
            >
              <span>Start Breakout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split Section */}
        <section className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between py-2">
              <div>
                <p className="text-xs font-medium text-amber-400 tracking-wide mb-3">
                  Tactical Top-Down Prison Escape · 3 Facilities · Multi-Route Stealth
                </p>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-50 leading-[1.03] text-balance mb-5">
                  Plan the Route. Craft the Tools. Slip Past the Lights.
                </h1>
                <p className="text-slate-300 text-base leading-relaxed max-w-xl mb-8">
                  Navigate raycasted guard vision cones, sweeping tower spotlights, and CCTV
                  cameras across three escalating prisons. Move effortlessly with click-to-walk
                  navigation or WASD, craft contraband gear, trade with inmates, and break out
                  your way.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => onStartLevel(nextRecommended)}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Play {LEVELS[nextRecommended - 1]?.name ?? 'Facility 1'}
                  </button>
                  <button
                    onClick={onToggleMute}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span>{muted ? 'Audio Muted' : 'Audio Enabled'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="font-mono-tabular">
                    Completed: {progress.completedLevels.length}/{LEVELS.length}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Controls: Click-to-Move or WASD</span>
                  <span aria-hidden="true">·</span>
                  <span>Interact: [E] or Click Object</span>
                  {progress.completedLevels.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <button
                        onClick={onResetProgress}
                        className="text-slate-400 hover:text-rose-400 underline underline-offset-4 cursor-pointer"
                      >
                        Reset Progress
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[360px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <img
                  src="/src/assets/images/prison_title_hero_1795531915463.jpg"
                  alt="Prison yard under sweeping searchlights during a night breakout"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-amber-400 font-medium mb-1">
                      Dynamic Day-Night Schedule
                    </p>
                    <p className="text-sm text-slate-200 max-w-md">
                      Every prison offers multiple ways out: wire cutters, ventilation ducts,
                      underground tunnels, power sabotage, or guard disguises.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Facilities Selection */}
        <section id="facilities" className="max-w-7xl mx-auto px-6 py-10 border-t border-slate-800/70">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
            <div>
              <h2 className="font-display text-3xl font-bold text-slate-100">
                Select Facility
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                All three prisons are playable right away in any order.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LEVELS.map((lvl) => {
              const completed = progress.completedLevels.includes(lvl.id);
              const best = progress.bestTimes[lvl.id];
              const rating = progress.bestRatings?.[lvl.id];
              const art = FACILITY_IMAGES[lvl.id];

              return (
                <div
                  key={lvl.id}
                  className="bg-[#121620] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="relative h-48 bg-slate-900 overflow-hidden">
                      <img
                        src={art.src}
                        alt={art.alt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121620] via-transparent to-transparent" />
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                        <span>Facility 0{lvl.id}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            lvl.difficulty === 'Extreme'
                              ? 'text-rose-400'
                              : lvl.difficulty === 'Hard'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                          }
                        >
                          {lvl.difficulty}
                        </span>
                        {completed && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-400 font-medium">Escaped</span>
                          </>
                        )}
                      </div>

                      <h3 className="font-display text-2xl font-bold text-slate-100 mb-2">
                        {lvl.name}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed mb-4">
                        {lvl.description}
                      </p>

                      <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
                        <div className="flex justify-between">
                          <span>Security</span>
                          <span className="text-slate-200">{lvl.securityRating}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Escape Routes</span>
                          <span className="text-slate-200 font-mono-tabular">
                            {lvl.escapeRoutes.length} Paths
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best Time</span>
                          <span className="text-slate-200 font-mono-tabular">
                            {best ? `${formatTime(best)}${rating ? ` (${rating})` : ''}` : 'Not Escaped'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      onClick={() => onStartLevel(lvl.id)}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-100 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {completed ? 'Replay Facility' : 'Launch Breakout'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Controls & Tactical Features */}
        <section id="controls" className="max-w-7xl mx-auto px-6 py-10 border-t border-slate-800/70">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-slate-100 mb-2">
                Effortless Controls
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Play comfortably with mouse-only smart navigation, keyboard, or touch controls.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-[#121620] border border-slate-800 rounded-lg">
                  <p className="font-semibold text-slate-100 mb-1">Move & Pathfind</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Click anywhere on the map to auto-navigate around walls, or use WASD / Arrow
                    keys.
                  </p>
                </div>
                <div className="p-4 bg-[#121620] border border-slate-800 rounded-lg">
                  <p className="font-semibold text-slate-100 mb-1">Single Action Key</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Press [E] or click any nearby locker, door, vent, terminal, or inmate to act.
                  </p>
                </div>
                <div className="p-4 bg-[#121620] border border-slate-800 rounded-lg">
                  <p className="font-semibold text-slate-100 mb-1">Sneak & Sprint</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Hold Shift to sprint (creates sound ripples) or toggle [C] to crouch quietly.
                  </p>
                </div>
                <div className="p-4 bg-[#121620] border border-slate-800 rounded-lg">
                  <p className="font-semibold text-slate-100 mb-1">Gadgets & Crafting</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Keys [1–5] trigger Coin Decoy, Ration, Guard Disguise, EMP, or Smoke. [Tab] opens
                    Crafting.
                  </p>
                </div>
              </div>
            </div>

            <div id="features">
              <h2 className="font-display text-3xl font-bold text-slate-100 mb-2">
                Prison Break Systems
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Every system interlocks so you can improvise your own breakout plan.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3.5 bg-[#121620] border border-slate-800 rounded-lg">
                  <Hammer className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Scavenge, Craft & Black Market Trading
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Loot desks, toolboxes, and laundry bins to craft Lockpicks, Screwdrivers,
                      Wire Cutters, Shovels, EMPs, and Guard Disguises—or buy gear with Coins.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-[#121620] border border-slate-800 rounded-lg">
                  <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Raycast Stealth, Disguises & Sabotage
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hide inside empty lockers, lure guards away with coin clinks, hack CCTV
                      terminals, or shut down the facility power grid to cross electric fences.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-[#121620] border border-slate-800 rounded-lg">
                  <KeyRound className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Vents, Underground Tunnels & Minigames
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Unscrew wall vents for stealth shortcuts, excavate escape tunnels beneath
                      fortress walls, and crack Warden safes with a timing-bar lockpick minigame.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-[#121620] border border-slate-800 rounded-lg">
                  <Compass className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Inmate Intel & Live Tactical Minimap
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Talk to fellow prisoners to reveal hidden stashes and tunnel spots directly on
                      your live radar minimap.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
