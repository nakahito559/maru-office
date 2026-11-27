/* 마루 비서실 — 대시보드 */
(function () {
  'use strict';

  var DATA_URL = './data/status.json?t=' + Date.now();
  var LS_DATA = 'maruOffice.lastData';
  var LS_TAB = 'maruOffice.tab';
  var LS_MOTION = 'maruOffice.motion';
  var state = { data: null, activePart: 'hq' };

  var $ = function (id) { return document.getElementById(id); };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '--:--';
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  function fmtFull(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var mo = d.getMonth() + 1;
    var day = d.getDate();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    return mo + '월 ' + day + '일 ' + hh + ':' + mm + ' 기준';
  }

  /* ---------- tabs ---------- */
  function setTab(name) {
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var on = t.dataset.tab === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    var panels = ['office', 'workshop', 'status', 'memo'];
    panels.forEach(function (p) {
      var el = $('panel-' + p);
      if (el) el.hidden = p !== name;
    });
    try { localStorage.setItem(LS_TAB, name); } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { setTab(t.dataset.tab); });
  });

  /* ---------- motion toggle ---------- */
  function setMotion(on, save) {
    document.body.classList.toggle('motion-on', on);
    var btn = $('motionToggle');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    $('motionLabel').textContent = on ? '모션 ON' : '모션 OFF';
    if (save) { try { localStorage.setItem(LS_MOTION, on ? '1' : '0'); } catch (e) {} }
  }
  $('motionToggle').addEventListener('click', function () {
    setMotion(!document.body.classList.contains('motion-on'), true);
  });

  /* ---------- render ---------- */
  function render(data) {
    state.data = data;
    document.title = '마루 비서실';

    $('subtitle').textContent = data.subtitle || '순스튜디오 본부 · 5개 파트 가동 중';
    $('headline').textContent = data.headline || '';
    $('hint').textContent = data.hint || '';
    $('liveTime').textContent = fmtTime(data.updatedAt);
    $('footUpdated').textContent = fmtFull(data.updatedAt);

    var parts = data.parts || [];
    $('chipParts').textContent = '가동 ' + parts.length + '파트';
    renderPins(parts);
    renderPartChips(parts);
    var has = parts.some(function (p) { return p.id === state.activePart; });
    selectPart(has ? state.activePart : (parts[0] && parts[0].id), parts);

    renderSchedule(data.schedule || []);
    renderMetrics(data.metrics || []);
    renderLinks(data.links || []);
    renderMemos(data.memos || []);
  }

  function renderPins(parts) {
    var wrap = $('pins');
    wrap.innerHTML = '';
    parts.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'pin';
      b.type = 'button';
      b.style.left = p.x + '%';
      b.style.top = p.y + '%';
      b.style.setProperty('--pin', p.color || '#7BB6E8');
      b.setAttribute('aria-label', p.name + ' 현황 보기');
      b.dataset.part = p.id;
      b.innerHTML = '<span aria-hidden="true">' + esc(p.emoji || '•') + '</span>' +
        '<span class="pin-label">' + esc(p.name) + '</span>';
      b.addEventListener('click', function () { selectPart(p.id, parts); });
      wrap.appendChild(b);
    });
  }

  function renderPartChips(parts) {
    var wrap = $('partChips');
    wrap.innerHTML = '';
    parts.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'part-chip';
      b.type = 'button';
      b.dataset.part = p.id;
      b.style.setProperty('--pin', p.color || '#7BB6E8');
      b.innerHTML = '<span class="dot" aria-hidden="true"></span>' + esc(p.name);
      b.addEventListener('click', function () { selectPart(p.id, parts); });
      wrap.appendChild(b);
    });
  }

  function selectPart(id, parts) {
    var p = (parts || (state.data && state.data.parts) || []).filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    state.activePart = id;

    document.querySelectorAll('.pin').forEach(function (el) {
      el.classList.toggle('is-active', el.dataset.part === id);
    });
    document.querySelectorAll('.part-chip').forEach(function (el) {
      el.classList.toggle('is-active', el.dataset.part === id);
    });

    var stats = (p.stats || []).map(function (s) {
      return '<div class="stat"><div class="stat-value">' + esc(s.value) + '</div>' +
        '<div class="stat-label">' + esc(s.label) + '</div></div>';
    }).join('');

    var rows = (p.items || []).map(function (it) {
      var inner = '<div class="row-body"><div class="row-title">' + esc(it.title) + '</div>' +
        (it.meta ? '<div class="row-meta">' + esc(it.meta) + '</div>' : '') + '</div>' +
        (it.url ? '<span class="row-go" aria-hidden="true">↗</span>' : '');
      return it.url
        ? '<a class="row" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>'
        : '<div class="row">' + inner + '</div>';
    }).join('');

    $('partDetail').innerHTML =
      '<div class="detail-head">' +
        '<div class="detail-emoji" aria-hidden="true">' + esc(p.emoji || '•') + '</div>' +
        '<div><h3 class="detail-name">' + esc(p.name) + '</h3>' +
        '<p class="detail-role">' + esc(p.role || '') + '</p></div>' +
      '</div>' +
      (p.summary ? '<p class="detail-summary">' + esc(p.summary) + '</p>' : '') +
      (stats ? '<div class="stats">' + stats + '</div>' : '') +
      (rows ? '<div class="rows">' + rows + '</div>' : '');
  }

  function renderSchedule(list) {
    var wrap = $('scheduleList');
    if (!list.length) { wrap.innerHTML = '<p class="loading">표시할 스케줄이 없어요.</p>'; return; }
    wrap.innerHTML = list.map(function (s) {
      return '<article class="card sched">' +
        '<div class="sched-time">' + esc(s.time) + '</div>' +
        '<div class="sched-body">' +
          '<div class="sched-title">' + esc(s.title) + '</div>' +
          '<div class="sched-detail">' + esc(s.detail || '') + '</div>' +
          '<div class="sched-foot">' +
            (s.status ? '<span class="status-chip">' + esc(s.status) + '</span>' : '') +
            (s.next ? '<span class="sched-next">' + esc(s.next) + '</span>' : '') +
            (s.url ? '<a class="sched-link" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">보기 ↗</a>' : '') +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderMetrics(list) {
    var wrap = $('metrics');
    wrap.innerHTML = list.map(function (m) {
      return '<div class="metric">' +
        '<div class="metric-label">' + esc(m.label) + '</div>' +
        '<div class="metric-value">' + esc(m.value) + '</div>' +
        (m.sub ? '<div class="metric-sub">' + esc(m.sub) + '</div>' : '') +
      '</div>';
    }).join('');
  }

  function renderLinks(list) {
    var wrap = $('links');
    var head = '<div class="list-head">공개 링크</div>';
    wrap.innerHTML = head + list.map(function (l) {
      return '<a class="link-row" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' +
        '<div><div class="link-name">' + esc(l.name) + '</div>' +
        '<div class="link-host">' + esc(l.host || '') + '</div></div>' +
        '<span class="link-go" aria-hidden="true">↗</span></a>';
    }).join('');
  }

  function renderMemos(list) {
    var wrap = $('memoList');
    if (!list.length) { wrap.innerHTML = '<p class="loading">대기 중인 메모가 없어요.</p>'; return; }
    wrap.innerHTML = list.map(function (m) {
      return '<article class="card memo">' +
        '<div class="memo-head"><span class="memo-type" data-type="' + esc(m.type) + '">' + esc(m.type) + '</span></div>' +
        '<h3 class="memo-title">' + esc(m.title) + '</h3>' +
        '<p class="memo-body">' + esc(m.body) + '</p>' +
      '</article>';
    }).join('');
  }

  function showError() {
    var box = $('partDetail');
    if (box && !state.data) {
      box.innerHTML = '<p class="error">현황 데이터를 불러오지 못했어요.<br>잠시 뒤 다시 열어 주세요.</p>';
    }
  }

  function loadData() {
    fetch(DATA_URL, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        render(data);
        try { localStorage.setItem(LS_DATA, JSON.stringify(data)); } catch (e) {}
      })
      .catch(function () {
        var cached = null;
        try { cached = JSON.parse(localStorage.getItem(LS_DATA) || 'null'); } catch (e) {}
        if (cached) { render(cached); }
        else { showError(); }
      });
  }

  /* ---------- boot ---------- */
  try {
    var m = localStorage.getItem(LS_MOTION);
    setMotion(m === null ? true : m === '1', false);
  } catch (e) { setMotion(true, false); }

  try {
    var savedTab = localStorage.getItem(LS_TAB);
    if (savedTab && $('panel-' + savedTab)) setTab(savedTab);
  } catch (e) {}

  loadData();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
})();
