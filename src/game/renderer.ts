import { PrisonBreakEngine, TILE_SIZE } from './engine';
import { Interactable, PropDeco } from './types';

interface TilePatterns {
  cell: CanvasPattern | null;
  hall: CanvasPattern | null;
  cafe: CanvasPattern | null;
  grass: CanvasPattern | null;
  dirt: CanvasPattern | null;
  asphalt: CanvasPattern | null;
  wood: CanvasPattern | null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export class PrisonRenderer {
  private patterns: TilePatterns | null = null;
  private lightCanvas: HTMLCanvasElement | null = null;
  private lightCtx: CanvasRenderingContext2D | null = null;

  private ensurePatterns(ctx: CanvasRenderingContext2D): TilePatterns {
    if (this.patterns) return this.patterns;

    const makeTile = (size: number, draw: (c: CanvasRenderingContext2D) => void): CanvasPattern | null => {
      const off = document.createElement('canvas');
      off.width = size;
      off.height = size;
      const oc = off.getContext('2d');
      if (!oc) return null;
      draw(oc);
      return ctx.createPattern(off, 'repeat');
    };

    const cell = makeTile(TILE_SIZE, (c) => {
      c.fillStyle = '#252B36';
      c.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      c.strokeStyle = 'rgba(255,255,255,0.04)';
      c.lineWidth = 1;
      c.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      c.fillStyle = 'rgba(0,0,0,0.14)';
      c.fillRect(6, 12, 3, 2);
      c.fillRect(28, 30, 4, 2);
    });

    const hall = makeTile(TILE_SIZE, (c) => {
      c.fillStyle = '#2B3240';
      c.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      c.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      c.lineWidth = 1;
      c.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
      c.fillStyle = 'rgba(255,255,255,0.025)';
      c.fillRect(1, 1, TILE_SIZE - 2, 2);
    });

    const cafe = makeTile(TILE_SIZE, (c) => {
      const h = TILE_SIZE / 2;
      c.fillStyle = '#313949';
      c.fillRect(0, 0, h, h);
      c.fillRect(h, h, h, h);
      c.fillStyle = '#262D3B';
      c.fillRect(h, 0, h, h);
      c.fillRect(0, h, h, h);
    });

    const grass = makeTile(TILE_SIZE, (c) => {
      c.fillStyle = '#1E3326';
      c.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      c.fillStyle = '#274332';
      c.fillRect(5, 7, 2, 5);
      c.fillRect(18, 22, 2, 4);
      c.fillRect(32, 11, 2, 5);
      c.fillStyle = '#17281D';
      c.fillRect(12, 31, 3, 3);
      c.fillRect(35, 34, 2, 4);
    });

    const dirt = makeTile(TILE_SIZE, (c) => {
      c.fillStyle = '#383028';
      c.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      c.fillStyle = '#473D33';
      c.fillRect(8, 10, 4, 3);
      c.fillRect(26, 28, 5, 3);
      c.fillStyle = '#2A231C';
      c.fillRect(18, 6, 3, 2);
      c.fillRect(34, 17, 3, 3);
    });

    const asphalt = makeTile(TILE_SIZE * 2, (c) => {
      c.fillStyle = '#1D2129';
      c.fillRect(0, 0, TILE_SIZE * 2, TILE_SIZE * 2);
      c.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 18; i++) {
        c.fillRect((i * 19) % 80, (i * 29) % 80, 2, 2);
      }
      c.fillStyle = 'rgba(245, 158, 11, 0.35)';
      c.fillRect(10, TILE_SIZE - 2, 26, 4);
    });

    const wood = makeTile(TILE_SIZE, (c) => {
      c.fillStyle = '#3F2D21';
      c.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      c.strokeStyle = 'rgba(20, 12, 8, 0.45)';
      c.lineWidth = 1;
      for (let y = 0; y < TILE_SIZE; y += 11) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(TILE_SIZE, y);
        c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,0.03)';
      c.fillRect(6, 3, 18, 2);
      c.fillRect(20, 25, 16, 2);
    });

    this.patterns = { cell, hall, cafe, grass, dirt, asphalt, wood };
    return this.patterns;
  }

  private ensureLightCanvas(w: number, h: number) {
    if (!this.lightCanvas) {
      this.lightCanvas = document.createElement('canvas');
      this.lightCtx = this.lightCanvas.getContext('2d');
    }
    if (this.lightCanvas.width !== w || this.lightCanvas.height !== h) {
      this.lightCanvas.width = w;
      this.lightCanvas.height = h;
    }
  }

  render(ctx: CanvasRenderingContext2D, engine: PrisonBreakEngine, viewW: number, viewH: number) {
    if (viewW <= 0 || viewH <= 0) return;
    const patterns = this.ensurePatterns(ctx);
    const time = engine.elapsedSeconds;

    ctx.save();
    ctx.fillStyle = '#090C11';
    ctx.fillRect(0, 0, viewW, viewH);

    // Camera centering + micro screen shake
    const shakeX = engine.screenShake > 0 ? (Math.random() - 0.5) * 10 * engine.screenShake * 3 : 0;
    const shakeY = engine.screenShake > 0 ? (Math.random() - 0.5) * 10 * engine.screenShake * 3 : 0;
    const camLeft = engine.camX - viewW / 2 + shakeX;
    const camTop = engine.camY - viewH / 2 + shakeY;

    ctx.translate(-camLeft, -camTop);

    // Visible tile bounds
    const startTx = Math.max(0, Math.floor(camLeft / TILE_SIZE) - 1);
    const endTx = Math.min(engine.level.width - 1, Math.ceil((camLeft + viewW) / TILE_SIZE) + 1);
    const startTy = Math.max(0, Math.floor(camTop / TILE_SIZE) - 1);
    const endTy = Math.min(engine.level.height - 1, Math.ceil((camTop + viewH) / TILE_SIZE) + 1);

    // 1. Floor Tiles
    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const t = engine.tiles[ty][tx];
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;

        if (t === 'void') continue;
        if (t === 'water') {
          ctx.fillStyle = '#0B2239';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          const waveOffset = Math.sin(time * 2.1 + tx * 0.8 + ty * 0.5) * 3;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px + 6, py + 14 + waveOffset);
          ctx.quadraticCurveTo(px + 22, py + 10 + waveOffset, px + 38, py + 14 + waveOffset);
          ctx.stroke();
          continue;
        }

        switch (t) {
          case 'cell_floor':
            ctx.fillStyle = patterns.cell ?? '#252B36';
            break;
          case 'cafeteria_floor':
            ctx.fillStyle = patterns.cafe ?? '#2B3240';
            break;
          case 'yard_grass':
            ctx.fillStyle = patterns.grass ?? '#1E3326';
            break;
          case 'yard_dirt':
            ctx.fillStyle = patterns.dirt ?? '#383028';
            break;
          case 'asphalt':
            ctx.fillStyle = patterns.asphalt ?? '#1D2129';
            break;
          case 'wood_floor':
            ctx.fillStyle = patterns.wood ?? '#3F2D21';
            break;
          default:
            ctx.fillStyle = patterns.hall ?? '#2B3240';
        }
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }

    // 2. Zone Floor Labels (subtle architectural stencil on floors)
    ctx.save();
    ctx.font = '600 11px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (const z of engine.level.zones) {
      ctx.fillText(z.name.toUpperCase(), (z.tx + 0.35) * TILE_SIZE, (z.ty + 0.6) * TILE_SIZE);
    }
    ctx.restore();

    // 3. Props (Bunks, Tables, Washers, Crates, Generators, Vans, Boats)
    for (const prop of engine.level.props) {
      this.drawProp(ctx, prop, time);
    }

    // 4. Click-to-Move Path & Waypoint Marker
    if (engine.movePath.length > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.32)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(engine.player.x, engine.player.y);
      for (const node of engine.movePath) {
        ctx.lineTo((node.tx + 0.5) * TILE_SIZE, (node.ty + 0.5) * TILE_SIZE);
      }
      ctx.stroke();
      ctx.restore();
    }
    if (engine.clickMarker) {
      const m = engine.clickMarker;
      const alpha = Math.min(1, m.timer * 1.5);
      ctx.save();
      ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 12 * (1.2 - alpha * 0.4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Raycasted Guard & Camera Vision Cones (under walls so walls mask cleanly)
    for (const cam of engine.cameras) {
      if (cam.permanentlyDisabled || cam.disabledTimer > 0) continue;
      const col =
        cam.alertLevel > 40 ? 'rgba(239, 68, 68, 0.24)' : 'rgba(56, 189, 248, 0.16)';
      this.drawRaycastCone(ctx, engine, cam.x, cam.y, cam.angle, 0.52, cam.range, col);
    }

    for (const g of engine.guards) {
      if (g.state === 'stunned') continue;
      const halfFov = ((g.fovDeg * Math.PI) / 180) * 0.5;
      const col =
        g.state === 'alerted'
          ? 'rgba(239, 68, 68, 0.28)'
          : g.state === 'suspicious'
            ? 'rgba(245, 158, 11, 0.24)'
            : 'rgba(254, 240, 138, 0.14)';
      this.drawRaycastCone(ctx, engine, g.x, g.y, g.angle, halfFov, g.viewDist, col);
    }

    // 6. Walls, Bars, Fences & Drop Shadows (2.5D extrusion)
    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const t = engine.tiles[ty][tx];
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;
        const it = engine.getInteractableAt(tx, ty);

        if (t === 'wall') {
          // Drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
          ctx.fillRect(px + 5, py + 7, TILE_SIZE, TILE_SIZE);
          // 2.5D Wall front face
          ctx.fillStyle = '#1E2430';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Top raised cap
          ctx.fillStyle = '#364152';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE - 8);
          // Concrete seam highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 9);
        } else if (t === 'bars') {
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(px, py + TILE_SIZE / 2 - 2, TILE_SIZE, 8);
          ctx.fillStyle = '#64748B';
          ctx.fillRect(px, py + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
          for (let b = 6; b < TILE_SIZE; b += 9) {
            ctx.fillStyle = '#CBD5E1';
            ctx.fillRect(px + b, py + 4, 3, TILE_SIZE - 8);
          }
        } else if (t === 'fence' || t === 'electric_fence') {
          if (it && it.type === 'fence_weak' && it.cut) {
            // Breached fence gap
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + 2, py + TILE_SIZE / 2);
            ctx.lineTo(px + 10, py + TILE_SIZE / 2 - 6);
            ctx.moveTo(px + TILE_SIZE - 2, py + TILE_SIZE / 2);
            ctx.lineTo(px + TILE_SIZE - 10, py + TILE_SIZE / 2 + 6);
            ctx.stroke();
          } else {
            const isElectric = t === 'electric_fence' && engine.powerDownTimer <= 0;
            ctx.strokeStyle = isElectric ? '#38BDF8' : '#94A3B8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py + TILE_SIZE / 2);
            ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
            ctx.stroke();
            // Posts
            ctx.fillStyle = '#475569';
            ctx.fillRect(px + 2, py + TILE_SIZE / 2 - 5, 4, 10);
            ctx.fillRect(px + TILE_SIZE - 6, py + TILE_SIZE / 2 - 5, 4, 10);
            if (isElectric && Math.sin(time * 14 + tx) > 0.4) {
              ctx.fillStyle = '#22D3EE';
              ctx.fillRect(px + TILE_SIZE / 2 - 4, py + TILE_SIZE / 2 - 2, 8, 4);
            }
          }
        }
      }
    }

    // 7. Interactable Objects (Doors, Lockers, Vents, Terminals, Inmates, Escape Zones)
    const nearest = engine.getNearestInteractable();
    for (const it of engine.interactables) {
      if (it.tx < startTx - 2 || it.tx > endTx + 2 || it.ty < startTy - 2 || it.ty > endTy + 2) {
        continue;
      }
      const isHighlight = nearest?.id === it.id || engine.hoveredInteractId === it.id;
      this.drawInteractable(ctx, engine, it, isHighlight, time);
    }

    // 8. Sound Ripples
    for (const r of engine.ripples) {
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 9. Guards
    for (const g of engine.guards) {
      this.drawGuard(ctx, g, time);
    }

    // 10. Player Prisoner
    if (!engine.player.hidingInId) {
      this.drawPlayer(ctx, engine);
    } else {
      // Subtle peeking indicator over hiding spot
      ctx.save();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.font = '600 11px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDDEN', engine.player.x, engine.player.y - 24);
      ctx.restore();
    }

    // 11. Smoke Clouds & Particles
    for (const s of engine.smokes) {
      const alpha = Math.min(0.82, s.timer / 2);
      const grad = ctx.createRadialGradient(s.x, s.y, 12, s.x, s.y, s.radius);
      grad.addColorStop(0, `rgba(203, 213, 225, ${alpha})`);
      grad.addColorStop(0.65, `rgba(148, 163, 184, ${alpha * 0.7})`);
      grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of engine.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }

    // 12. Security Cameras Hardware & Sweeping Searchlights
    for (const cam of engine.cameras) {
      this.drawCameraMount(ctx, cam);
    }

    for (const sl of engine.searchlights) {
      if (sl.permanentlyDisabled || sl.disabledTimer > 0) continue;
      ctx.save();
      const grad = ctx.createRadialGradient(sl.spotX, sl.spotY, 10, sl.spotX, sl.spotY, sl.beamRadius);
      grad.addColorStop(0, 'rgba(253, 224, 71, 0.34)');
      grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.14)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sl.spotX, sl.spotY, sl.beamRadius, 0, Math.PI * 2);
      ctx.fill();

      // Beam line from tower to pool
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.08)';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(sl.originX, sl.originY);
      ctx.lineTo(sl.spotX, sl.spotY);
      ctx.stroke();
      ctx.restore();
    }

    // 13. World-space Floating Texts & Nearest Interactable Tag
    if (nearest && !engine.player.hidingInId) {
      const ix = (nearest.tx + 0.5) * TILE_SIZE;
      const iy = nearest.ty * TILE_SIZE - 8;
      ctx.save();
      ctx.font = '600 11px "DM Sans", sans-serif';
      const label = `[E] ${nearest.label}`;
      const w = ctx.measureText(label).width + 14;
      ctx.fillStyle = 'rgba(11, 14, 20, 0.88)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, ix - w / 2, iy - 18, w, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FDE68A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, ix, iy - 8);
      ctx.restore();
    }

    for (const f of engine.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
      ctx.font = '700 12px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    ctx.restore();

    // 14. Dynamic Night / Lights-Out Ambient Darkness Overlay & Lockdown Strobe
    const { isNight } = engine.getScheduleInfo();
    const darknessAlpha = engine.powerDownTimer > 0 ? 0.56 : isNight ? 0.38 : 0.1;
    if (darknessAlpha > 0.12) {
      this.ensureLightCanvas(viewW, viewH);
      if (this.lightCtx && this.lightCanvas) {
        const lc = this.lightCtx;
        lc.clearRect(0, 0, viewW, viewH);
        lc.fillStyle = `rgba(6, 9, 15, ${darknessAlpha})`;
        lc.fillRect(0, 0, viewW, viewH);

        lc.globalCompositeOperation = 'destination-out';
        // Soft player visibility halo
        const px = engine.player.x - camLeft;
        const py = engine.player.y - camTop;
        const pGrad = lc.createRadialGradient(px, py, 20, px, py, 220);
        pGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
        pGrad.addColorStop(1, 'rgba(0,0,0,0)');
        lc.fillStyle = pGrad;
        lc.beginPath();
        lc.arc(px, py, 220, 0, Math.PI * 2);
        lc.fill();

        // Searchlights cut darkness
        for (const sl of engine.searchlights) {
          if (sl.disabledTimer > 0 || sl.permanentlyDisabled) continue;
          const sx = sl.spotX - camLeft;
          const sy = sl.spotY - camTop;
          const sGrad = lc.createRadialGradient(sx, sy, 10, sx, sy, sl.beamRadius);
          sGrad.addColorStop(0, 'rgba(0,0,0,0.9)');
          sGrad.addColorStop(1, 'rgba(0,0,0,0)');
          lc.fillStyle = sGrad;
          lc.beginPath();
          lc.arc(sx, sy, sl.beamRadius, 0, Math.PI * 2);
          lc.fill();
        }
        lc.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.lightCanvas, 0, 0);
      }
    }

    // Lockdown Red Perimeter Vignette
    if (engine.lockdownTimer > 0) {
      const pulse = 0.08 + 0.09 * Math.abs(Math.sin(time * 5));
      ctx.fillStyle = `rgba(220, 38, 38, ${pulse})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  private drawRaycastCone(
    ctx: CanvasRenderingContext2D,
    engine: PrisonBreakEngine,
    ox: number,
    oy: number,
    angle: number,
    halfFov: number,
    range: number,
    color: string
  ) {
    const rays = 26;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    for (let i = 0; i <= rays; i++) {
      const a = angle - halfFov + (i / rays) * halfFov * 2;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      let dist = range;
      for (let d = 12; d <= range; d += 12) {
        const px = ox + dx * d;
        const py = oy + dy * d;
        const tx = Math.floor(px / TILE_SIZE);
        const ty = Math.floor(py / TILE_SIZE);
        if (engine.isTileOpaque(tx, ty)) {
          dist = d;
          break;
        }
        let inSmoke = false;
        for (const s of engine.smokes) {
          if (Math.hypot(px - s.x, py - s.y) < s.radius * 0.78) {
            dist = d;
            inSmoke = true;
            break;
          }
        }
        if (inSmoke) break;
      }
      ctx.lineTo(ox + dx * dist, oy + dy * dist);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  private drawProp(ctx: CanvasRenderingContext2D, prop: PropDeco, time: number) {
    const x = prop.tx * TILE_SIZE;
    const y = prop.ty * TILE_SIZE;
    ctx.save();
    switch (prop.type) {
      case 'bunk': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x + 3, y + 3, 56, 30);
        ctx.fillStyle = '#475569';
        ctx.fillRect(x, y, 56, 28);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(x + 3, y + 3, 50, 22);
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(x + 18, y + 3, 35, 22);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(x + 4, y + 6, 11, 16);
        break;
      }
      case 'table': {
        const w = (prop.wTiles ?? 3) * TILE_SIZE;
        const h = (prop.hTiles ?? 1.2) * TILE_SIZE;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(x + 4, y + 4, w, h);
        ctx.fillStyle = '#64748B';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
        // Trays
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(x + 12, y + 10, 18, 12);
        ctx.fillRect(x + w - 34, y + h - 22, 18, 12);
        break;
      }
      case 'washer': {
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(x, y, 32, 32);
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'crate': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x + 4, y + 4, 34, 34);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(x, y, 34, 34);
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, 30, 30);
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 32, y + 32);
        ctx.stroke();
        break;
      }
      case 'generator': {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(x, y, 38, 34);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(x + 4, y + 4, 30, 8);
        ctx.fillStyle = Math.sin(time * 8) > 0 ? '#22D3EE' : '#0284C7';
        ctx.fillRect(x + 8, y + 18, 22, 10);
        break;
      }
      case 'server': {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(x, y, 34, 36);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(x + 6, y + 6, 8, 4);
        ctx.fillStyle = Math.sin(time * 6 + x) > 0 ? '#10B981' : '#334155';
        ctx.fillRect(x + 20, y + 6, 6, 4);
        break;
      }
      case 'watchtower': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x + 6, y + 6, 60, 60);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, 60, 60);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(x + 8, y + 8, 44, 44);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 8, y + 8, 44, 44);
        break;
      }
      case 'van': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x + 4, y + 6, 84, 42);
        ctx.fillStyle = '#E2E8F0';
        drawRoundedRect(ctx, x, y, 84, 40, 7);
        ctx.fill();
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(x + 56, y + 5, 20, 30);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(x + 4, y + 17, 46, 6);
        // Blinking hazard lights
        if (Math.sin(time * 6) > 0) {
          ctx.fillStyle = '#FBBF24';
          ctx.fillRect(x + 78, y + 4, 6, 8);
          ctx.fillRect(x + 78, y + 28, 6, 8);
        }
        break;
      }
      case 'boat': {
        const bob = Math.sin(time * 2.5) * 2.5;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x + 4, y + 4 + bob, 76, 36);
        ctx.fillStyle = '#F1F5F9';
        ctx.beginPath();
        ctx.moveTo(x, y + 8 + bob);
        ctx.lineTo(x + 58, y + 4 + bob);
        ctx.lineTo(x + 78, y + 18 + bob);
        ctx.lineTo(x + 58, y + 32 + bob);
        ctx.lineTo(x, y + 28 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(x + 22, y + 10 + bob, 26, 16);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(x + 8, y + 14 + bob, 10, 8);
        break;
      }
      case 'bush': {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.arc(x + 20, y + 22, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#14532D';
        ctx.beginPath();
        ctx.arc(x + 18, y + 18, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(x + 15, y + 15, 11, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
    ctx.restore();
  }

  private drawInteractable(
    ctx: CanvasRenderingContext2D,
    engine: PrisonBreakEngine,
    it: Interactable,
    highlight: boolean,
    time: number
  ) {
    const px = it.tx * TILE_SIZE;
    const py = it.ty * TILE_SIZE;
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    ctx.save();
    if (highlight) {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }

    switch (it.type) {
      case 'door_cell': {
        if (it.open) {
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(px + 2, py + 2, 7, TILE_SIZE - 4);
        } else {
          ctx.fillStyle = '#64748B';
          ctx.fillRect(px + 2, py + TILE_SIZE / 2 - 3, TILE_SIZE - 4, 6);
          ctx.fillStyle = it.locked ? '#EF4444' : '#34D399';
          ctx.fillRect(cx - 3, py + TILE_SIZE / 2 - 4, 6, 8);
        }
        break;
      }
      case 'door_keycard': {
        if (it.open) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 2, py + 2, 8, TILE_SIZE - 4);
        } else {
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 1, py + TILE_SIZE / 2 - 5, TILE_SIZE - 2, 10);
          ctx.fillStyle = it.locked ? '#EF4444' : '#10B981';
          ctx.fillRect(cx - 5, py + TILE_SIZE / 2 - 3, 10, 6);
        }
        break;
      }
      case 'desk':
      case 'toolbox':
      case 'med_cabinet':
      case 'locker':
      case 'laundry': {
        const bg =
          it.type === 'med_cabinet'
            ? '#F8FAFC'
            : it.type === 'toolbox'
              ? '#B91C1C'
              : it.type === 'laundry'
                ? '#475569'
                : '#52525B';
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px + 8, py + 8, TILE_SIZE - 12, TILE_SIZE - 12);
        ctx.fillStyle = bg;
        drawRoundedRect(ctx, px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12, 4);
        ctx.fill();
        if (it.type === 'med_cabinet') {
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(cx - 2, cy - 7, 4, 14);
          ctx.fillRect(cx - 7, cy - 2, 14, 4);
        } else if (!it.searched) {
          // Subtle loot shimmer
          ctx.fillStyle = `rgba(251, 191, 36, ${0.4 + 0.4 * Math.sin(time * 4)})`;
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE - 10, py + 10, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'vent': {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        ctx.strokeStyle = it.unscrewed ? '#34D399' : '#94A3B8';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        for (let y = py + 14; y < py + TILE_SIZE - 12; y += 6) {
          ctx.beginPath();
          ctx.moveTo(px + 11, y);
          ctx.lineTo(px + TILE_SIZE - 11, y);
          ctx.stroke();
        }
        break;
      }
      case 'fence_weak': {
        if (!it.cut) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.fillRect(px + 4, py + 8, TILE_SIZE - 8, TILE_SIZE - 16);
          ctx.strokeStyle = '#F59E0B';
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 6, py + 10, TILE_SIZE - 12, TILE_SIZE - 20);
        }
        break;
      }
      case 'power_box': {
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        ctx.fillStyle = engine.powerDownTimer > 0 ? '#64748B' : '#22D3EE';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'security_terminal': {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(px + 7, py + 8, TILE_SIZE - 14, TILE_SIZE - 16);
        ctx.fillStyle = it.disabled ? '#475569' : '#38BDF8';
        ctx.fillRect(px + 11, py + 12, TILE_SIZE - 22, 12);
        break;
      }
      case 'dig_spot': {
        const prog = it.digProgress ?? 0;
        ctx.fillStyle = prog >= 100 ? '#090D12' : '#573B26';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = prog >= 100 ? '#34D399' : '#92400E';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        break;
      }
      case 'safe': {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(px + 7, py + 7, TILE_SIZE - 14, TILE_SIZE - 14);
        ctx.strokeStyle = it.searched ? '#475569' : '#FBBF24';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 7, py + 7, TILE_SIZE - 14, TILE_SIZE - 14);
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'inmate': {
        // Friendly Inmate Sprite
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(cx + 2, cy + 3, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = it.isTrader ? '#D97706' : '#EA580C';
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDBA74';
        ctx.beginPath();
        ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
        ctx.fill();
        // Speech/Trade icon
        ctx.fillStyle = it.isTrader ? '#FBBF24' : '#38BDF8';
        ctx.font = '700 12px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(it.isTrader ? '$' : '?', cx, cy - 15);
        break;
      }
      case 'escape_zone': {
        const pulse = 0.55 + 0.35 * Math.sin(time * 4);
        ctx.strokeStyle = `rgba(16, 185, 129, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.font = '700 11px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESCAPE', cx, cy - 28);
        break;
      }
    }
    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, engine: PrisonBreakEngine) {
    const p = engine.player;
    const disguised = p.disguiseTimer > 0;
    const scale = p.crouching ? 0.86 : 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.inVentFade > 0) ctx.globalAlpha = 0.45;
    ctx.scale(scale, scale);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(p.angle);

    // Animated Arms/Feet stride
    const swing = Math.sin(p.walkPhase) * 4;
    ctx.fillStyle = disguised ? '#1E3A8A' : '#C2410C';
    ctx.beginPath();
    ctx.arc(4 + swing, -9, 4.5, 0, Math.PI * 2);
    ctx.arc(4 - swing, 9, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Torso (Orange Jumpsuit or Guard Disguise Blue)
    ctx.fillStyle = disguised ? '#1D4ED8' : '#F97316';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Head / Cap
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(2, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    if (disguised) {
      ctx.fillStyle = '#1E3A8A';
      ctx.beginPath();
      ctx.arc(1, 0, 7, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.fill();
    } else {
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(-1, 0, 6.5, Math.PI * 0.55, Math.PI * 1.45);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawGuard(ctx: CanvasRenderingContext2D, g: PrisonBreakEngine['guards'][number], time: number) {
    ctx.save();
    ctx.translate(g.x, g.y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(g.angle);

    if (g.role === 'k9') {
      // K9 Patrol Dog
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.ellipse(9, 0, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(5, -5, 3, 10);
    } else {
      const swing = Math.sin(g.walkPhase) * 4;
      const bodyColor =
        g.role === 'warden' ? '#0F172A' : g.role === 'riot' ? '#334155' : '#1E40AF';
      const capColor =
        g.role === 'warden' ? '#F59E0B' : g.role === 'riot' ? '#475569' : '#1E3A8A';

      // Arms + Flashlight
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(4 + swing, -9, 4.5, 0, Math.PI * 2);
      ctx.arc(6 - swing, 9, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(8 - swing, 7, 6, 3);

      // Torso
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10.5, 12.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090D12';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Peaked Guard Cap / Riot Helmet
      ctx.fillStyle = capColor;
      ctx.beginPath();
      ctx.arc(1, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(5, -5, 4, 10);
    }
    ctx.restore();

    // Suspicion / Alert Overhead Indicator
    if (g.state === 'alerted' || g.state === 'suspicious' || g.suspicion > 15) {
      const col = g.state === 'alerted' ? '#EF4444' : '#F59E0B';
      const sym = g.state === 'alerted' ? '!' : '?';
      const bounce = g.state === 'alerted' ? Math.abs(Math.sin(time * 8)) * 4 : 0;
      ctx.fillStyle = col;
      ctx.font = '700 15px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sym, 0, -18 - bounce);

      // Small suspicion bar
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(-14, -15, 28, 4);
      ctx.fillStyle = col;
      ctx.fillRect(-14, -15, 28 * Math.min(1, g.suspicion / 100), 4);
    }

    ctx.restore();
  }

  private drawCameraMount(ctx: CanvasRenderingContext2D, cam: PrisonBreakEngine['cameras'][number]) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-6, -5, 14, 10);
    ctx.fillStyle = cam.permanentlyDisabled || cam.disabledTimer > 0 ? '#475569' : '#38BDF8';
    ctx.beginPath();
    ctx.arc(8, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderMinimap(ctx: CanvasRenderingContext2D, engine: PrisonBreakEngine, w: number, h: number) {
    if (w <= 0 || h <= 0) return;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090C11';
    ctx.fillRect(0, 0, w, h);

    const sx = w / engine.level.width;
    const sy = h / engine.level.height;

    for (let ty = 0; ty < engine.level.height; ty++) {
      for (let tx = 0; tx < engine.level.width; tx++) {
        const t = engine.tiles[ty][tx];
        if (t === 'void') continue;
        if (t === 'wall') ctx.fillStyle = '#475569';
        else if (t === 'bars') ctx.fillStyle = '#64748B';
        else if (t === 'fence' || t === 'electric_fence') {
          ctx.fillStyle = t === 'electric_fence' && engine.powerDownTimer <= 0 ? '#38BDF8' : '#94A3B8';
        } else if (t === 'water') ctx.fillStyle = '#0C2D48';
        else if (t === 'yard_grass') ctx.fillStyle = '#192E22';
        else if (t === 'asphalt') ctx.fillStyle = '#1A1F28';
        else ctx.fillStyle = '#202632';
        ctx.fillRect(tx * sx, ty * sy, Math.ceil(sx), Math.ceil(sy));
      }
    }

    // Escape Zones (Emerald)
    for (const it of engine.interactables) {
      if (it.type === 'escape_zone') {
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc((it.tx + 0.5) * sx, (it.ty + 0.5) * sy, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.type === 'power_box' || it.type === 'security_terminal') {
        ctx.fillStyle = '#22D3EE';
        ctx.fillRect(it.tx * sx, it.ty * sy, 3, 3);
      }
    }

    // Discovered Intel Pins (Amber Stars/Squares)
    for (const intel of engine.discoveredIntel) {
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc((intel.tx + 0.5) * sx, (intel.ty + 0.5) * sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Guards (Red dots)
    for (const g of engine.guards) {
      ctx.fillStyle = g.state === 'alerted' ? '#EF4444' : '#F87171';
      ctx.beginPath();
      ctx.arc((g.x / TILE_SIZE) * sx, (g.y / TILE_SIZE) * sy, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player (Bright Orange/White Dot)
    ctx.fillStyle = '#F97316';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc((engine.player.x / TILE_SIZE) * sx, (engine.player.y / TILE_SIZE) * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
