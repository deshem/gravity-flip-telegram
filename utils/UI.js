const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/** Чёткий текст: целые px (масштаб экрана — в main.js resolution) */
export function textStyle(fontSize, extra = {}) {
  const size = Math.max(12, Math.round(fontSize));
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color: '#f8fafc',
    ...extra
  };
}

/** Верхняя панель HUD в игре */
export function createGameHud(scene, callbacks = {}) {
  const L = layout(scene);
  const hudH = 44;
  const hudY = L.safeTop + L.pad + hudH / 2;
  const hudW = L.w - L.pad * 2;
  const midY = hudY;

  const root = scene.add.container(0, 0).setScrollFactor(0).setDepth(10);

  const bar = scene.add
    .rectangle(L.cx, midY, hudW, hudH, 0x0f172a, 0.93)
    .setStrokeStyle(1, 0x475569, 1);

  const scoreX = L.pad + 14;
  const hudFont = Math.min(18, L.fontBody);

  const scoreText = addText(scene, scoreX, midY, '0 m', hudFont, {
    color: '#f8fafc',
    fontStyle: 'bold'
  }).setOrigin(0, 0.5);

  const pillX = scoreX + 58;
  const pillW = 68;
  const pillH = 30;
  const coinPill = scene.add
    .rectangle(pillX + pillW / 2, midY, pillW, pillH, 0x1e293b, 1)
    .setStrokeStyle(1, 0x64748b, 0.8);

  const coinIcon = scene.add
    .image(pillX + 16, midY, 'coin')
    .setDisplaySize(20, 20);

  const coinText = addText(scene, pillX + 34, midY, '0', hudFont, {
    color: '#fbbf24',
    fontStyle: '600'
  }).setOrigin(0, 0.5);

  const pauseSize = 36;
  const pauseX = L.w - L.pad - pauseSize / 2 - 2;
  const pauseBtn = scene.add
    .rectangle(pauseX, midY, pauseSize, pauseSize, 0x334155, 1)
    .setStrokeStyle(1, 0x64748b)
    .setInteractive({ useHandCursor: true });

  const pauseIcon = addText(scene, pauseX, midY, 'II', Math.round(L.fontSmall * 1.1), {
    color: '#e2e8f0',
    fontStyle: 'bold',
    align: 'center'
  }).setOrigin(0.5);

  pauseBtn.on('pointerdown', () => callbacks.onPause?.());

  root.add([bar, scoreText, coinPill, coinIcon, coinText, pauseBtn, pauseIcon]);

  return {
    root,
    scoreText,
    coinText,
    setScore: (v) => scoreText.setText(`${v} m`),
    setCoins: (v) => coinText.setText(String(v))
  };
}

/** @param {Phaser.Scene} scene */
export function layout(scene) {
  const w = Math.floor(scene.scale.width);
  const h = Math.floor(scene.scale.height);
  const safeTop = scene.registry.get('safeTop') || 0;
  const safeBottom = scene.registry.get('safeBottom') || 0;
  const usableH = h - safeTop - safeBottom;
  const s = Math.min(w, usableH);

  return {
    w,
    h,
    usableH,
    safeTop,
    safeBottom,
    s,
    cx: w / 2,
    cy: safeTop + usableH / 2,
    pad: Math.max(16, Math.round(s * 0.042)),
    btnW: Math.min(320, Math.round(w * 0.84)),
    btnH: Math.max(48, Math.round(s * 0.062)),
    fontTitle: Math.round(s * 0.072),
    fontHead: Math.round(s * 0.046),
    fontBody: Math.round(s * 0.036),
    fontSmall: Math.round(s * 0.028)
  };
}

/** @param {Phaser.Scene} scene */
export function addText(scene, x, y, content, fontSize, extra = {}) {
  return scene.add.text(x, y, content, textStyle(fontSize, extra));
}

/** @param {Phaser.Scene} scene */
export function createButton(scene, x, y, label, onClick, color = 0x2563eb, opts = {}) {
  const L = layout(scene);
  const btnW = opts.width ?? L.btnW;
  const btnH = opts.height ?? L.btnH;
  const fontSize = opts.fontSize ?? L.fontBody;
  const container = scene.add.container(x, y);

  const bg = scene.add
    .rectangle(0, 0, btnW, btnH, color, 1)
    .setStrokeStyle(2, 0xffffff, 0.1)
    .setInteractive({ useHandCursor: true });

  const text = addText(scene, 0, 0, label, fontSize, {
    color: '#ffffff',
    fontStyle: '600',
    align: 'center'
  }).setOrigin(0.5);

  container.add([bg, text]);

  bg.on('pointerover', () => bg.setFillStyle(lighten(color), 1));
  bg.on('pointerout', () => bg.setFillStyle(color, 1));
  bg.on('pointerdown', onClick);

  return container;
}

/** @param {Phaser.Scene} scene */
export function createPanel(scene, { title, panelH, onBack }) {
  const L = layout(scene);
  const panelW = Math.min(360, Math.round(L.w * 0.9));
  const panelHeight = panelH ?? Math.round(L.usableH * 0.58);

  const root = scene.add.container(L.cx, L.cy).setDepth(200);

  const dim = scene.add.rectangle(0, 0, L.w, L.h, 0x000000, 0.78);
  const box = scene.add
    .rectangle(0, 0, panelW, panelHeight, 0x1e293b, 1)
    .setStrokeStyle(2, 0x38bdf8, 0.4);

  const titleY = -panelHeight / 2 + L.pad;
  const titleText = addText(scene, 0, titleY, title, L.fontHead, {
    color: '#f8fafc',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0);

  const divider = scene.add.rectangle(0, titleY + L.fontHead + 12, panelW - 28, 1, 0x334155);

  root.add([dim, box, titleText, divider]);

  const contentY = titleY + L.fontHead + 28;
  const content = scene.add.container(0, contentY);
  root.add(content);

  if (onBack) {
    const backBtn = createButton(
      scene,
      0,
      panelHeight / 2 - L.pad - L.btnH / 2,
      '← Назад',
      onBack,
      0x2563eb
    );
    root.add(backBtn);
  }

  return {
    root,
    content,
    panelW,
    panelHeight,
    L,
    destroy: () => root.destroy()
  };
}

export function createToggleRow(scene, x, y, label, value, onChange) {
  const L = layout(scene);
  const rowW = Math.min(300, Math.round(L.w * 0.8));

  const row = scene.add.container(x, y);

  const lbl = addText(scene, -rowW / 2, 0, label, L.fontBody, {
    color: '#e2e8f0'
  }).setOrigin(0, 0.5);

  const pillW = 76;
  const pillH = 38;
  const pillX = rowW / 2 - pillW / 2;

  const pill = scene.add
    .rectangle(pillX, 0, pillW, pillH, value ? 0x2563eb : 0x475569)
    .setInteractive({ useHandCursor: true });

  const pillText = addText(scene, pillX, 0, value ? 'ВКЛ' : 'ВЫКЛ', L.fontSmall, {
    color: '#ffffff',
    fontStyle: '700',
    align: 'center'
  }).setOrigin(0.5);

  let current = value;

  const refresh = (v) => {
    pill.setFillStyle(v ? 0x2563eb : 0x475569);
    pillText.setText(v ? 'ВКЛ' : 'ВЫКЛ');
  };

  pill.on('pointerdown', () => {
    current = !current;
    refresh(current);
    onChange(current);
  });

  row.add([lbl, pill, pillText]);
  return row;
}

export function createVolumeRow(scene, x, y, volume, onChange) {
  const L = layout(scene);
  const rowW = Math.min(300, Math.round(L.w * 0.8));
  const trackW = rowW - 108;
  let vol = volume;

  const row = scene.add.container(x, y);

  const label = addText(scene, 0, -30, `Громкость: ${vol}%`, L.fontBody, {
    color: '#e2e8f0',
    align: 'center'
  }).setOrigin(0.5);

  const track = scene.add.rectangle(0, 10, trackW, 8, 0x334155).setOrigin(0.5);
  const fill = scene.add
    .rectangle(-trackW / 2, 10, (trackW * vol) / 100, 8, 0x38bdf8)
    .setOrigin(0, 0.5);

  const mkBtn = (bx, sign) => {
    const b = scene.add
      .rectangle(bx, 10, 44, 44, 0x334155)
      .setStrokeStyle(1, 0x64748b)
      .setInteractive({ useHandCursor: true });
    const t = addText(scene, bx, 10, sign, L.fontHead, {
      color: '#f8fafc',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    b.on('pointerdown', () => {
      const step = sign === '−' ? -10 : 10;
      vol = Phaser.Math.Clamp(vol + step, 0, 100);
      label.setText(`Громкость: ${vol}%`);
      fill.width = (trackW * vol) / 100;
      fill.x = -trackW / 2;
      onChange(vol);
    });
    return { b, t };
  };

  const minus = mkBtn(-trackW / 2 - 40, '−');
  const plus = mkBtn(trackW / 2 + 40, '+');

  row.add([label, track, fill, minus.b, minus.t, plus.b, plus.t]);
  return row;
}

function lighten(color) {
  const r = Math.min(255, ((color >> 16) & 0xff) + 25);
  const g = Math.min(255, ((color >> 8) & 0xff) + 25);
  const b = Math.min(255, (color & 0xff) + 25);
  return (r << 16) | (g << 8) | b;
}
