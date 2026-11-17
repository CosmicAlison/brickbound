import levelsData from '../levels.json' with { type: 'json' };
import { worldOneLevel, bossPhase } from './world1.js';

const $ = (q, parent = document) => parent.querySelector(q);
const view = $('#view');
const A = (group, name) => `/assets/${group}/${name}.webp`;
const WORLDS = levelsData.worlds;
const LEVELS = levelsData.levels;
const UPGRADES = levelsData.run_upgrades;

const WORLD_ART = {
  W1: 'woods',
  W2: 'quarry',
  W3: 'astral',
  W4: 'frost',
  W5: 'quarry',
  W6: 'astral'
};

const WORLD_COPY = {
  bloom: 'Explosive growth and soft introductions to chain reactions.',
  heat: 'Harder bricks, higher pressure, and explosive lanes.',
  rebuild: 'Undead fortifications that repair, curse, and reflect.',
  freeze: 'Sharp ricochets, crystal shatters, and frozen enemy turns.',
  shift: 'Mechanical pressure, armored blocks, and board movement.',
  teleport: 'Portal routes, cursed geometry, and late-game chaos.'
};

const ENEMY_SPRITE = {
  sporeling: 'spore',
  thicket_guardian: 'guardian',
  ember_imp: 'wisp',
  forge_guard: 'guardian',
  bone_archer: 'skeleton',
  crypt_mender: 'skeleton',
  frost_wisp: 'wisp',
  ice_guardian: 'guardian',
  clockwork_drone: 'bat',
  iron_sentinel: 'guardian',
  void_sprite: 'wisp',
  rift_keeper: 'bat'
};

const WORLD_BOSS_ASSET = {
  W1: 'spore_queen',
  W2: 'clockwork_dragon',
  W3: 'bone_king',
  W4: 'crystal_titan',
  W5: 'clockwork_dragon',
  W6: 'spore_queen'
};

const TEACH_COPY = {
  drag_to_aim: 'Aim with a drag gesture and release to launch your volley.',
  wall_bounce: 'Bank shots are safer and more powerful than direct lines.',
  break_explosive: 'Explosive blocks reward smart chain setups.',
  armor_bricks: 'Armored bricks need repeated hits or chain damage.',
  elite_intent: 'Watch enemy intent. Good timing prevents heavy damage.',
  boss_intro: 'Boss rooms ask for clean geometry and patience.'
};

const DEFAULT_STATE = {
  stage: 1,
  highest: 1,
  gold: 0,
  gems: 0,
  xp: 0,
  hero: 'pyromancer',
  upgrades: [],
  cleared: [],
  seenTutorial: false,
  lastDaily: null,
  roomClears: 0,
  permanentBoosts: {
    power: 0,
    volley: 0,
    vitality: 0
  },
  gear: {
    wand: 1,
    mantle: 1,
    orb: 1
  }
};

const DEFAULT_SETTINGS = {
  sound: true,
  reducedMotion: false
};

let state = { ...DEFAULT_STATE };
let settings = { ...DEFAULT_SETTINGS };
let engine = null;
let toastTimer = null;

try {
  Object.assign(state, JSON.parse(localStorage.getItem('brickbound-save-v2')) || {});
} catch {}

state.permanentBoosts = { ...DEFAULT_STATE.permanentBoosts, ...(state.permanentBoosts || {}) };
state.gear = { ...DEFAULT_STATE.gear, ...(state.gear || {}) };
state.upgrades = Array.isArray(state.upgrades) ? state.upgrades : [];
state.cleared = Array.isArray(state.cleared) ? state.cleared : [];

try {
  Object.assign(settings, JSON.parse(localStorage.getItem('brickbound-settings-v2')) || {});
} catch {}

function persist() {
  try {
    localStorage.setItem('brickbound-save-v2', JSON.stringify(state));
  } catch {}
  syncHud();
}

function persistSettings() {
  try {
    localStorage.setItem('brickbound-settings-v2', JSON.stringify(settings));
  } catch {}
}

function syncHud() {
  $('#hud-gold').textContent = fmt(state.gold);
  $('#hud-gems').textContent = fmt(state.gems);
}

const fmt = (n) => Math.floor(n || 0).toLocaleString();
const level = (n) => LEVELS[n - 1];
const worldOfStage = (n) => WORLDS[Math.floor((n - 1) / 10)];
const worldIndex = (worldId) => WORLDS.findIndex((w) => w.id === worldId);
const worldAsset = (worldId) => WORLD_ART[worldId] || 'woods';
const img = (group, name, cls = '', style = '') => `<img loading="lazy" class="${cls}" src="${A(group, name)}" style="${style}" alt=""/>`;
const screen = (html, bg = null) => {
  view.innerHTML = `<article class="screen ${bg ? 'with-bg' : ''}" ${bg ? `style="background-image:url('${A('arenas', bg)}')"` : ''}>${html}</article>`;
};
const card = (title, body, cls = '') => `<section class="card ${cls}"><h3>${title}</h3>${body}</section>`;
const button = (label, action, cls = '') => `<button class="button ${cls}" data-action="${action}">${label}</button>`;

function playerLevel() {
  return Math.floor(state.xp / 100) + 1;
}

function countUpgrade(id) {
  return state.upgrades.filter((u) => u === id).length;
}

function hasUpgrade(id) {
  return countUpgrade(id) > 0;
}

function availableUpgrades() {
  return UPGRADES.filter((u) => countUpgrade(u.id) < (u.stack_limit ?? 1));
}

function weightedUpgradePicks(count = 3) {
  const pool = availableUpgrades();
  const picks = [];
  const bag = [...pool];
  while (bag.length && picks.length < count) {
    const total = bag.reduce((sum, item) => sum + (item.weight || 10), 0);
    let roll = Math.random() * total;
    let chosen = bag[0];
    for (const item of bag) {
      roll -= item.weight || 10;
      if (roll <= 0) {
        chosen = item;
        break;
      }
    }
    picks.push(chosen);
    bag.splice(bag.indexOf(chosen), 1);
  }
  return picks;
}

function toast(text) {
  $('.toast')?.remove();
  view.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${text}</div>`);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('.toast')?.remove(), 1800);
}

function stop() {
  if (engine) {
    engine.dispose();
    engine = null;
  }
}

function resetRun() {
  state.upgrades = [];
  persist();
}

function progressForWorld(index) {
  const start = index * 10 + 1;
  const end = start + 9;
  return state.cleared.filter((n) => n >= start && n <= end).length;
}

function home() {
  stop();
  const nextLevel = level(Math.min(state.highest, 60));
  const currentWorld = worldOfStage(Math.min(state.highest, 60));
  const totalClear = state.cleared.length;
  screen(`
    <div class="hero-home-grid">
      <section class="hero-banner">
        <div>
          <div class="eyebrow">AIM · BREAK · ASCEND</div>
          <h1 class="hero-title">Brickbound <span>Dungeon Volley</span></h1>
          <p class="helper">A browser-first fantasy brick-breaker RPG built for quick sessions and one-more-run energy. Launch a volley, break enchanted defenses, and outplay the dungeon’s intent.</p>
          <div class="hero-actions">
            ${button(state.highest > 1 ? `Continue ${nextLevel.id}` : 'Start Adventure', 'continue-stage')}
            ${button('Choose World', 'map', 'secondary')}
          </div>
          <div class="inline-meta">
            <span>Next encounter: <b>${nextLevel.id}</b></span>
            <span>World: <b>${currentWorld.name}</b></span>
            <span>Hero level: <b>${playerLevel()}</b></span>
          </div>
        </div>
        ${img('hero/pyromancer', 'idle', 'hero-illustration')}
      </section>

      <section class="dashboard-grid">
        ${card('Adventure Status', `
          <div class="stat-list">
            <div><span>Stages cleared</span><strong>${totalClear}/60</strong></div>
            <div><span>Current chapter</span><strong>${Math.min(6, Math.ceil(state.highest / 10))}</strong></div>
            <div><span>Active relics</span><strong>${state.upgrades.length}</strong></div>
          </div>
        `)}
        ${card('Next Objective', `
          <p class="helper compact">Push through <b>${currentWorld.name}</b>. ${WORLD_COPY[currentWorld.mechanic] || 'Master the geometry of the room and protect your health.'}</p>
          <div class="mini-progress"><span style="width:${progressForWorld(worldIndex(currentWorld.id)) * 10}%"></span></div>
          <div class="small">World progress: ${progressForWorld(worldIndex(currentWorld.id))}/10</div>
        `)}
        ${card('Quick Tips', `
          <ul class="tips-list">
            <li>Use wall bounces to reach protected lanes.</li>
            <li>Enemy intent resolves after your volley ends.</li>
            <li>Relic rooms and boss rooms reshape your whole run.</li>
          </ul>
        `)}
      </section>
    </div>
  `, worldAsset(currentWorld.id));
}

function map() {
  stop();
  const cards = WORLDS.map((world, index) => {
    const unlocked = state.highest > index * 10;
    const progress = progressForWorld(index);
    return `
      <button class="world-card ${unlocked ? '' : 'locked'}" data-world="${index}" ${unlocked ? '' : 'disabled'} style="background-image:url('${A('arenas', worldAsset(world.id))}')">
        <span class="eyebrow">World ${index + 1}</span>
        <strong>${world.name}</strong>
        <span class="world-tag">Mechanic: ${world.mechanic}</span>
        <p>${WORLD_COPY[world.mechanic] || ''}</p>
        <div class="mini-progress"><span style="width:${progress * 10}%"></span></div>
        <span class="small">${progress}/10 cleared · Boss: ${world.boss}</span>
      </button>
    `;
  }).join('');

  screen(`
    <div class="section-head">
      <div>
        <div class="eyebrow">Campaign</div>
        <h1>Choose a World</h1>
        <p class="helper compact">Six themed regions, each teaching a new layer of brick geometry and enemy pressure.</p>
      </div>
      ${button('Resume', 'continue-stage')}
    </div>
    <div class="world-list">${cards}</div>
  `);
}

function stageSelect(index) {
  stop();
  const world = WORLDS[index];
  const stages = Array.from({ length: 10 }, (_, i) => {
    const n = index * 10 + i + 1;
    const unlocked = n <= state.highest;
    const cleared = state.cleared.includes(n);
    const lv = level(n);
    return `
      <button class="stage-tile ${cleared ? 'cleared' : ''} ${n % 10 === 0 ? 'boss' : ''} ${n === state.highest ? 'available' : ''}" data-stage="${n}" ${unlocked ? '' : 'disabled'}>
        <span class="stage-number">${lv.id}</span>
        <span class="stage-lesson">${TEACH_COPY[lv.teaches] || lv.teaches.replaceAll('_', ' ')}</span>
      </button>
    `;
  }).join('');

  screen(`
    <div class="section-head">
      <div>
        <div class="eyebrow">${world.id}</div>
        <h1>${world.name}</h1>
        <p class="helper compact">${WORLD_COPY[world.mechanic] || ''}</p>
      </div>
      ${button('All Worlds', 'map', 'secondary')}
    </div>
    <div class="detail-layout">
      <section class="card stage-board">
        <h3>Stage Route</h3>
        <div class="stage-grid">${stages}</div>
      </section>
      ${card('World Overview', `
        <div class="meta-stack">
          <div><span>Common enemy</span><strong>${world.common_enemy}</strong></div>
          <div><span>Elite enemy</span><strong>${world.elite_enemy}</strong></div>
          <div><span>Boss</span><strong>${world.boss}</strong></div>
          <div><span>Core mechanic</span><strong>${world.mechanic}</strong></div>
        </div>
      `)}
    </div>
  `, worldAsset(world.id));
}

function stageBrief(stageNumber) {
  stop();
  state.stage = stageNumber;
  persist();
  const lv = level(stageNumber);
  const world = worldOfStage(stageNumber);
  const rewards = lv.reward;
  screen(`
    <div class="section-head">
      <div>
        <div class="eyebrow">Mission Brief</div>
        <h1>${lv.id} · ${lv.theme}</h1>
        <p class="helper compact">${TEACH_COPY[lv.teaches] || 'Fight through the room and survive the enemy retaliation.'}</p>
      </div>
      ${button('Back', `world-${worldIndex(world.id)}`, 'secondary')}
    </div>
    <div class="detail-layout">
      ${card('Encounter', `
        <div class="meta-stack">
          <div><span>Pattern</span><strong>${lv.layout.pattern.replaceAll('_', ' ')}</strong></div>
          <div><span>Soft turn target</span><strong>${lv.turn_limit_soft} turns</strong></div>
          <div><span>Target clear time</span><strong>${lv.target_completion_seconds}s</strong></div>
          <div><span>Win condition</span><strong>${lv.win_condition.replaceAll('_', ' ')}</strong></div>
        </div>
      `)}
      ${card('Rewards', `
        <div class="meta-stack">
          <div><span>Gold</span><strong>+${rewards.gold}</strong></div>
          <div><span>XP</span><strong>+${rewards.xp}</strong></div>
          <div><span>Relic choice</span><strong>${rewards.relic_choice ? 'Yes' : 'No'}</strong></div>
          <div><span>Treasure chest</span><strong>${rewards.chest ? 'Yes' : 'No'}</strong></div>
        </div>
        <div class="button-row stage-brief-actions">
          ${button('Enter Combat', 'play')}
          ${button('Hero & Gear', 'heroes', 'secondary')}
        </div>
      `)}
    </div>
  `, worldAsset(world.id));
}

function heroes() {
  stop();
  const relics = state.upgrades.length
    ? state.upgrades.map((id) => UPGRADES.find((u) => u.id === id)?.name || id)
    : ['No active relics yet'];
  screen(`
    <div class="section-head">
      <div>
        <div class="eyebrow">Hero Profile</div>
        <h1>Pyromancer</h1>
        <p class="helper compact">A precise caster built around angle mastery, controlled chaos, and chain-breaking pressure.</p>
      </div>
      ${button('Resume Campaign', 'continue-stage')}
    </div>
    <div class="detail-layout hero-layout">
      <section class="card hero-panel">
        ${img('hero/pyromancer', 'idle', 'hero-portrait-large')}
        <div>
          <div class="eyebrow">Loadout</div>
          <div class="meta-stack">
            <div><span>Hero level</span><strong>${playerLevel()}</strong></div>
            <div><span>XP to next</span><strong>${100 - (state.xp % 100)}</strong></div>
            <div><span>Starter volley</span><strong>${8 + state.permanentBoosts.volley}</strong></div>
            <div><span>Base power</span><strong>${1 + state.permanentBoosts.power}</strong></div>
            <div><span>Vitality</span><strong>${12 + state.permanentBoosts.vitality}</strong></div>
          </div>
          <div class="stat-bar"><span style="width:${state.xp % 100}%"></span></div>
        </div>
      </section>
      ${card('Gear', `
        <div class="meta-stack">
          <div><span>Ember Wand</span><strong>Tier ${state.gear.wand}</strong></div>
          <div><span>Traveler Mantle</span><strong>Tier ${state.gear.mantle}</strong></div>
          <div><span>Spell Orb</span><strong>Tier ${state.gear.orb}</strong></div>
        </div>
      `)}
      ${card('Active Relics', `<div class="chip-wrap">${relics.map((r) => `<span class="chip">${r}</span>`).join('')}</div>`) }
    </div>
  `, 'woods');
}

function shop() {
  stop();
  screen(`
    <div class="section-head">
      <div>
        <div class="eyebrow">The Forge</div>
        <h1>Upgrade Camp</h1>
        <p class="helper compact">Permanent upgrades strengthen your baseline kit. Relics stay focused on the current run style.</p>
      </div>
      ${button('Back Home', 'home', 'secondary')}
    </div>
    <div class="dashboard-grid three-col">
      ${card('Sharpened Focus', `<p class="helper compact">+1 base power permanently.</p><div class="meta-price">Cost: <b>120 gold</b></div>${button('Upgrade Power', 'buy-power')}`)}
      ${card('Larger Volley', `<p class="helper compact">+1 starting ball permanently.</p><div class="meta-price">Cost: <b>150 gold</b></div>${button('Upgrade Volley', 'buy-volley')}`)}
      ${card('Rune Vitality', `<p class="helper compact">+1 max HP permanently.</p><div class="meta-price">Cost: <b>180 gold</b></div>${button('Upgrade Vitality', 'buy-vitality')}`)}
      ${card('Daily Supply Chest', `<p class="helper compact">A free stash for returning adventurers.</p>${button('Claim Daily Chest', 'daily', 'reward')}`)}
      ${card('Fresh Run', `<p class="helper compact">Clear temporary relics and begin a cleaner build path.</p>${button('Reset Current Relics', 'reset-run', 'secondary')}`)}
      ${card('Design Goal', `<p class="small">No energy gates, no required ads, no account wall. Just a short-session RPG loop with clearer progression.</p>`)}
    </div>
  `, 'quarry');
}

function settingsView() {
  stop();
  screen(`
    <div class="section-head">
      <div>
        <div class="eyebrow">Options</div>
        <h1>Settings</h1>
      </div>
      ${button('Back Home', 'home', 'secondary')}
    </div>
    ${card('Preferences', `
      <div class="settings-grid">
        <label class="setting">Sound <input type="checkbox" id="sound" ${settings.sound ? 'checked' : ''}></label>
        <label class="setting">Reduced motion <input type="checkbox" id="motion" ${settings.reducedMotion ? 'checked' : ''}></label>
        <p class="settings-help">Progress saves locally in this browser. No personal account is required.</p>
        <div class="button-row">${button('Reset Save', 'reset', 'secondary')}</div>
      </div>
    `)}
  `);
}

function chooseUpgrade() {
  stop();
  const picks = weightedUpgradePicks(hasUpgrade('lucky') ? 4 : 3);
  screen(`
    <div class="upgrades-panel">
      <div class="eyebrow">Relic Choice</div>
      <h1>Choose Your Upgrade</h1>
      <p class="helper compact">Build identity matters. Pick damage, control, survivability, or chain potential.</p>
      <div class="cards ${picks.length === 4 ? 'four' : ''}">
        ${picks.map((u) => `
          <button class="upgrade-card" data-upgrade="${u.id}">
            <span class="tier-badge">Tier ${u.tier}</span>
            <strong>${u.name}</strong>
            <span class="small">${u.effect.replaceAll('_', ' ')}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `, 'astral');
}

function victory() {
  stop();
  const lv = level(state.stage);
  let bonusGold = state.cleared.includes(state.stage) ? Math.floor(lv.reward.gold * 0.4) : lv.reward.gold;
  let bonusXp = lv.reward.xp;
  let message = state.stage % 10 === 0 ? 'World boss defeated. The next region is now open.' : 'The path forward is clear.';

  if (!state.cleared.includes(state.stage)) state.cleared.push(state.stage);
  state.gold += bonusGold + (lv.reward.chest ? 25 : 0);
  state.xp += bonusXp;
  state.highest = Math.min(60, Math.max(state.highest, state.stage + 1));
  state.roomClears += 1;

  if (hasUpgrade('recovery') && state.roomClears % 3 === 0) {
    message += ' Second Wind restores health in your next room.';
  }
  if (lv.reward.chest) message += ' Treasure chest bonus collected.';
  persist();

  screen(`
    <div class="reward-wrap">
      <div class="eyebrow">Encounter Complete</div>
      <h1>Victory</h1>
      ${img('hero/pyromancer', 'victory', 'reward-hero')}
      <div class="reward-numbers">
        <span>◉ +${bonusGold + (lv.reward.chest ? 25 : 0)}</span>
        <span>✧ +${bonusXp} XP</span>
      </div>
      <p class="helper compact">${message}</p>
      <div class="button-row center">
        ${button(lv.reward.relic_choice ? 'Choose Relic' : 'Next Stage', 'next')}
        ${button('World Map', 'map', 'secondary')}
      </div>
    </div>
  `, worldAsset(lv.world_id));
}

function defeat() {
  stop();
  const lv = level(state.stage);
  screen(`
    <div class="reward-wrap">
      <div class="eyebrow">Retreat</div>
      <h1>Defeat</h1>
      ${img('hero/pyromancer', 'hurt', 'reward-hero')}
      <p class="helper compact">Study the board, protect your HP, and make enemy intent work for you instead of against you.</p>
      <div class="button-row center">
        ${button('Retry Stage', 'retry')}
        ${button('Hero & Gear', 'heroes', 'secondary')}
        ${button('World Map', 'map', 'secondary')}
      </div>
      <p class="small">No forced revive. No progress reset.</p>
    </div>
  `, worldAsset(lv.world_id));
}

function nextAfterWin() {
  const lv = level(state.stage);
  if (lv.reward.relic_choice) chooseUpgrade();
  else {
    state.stage = Math.min(60, state.highest);
    persist();
    combat();
  }
}

function combat() {
  stop();
  const lv = level(state.stage);
  const world = worldOfStage(state.stage);
  const authored = world.id === 'W1' ? worldOneLevel(lv.stage_index) : null;
  const isBoss = lv.kind === 'boss' || state.stage % 10 === 0;
  view.innerHTML = `
    <article class="screen combat-screen">
      <div class="combat-header">
        <div>
          <strong>${lv.id}${isBoss ? ' · BOSS' : ''}</strong>
          <div class="small combat-subtitle">${world.name} · ${lv.layout.pattern.replaceAll('_', ' ')}</div>
        </div>
        <div class="combat-head-actions">
          <div class="combat-pill">HP <b id="hp">0</b></div>
          <div class="combat-pill">Balls <b id="volley-count">0</b></div>
          <button class="icon-button" id="pause" aria-label="Pause">Ⅱ</button>
        </div>
      </div>
      <div class="combat-center">
        <div class="combat-back" style="background-image:url('${A('arenas', worldAsset(world.id))}')"></div>
        <div class="battle-frame">
          <canvas id="battle" width="420" height="610" aria-label="Combat board. Drag to aim and release to launch."></canvas>
          <div class="combat-overlay-top">
            <div class="intent-card"><span class="eyebrow">Enemy Intent</span><strong id="intent-label">Reading room…</strong></div>
            <div class="mission-card"><span class="eyebrow">Lesson</span><strong>${authored?.lesson || TEACH_COPY[lv.teaches] || 'Defeat all enemies.'}</strong></div>
          </div>
          ${isBoss && world.id === 'W1' ? '<div class="boss-indicator" id="boss-indicator">ROOTHEART · PHASE 1 / 3 · ROOT SHIELD ACTIVE</div>' : ''}
          <div class="hint" id="combat-hint">Drag to aim · Release to launch</div>
          <div class="combat-bottom">
            <button id="fast-forward" class="button secondary" style="display:none">Fast Forward</button>
          </div>
        </div>
      </div>
    </article>
  `;
  engine = new Battle(lv, world, isBoss);
  engine.start();
  $('#pause').onclick = () => {
    if (!engine) return;
    engine.paused = true;
    view.insertAdjacentHTML('beforeend', `
      <div class="modal-shroud" id="pause-modal">
        <div class="card modal-card">
          <h3>Paused</h3>
          <p class="helper compact">Take a breath. Your aim and build are preserved.</p>
          <div class="button-row center">
            ${button('Resume', 'resume')}
            ${button('Retry', 'retry', 'secondary')}
            ${button('World Map', 'map', 'secondary')}
          </div>
        </div>
      </div>
    `);
  };
  $('#fast-forward').onclick = () => {
    if (!engine) return;
    engine.speedFactor = 2.3;
    toast('Fast-forward enabled');
  };
}

class Battle {
  constructor(lv, world, isBoss) {
    this.lv = lv;
    this.world = world;
    this.authored = world.id === 'W1' ? worldOneLevel(lv.stage_index) : null;
    this.rootheart = world.id === 'W1' && isBoss;
    this.phase = 1;
    this.winScheduled = false;
    this.loseScheduled = false;
    this.isBoss = isBoss;
    this.canvas = $('#battle');
    this.ctx = this.canvas.getContext('2d');
    this.W = 420;
    this.H = 610;
    this.blocks = [];
    this.enemies = [];
    this.balls = [];
    this.effects = [];
    this.turn = 1;
    this.maxHp = 12 + state.permanentBoosts.vitality;
    this.hp = this.maxHp;
    this.shield = Math.floor(countUpgrade('armor') / 2);
    this.angle = -Math.PI / 2;
    this.launchX = 210;
    this.aiming = false;
    this.active = false;
    this.paused = false;
    this.disposed = false;
    this.speedFactor = 1;
    this.volleyTime = 0;
    this.shotsSent = 0;
    this.shotClock = 0;
    this.firstLanding = null;
    this.last = 0;
    this.portalCooldown = new WeakMap();
    this.direction = 1;
    this.hitCounter = 0;
    this.breakCounter = 0;
    this.enemyIntent = null;
    this.activeHitCooldown = new WeakMap();
    this.usedFreeze = false;
    this.usedPhoenix = 0;
    this.healsThisRoom = 0;
    this.totalBalls = 8 + state.permanentBoosts.volley + Math.min(12, countUpgrade('multi_ball') * 2);
    this.baseDamage = 1 + state.permanentBoosts.power + countUpgrade('extra_power');
    this.previewSegments = 18 + (hasUpgrade('focus') ? 8 : 0);
    this.setup();
  }

  setup() {
    $('#hp').textContent = this.hp;
    $('#volley-count').textContent = this.totalBalls;
    this.generateBlocks();
    this.generateEnemies();
    this.enemyIntent = this.rollIntent();
    this.updateIntentLabel();
    this.attach();
  }

  attach() {
    this.down = (e) => {
      if (this.paused || this.active) return;
      this.aiming = true;
      this.updateAim(e);
    };
    this.move = (e) => {
      if (this.aiming) this.updateAim(e);
    };
    this.up = () => {
      if (!this.aiming) return;
      this.aiming = false;
      this.fire();
    };
    this.canvas.addEventListener('pointerdown', this.down);
    this.canvas.addEventListener('pointermove', this.move);
    window.addEventListener('pointerup', this.up);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.canvas?.removeEventListener('pointerdown', this.down);
    this.canvas?.removeEventListener('pointermove', this.move);
    window.removeEventListener('pointerup', this.up);
  }

  updateAim(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * this.W;
    const py = ((e.clientY - rect.top) / rect.height) * this.H;
    const dx = px - this.launchX;
    const dy = py - 560;
    this.angle = Math.atan2(dy, dx);
    this.angle = Math.min(-0.18, Math.max(-Math.PI + 0.18, this.angle));
  }

  getBallElement() {
    if (hasUpgrade('frost') || this.world.id === 'W4') return 'ice';
    if (hasUpgrade('shock') || this.world.id === 'W6') return 'arcane';
    if (this.world.id === 'W2') return 'fire';
    return 'neutral';
  }

  fire() {
    if (this.active) return;
    this.active = true;
    this.shotsSent = 0;
    this.shotClock = 0;
    this.volleyTime = 0;
    this.firstLanding = null;
    this.speedFactor = 1;
    $('#combat-hint')?.remove();
  }

  createBall(x, y, angle = this.angle, speed = 540) {
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 6,
      life: 0,
      hits: 0,
      wallBounces: 0,
      element: this.getBallElement(),
      pierced: false,
      prismDone: false
    };
  }

  generateBlocks() {
    if (this.authored) {
      this.blocks = this.authored.blocks.map(([c, r, kind, hp], index) => ({
        id:index + 1, c, r, x:24 + c * 62, y:140 + r * 40, w:56, h:34,
        kind, hp, maxHp:hp, burning:false
      }));
      return;
    }
    const cols = this.lv.layout.columns || 6;
    const rows = this.lv.layout.rows || 5;
    const brickW = 56;
    const brickH = 34;
    const gapX = 6;
    const gapY = 6;
    const startX = 24;
    const startY = 140;
    const random = mulberry32(this.lv.layout.generation_seed || (1000 + state.stage));
    const pool = this.lv.layout.brick_pool || ['stone'];
    let idCounter = 0;
    const slots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) slots.push([c, r]);
    }
    const include = new Set();
    const put = (c, r) => {
      if (c < 0 || c >= cols || r < 0 || r >= rows) return;
      include.add(`${c}-${r}`);
    };

    switch (this.lv.layout.pattern) {
      case 'staggered_wall':
        for (let r = 0; r < rows - 1; r++) for (let c = (r % 2); c < cols; c += 2) put(c, r);
        break;
      case 'split_towers':
        for (let r = 0; r < rows; r++) { put(1, r); put(4, r); }
        break;
      case 'funnel':
        [[0,0],[5,0],[1,1],[4,1],[2,2],[3,2],[2,3],[3,3],[1,4],[4,4]].forEach(([c,r])=>put(c,r));
        break;
      case 'open_corridor':
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (c !== 2 && c !== 3) put(c, r);
        break;
      case 'protected_core':
        [[1,0],[2,0],[3,0],[4,0],[1,1],[4,1],[0,2],[5,2],[1,3],[4,3],[2,4],[3,4]].forEach(([c,r])=>put(c,r));
        break;
      case 'side_pockets':
        [[0,0],[1,0],[4,0],[5,0],[0,1],[5,1],[1,2],[4,2],[0,3],[5,3],[0,4],[1,4],[4,4],[5,4]].forEach(([c,r])=>put(c,r));
        break;
      case 'weak_point':
        for (let r = 0; r < rows; r++) for (let c = 1; c < 5; c++) put(c, r);
        include.delete('2-2');
        include.delete('3-2');
        break;
      case 'crossfire':
        for (let c = 0; c < cols; c++) put(c, 2);
        for (let r = 0; r < rows; r++) put(2, r), put(3, r);
        break;
      case 'zigzag':
        [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[4,3],[4,4],[5,4],[0,2],[5,2]].forEach(([c,r])=>put(c,r));
        break;
      default:
        break;
    }

    while (include.size < (this.lv.layout.blocker_count || 4) + 6) {
      const [c, r] = slots[Math.floor(random() * slots.length)];
      include.add(`${c}-${r}`);
    }

    for (const key of include) {
      const [c, r] = key.split('-').map(Number);
      const kind = pool[Math.floor(random() * pool.length)];
      const baseHp = ({ stone: 2, cracked: 1, explosive: 1, metal: 4, lava: 2, bone: 2, cursed: 2, mirror: 2, ice: 2, crystal: 2, conveyor: 3, portal: 2 }[kind] || 2) + (this.lv.layout.brick_hp_bonus || 0);
      this.blocks.push({
        id: ++idCounter,
        c,
        r,
        x: startX + c * (brickW + gapX),
        y: startY + r * (brickH + gapY),
        w: brickW,
        h: brickH,
        kind,
        hp: baseHp,
        maxHp: baseHp,
        burning: false,
        portalIndex: kind === 'portal' ? this.blocks.filter((b) => b.kind === 'portal').length : null
      });
    }
  }

  generateEnemies() {
    const defs = this.lv.enemies?.length ? this.lv.enemies : [{ id: this.world.common_enemy, count: 1, hp_multiplier: 1 }];
    const total = defs.reduce((sum, e) => sum + Math.min(e.count || 1, 3), 0);
    let index = 0;
    for (const def of defs) {
      const count = Math.min(def.count || 1, 3);
      for (let i = 0; i < count; i++) {
        const isBossSprite = this.isBoss && index === 0;
        const w = isBossSprite ? 150 : 86;
        const h = isBossSprite ? 108 : 74;
        const x = total === 1 ? 135 : 60 + index * 115;
        const hp = this.authored ? this.authored.enemyHp : Math.round((isBossSprite ? 32 : 7) * (def.hp_multiplier || 1) + (this.lv.stage_index * 0.3));
        this.enemies.push({
          x,
          y: isBossSprite ? 42 : 58,
          w,
          h,
          kind: def.id,
          hp,
          maxHp: hp,
          boss: isBossSprite
        });
        index += 1;
      }
    }
  }

  updateIntentLabel() {
    const label = $('#intent-label');
    if (label) label.textContent = this.enemyIntent?.label || 'No intent';
    const indicator = $('#boss-indicator');
    if (indicator && this.rootheart) {
      const roots = this.blocks.filter(b => b.kind === 'root').length;
      indicator.textContent = `ROOTHEART · PHASE ${this.phase} / 3 · ${roots ? `${roots} ROOTS SHIELDING` : 'HEART EXPOSED'}`;
      indicator.classList.toggle('exposed', roots === 0);
    }
  }

  rollIntent() {
    if (this.rootheart) {
      const ratio = this.enemies[0]?.hp / this.enemies[0]?.maxHp ?? 1;
      this.phase = bossPhase(ratio);
      const roots = this.blocks.filter(b => b.kind === 'root').length;
      const options = this.phase === 1
        ? [{type:'fortify',label:'ROOTHEART · Regrow 1 root',value:1},{type:'strike',label:'ROOTHEART · Thorn lash (2 HP)',value:2}]
        : this.phase === 2
        ? [{type:'strike',label:'ROOTHEART · Double lash (3 HP)',value:3},{type:'fortify',label:'ROOTHEART · Regrow 2 roots',value:2}]
        : [{type:'strike',label:'ROOTHEART · Heart burst (4 HP)',value:4},{type:'push',label:'ROOTHEART · Root surge',value:24}];
      const selected = options[(this.turn - 1) % options.length];
      return selected.type === 'fortify' && roots >= 4 ? {type:'strike',label:'ROOTHEART · Thorn lash (2 HP)',value:2}:selected;
    }
    const mechanic = this.world.mechanic;
    const table = {
      bloom: [
        { type: 'strike', label: 'Spore burst · Deal 1 damage', value: 1 },
        { type: 'fortify', label: 'Vine growth · Add 2 bricks', value: 2 },
        { type: 'mend', label: 'Regrow shell · Heal lowest enemy', value: 3 }
      ],
      heat: [
        { type: 'strike', label: 'Heat lash · Deal 2 damage', value: 2 },
        { type: 'fortify', label: 'Forge plates · Add armored bricks', value: 2 },
        { type: 'push', label: 'Heat wave · Push board downward', value: 1 }
      ],
      rebuild: [
        { type: 'strike', label: 'Bone volley · Deal 2 damage', value: 2 },
        { type: 'rebuild', label: 'Raise remains · Restore bone bricks', value: 2 },
        { type: 'curse', label: 'Hex mist · Lose 1 shield / HP', value: 1 }
      ],
      freeze: [
        { type: 'strike', label: 'Frost shard · Deal 1 damage', value: 1 },
        { type: 'fortify', label: 'Glass wall · Add crystal blocks', value: 2 },
        { type: 'slow', label: 'Cold snap · Next volley launches slower', value: 1 }
      ],
      shift: [
        { type: 'strike', label: 'Gear slam · Deal 2 damage', value: 2 },
        { type: 'shift', label: 'Assembly line · Shift bricks sideways', value: 1 },
        { type: 'fortify', label: 'Steel plating · Add metal bricks', value: 2 }
      ],
      teleport: [
        { type: 'strike', label: 'Void pulse · Deal 2 damage', value: 2 },
        { type: 'curse', label: 'Rift scar · Lose 1 shield / HP', value: 1 },
        { type: 'fortify', label: 'Portal weave · Add special blocks', value: 2 }
      ]
    };
    const options = table[mechanic] || table.bloom;
    if (this.isBoss && Math.random() < 0.45) return options[(this.turn + 1) % options.length];
    return options[Math.floor(Math.random() * options.length)];
  }

  applyPlayerDamage(amount, text = '') {
    let dmg = amount;
    while (this.shield > 0 && dmg > 0) {
      this.shield -= 1;
      dmg -= 1;
    }
    if (dmg > 0) this.hp = Math.max(0, this.hp - dmg);
    $('#hp').textContent = this.hp;
    if (text) this.effects.push({ x: 210, y: 530, text, life: 1, color: '#f2b39d' });
  }

  resolveIntent() {
    if (hasUpgrade('frost') && !this.usedFreeze && this.enemyIntent?.type === 'strike') {
      this.usedFreeze = true;
      this.effects.push({ x: 210, y: 90, text: 'Frozen intent!', life: 1.1, color: '#9dd7ea' });
      return;
    }
    const intent = this.enemyIntent;
    if (!intent) return;
    if (this.authored && intent.type === 'strike' && this.authored.enemyDamage === 0) return;
    if (this.rootheart && intent.type === 'fortify') {
      this.regrowRoots(intent.value);
      return;
    }
    switch (intent.type) {
      case 'strike':
        this.applyPlayerDamage(intent.value, `-${intent.value}`);
        break;
      case 'fortify':
        this.spawnBlocks(intent.value, this.world.brick_pool || this.lv.layout.brick_pool || ['stone']);
        break;
      case 'mend':
        this.healEnemy(intent.value);
        break;
      case 'rebuild':
        this.spawnBlocks(intent.value, ['bone', 'stone']);
        break;
      case 'push':
        this.pushBoard(20);
        break;
      case 'shift':
        this.shiftBoard();
        break;
      case 'curse':
        if (this.shield > 0) this.shield -= 1;
        else this.applyPlayerDamage(intent.value, '-1');
        this.spawnBlocks(1, ['cursed']);
        break;
      case 'slow':
        this.slowNextVolley = true;
        this.effects.push({ x: 210, y: 110, text: 'Volley slowed', life: 1, color: '#9bc7ff' });
        break;
    }
  }

  regrowRoots(amount) {
    const anchors = [[1,2],[4,2],[1,3],[4,3]];
    const occupied = new Set(this.blocks.map(b => `${b.c},${b.r}`));
    for (const [c,r] of anchors) {
      if (amount <= 0) break;
      if (occupied.has(`${c},${r}`)) continue;
      this.blocks.push({id:Math.random(),c,r,x:24+c*62,y:140+r*40,w:56,h:34,kind:'root',hp:2+this.phase,maxHp:2+this.phase,burning:false});
      amount--;
    }
  }

  spawnBlocks(amount, pool) {
    const kinds = Array.isArray(pool) ? pool : ['stone'];
    const occupied = new Set(this.blocks.map((b) => `${b.c}-${b.r}`));
    const open = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) if (!occupied.has(`${c}-${r}`)) open.push([c, r]);
    for (let i = 0; i < amount && open.length; i++) {
      const idx = Math.floor(Math.random() * open.length);
      const [c, r] = open.splice(idx, 1)[0];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const baseHp = ({ stone: 2, cracked: 1, explosive: 1, metal: 4, lava: 2, bone: 2, cursed: 2, mirror: 2, ice: 2, crystal: 2, conveyor: 3, portal: 2 }[kind] || 2);
      this.blocks.push({ id: Math.random(), c, r, x: 24 + c * 62, y: 140 + r * 40, w: 56, h: 34, kind, hp: baseHp, maxHp: baseHp, burning: false });
    }
  }

  healEnemy(amount) {
    const target = [...this.enemies].sort((a, b) => a.hp - b.hp)[0];
    if (!target) return;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    this.effects.push({ x: target.x + target.w / 2, y: target.y - 8, text: `+${amount}`, life: 1, color: '#b7d9b1' });
  }

  pushBoard(step) {
    this.blocks.forEach((b) => {
      b.y = Math.min(490, b.y + step);
    });
  }

  shiftBoard() {
    this.direction *= -1;    this.blocks.forEach((b) => {
      b.x = Math.max(24, Math.min(24 + 5 * 62, b.x + this.direction * 18));
    });
  }

  spawnPhoenixBall(x, y) {
    if (!hasUpgrade('phoenix') || this.usedPhoenix >= 2) return;
    this.usedPhoenix += 1;
    const angle = -Math.PI / 2 + (Math.random() * 0.5 - 0.25);
    const ball = this.createBall(x, y, angle, 500);
    ball.element = 'fire';
    this.balls.push(ball);
  }

  hitNeighbors(origin, amount, radius = 82) {
    this.blocks.forEach((other) => {
      if (other === origin) return;
      if (Math.hypot(other.x - origin.x, other.y - origin.y) < radius) other.hp -= amount;
    });
  }

  handleBrickHit(ball, block, fromX, fromY) {
    let damage = this.baseDamage;
    if (ball.wallBounces > 0 && hasUpgrade('bank_shot')) damage += 0.5 * countUpgrade('bank_shot');
    if (hasUpgrade('crit') && Math.random() < 0.05 * countUpgrade('crit')) damage *= 2;
    if (block.kind === 'metal') damage *= 0.9;
    block.hp -= damage;
    this.hitCounter += 1;
    ball.hits += 1;

    if (hasUpgrade('ember') && this.hitCounter % 5 === 0) block.burning = true;

    const sideX = Math.min(Math.abs(fromX - block.x), Math.abs(fromX - (block.x + block.w)));
    const sideY = Math.min(Math.abs(fromY - block.y), Math.abs(fromY - (block.y + block.h)));

    if (block.kind === 'mirror') {
      if (sideX < sideY) ball.vx *= -1;
      else ball.vy *= -1;
      ball.wallBounces += 1;
    } else if (block.kind === 'portal') {
      const twin = this.blocks.find((b) => b !== block && b.kind === 'portal');
      if (twin) {
        ball.x = twin.x + twin.w / 2;
        ball.y = twin.y + twin.h / 2;
      }
    } else if (hasUpgrade('pierce') && !ball.pierced) {
      ball.pierced = true;
    } else {
      if (sideX < sideY) ball.vx *= -1;
      else ball.vy *= -1;
    }

    if (hasUpgrade('shock') && this.hitCounter % 6 === 0) {
      this.hitNeighbors(block, 1, 72);
      const enemy = this.enemies[0];
      if (enemy) enemy.hp -= 1;
    }

    if (block.kind === 'cursed') this.applyPlayerDamage(1, 'Curse');
    if (block.kind === 'ice') this.usedFreeze = false;

    if (block.hp <= 0) {
      this.breakCounter += 1;
      if (['explosive', 'lava'].includes(block.kind) || (block.burning && hasUpgrade('blast'))) this.hitNeighbors(block, hasUpgrade('chain') ? 2 : 1, hasUpgrade('chain') ? 110 : 82);
      if (block.kind === 'crystal') {
        this.balls.push(this.createBall(ball.x, ball.y, Math.atan2(ball.vy, ball.vx) + 0.35, 420));
        this.balls.push(this.createBall(ball.x, ball.y, Math.atan2(ball.vy, ball.vx) - 0.35, 420));
      }
      if (hasUpgrade('phoenix') && this.breakCounter % 12 === 0) this.spawnPhoenixBall(block.x + block.w / 2, block.y + block.h / 2);
      if (hasUpgrade('vamp') && this.breakCounter % 25 === 0 && this.healsThisRoom < 2) {
        this.hp = Math.min(this.maxHp, this.hp + 1);
        this.healsThisRoom += 1;
        $('#hp').textContent = this.hp;
      }
    }
  }

  handleEnemyHit(ball, enemy) {
    let damage = this.baseDamage;
    if (this.rootheart && enemy.boss && this.blocks.some(b => b.kind === 'root')) {
      damage = Math.max(.5, damage * .2);
      if (this.hitCounter % 8 === 0) this.effects.push({ x:enemy.x+enemy.w/2,y:enemy.y-18,text:'ROOT SHIELD',life:.8,color:'#afc8aa' });
    }
    if (hasUpgrade('crit') && Math.random() < 0.05 * countUpgrade('crit')) damage *= 2;
    enemy.hp -= damage;
    if (this.rootheart && enemy.boss) {
      const next = bossPhase(Math.max(0,enemy.hp)/enemy.maxHp);
      if (next > this.phase) {
        this.phase = next;
        this.effects.push({x:210,y:88,text:`PHASE ${next}`,life:1.3,color:'#f0c99c'});
        this.regrowRoots(next===2 ? 2 : 4);
      }
      this.updateIntentLabel();
    }
    if (hasUpgrade('frost') && !this.usedFreeze) {
      this.usedFreeze = true;
      this.enemyIntent = { type: 'none', label: 'Frozen this turn', value: 0 };
      this.updateIntentLabel();
    }
    if (hasUpgrade('pierce') && !ball.pierced) ball.pierced = true;
    else ball.vy = Math.abs(ball.vy);
    this.effects.push({ x: enemy.x + enemy.w / 2, y: enemy.y, text: `-${Math.round(damage)}`, life: 0.8, color: '#f7c7ae' });
  }

  update(dt) {
    if (this.paused || this.disposed) return;
    dt = Math.min(0.04, dt) * this.speedFactor;

    if (this.active) {
      this.volleyTime += dt;
      this.shotClock += dt;
      const launchSpeed = this.slowNextVolley ? 420 : 540;
      if (this.shotsSent < this.totalBalls && this.shotClock >= 0.075) {
        this.shotClock = 0;
        this.shotsSent += 1;
        this.balls.push(this.createBall(this.launchX, 558, this.angle, launchSpeed));
        this.slowNextVolley = false;
      }

      const surviving = [];
      for (const ball of this.balls) {
        ball.life += dt;
        ball.hitReset=Math.max(0,(ball.hitReset||0)-dt);
        let alive = true;
        const steps = Math.max(1, Math.ceil(dt / 0.008));
        const sdt = dt / steps;
        for (let i = 0; i < steps && alive; i++) {
          const fromX = ball.x;
          const fromY = ball.y;
          ball.x += ball.vx * sdt;
          ball.y += ball.vy * sdt;

          if (ball.x < 8) { ball.x = 8; ball.vx = Math.abs(ball.vx); ball.wallBounces += 1; }
          if (ball.x > 412) { ball.x = 412; ball.vx = -Math.abs(ball.vx); ball.wallBounces += 1; }
          if (ball.y < 8) { ball.y = 8; ball.vy = Math.abs(ball.vy); ball.wallBounces += 1; }
          if (ball.y > 568) {
            if (this.firstLanding === null) this.firstLanding = Math.max(27, Math.min(393, ball.x));
            alive = false;
            break;
          }

          for (let b = this.blocks.length - 1; b >= 0; b--) {
            const block = this.blocks[b];
            if (ball.x + ball.r > block.x && ball.x - ball.r < block.x + block.w && ball.y + ball.r > block.y && ball.y - ball.r < block.y + block.h) {
              this.handleBrickHit(ball, block, fromX, fromY);
              if (block.hp <= 0) this.blocks.splice(b, 1);
              break;
            }
          }

          for (const enemy of this.enemies) {
            if (enemy.hp > 0 && (!ball.lastEnemyHit || ball.lastEnemyHit !== enemy || ball.hitReset <= 0) && ball.x >= enemy.x && ball.x <= enemy.x + enemy.w && ball.y >= enemy.y && ball.y <= enemy.y + enemy.h) {
              this.handleEnemyHit(ball, enemy);
              ball.lastEnemyHit=enemy;ball.hitReset=.09;
              break;
            }
          }
        }
        if (alive && ball.life < 11) surviving.push(ball);
      }
      this.balls = surviving;
      this.enemies = this.enemies.filter((e) => e.hp > 0);
      this.effects = this.effects.filter((e) => (e.life -= dt) > 0);

      if (!this.enemies.length && !this.winScheduled) {
        this.winScheduled = true;
        this.disposed = true;
        setTimeout(victory, 450);
        return;
      }

      if (this.volleyTime > 9 || (this.shotsSent >= this.totalBalls && this.balls.length === 0)) {
        this.endVolley();
      }
    } else {
      this.effects = this.effects.filter((e) => (e.life -= dt) > 0);
    }
  }

  endVolley() {
    this.active = false;
    this.balls = [];
    this.turn += 1;
    this.launchX = this.firstLanding ?? this.launchX;
    this.angle = -Math.PI / 2;
    this.resolveIntent();
    if (this.hp <= 0 && !this.loseScheduled) {
      this.loseScheduled = true;
      this.disposed = true;
      setTimeout(defeat, 450);
      return;
    }
    this.pushBoard(12);
    if (this.blocks.some((b) => b.y > 490)) {
      this.applyPlayerDamage(2, 'Crush');
      if (this.hp <= 0) {
        this.disposed = true;
        setTimeout(defeat, 450);
        return;
      }
    }
    this.enemyIntent = this.rollIntent();
    this.updateIntentLabel();
    this.speedFactor = 1;
    const ff = $('#fast-forward');
    if (ff) ff.style.display = 'none';
  }

  sprite(path, x, y, w, h) {
    if (!this.imageCache) this.imageCache = {};
    if (!this.imageCache[path]) {
      const im = new Image();
      im.src = `/assets/${path}.webp`;
      this.imageCache[path] = im;
    }
    const im = this.imageCache[path];
    if (im.complete && im.naturalWidth) this.ctx.drawImage(im, x, y, w, h);
  }

  drawBricks() {
    const ctx = this.ctx;
    const typeMap = { root:'ember', stone: 'stone', cracked: 'stone', explosive: 'ember', lava: 'ember', metal: 'armor', bone: 'stone', cursed: 'curse', mirror: 'mirror', ice: 'crystal', crystal: 'crystal', conveyor: 'armor', portal: 'portal' };
    for (const block of this.blocks) {
      this.sprite(`bricks/${typeMap[block.kind] || 'stone'}`, block.x, block.y, block.w, block.h);
      ctx.fillStyle = '#f7e4c0';
      ctx.font = 'bold 15px Trebuchet MS';
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.max(0, Math.ceil(block.hp))), block.x + block.w / 2, block.y + 22);
      if (block.kind === 'root') {
        ctx.strokeStyle='#9bcd99';ctx.lineWidth=3;ctx.strokeRect(block.x+2,block.y+2,block.w-4,block.h-4);
      }
      if (block.burning) {
        ctx.fillStyle = '#efaa75';
        ctx.fillRect(block.x + 4, block.y + 4, 10, 10);
      }
    }
    ctx.textAlign = 'left';
  }

  drawEnemies() {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      const path = enemy.boss ? `bosses/${WORLD_BOSS_ASSET[this.world.id] || 'bone_king'}` : `enemies/${ENEMY_SPRITE[enemy.kind] || 'slime'}`;
      this.sprite(path, enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.fillStyle = '#2b2131';
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.w, 7);
      ctx.fillStyle = '#cb867f';
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.w * Math.max(0, enemy.hp / enemy.maxHp), 7);
    }
  }

  drawPlayer() {
    this.sprite(`hero/pyromancer/${this.active ? 'cast' : 'aim'}`, 6, 468, 104, 128);
    const ctx = this.ctx;
    ctx.fillStyle = '#f0d4a5';
    ctx.beginPath();
    ctx.arc(this.launchX, 558, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff4d8';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (!this.active) {
      ctx.strokeStyle = '#f2d79d';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      let px = this.launchX;
      let py = 558;
      let vx = Math.cos(this.angle);
      let vy = Math.sin(this.angle);
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (let i = 0; i < this.previewSegments; i++) {
        px += vx * 16;
        py += vy * 16;
        if (px < 8 || px > 412) {
          vx *= -1;
          px = Math.max(8, Math.min(412, px));
        }
        if (py < 8) {
          vy *= -1;
          py = 8;
        }
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawBallsAndFx() {
    const ctx = this.ctx;
    for (const ball of this.balls) this.sprite(`balls/${ball.element}`, ball.x - 9, ball.y - 9, 18, 18);
    for (const fx of this.effects) {
      ctx.globalAlpha = Math.max(0, fx.life);
      ctx.fillStyle = fx.color || '#f7e4c0';
      ctx.font = 'bold 14px Trebuchet MS';
      ctx.textAlign = 'center';
      ctx.fillText(fx.text, fx.x, fx.y - (1 - fx.life) * 18);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }

  drawHudInCanvas() {
    const ctx = this.ctx;
    ctx.fillStyle = '#e4c9a0';
    ctx.font = 'bold 14px Trebuchet MS';
    ctx.fillText(`Turn ${this.turn}`, 16, 28);
    ctx.fillText(`Shield ${this.shield}`, 16, 48);
    ctx.fillText(`${this.totalBalls} balls`, 302, 588);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.fillStyle = '#122131b8';
    ctx.fillRect(0, 0, this.W, this.H);
    this.drawEnemies();
    this.drawBricks();
    this.drawPlayer();
    this.drawBallsAndFx();
    this.drawHudInCanvas();
  }

  start() {
    this.last = performance.now();
    const tick = (t) => {
      if (this.disposed) return;
      this.update((t - this.last) / 1000);
      this.draw();
      if (this.active && this.volleyTime > 3) {
        const ff = $('#fast-forward');
        if (ff) ff.style.display = 'inline-flex';
      }
      this.last = t;
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
}

function mulberry32(a) {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function upgradePermanent(stat, cost) {
  if (state.gold < cost) {
    toast('Not enough gold');
    return;
  }
  state.gold -= cost;
  state.permanentBoosts[stat] += 1;
  persist();
  toast('Permanent upgrade purchased');
  shop();
}

function action(name) {
  if (name?.startsWith('world-')) {
    stageSelect(Number(name.split('-')[1]));
    return;
  }
  switch (name) {
    case 'home': home(); break;
    case 'map': map(); break;
    case 'heroes': heroes(); break;
    case 'shop': shop(); break;
    case 'settings': settingsView(); break;
    case 'play': combat(); break;
    case 'continue-stage': state.stage = Math.min(60, Math.max(1, state.highest)); persist(); combat(); break;
    case 'retry': combat(); break;
    case 'resume':
      if (engine) engine.paused = false;
      $('#pause-modal')?.remove();
      break;
    case 'next': nextAfterWin(); break;
    case 'buy-power': upgradePermanent('power', 120); break;
    case 'buy-volley': upgradePermanent('volley', 150); break;
    case 'buy-vitality': upgradePermanent('vitality', 180); break;
    case 'daily': {
      const day = new Date().toISOString().slice(0, 10);
      if (state.lastDaily === day) toast('Already claimed today');
      else {
        state.lastDaily = day;
        state.gold += 60;
        persist();
        toast('Daily chest claimed');
        shop();
      }
      break;
    }
    case 'reset-run':
      resetRun();
      toast('Temporary relics cleared');
      shop();
      break;
    case 'reset':
      if (confirm('Clear all local progress?')) {
        localStorage.removeItem('brickbound-save-v2');
        localStorage.removeItem('brickbound-settings-v2');
        location.reload();
      }
      break;
  }
}

view.addEventListener('click', (e) => {
  let node = e.target.closest('[data-action]');
  if (node) return action(node.dataset.action);
  node = e.target.closest('[data-world]');
  if (node) return stageSelect(Number(node.dataset.world));
  node = e.target.closest('[data-stage]');
  if (node) return stageBrief(Number(node.dataset.stage));
  node = e.target.closest('[data-upgrade]');
  if (node) {
    state.upgrades.push(node.dataset.upgrade);
    persist();
    state.stage = Math.min(60, state.highest);
    combat();
  }
});

document.addEventListener('click', (e) => {
  const node = e.target.closest('[data-screen]');
  if (node) action(node.dataset.screen);
});

$('#open-settings').onclick = () => action('settings');
view.addEventListener('change', (e) => {
  if (e.target.id === 'sound') settings.sound = e.target.checked;
  if (e.target.id === 'motion') settings.reducedMotion = e.target.checked;
  persistSettings();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && engine && $('#pause-modal')) action('resume');
});

syncHud();
home();