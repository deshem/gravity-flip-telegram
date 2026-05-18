/** @param {Phaser.Scene} scene */
export function layout(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const s = Math.min(w, h);
  return {
    w,
    h,
    s,
    cx: w / 2,
    cy: h / 2,
    pad: Math.max(16, s * 0.04),
    btnW: Math.min(300, w * 0.82),
    btnH: Math.max(44, s * 0.065),
    fontTitle: Math.round(s * 0.078),
    fontHead: Math.round(s * 0.05),
    fontBody: Math.round(s * 0.038),
    fontSmall: Math.round(s * 0.03)
  };
}

/** @param {Phaser.Scene} scene */
export function createButton(scene, x, y, label, onClick, color = 0x2563eb) {
  const L = layout(scene);
  const container = scene.add.container(x, y);

  const bg = scene.add
    .rectangle(0, 0, L.btnW, L.btnH, color, 1)
    .setStrokeStyle(2, 0xffffff, 0.08)
    .setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: `${L.fontBody}px`,
      color: '#ffffff',
      fontStyle: '600'
    })
    .setOrigin(0.5);

  container.add([bg, text]);

  bg.on('pointerover', () => bg.setFillStyle(lighten(color), 1));
  bg.on('pointerout', () => bg.setFillStyle(color, 1));
  bg.on('pointerdown', onClick);

  return container;
}

/** @param {Phaser.Scene} scene */
export function createPanel(scene, { title, panelH, onBack }) {
  const L = layout(scene);
  const panelW = Math.min(340, L.w * 0.9);
  const panelHeight = panelH ?? L.h * 0.55;

  const root = scene.add.container(L.cx, L.cy).setDepth(200);

  const dim = scene.add.rectangle(0, 0, L.w, L.h, 0x000000, 0.75);
  const box = scene.add
    .rectangle(0, 0, panelW, panelHeight, 0x1e293b, 1)
    .setStrokeStyle(2, 0x38bdf8, 0.35);

  const titleText = scene.add
    .text(0, -panelHeight / 2 + L.pad + 8, title, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: `${L.fontHead}px`,
      color: '#f8fafc',
      fontStyle: 'bold'
    })
    .setOrigin(0.5, 0);

  const divider = scene.add.rectangle(0, -panelHeight / 2 + L.pad + L.fontHead + 16, panelW - 32, 1, 0x334155);

  root.add([dim, box, titleText, divider]);

  const contentY = -panelHeight / 2 + L.pad + L.fontHead + 36;
  const content = scene.add.container(0, contentY);
  root.add(content);

  let backBtn = null;
  if (onBack) {
    backBtn = createButton(scene, 0, panelHeight / 2 - L.pad - L.btnH / 2, '← Назад', onBack, 0x2563eb);
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

/** Toggle row: label left, pill right */
export function createToggleRow(scene, x, y, label, value, onChange) {
  const L = layout(scene);
  const rowW = Math.min(280, L.w * 0.78);

  const row = scene.add.container(x, y);

  const lbl = scene.add.text(-rowW / 2, 0, label, {
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    fontSize: `${L.fontBody}px`,
    color: '#e2e8f0'
  }).setOrigin(0, 0.5);

  const pillW = 72;
  const pillH = 36;
  const pill = scene.add
    .rectangle(rowW / 2 - pillW / 2, 0, pillW, pillH, value ? 0x2563eb : 0x475569)
    .setInteractive({ useHandCursor: true });

  const pillText = scene.add
    .text(rowW / 2 - pillW / 2, 0, value ? 'ВКЛ' : 'ВЫКЛ', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: `${L.fontSmall}px`,
      color: '#ffffff',
      fontStyle: '600'
    })
    .setOrigin(0.5);

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
  row.refresh = refresh;
  row.getValue = () => current;

  return row;
}

/** Volume row with - slider + */
export function createVolumeRow(scene, x, y, volume, onChange) {
  const L = layout(scene);
  const rowW = Math.min(280, L.w * 0.78);
  const trackW = rowW - 100;
  let vol = volume;

  const row = scene.add.container(x, y);

  const label = scene.add.text(0, -28, `Громкость: ${vol}%`, {
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    fontSize: `${L.fontBody}px`,
    color: '#e2e8f0'
  }).setOrigin(0.5);

  const track = scene.add.rectangle(0, 8, trackW, 8, 0x334155).setOrigin(0.5);
  const fill = scene.add.rectangle(-trackW / 2, 8, (trackW * vol) / 100, 8, 0x38bdf8).setOrigin(0, 0.5);

  const mkBtn = (bx, sign) => {
    const b = scene.add
      .rectangle(bx, 8, 40, 40, 0x334155)
      .setStrokeStyle(1, 0x64748b)
      .setInteractive({ useHandCursor: true });
    const t = scene.add.text(bx, 8, sign, {
      fontSize: `${L.fontHead}px`,
      color: '#f8fafc',
      fontStyle: 'bold'
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

  const minus = mkBtn(-trackW / 2 - 36, '−');
  const plus = mkBtn(trackW / 2 + 36, '+');

  row.add([
    label, track, fill,
    minus.b, minus.t, plus.b, plus.t
  ]);

  row.setVolume = (v) => {
    vol = v;
    label.setText(`Громкость: ${vol}%`);
    fill.width = (trackW * vol) / 100;
    fill.x = -trackW / 2;
  };

  return row;
}

function lighten(color) {
  const r = Math.min(255, ((color >> 16) & 0xff) + 25);
  const g = Math.min(255, ((color >> 8) & 0xff) + 25);
  const b = Math.min(255, (color & 0xff) + 25);
  return (r << 16) | (g << 8) | b;
}
