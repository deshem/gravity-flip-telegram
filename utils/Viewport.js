export function getViewport() {
  const tg = window.Telegram?.WebApp;
  return {
    width: Math.floor(tg?.viewportStableWidth || window.innerWidth),
    height: Math.floor(tg?.viewportStableHeight || window.innerHeight),
    safeTop: tg?.safeAreaInset?.top ?? 0,
    safeBottom: tg?.safeAreaInset?.bottom ?? 0
  };
}

export function getDpr() {
  return Math.min(window.devicePixelRatio || 1, 2.5);
}

export function applySafeArea(game) {
  const { safeTop, safeBottom } = getViewport();
  game.registry.set('safeTop', safeTop);
  game.registry.set('safeBottom', safeBottom);
}

export function resizeGame(game) {
  const { width, height } = getViewport();
  game.scale.resize(width, height);
  applySafeArea(game);
}
