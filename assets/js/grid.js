(() => {
  'use strict';
  const $ = id => document.getElementById(id), board = $('grid-board');
  if (!board) return;
  const key = 'osisos-grid-v2', palette = ['#d97757', '#67978b', '#769bc1', '#b099c6', '#c5a451'];
  const cellKey = (x, y) => `${x},${y}`;
  let state = { regions: [{ id: 'q', name: 'Q', color: palette[0] }], cells: {}, active: 'q' };
  let view = { x: 0, y: 0, size: 32 }, mode = 'rectangle', selected = null, gesture = null, history = [], space = false, storageOK = true;
  function validRegions(saved) {
    return saved && Array.isArray(saved.regions) && saved.regions.length > 0 && saved.regions.length <= 100 &&
      saved.regions.every(r => r && typeof r.id === 'string' && typeof r.name === 'string' && r.name.trim().length > 0 && r.name.length <= 24 && /^#[0-9a-f]{6}$/i.test(r.color)) &&
      new Set(saved.regions.map(r => r.id)).size === saved.regions.length && saved.regions.some(r => r.id === saved.active);
  }
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (validRegions(saved) && saved.cells && !Array.isArray(saved.cells) && typeof saved.cells === 'object' &&
      Object.entries(saved.cells).every(([k, id]) => /^-?\d+,-?\d+$/.test(k) && k.split(',').every(n => Number.isSafeInteger(Number(n))) && saved.regions.some(r => r.id === id))) {
      state = { regions: saved.regions, cells: saved.cells, active: saved.active };
      if (saved.view && [saved.view.x, saved.view.y, saved.view.size].every(Number.isFinite) && saved.view.size >= 24 && saved.view.size <= 64) view = saved.view;
    } else if (!saved) {
      // Preserve drawings from the original 16 × 12 version.
      const old = JSON.parse(localStorage.getItem('osisos-grid-v1'));
      if (validRegions(old) && Array.isArray(old.cells) && old.cells.length === 192 && old.cells.every(id => id === null || old.regions.some(r => r.id === id))) {
        state = { regions: old.regions, cells: {}, active: old.active };
        old.cells.forEach((id, i) => { if (id !== null) state.cells[cellKey(i % 16, Math.floor(i / 16))] = id; });
      }
    }
  } catch (_) { storageOK = false; }
  const region = id => state.regions.find(r => r.id === id), copy = () => JSON.stringify(state);
  function remember(snapshot = copy()) { history.push(snapshot); if (history.length > 50) history.shift(); }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify({ ...state, view })); storageOK = true; } catch (_) { storageOK = false; }
    $('grid-status').textContent = storageOK ? '自动保存在此浏览器 · 支持正负坐标' : '浏览器无法保存，刷新后画布可能丢失';
  }
  function showCoordinate() {
    if (!selected) return;
    const [x, y] = selected, r = region(state.cells[cellKey(x, y)]);
    $('grid-coordinate').textContent = `${r ? r.name : '未命名'}(${x},${y})`;
    $('grid-detail').textContent = r ? `区域 ${r.name} · 全画布坐标 (${x},${y})` : `空白格点 · 全画布坐标 (${x},${y})`;
  }
  function updateForm() { const r = region(state.active); $('grid-name').setCustomValidity(''); $('grid-name').value = r.name; $('grid-color').value = r.color; }
  const gutter = 30;
  function draw() {
    const w = board.clientWidth - gutter, h = board.clientHeight - gutter, size = view.size;
    const fragment = document.createDocumentFragment(), axes = document.createDocumentFragment();
    const minX = Math.floor(view.x), minY = Math.floor(view.y), maxX = Math.ceil(view.x + w / size), maxY = Math.ceil(view.y + h / size);
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const cell = document.createElement('button'), r = region(state.cells[cellKey(x, y)]);
        cell.type = 'button'; cell.tabIndex = -1; cell.className = 'grid-cell'; cell.dataset.x = x; cell.dataset.y = y;
        cell.style.cssText = `left:${gutter + (x - view.x) * size}px;top:${gutter + (y - view.y) * size}px;width:${size}px;height:${size}px;`;
        if (r) { cell.classList.add('filled'); cell.style.setProperty('--cell-color', r.color); }
        if (x === 0) cell.classList.add('origin-x'); if (y === 0) cell.classList.add('origin-y');
        if (selected && selected[0] === x && selected[1] === y) cell.classList.add('selected');
        if (gesture?.kind === 'rectangle' && x >= Math.min(gesture.start[0], gesture.end[0]) && x <= Math.max(gesture.start[0], gesture.end[0]) && y >= Math.min(gesture.start[1], gesture.end[1]) && y <= Math.max(gesture.start[1], gesture.end[1])) cell.classList.add('preview');
        const label = `${r ? r.name : '空白'}(${x},${y})`; cell.setAttribute('aria-label', label); cell.title = label; fragment.append(cell);
      }
    }
    function axis(value, horizontal) {
      const label = document.createElement('span'); label.className = 'grid-axis'; label.textContent = value;
      label.style.cssText = horizontal ? `left:${gutter + (value - view.x) * size}px;top:0;width:${size}px;height:${gutter}px` : `left:0;top:${gutter + (value - view.y) * size}px;width:${gutter}px;height:${size}px`;
      axes.append(label);
    }
    for (let x = minX; x < maxX; x++) axis(x, true);
    for (let y = minY; y < maxY; y++) axis(y, false);
    $('grid-cells').replaceChildren(fragment); $('grid-axes').replaceChildren(axes);
    $('grid-zoom').textContent = `${Math.round(size / 32 * 100)}%`;
    $('grid-zoom-out').disabled = size <= 24; $('grid-zoom-in').disabled = size >= 64;
    board.classList.toggle('panning', mode === 'pan' || space || gesture?.kind === 'pan');
    showCoordinate();
  }
  function render() {
    draw();
    const counts = {}; Object.values(state.cells).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    $('grid-regions').replaceChildren();
    state.regions.forEach(r => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'grid-region'; button.setAttribute('aria-pressed', String(r.id === state.active));
      const swatch = document.createElement('span'); swatch.className = 'grid-swatch'; swatch.style.backgroundColor = r.color;
      const name = document.createElement('span'); name.className = 'grid-region-name'; name.textContent = r.name;
      const count = document.createElement('span'); count.className = 'grid-region-count'; count.textContent = `${counts[r.id] || 0} 格`;
      button.append(swatch, name, count);
      button.addEventListener('click', () => { state.active = r.id; updateForm(); render(); persist(); });
      $('grid-regions').append(button);
    });
    $('grid-undo').disabled = history.length === 0;
  }
  function point(event) {
    const rect = board.getBoundingClientRect(), px = event.clientX - rect.left - board.clientLeft, py = event.clientY - rect.top - board.clientTop;
    if (px < gutter || py < gutter || px >= board.clientWidth || py >= board.clientHeight) return null;
    return [Math.floor(view.x + (px - gutter) / view.size), Math.floor(view.y + (py - gutter) / view.size)];
  }
  function paint(x, y, erase = false) { const k = cellKey(x, y); if (erase) delete state.cells[k]; else state.cells[k] = state.active; }
  function stroke(a, b, erase) {
    let [x, y] = a; const [endX, endY] = b, dx = Math.abs(endX - x), dy = -Math.abs(endY - y), stepX = x < endX ? 1 : -1, stepY = y < endY ? 1 : -1;
    let error = dx + dy;
    for (;;) { paint(x, y, erase); if (x === endX && y === endY) break; const twice = 2 * error; if (twice >= dy) { error += dy; x += stepX; } if (twice <= dx) { error += dx; y += stepY; } }
  }
  function finish(cancel = false) {
    if (!gesture) return;
    if (gesture.kind === 'pan') { if (cancel) view = gesture.view; }
    else if (cancel) state = JSON.parse(gesture.before);
    else {
      if (gesture.kind === 'rectangle') {
        for (let y = Math.min(gesture.start[1], gesture.end[1]); y <= Math.max(gesture.start[1], gesture.end[1]); y++)
          for (let x = Math.min(gesture.start[0], gesture.end[0]); x <= Math.max(gesture.start[0], gesture.end[0]); x++) paint(x, y);
      }
      if (copy() !== gesture.before) remember(gesture.before);
    }
    gesture = null; render(); persist();
  }
  board.addEventListener('pointerdown', event => {
    if (gesture || (event.button !== 0 && event.button !== 1)) return;
    const p = point(event); if (!p) return;
    event.preventDefault(); board.focus({ preventScroll: true }); board.setPointerCapture(event.pointerId);
    if (mode === 'pan' || space || event.button === 1) gesture = { kind: 'pan', px: event.clientX, py: event.clientY, view: { ...view } };
    else { selected = p; if (mode !== 'inspect') { gesture = { kind: mode, start: p, end: p, before: copy() }; if (mode !== 'rectangle') paint(...p, mode === 'erase'); } }
    draw();
  });
  board.addEventListener('pointermove', event => {
    if (!gesture) return;
    if (gesture.kind === 'pan') { view.x = gesture.view.x - (event.clientX - gesture.px) / view.size; view.y = gesture.view.y - (event.clientY - gesture.py) / view.size; }
    else { const p = point(event); if (!p) return; selected = p; if (gesture.kind !== 'rectangle') stroke(gesture.end, p, gesture.kind === 'erase'); gesture.end = p; }
    draw();
  });
  board.addEventListener('pointerup', () => finish());
  board.addEventListener('pointercancel', () => finish(true));
  board.addEventListener('lostpointercapture', () => finish(true));
  board.addEventListener('click', event => {
    const cell = event.target.closest('.grid-cell'); if (!cell || event.detail !== 0 || gesture) return;
    selected = [Number(cell.dataset.x), Number(cell.dataset.y)];
    if (mode !== 'inspect' && mode !== 'pan') { const before = copy(); paint(...selected, mode === 'erase'); if (before !== copy()) remember(before); persist(); }
    render();
  });
  function zoom(factor, px = (board.clientWidth - gutter) / 2, py = (board.clientHeight - gutter) / 2) {
    if (gesture) return;
    const size = Math.max(24, Math.min(64, view.size * factor));
    view.x += px / view.size - px / size; view.y += py / view.size - py / size; view.size = size; draw(); persist();
  }
  board.addEventListener('wheel', event => {
    event.preventDefault(); if (gesture) return;
    if (event.ctrlKey || event.metaKey) { const rect = board.getBoundingClientRect(); zoom(Math.exp(-event.deltaY * .005), event.clientX - rect.left - gutter, event.clientY - rect.top - gutter); }
    else { const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? board.clientHeight : 1; view.x += (event.shiftKey ? event.deltaY : event.deltaX) * unit / view.size; view.y += (event.shiftKey ? 0 : event.deltaY) * unit / view.size; draw(); persist(); }
  }, { passive: false });
  board.addEventListener('keydown', event => {
    if (event.key === 'Escape') { finish(true); return; }
    if (event.code === 'Space') { event.preventDefault(); space = true; draw(); return; }
    const steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (steps[event.key]) {
      event.preventDefault(); const [dx, dy] = steps[event.key];
      selected = selected || [Math.floor(view.x), Math.floor(view.y)]; selected = [selected[0] + dx, selected[1] + dy];
      if (selected[0] < view.x) view.x = selected[0]; if (selected[1] < view.y) view.y = selected[1];
      if (selected[0] + 1 > view.x + (board.clientWidth - gutter) / view.size) view.x = selected[0] + 1 - (board.clientWidth - gutter) / view.size;
      if (selected[1] + 1 > view.y + (board.clientHeight - gutter) / view.size) view.y = selected[1] + 1 - (board.clientHeight - gutter) / view.size;
      draw(); persist();
    } else if (event.key === 'Enter' && mode !== 'pan') {
      event.preventDefault(); selected = selected || [Math.floor(view.x), Math.floor(view.y)];
      if (mode !== 'inspect') { const before = copy(); paint(...selected, mode === 'erase'); if (before !== copy()) remember(before); persist(); } render();
    }
  });
  document.addEventListener('keyup', event => { if (event.code === 'Space') { space = false; draw(); } });
  board.addEventListener('blur', () => { space = false; draw(); });
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    finish(true); mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $('grid-help').textContent = { inspect: '点击查看坐标；方向键移动，回车操作格点。', paint: '点击或拖动填色，使用当前区域。', rectangle: '拖动框选矩形，松开后填入当前区域。', erase: '点击或拖动擦除填色。', pan: '拖动移动画布，可以探索任意方向的格点。' }[mode] + ' 按住空格拖动可随时移动；滚轮平移，Ctrl / ⌘ + 滚轮缩放。'; draw();
  }));
  $('grid-zoom-in').addEventListener('click', () => zoom(1.25)); $('grid-zoom-out').addEventListener('click', () => zoom(.8));
  $('grid-home').addEventListener('click', () => { finish(true); view = { x: 0, y: 0, size: 32 }; draw(); persist(); });
  $('grid-region-form').addEventListener('submit', event => {
    event.preventDefault(); const name = $('grid-name').value.trim();
    if (!name || state.regions.some(r => r.id !== state.active && r.name === name)) { $('grid-name').setCustomValidity(!name ? '请输入区域名称。' : '这个名称已被使用，请换一个名称。'); $('grid-name').reportValidity(); return; }
    const before = copy(); Object.assign(region(state.active), { name, color: $('grid-color').value }); if (before !== copy()) remember(before); render(); persist();
  });
  $('grid-name').addEventListener('input', () => $('grid-name').setCustomValidity(''));
  $('grid-add').addEventListener('click', () => {
    if (state.regions.length >= 100) { $('grid-status').textContent = '最多支持 100 个区域。'; return; }
    remember(); let n = state.regions.length + 1; while (state.regions.some(r => r.name === `R${n}`)) n++;
    const id = `r-${Date.now()}-${Math.random().toString(36).slice(2)}`; state.regions.push({ id, name: `R${n}`, color: palette[state.regions.length % palette.length] }); state.active = id;
    updateForm(); render(); persist(); $('grid-name').focus(); $('grid-name').select();
  });
  $('grid-undo').addEventListener('click', () => { if (!history.length) return; state = JSON.parse(history.pop()); updateForm(); render(); persist(); });
  $('grid-clear').addEventListener('click', () => { if (!Object.keys(state.cells).length) return; remember(); state.cells = {}; render(); persist(); });
  new ResizeObserver(draw).observe(board);
  updateForm(); render();
  $('grid-help').textContent = '拖动框选矩形，松开后填色。选择“移动”或按住空格拖动平移；滚轮平移，Ctrl / ⌘ + 滚轮缩放。';
  if (!storageOK) $('grid-status').textContent = '浏览器无法读取保存的数据 · 当前画布尚未保存';
})();
