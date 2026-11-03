/* =============================================================
   Memorijal „Đelac” – zajednička logika (web stranica + aplikacija)
   ============================================================= */
(function () {
  'use strict';

  /* ---------- sitne pomoćne funkcije ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
  const isNum = v => typeof v === 'number' && isFinite(v);
  const clone = o => JSON.parse(JSON.stringify(o));
  const rnd = n => { try { const u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] % n; } catch (e) { return Math.floor(Math.random() * n); } };
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const toMin = s => { const m = /^(\d{1,2})[:.](\d{2})$/.exec(String(s || '').trim()); return m ? (+m[1]) * 60 + (+m[2]) : 540; };
  const fmtMin = n => { n = ((n % 1440) + 1440) % 1440; return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); };
  const hue = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  const LETTER = i => String.fromCharCode(65 + i);

  /* ---------- zadane postavke ---------- */
  const DEFAULT_SETTINGS = {
    name: 'Memorijalni malonogometni turnir „Đelac”',
    subtitle: 'U spomen na Anđelka Herjavca (1958. – 2001.)',
    organizer: 'Udruga navijača White Stones',
    date: '',
    location: 'Varaždin',
    venue: '',
    contact: '',
    fee: '',
    prizes: '',
    news: '',
    about: 'Anđelko Herjavec – Đelac (1958. – 2001.) počeo je kao radnik u varaždinskom Varteksu, a postao direktor tvornice i predsjednik nogometnog kluba. Pod njegovim vodstvom Varteks je proživio svoje najveće europske utakmice, a navijači stadion i danas zovu njegovim imenom.\n\nOvaj turnir igramo u njegovu čast – uz navijačku podršku White Stonesa.',
    rules: 'Igra se 4 + 1 (četiri igrača u polju i vratar), uz leteće izmjene.\nEkipa u prijavi može imati najviše 10 igrača; igrač smije nastupati samo za jednu ekipu.\nPobjeda nosi 3 boda, neriješeno 1, poraz 0.\nKod jednakog broja bodova u skupini odlučuju: međusobni susret, gol-razlika, više postignutih golova.\nU eliminacijama se kod neriješenog rezultata izvode kazneni udarci.\nEkipa koja ne dođe na utakmicu u roku od 5 minuta gubi 3 : 0 bez borbe.\nOdluke sudaca su konačne. Organizator zadržava pravo izmjene rasporeda.',
    format: 'groups_ko',      // groups_ko | ko | league
    groupsCount: 4,
    advance: 2,
    doubleRound: false,
    thirdPlace: true,
    matchMinutes: 20,
    breakMinutes: 5,
    koBreak: 15,
    fields: 1,
    startTime: '09:00',
    maxTeams: 16,
    minPlayers: 5,
    maxPlayers: 10,
    registrationOpen: true
  };
  const NUM_KEYS = ['groupsCount', 'advance', 'matchMinutes', 'breakMinutes', 'koBreak', 'fields', 'maxTeams', 'minPlayers', 'maxPlayers'];
  const BOOL_KEYS = ['doubleRound', 'thirdPlace', 'registrationOpen'];

  function normT(t) {
    t = t && typeof t === 'object' ? t : {};
    return {
      settings: { ...DEFAULT_SETTINGS, ...(t.settings || {}) },
      groups: Array.isArray(t.groups) ? t.groups : [],
      matches: Array.isArray(t.matches) ? t.matches : [],
      drawnAt: t.drawnAt || null,
      drawSeq: Array.isArray(t.drawSeq) ? t.drawSeq : []
    };
  }

  /* =============================================================
     POHRANA PODATAKA: demo (preglednik) ili Supabase (prava baza)
     ============================================================= */
  const CFG = window.TURNIR_CONFIG || {};
  const LIVE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  const LS_KEY = 'djelac_turnir_demo_v1';
  const SS_ADMIN = 'djelac_demo_admin';

  const mem = {};
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] ?? null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return mem['s_' + k] ?? null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { mem['s_' + k] = v; } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { delete mem['s_' + k]; } }
  };

  const nameKey = n => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const Demo = {
    data: null,
    read() { try { const r = ls.get(LS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
    write() { ls.set(LS_KEY, JSON.stringify(this.data)); },
    async init() { this.data = this.read() || { teams: [], t: normT({}) }; },
    async isAdmin() { return ss.get(SS_ADMIN) === '1'; },
    async login() { ss.set(SS_ADMIN, '1'); return true; },
    async logout() { ss.del(SS_ADMIN); },
    async loadTeams() { this.data = this.read() || this.data; return clone(this.data.teams); },
    async loadTournament() { return normT(clone(this.data.t)); },
    async saveTournament(t) { this.data.t = clone(t); this.write(); },
    async register(team) {
      const t = normT(this.data.t);
      if (!t.settings.registrationOpen || t.drawnAt) throw { code: 'closed' };
      if (this.data.teams.some(x => nameKey(x.name) === nameKey(team.name))) throw { code: 'dup' };
      this.data.teams.push({ ...team, id: uid(), status: 'pending', seeded: false, created_at: new Date().toISOString() });
      this.write();
    },
    async addTeam(team) {
      if (this.data.teams.some(x => nameKey(x.name) === nameKey(team.name))) throw { code: 'dup' };
      this.data.teams.push({ status: 'approved', seeded: false, ...team, id: uid(), created_at: new Date().toISOString() });
      this.write();
    },
    async updateTeam(id, patch) {
      if (patch.name && this.data.teams.some(x => x.id !== id && nameKey(x.name) === nameKey(patch.name))) throw { code: 'dup' };
      const x = this.data.teams.find(x => x.id === id); if (x) Object.assign(x, patch); this.write();
    },
    async deleteTeam(id) { this.data.teams = this.data.teams.filter(x => x.id !== id); this.write(); },
    subscribe(cb) {
      window.addEventListener('storage', e => { if (e.key === LS_KEY) cb(); });
      setInterval(cb, 15000);
    },
    reset() { ls.del(LS_KEY); this.data = { teams: [], t: normT({}) }; }
  };

  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Ne mogu učitati ' + src)); document.head.appendChild(s); });
  }
  function mapDbErr(error) {
    if (!error) return null;
    if (error.code === '23505') return { code: 'dup' };
    if (error.code === '42501' || /row-level security/i.test(error.message || '')) return { code: 'closed' };
    return { code: 'error', message: error.message || String(error) };
  }

  const Live = {
    sb: null, admin: false,
    async init() {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      this.sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    },
    async isAdmin() {
      const { data } = await this.sb.auth.getSession();
      if (!data.session) return (this.admin = false);
      const r = await this.sb.rpc('is_admin');
      return (this.admin = !!r.data);
    },
    async login(email, password) {
      const { error } = await this.sb.auth.signInWithPassword({ email, password });
      if (error) throw { code: 'auth', message: error.message };
      const ok = await this.isAdmin();
      if (!ok) { await this.sb.auth.signOut(); throw { code: 'notadmin' }; }
      return true;
    },
    async logout() { await this.sb.auth.signOut(); this.admin = false; },
    async loadTeams() {
      const tbl = this.admin ? 'teams' : 'teams_public';
      const { data, error } = await this.sb.from(tbl).select('*').order('created_at');
      if (error) throw mapDbErr(error);
      return data || [];
    },
    async loadTournament() {
      const { data, error } = await this.sb.from('tournament').select('data').eq('id', 1).maybeSingle();
      if (error) throw mapDbErr(error);
      return normT(data && data.data);
    },
    async saveTournament(t) {
      const { error } = await this.sb.from('tournament').upsert({ id: 1, data: t, updated_at: new Date().toISOString() });
      if (error) throw mapDbErr(error);
    },
    async register(team) {
      const { error } = await this.sb.from('teams').insert({
        name: team.name, captain: team.captain, phone: team.phone, email: team.email || null,
        color: team.color || null, note: team.note || null, players: team.players || [], status: 'pending', seeded: false
      });
      if (error) throw mapDbErr(error);
    },
    async addTeam(team) {
      const row = { status: 'approved', seeded: false, ...team }; delete row.id;
      const { error } = await this.sb.from('teams').insert(row);
      if (error) throw mapDbErr(error);
    },
    async updateTeam(id, patch) {
      const { error } = await this.sb.from('teams').update(patch).eq('id', id);
      if (error) throw mapDbErr(error);
    },
    async deleteTeam(id) {
      const { error } = await this.sb.from('teams').delete().eq('id', id);
      if (error) throw mapDbErr(error);
    },
    subscribe(cb) {
      try {
        this.sb.channel('turnir-promjene')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, () => cb())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => cb())
          .subscribe();
      } catch (e) { /* realtime nije obavezan */ }
      setInterval(cb, 30000);
    }
  };

  const API = LIVE ? Live : Demo;

  /* =============================================================
     STANJE
     ============================================================= */
  const S = { teams: [], t: normT({}), isAdmin: false, loaded: false, error: null, saving: false };

  const teamById = id => S.teams.find(x => x.id === id);
  const teamName = id => (teamById(id) || {}).name || 'Nepoznata ekipa';
  const approvedTeams = () => S.teams.filter(x => x.status === 'approved');
  const groupByKey = k => S.t.groups.find(g => g.key === k);
  const groupLabel = k => (groupByKey(k) || {}).name || ('Skupina ' + k);
  const findMatch = id => S.t.matches.find(m => m.id === id);

  /* =============================================================
     TURNIRSKA LOGIKA
     ============================================================= */
  function roundRobin(ids, double) {
    const a = [...ids]; if (a.length % 2) a.push(null);
    const n = a.length, rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) {
        const x = a[i], y = a[n - 1 - i];
        if (x != null && y != null) pairs.push((r + i) % 2 ? [y, x] : [x, y]);
      }
      rounds.push(pairs);
      a.splice(1, 0, a.pop());
    }
    if (double) rounds.push(...rounds.map(p => p.map(([x, y]) => [y, x])));
    return rounds;
  }

  function newMatch(stage, home, away, extra) {
    return Object.assign({ id: uid(), stage, home, away, hg: null, ag: null, ph: null, pa: null, status: 'scheduled', scorers: [], time: '', field: 1, seq: 0 }, extra || {});
  }

  const ROUND_NAMES = { 2: 'Finale', 4: 'Polufinale', 8: 'Četvrtfinale', 16: 'Osmina finala', 32: 'Šesnaestina finala', 64: '1/32 finala' };
  const ROUND_ABBR = { 2: 'F', 4: 'PF', 8: 'ČF', 16: 'OF', 32: 'ŠF', 64: 'R64' };
  function seedOrder(n) { let o = [1]; while (o.length < n) { const m = o.length * 2 + 1; o = o.flatMap(x => [x, m - x]); } return o; }
  function fixClashes(cur) {
    const gk = s => (s && s.type === 'group' ? s.group : null);
    for (let i = 0; i < cur.length; i += 2) {
      const a = cur[i], b = cur[i + 1];
      if (!a || !b || gk(a) == null || gk(a) !== gk(b)) continue;
      for (let j = 0; j < cur.length; j += 2) {
        if (j === i) continue; const c = cur[j], d = cur[j + 1]; if (!c || !d) continue;
        if (gk(a) !== gk(d) && gk(c) !== gk(b)) { cur[i + 1] = d; cur[j + 1] = b; break; }
      }
    }
  }
  function buildKO(sources, thirdPlace) {
    const Q = sources.length; if (Q < 2) return [];
    let size = 2; while (size < Q) size *= 2;
    let cur = seedOrder(size).map(s => (s <= Q ? sources[s - 1] : null));
    fixClashes(cur);
    const out = []; let r = 0, semis = null;
    while (cur.length > 1) {
      const name = ROUND_NAMES[cur.length] || ('1/' + cur.length / 2 + ' finala');
      const ab = ROUND_ABBR[cur.length] || ('R' + cur.length);
      const next = [], roundMs = []; let k = 0;
      for (let i = 0; i < cur.length; i += 2) {
        const a = cur[i], b = cur[i + 1];
        if (a && b) {
          k++;
          const m = newMatch('ko', a, b, { round: name, roundIndex: r, code: cur.length === 2 ? 'F' : ab + k });
          out.push(m); roundMs.push(m); next.push({ type: 'winner', match: m.id });
        } else next.push(a || b || null);
      }
      if (cur.length === 4) semis = roundMs;
      cur = next; r++;
    }
    if (thirdPlace && semis && semis.length === 2) {
      const fin = out.find(m => m.code === 'F');
      out.push(newMatch('ko', { type: 'loser', match: semis[0].id }, { type: 'loser', match: semis[1].id }, { round: 'Za 3. mjesto', roundIndex: fin.roundIndex - 0.5, code: '3M', third: true }));
    }
    return out;
  }

  function scheduleAll(t) {
    const st = t.settings;
    const F = Math.max(1, +st.fields || 1);
    const slot = (+st.matchMinutes || 20) + (+st.breakMinutes || 0);
    let cur = toMin(st.startTime);
    const gm = t.matches.filter(m => m.stage === 'group').sort((a, b) => a.seq - b.seq);
    const queue = [...gm]; let prev = new Set();
    while (queue.length) {
      const picked = [], busy = new Set();
      for (const pass of [0, 1]) {
        for (let i = 0; i < queue.length && picked.length < F; i++) {
          const m = queue[i], ids = [m.home.id, m.away.id];
          if (ids.some(x => busy.has(x))) continue;
          if (pass === 0 && ids.some(x => prev.has(x))) continue;
          picked.push(m); ids.forEach(x => busy.add(x)); queue.splice(i, 1); i--;
        }
        if (picked.length >= F) break;
      }
      if (!picked.length) { const m = queue.shift(); picked.push(m); busy.add(m.home.id); busy.add(m.away.id); }
      picked.forEach((m, k) => { m.time = fmtMin(cur); m.field = k + 1; });
      prev = busy; cur += slot;
    }
    const ko = t.matches.filter(m => m.stage === 'ko');
    if (ko.length) {
      if (gm.length) cur += (+st.koBreak || 0);
      const rounds = [...new Set(ko.map(m => m.roundIndex))].sort((a, b) => a - b);
      for (const r of rounds) {
        const ms = ko.filter(m => m.roundIndex === r).sort((a, b) => a.seq - b.seq);
        for (let i = 0; i < ms.length; i += F) { ms.slice(i, i + F).forEach((m, k) => { m.time = fmtMin(cur); m.field = k + 1; }); cur += slot; }
      }
    }
  }

  function validateDraw() {
    const st = S.t.settings, n = approvedTeams().length;
    if (n < 2) return 'Potrebne su barem 2 odobrene ekipe.';
    if (st.format === 'groups_ko') {
      const G = Math.max(1, +st.groupsCount || 1), adv = Math.max(1, +st.advance || 1);
      if (n < G * 2) return `Za ${G} skupine potrebno je barem ${G * 2} ekipa (sada ${n}).`;
      if (adv >= Math.floor(n / G)) return `Iz skupina ne može proći ${adv} ekipa – skupine imaju samo ${Math.floor(n / G)} ekipe. Smanji broj ekipa koje prolaze ili broj skupina.`;
      if (G * adv < 2) return 'Iz skupina moraju proći barem 2 ekipe ukupno.';
    }
    return null;
  }

  function doDraw() {
    const st = S.t.settings, teams = approvedTeams();
    const seeded = shuffle(teams.filter(x => x.seeded)).map(x => x.id);
    const rest = shuffle(teams.filter(x => !x.seeded)).map(x => x.id);
    const order = [...seeded, ...rest];
    let groups = [], matches = [], drawSeq = [];

    if (st.format === 'league') {
      const ids = shuffle(order);
      groups = [{ key: 'L', name: 'Liga', teamIds: ids }];
      drawSeq = ids.map(id => ({ id, group: 'L' }));
    } else if (st.format === 'groups_ko') {
      const G = Math.max(1, +st.groupsCount || 1);
      groups = Array.from({ length: G }, (_, i) => ({ key: LETTER(i), name: 'Skupina ' + LETTER(i), teamIds: [] }));
      order.forEach((id, i) => { groups[i % G].teamIds.push(id); drawSeq.push({ id, group: groups[i % G].key }); });
    } else {
      drawSeq = order.map(id => ({ id, group: null }));
    }

    let seq = 0;
    if (groups.length) {
      const rr = groups.map(g => roundRobin(g.teamIds, !!st.doubleRound));
      const maxR = Math.max(...rr.map(r => r.length));
      for (let r = 0; r < maxR; r++) {
        groups.forEach((g, gi) => {
          (rr[gi][r] || []).forEach(([h, a]) => {
            matches.push(newMatch('group', { type: 'team', id: h }, { type: 'team', id: a }, { group: g.key, round: r + 1, seq: seq++ }));
          });
        });
      }
    }
    let sources = [];
    if (st.format === 'groups_ko') {
      const adv = Math.max(1, +st.advance || 1);
      for (let p = 1; p <= adv; p++) groups.forEach(g => sources.push({ type: 'group', group: g.key, pos: p }));
    } else if (st.format === 'ko') {
      sources = order.map(id => ({ type: 'team', id }));
    }
    if (sources.length) buildKO(sources, !!st.thirdPlace).forEach(m => { m.seq = seq++; matches.push(m); });

    S.t.groups = groups; S.t.matches = matches; S.t.drawSeq = drawSeq;
    S.t.drawnAt = new Date().toISOString();
    scheduleAll(S.t);
  }

  /* ---------- tablice i razrješavanje parova ---------- */
  const groupMatches = k => S.t.matches.filter(m => m.stage === 'group' && m.group === k);
  const groupComplete = k => { const ms = groupMatches(k); return ms.length > 0 && ms.every(m => m.status === 'done'); };

  function standings(k) {
    const g = groupByKey(k); if (!g) return [];
    const rows = {};
    g.teamIds.forEach(id => (rows[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
    const ms = groupMatches(k).filter(m => m.status === 'done' && isNum(m.hg) && isNum(m.ag));
    for (const m of ms) {
      const h = rows[m.home.id], a = rows[m.away.id]; if (!h || !a) continue;
      h.p++; a.p++; h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg;
      if (m.hg > m.ag) { h.w++; a.l++; h.pts += 3; } else if (m.hg < m.ag) { a.w++; h.l++; a.pts += 3; } else { h.d++; a.d++; h.pts++; a.pts++; }
    }
    const arr = Object.values(rows).sort((x, y) => y.pts - x.pts);
    const out = []; let i = 0;
    while (i < arr.length) {
      let j = i; while (j < arr.length && arr[j].pts === arr[i].pts) j++;
      const block = arr.slice(i, j);
      if (block.length > 1) {
        const ids = new Set(block.map(r => r.id)), hh = {};
        block.forEach(r => (hh[r.id] = { pts: 0, gd: 0, gf: 0 }));
        ms.forEach(m => {
          if (!ids.has(m.home.id) || !ids.has(m.away.id)) return;
          const H = hh[m.home.id], A = hh[m.away.id];
          H.gf += m.hg; A.gf += m.ag; H.gd += m.hg - m.ag; A.gd += m.ag - m.hg;
          if (m.hg > m.ag) H.pts += 3; else if (m.hg < m.ag) A.pts += 3; else { H.pts++; A.pts++; }
        });
        block.sort((x, y) => (hh[y.id].pts - hh[x.id].pts) || (hh[y.id].gd - hh[x.id].gd) || (hh[y.id].gf - hh[x.id].gf) ||
          ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf) || teamName(x.id).localeCompare(teamName(y.id), 'hr'));
      }
      out.push(...block); i = j;
    }
    return out;
  }

  function resolve(src, depth = 0) {
    if (!src || depth > 20) return null;
    if (src.type === 'team') return src.id;
    if (src.type === 'group') { if (!groupComplete(src.group)) return null; const r = standings(src.group)[src.pos - 1]; return r ? r.id : null; }
    const m = findMatch(src.match); if (!m) return null;
    if (src.type === 'winner') return winnerOf(m, depth + 1);
    if (src.type === 'loser') return loserOf(m, depth + 1);
    return null;
  }
  function winnerOf(m, depth = 0) {
    if (m.status !== 'done' || !isNum(m.hg) || !isNum(m.ag)) return null;
    const h = resolve(m.home, depth), a = resolve(m.away, depth);
    if (m.hg > m.ag) return h; if (m.ag > m.hg) return a;
    if (isNum(m.ph) && isNum(m.pa) && m.ph !== m.pa) return m.ph > m.pa ? h : a;
    return null;
  }
  function loserOf(m, depth = 0) {
    const w = winnerOf(m, depth); if (!w) return null;
    const h = resolve(m.home, depth), a = resolve(m.away, depth);
    return w === h ? a : h;
  }
  function srcLabel(src) {
    if (!src) return '—';
    if (src.type === 'team') return teamName(src.id);
    if (src.type === 'group') return src.pos + '. ' + groupLabel(src.group).replace('Skupina', 'skupina');
    const m = findMatch(src.match), c = m ? (m.code || m.round) : '?';
    return (src.type === 'winner' ? 'Pobjednik ' : 'Poraženi ') + c;
  }

  function champion() {
    const st = S.t.settings;
    if (!S.t.drawnAt) return null;
    if (st.format === 'league') {
      const g = S.t.groups[0]; if (!g || !groupComplete(g.key)) return null;
      const tbl = standings(g.key);
      return { first: tbl[0] && tbl[0].id, second: tbl[1] && tbl[1].id, third: tbl[2] && tbl[2].id };
    }
    const f = S.t.matches.find(m => m.code === 'F'); if (!f) return null;
    const w = winnerOf(f); if (!w) return null;
    const t3 = S.t.matches.find(m => m.code === '3M');
    return { first: w, second: loserOf(f), third: t3 ? winnerOf(t3) : null };
  }

  function topScorers() {
    const map = {};
    S.t.matches.forEach(m => {
      if (m.status !== 'done' && m.status !== 'live') return;
      (m.scorers || []).forEach(s => {
        if (!s || !s.name || s.og) return;
        const tid = resolve(s.side === 'away' ? m.away : m.home); if (!tid) return;
        const k = tid + '|' + nameKey(s.name);
        if (!map[k]) map[k] = { name: s.name.trim(), team: tid, goals: 0 };
        map[k].goals++;
      });
    });
    return Object.values(map).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'hr'));
  }

  function formatText() {
    const st = S.t.settings;
    if (st.format === 'league') return 'Liga – svatko sa svakim' + (st.doubleRound ? ' (dvokružno)' : '');
    if (st.format === 'ko') return 'Kup sustav – ispadanje od prve utakmice';
    return `${st.groupsCount} ${+st.groupsCount === 1 ? 'skupina' : (+st.groupsCount < 5 ? 'skupine' : 'skupina')} + eliminacije · dalje idu ${st.advance} najbolje iz svake skupine`;
  }
  function fmtDate(d, opts) {
    if (!d) return '';
    const x = new Date(d + 'T12:00:00'); if (isNaN(x)) return d;
    return x.toLocaleDateString('hr-HR', opts || { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* =============================================================
     ZAJEDNIČKI PRIKAZI (HTML)
     ============================================================= */
  function crest(id, size) {
    const n = teamName(id);
    return `<span class="crest${size ? ' ' + size : ''}" style="--h:${hue(n)}" aria-hidden="true">${esc(initials(n))}</span>`;
  }
  function sideHTML(src, id) {
    return id ? `${crest(id)}<span class="tn">${esc(teamName(id))}</span>` : `<span class="crest ph" aria-hidden="true">?</span><span class="tn ph">${esc(srcLabel(src))}</span>`;
  }
  function stageLabel(m) {
    return m.stage === 'group' ? `${groupLabel(m.group)} · ${m.round}. kolo` : `${m.round}${m.code && !m.third && m.code !== 'F' ? ' · ' + m.code : ''}`;
  }
  function matchCard(m, opts = {}) {
    const h = resolve(m.home), a = resolve(m.away);
    const done = m.status === 'done', live = m.status === 'live';
    const w = done ? winnerOf(m) : null;
    const hasScore = (done || live) && isNum(m.hg) && isNum(m.ag);
    const pens = m.stage === 'ko' && isNum(m.ph) && isNum(m.pa) ? `<span class="pens">${m.ph}:${m.pa} pen.</span>` : '';
    const multiField = (+S.t.settings.fields || 1) > 1;
    const attrs = opts.clickable ? ` data-action="edit-match" data-id="${m.id}" tabindex="0" role="button"` : '';
    return `<article class="match ${live ? 'is-live' : ''} ${done ? 'is-done' : ''}"${attrs}>
      <div class="m-meta">
        <span class="m-time">${esc(m.time || '--:--')}</span>
        ${multiField ? `<span class="m-field">Teren ${esc(m.field)}</span>` : ''}
        <span class="m-stage">${esc(stageLabel(m))}</span>
        ${live ? '<span class="badge live">Uživo</span>' : done ? '<span class="badge done">Kraj</span>' : ''}
      </div>
      <div class="m-body">
        <div class="m-team home ${w && w === h ? 'win' : ''} ${w && w !== h ? 'lose' : ''}">${sideHTML(m.home, h)}</div>
        <div class="m-score">${hasScore ? `<b>${m.hg}</b><i>:</i><b>${m.ag}</b>` : '<span class="vs">vs</span>'}${pens}</div>
        <div class="m-team away ${w && w === a ? 'win' : ''} ${w && w !== a ? 'lose' : ''}">${sideHTML(m.away, a)}</div>
      </div>
      ${opts.scorers && (m.scorers || []).length ? `<div class="m-scorers">${scorersLine(m)}</div>` : ''}
    </article>`;
  }
  function scorersLine(m) {
    const side = s => (m.scorers || []).filter(x => x.side === s).map(x => esc(x.name) + (x.og ? ' (ag)' : '')).join(', ');
    const hs = side('home'), as = side('away');
    return `<span>${hs || '&nbsp;'}</span><span>⚽</span><span>${as || '&nbsp;'}</span>`;
  }

  function standingsTable(k, opts = {}) {
    const st = S.t.settings;
    const rows = standings(k);
    const adv = st.format === 'groups_ko' ? +st.advance : (st.format === 'league' ? 1 : 0);
    const complete = groupComplete(k);
    return `<div class="table-wrap"><table class="standings">
      <thead><tr><th class="pos">#</th><th class="team">Ekipa</th><th title="Utakmice">U</th><th title="Pobjede">P</th><th title="Neriješeno">N</th><th title="Porazi">I</th><th class="hide-xs" title="Golovi">G</th><th title="Gol-razlika">GR</th><th class="pts" title="Bodovi">B</th></tr></thead>
      <tbody>${rows.map((r, i) => `<tr class="${i < adv ? 'q' : ''}">
        <td class="pos"><span>${i + 1}</span></td>
        <td class="team">${crest(r.id, 'sm')}<span class="tn">${esc(teamName(r.id))}</span></td>
        <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
        <td class="hide-xs">${r.gf}:${r.ga}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td class="pts">${r.pts}</td></tr>`).join('')}
      </tbody></table></div>
      ${adv && st.format === 'groups_ko' ? `<p class="legend"><span class="qdot"></span> prolaz u eliminacije${complete ? ' · skupina završena' : ''}</p>` : ''}`;
  }

  function bracketHTML(opts = {}) {
    const ko = S.t.matches.filter(m => m.stage === 'ko' && !m.third);
    if (!ko.length) return '';
    const rounds = [...new Set(ko.map(m => m.roundIndex))].sort((a, b) => a - b);
    const box = m => {
      const h = resolve(m.home), a = resolve(m.away), done = m.status === 'done', live = m.status === 'live';
      const w = done ? winnerOf(m) : null;
      const line = (src, id, g, p) => `<div class="b-row ${w && w === id ? 'win' : ''} ${w && id && w !== id ? 'lose' : ''}">
        ${id ? crest(id, 'sm') : '<span class="crest sm ph">?</span>'}
        <span class="tn ${id ? '' : 'ph'}">${esc(id ? teamName(id) : srcLabel(src))}</span>
        <span class="b-sc">${(done || live) && isNum(g) ? g : ''}${m.stage === 'ko' && isNum(p) ? `<small>(${p})</small>` : ''}</span></div>`;
      const attrs = opts.clickable ? ` data-action="edit-match" data-id="${m.id}" tabindex="0" role="button"` : '';
      return `<div class="b-match ${live ? 'is-live' : ''}"${attrs}>
        <div class="b-head"><span>${esc(m.code || '')}</span><span>${esc(m.time || '')}${(+S.t.settings.fields || 1) > 1 ? ' · T' + esc(m.field) : ''}</span>${live ? '<span class="badge live">Uživo</span>' : ''}</div>
        ${line(m.home, h, m.hg, m.ph)}${line(m.away, a, m.ag, m.pa)}</div>`;
    };
    const third = S.t.matches.find(m => m.third);
    return `<div class="bracket-scroll"><div class="bracket">
      ${rounds.map(r => { const ms = ko.filter(m => m.roundIndex === r).sort((a, b) => a.seq - b.seq);
        return `<div class="b-col"><h4>${esc(ms[0].round)}</h4><div class="b-col-body">${ms.map(box).join('')}</div></div>`; }).join('')}
    </div></div>
    ${third ? `<div class="third"><h4>Utakmica za 3. mjesto</h4>${box(third)}</div>` : ''}`;
  }

  /* ---------- UI pomagala ---------- */
  function toast(msg, kind) {
    let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.className = 'show ' + (kind || '');
    clearTimeout(toast._t); toast._t = setTimeout(() => (el.className = ''), 3200);
  }
  function openModal(html, cls) {
    let r = $('#modal-root'); if (!r) { r = document.createElement('div'); r.id = 'modal-root'; document.body.appendChild(r); }
    r.innerHTML = `<div class="modal-bg"><div class="modal ${cls || ''}" role="dialog" aria-modal="true">${html}</div></div>`;
    document.body.classList.add('noscroll');
    const bg = $('.modal-bg', r);
    bg.addEventListener('mousedown', e => { if (e.target === bg) { closeModal(); if (openModal.onDismiss) openModal.onDismiss(); } });
    const f = $('input,select,textarea,button', r); if (f && !('ontouchstart' in window)) setTimeout(() => f.focus(), 30);
  }
  function closeModal() { const r = $('#modal-root'); if (r) r.innerHTML = ''; document.body.classList.remove('noscroll'); openModal.onDismiss = null; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal-root .modal')) { closeModal(); } });
  function confirmBox(title, text, ok = 'Potvrdi', danger = false) {
    return new Promise(res => {
      openModal(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="modal-actions"><button class="btn ghost" id="cb-no">Odustani</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cb-yes">${esc(ok)}</button></div>`);
      openModal.onDismiss = () => res(false);
      $('#cb-no').onclick = () => { closeModal(); res(false); };
      $('#cb-yes').onclick = () => { closeModal(); res(true); };
    });
  }
  function errText(e) {
    if (!e) return 'Nepoznata greška';
    if (e.code === 'dup') return 'Ekipa s tim imenom već postoji.';
    if (e.code === 'closed') return 'Prijave su zatvorene.';
    if (e.code === 'notadmin') return 'Ovaj račun nema administratorska prava.';
    if (e.code === 'auth') return 'Pogrešan e-mail ili lozinka.';
    return e.message || String(e);
  }

  /* ---------- učitavanje ---------- */
  async function refresh() {
    try {
      const [teams, t] = await Promise.all([API.loadTeams(), API.loadTournament()]);
      S.teams = teams; if (!S.saving) S.t = t; S.loaded = true; S.error = null;
    } catch (e) { if (!S.loaded) S.error = errText(e); }
  }
  async function start(onChange) {
    try {
      await API.init();
      S.isAdmin = await API.isAdmin();
      await refresh();
      API.subscribe(async () => { await refresh(); onChange(true); });
    } catch (e) { S.error = errText(e) || 'Ne mogu se spojiti na bazu.'; }
    onChange(false);
  }
  async function saveT(msg) {
    S.saving = true;
    try { await API.saveTournament(S.t); if (msg !== false) toast(msg || 'Spremljeno', 'ok'); return true; }
    catch (e) { toast('Greška pri spremanju: ' + errText(e), 'err'); S.saving = false; await refresh(); return false; }
    finally { S.saving = false; }
  }

  window.T = {
    $, $$, esc, uid, isNum, clone, shuffle, rnd, toMin, fmtMin, hue, initials, nameKey,
    DEFAULT_SETTINGS, NUM_KEYS, BOOL_KEYS, normT, LIVE, API, Demo, S,
    teamById, teamName, approvedTeams, groupByKey, groupLabel, findMatch,
    validateDraw, doDraw, scheduleAll, standings, groupComplete, groupMatches, resolve, winnerOf, loserOf, srcLabel,
    champion, topScorers, formatText, fmtDate,
    crest, sideHTML, stageLabel, matchCard, scorersLine, standingsTable, bracketHTML,
    toast, openModal, closeModal, confirmBox, errText, refresh, start, saveT
  };
})();
