import { useCallback, useEffect, useRef, useState } from 'react';
import { computeStealthRating, GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { soundEngine } from './game/audio';
import { InputState, PrisonBreakEngine } from './game/engine';
import { LEVELS } from './game/levels';
import { PrisonRenderer } from './game/renderer';
import { CraftingRecipe, GameState, HUDTelemetry, SaveProgress } from './game/types';

const STORAGE_KEY = 'ironhold_breakout_progress_v1';

function loadProgress(): SaveProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedLevels: [], bestTimes: {}, bestRatings: {} };
    const parsed = JSON.parse(raw) as SaveProgress;
    return {
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      bestTimes: parsed.bestTimes && typeof parsed.bestTimes === 'object' ? parsed.bestTimes : {},
      bestRatings:
        parsed.bestRatings && typeof parsed.bestRatings === 'object' ? parsed.bestRatings : {},
    };
  } catch {
    return { completedLevels: [], bestTimes: {}, bestRatings: {} };
  }
}

function saveProgress(progress: SaveProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota issues
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [progress, setProgress] = useState<SaveProgress>(() => loadProgress());
  const [muted, setMuted] = useState(false);
  const [showCraftDrawer, setShowCraftDrawer] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PrisonBreakEngine | null>(null);
  const rendererRef = useRef<PrisonRenderer | null>(null);
  const gameStateRef = useRef<GameState>(gameState);

  const [telemetry, setTelemetry] = useState<HUDTelemetry>(() =>
    new PrisonBreakEngine(LEVELS[0]).getTelemetry()
  );

  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false,
    crouch: false,
    touchX: 0,
    touchY: 0,
  });

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    }
  }, []);

  const clearInputs = useCallback(() => {
    inputRef.current.up = false;
    inputRef.current.down = false;
    inputRef.current.left = false;
    inputRef.current.right = false;
    inputRef.current.sprint = false;
    inputRef.current.crouch = false;
    inputRef.current.touchX = 0;
    inputRef.current.touchY = 0;
  }, []);

  const syncTelemetry = useCallback(() => {
    if (engineRef.current) {
      setTelemetry(engineRef.current.getTelemetry());
    }
  }, []);

  const launchLevel = useCallback(
    (levelId: number) => {
      const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
      clearInputs();
      setCurrentLevelId(level.id);
      setShowCraftDrawer(false);
      const engine = new PrisonBreakEngine(level);
      engineRef.current = engine;
      setTelemetry(engine.getTelemetry());
      setGameState('PLAYING');
    },
    [clearInputs]
  );

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handlePauseToggle = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') {
        clearInputs();
        setShowCraftDrawer(false);
        return 'PAUSED';
      }
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, [clearInputs]);

  const handleReturnMenu = useCallback(() => {
    clearInputs();
    setShowCraftDrawer(false);
    setGameState('TITLE_MENU');
  }, [clearInputs]);

  const handleResetProgress = useCallback(() => {
    const empty: SaveProgress = { completedLevels: [], bestTimes: {}, bestRatings: {} };
    setProgress(empty);
    saveProgress(empty);
  }, []);

  // Main Canvas Render & Simulation Loop
  useEffect(() => {
    if (gameState === 'TITLE_MENU') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!rendererRef.current) {
      rendererRef.current = new PrisonRenderer();
    }
    if (!engineRef.current) {
      const lvl = LEVELS.find((l) => l.id === currentLevelId) ?? LEVELS[0];
      engineRef.current = new PrisonBreakEngine(lvl);
      setTelemetry(engineRef.current.getTelemetry());
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let frameId = 0;
    let lastTime = performance.now();
    let hudAccum = 0;

    const tick = () => {
      try {
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        const engine = engineRef.current;
        const renderer = rendererRef.current;
        if (engine && renderer) {
          if (gameStateRef.current === 'PLAYING') {
            engine.step(inputRef.current, dt);

            if (engine.busted) {
              setTelemetry(engine.getTelemetry());
              setGameState('GAME_OVER');
            } else if (engine.escaped) {
              const finalTel = engine.getTelemetry();
              const lvlId = engine.level.id;
              const elapsed = engine.elapsedSeconds;
              const rating = computeStealthRating(finalTel);

              setProgress((prev) => {
                const completedLevels = prev.completedLevels.includes(lvlId)
                  ? prev.completedLevels
                  : [...prev.completedLevels, lvlId];
                const prevBest = prev.bestTimes[lvlId];
                const bestTimes = {
                  ...prev.bestTimes,
                  [lvlId]: prevBest ? Math.min(prevBest, elapsed) : elapsed,
                };
                const bestRatings = {
                  ...prev.bestRatings,
                  [lvlId]: !prevBest || elapsed <= prevBest ? rating : prev.bestRatings[lvlId] ?? rating,
                };
                const updated = { completedLevels, bestTimes, bestRatings };
                saveProgress(updated);
                return updated;
              });

              setTelemetry(finalTel);
              setGameState(lvlId >= LEVELS.length ? 'VICTORY' : 'LEVEL_COMPLETE');
            }
          }

          renderer.render(ctx, engine, window.innerWidth, window.innerHeight);

          const mini = minimapRef.current;
          if (mini) {
            const mCtx = mini.getContext('2d');
            if (mCtx) {
              renderer.renderMinimap(mCtx, engine, mini.width, mini.height);
            }
          }

          hudAccum += dt;
          if (hudAccum >= 0.08 && gameStateRef.current === 'PLAYING') {
            hudAccum = 0;
            setTelemetry(engine.getTelemetry());
          }
        }
      } catch (err) {
        console.error('Game loop error:', err);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [gameState === 'TITLE_MENU', currentLevelId]);

  // Keyboard Controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (state === 'TITLE_MENU') return;

      const code = e.code;

      if (code === 'Escape' || code === 'KeyP') {
        if (engineRef.current?.minigame) {
          engineRef.current.cancelMinigame();
          syncTelemetry();
          return;
        }
        if (engineRef.current?.dialog) {
          engineRef.current.dialog = null;
          syncTelemetry();
          return;
        }
        if (showCraftDrawer) {
          setShowCraftDrawer(false);
          return;
        }
        if (state === 'PLAYING' || state === 'PAUSED') {
          e.preventDefault();
          handlePauseToggle();
        }
        return;
      }

      if (code === 'KeyR' && (state === 'PLAYING' || state === 'GAME_OVER') && !e.repeat) {
        e.preventDefault();
        launchLevel(currentLevelId);
        return;
      }

      if (state !== 'PLAYING') return;

      if (code === 'Tab' || code === 'KeyB') {
        e.preventDefault();
        setShowCraftDrawer((p) => !p);
        return;
      }
      if (code === 'KeyM' && !e.repeat) {
        setShowMinimap((p) => !p);
        return;
      }

      if (code === 'KeyW' || code === 'ArrowUp') inputRef.current.up = true;
      else if (code === 'KeyS' || code === 'ArrowDown') inputRef.current.down = true;
      else if (code === 'KeyA' || code === 'ArrowLeft') inputRef.current.left = true;
      else if (code === 'KeyD' || code === 'ArrowRight') inputRef.current.right = true;
      else if (code === 'ShiftLeft' || code === 'ShiftRight') inputRef.current.sprint = true;
      else if (code === 'KeyC' && !e.repeat) {
        inputRef.current.crouch = !inputRef.current.crouch;
        syncTelemetry();
      } else if ((code === 'KeyE' || code === 'Space') && !e.repeat) {
        e.preventDefault();
        engineRef.current?.interact();
        syncTelemetry();
      } else if (code === 'KeyQ' && !e.repeat) {
        engineRef.current?.useHotbarItem(1);
        syncTelemetry();
      } else if (code === 'Digit1' && !e.repeat) {
        engineRef.current?.useHotbarItem(1);
        syncTelemetry();
      } else if (code === 'Digit2' && !e.repeat) {
        engineRef.current?.useHotbarItem(2);
        syncTelemetry();
      } else if (code === 'Digit3' && !e.repeat) {
        engineRef.current?.useHotbarItem(3);
        syncTelemetry();
      } else if (code === 'Digit4' && !e.repeat) {
        engineRef.current?.useHotbarItem(4);
        syncTelemetry();
      } else if (code === 'Digit5' && !e.repeat) {
        engineRef.current?.useHotbarItem(5);
        syncTelemetry();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') inputRef.current.up = false;
      else if (code === 'KeyS' || code === 'ArrowDown') inputRef.current.down = false;
      else if (code === 'KeyA' || code === 'ArrowLeft') inputRef.current.left = false;
      else if (code === 'KeyD' || code === 'ArrowRight') inputRef.current.right = false;
      else if (code === 'ShiftLeft' || code === 'ShiftRight') inputRef.current.sprint = false;
    };

    const onBlur = () => clearInputs();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [clearInputs, currentLevelId, handlePauseToggle, launchLevel, showCraftDrawer, syncTelemetry]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || !engineRef.current) return;
    if (showCraftDrawer) {
      setShowCraftDrawer(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldX = engineRef.current.camX - rect.width / 2 + sx;
    const worldY = engineRef.current.camY - rect.height / 2 + sy;
    engineRef.current.handleCanvasClick(worldX, worldY);
    syncTelemetry();
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || !engineRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldX = engineRef.current.camX - rect.width / 2 + sx;
    const worldY = engineRef.current.camY - rect.height / 2 + sy;
    engineRef.current.updateHover(worldX, worldY);
  };

  if (gameState === 'TITLE_MENU') {
    return (
      <TitleScreen
        progress={progress}
        muted={muted}
        onToggleMute={handleToggleMute}
        onStartLevel={launchLevel}
        onResetProgress={handleResetProgress}
      />
    );
  }

  const currentLevel = LEVELS.find((l) => l.id === currentLevelId) ?? LEVELS[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090C11]">
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        className="block w-full h-full cursor-crosshair"
      />

      <GameHUD
        gameState={gameState}
        telemetry={telemetry}
        escapeRoutes={currentLevel.escapeRoutes}
        totalLevels={LEVELS.length}
        muted={muted}
        showCraftDrawer={showCraftDrawer}
        showMinimap={showMinimap}
        minimapRef={minimapRef}
        isTouchDevice={isTouchDevice}
        onToggleCraftDrawer={() => setShowCraftDrawer((p) => !p)}
        onToggleMinimap={() => setShowMinimap((p) => !p)}
        onToggleMute={handleToggleMute}
        onPauseToggle={handlePauseToggle}
        onRestartLevel={() => launchLevel(currentLevelId)}
        onNextLevel={() => launchLevel(Math.min(LEVELS.length, currentLevelId + 1))}
        onReturnMenu={handleReturnMenu}
        onInteract={() => {
          engineRef.current?.interact();
          syncTelemetry();
        }}
        onToggleCrouch={() => {
          inputRef.current.crouch = !inputRef.current.crouch;
          syncTelemetry();
        }}
        onUseHotbar={(slot) => {
          engineRef.current?.useHotbarItem(slot);
          syncTelemetry();
        }}
        onCraft={(recipe: CraftingRecipe) => {
          engineRef.current?.craftRecipe(recipe);
          syncTelemetry();
        }}
        onTriggerMinigameHit={() => {
          engineRef.current?.triggerMinigameHit();
          syncTelemetry();
        }}
        onCancelMinigame={() => {
          engineRef.current?.cancelMinigame();
          syncTelemetry();
        }}
        onCloseDialog={() => {
          if (engineRef.current) {
            engineRef.current.dialog = null;
            syncTelemetry();
          }
        }}
        onBuyTrade={(offerId) => {
          engineRef.current?.buyTradeOffer(offerId);
          syncTelemetry();
        }}
        onTouchJoystick={(dx, dy) => {
          inputRef.current.touchX = dx;
          inputRef.current.touchY = dy;
        }}
      />
    </div>
  );
}
