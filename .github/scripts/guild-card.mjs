#!/usr/bin/env node
/* =========================================================
   ⚔ GuildenKain — GitHub Guild Card Generator (Action)
   ========================================================= */

import fs from 'node:fs';

const USERNAME = process.env.GH_USERNAME || process.env.GITHUB_REPOSITORY?.split('/')[0];
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const OUTPUT_SVG = 'guild-card.svg';
const OUTPUT_YML = 'guild-card.yml';

if (!USERNAME) {
  console.error('❌ GH_USERNAME não definido');
  process.exit(1);
}

const HEADERS = TOKEN
  ? { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' }
  : { Accept: 'application/vnd.github+json' };

const fmt = (n) => {
  n = n || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
};

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const trunc = (s, n) => s && s.length > n ? s.slice(0, n - 1) + '…' : (s || '');

const flag = (country) => {
  if (!country) return '🌍';
  const match = String(country).match(/\b([A-Z]{2})\b/);
  if (!match) return '🌍';
  return match[1].replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
};

async function fetchGH(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`GitHub ${res.status} on ${url}`);
  }
  return res.json();
}

async function fetchUser(username) {
  const user = await fetchGH(`https://api.github.com/users/${username}`);
  if (!user) throw new Error('Usuário não encontrado');
  const repos = await fetchGH(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`) || [];

  const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const forks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);

  const topRepos = [...repos]
    .filter(r => !r.fork)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 3);

  return {
    ...user, repos, topRepos,
    total_stars: stars,
    total_forks: forks,
    public_repos_count: user.public_repos || 0
  };
}

function detectClass(repos) {
  const groups = {
    frontend: ['JavaScript','TypeScript','HTML','CSS','Vue','Svelte','SCSS','Less','Astro'],
    backend:  ['Python','Java','Go','Rust','Ruby','PHP','C#','Elixir','Scala','Kotlin','Perl','Clojure'],
    mobile:   ['Swift','Kotlin','Dart','Objective-C'],
    data:     ['Jupyter Notebook','R','MATLAB','Julia'],
    devops:   ['Shell','Dockerfile','HCL','Makefile','PowerShell','Nix'],
    systems:  ['C','C++','Assembly','Zig','CUDA']
  };
  const counts = { frontend:0, backend:0, mobile:0, data:0, devops:0, systems:0 };
  const langTotals = {};
  repos.forEach(r => {
    if (!r.language) return;
    langTotals[r.language] = (langTotals[r.language] || 0) + 1;
    for (const [k, list] of Object.entries(groups)) {
      if (list.includes(r.language)) counts[k]++;
    }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const active = sorted.filter(([, v]) => v > 0).length;
  let key = 'adventurer';
  if (active >= 3) {
    if (counts.frontend > 0 && counts.backend > 0 && counts.frontend >= counts.backend * 0.6) key = 'fullstack';
    else key = sorted[0][0];
  } else if (active >= 1) {
    key = sorted[0][0];
  }
  const map = {
    frontend:  { name: 'FRONTEND WARRIOR',  icon: '⚔️', desc: 'Defensor da experiência do usuário' },
    backend:   { name: 'BACKEND MAGE',       icon: '🔮', desc: 'Manipulador de algoritmos no servidor' },
    fullstack: { name: 'FULLSTACK RANGER',   icon: '🏹', desc: 'Preciso em todas as camadas' },
    mobile:    { name: 'MOBILE ASSASSIN',    icon: '🗡️', desc: 'Mestre dos dispositivos' },
    data:      { name: 'DATA ALCHEMIST',     icon: '⚗️', desc: 'Transforma dados em ouro' },
    devops:    { name: 'DEVOPS CLERIC',      icon: '⛪', desc: 'Curador dos pipelines' },
    systems:   { name: 'SYSTEMS BERSERKER',  icon: '🛡️', desc: 'Força bruta de baixo nível' },
    adventurer:{ name: 'CODE ADVENTURER',    icon: '✨', desc: 'Explorador de múltiplas stacks' }
  };
  return { key, ...map[key], langTotals };
}

function calcStats(user) {
  const starsXP = (user.total_stars || 0) * 15;
  const forksXP = (user.total_forks || 0) * 8;
  const reposXP = (user.public_repos_count || 0) * 30;
  const followersXP = (user.followers || 0) * 6;
  const ageYears = (Date.now() - new Date(user.created_at)) / (365.25 * 24 * 3600 * 1000);
  const ageXP = Math.floor(ageYears * 400);
  const totalXP = starsXP + forksXP + reposXP + followersXP + ageXP;
  const XP_PER_LEVEL = 2000;
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpCurrent = totalXP % XP_PER_LEVEL;
  const xpProgress = Math.min((xpCurrent / XP_PER_LEVEL) * 100, 100);
  const hpPct = Math.min(100, Math.round(
    Math.log10(user.followers + 1) * 20 +
    Math.log10(user.total_stars + 1) * 25 +
    Math.log10(user.public_repos_count + 1) * 20
  ));
  return {
    stars: user.total_stars || 0,
    forks: user.total_forks || 0,
    repos: user.public_repos_count || 0,
    followers: user.followers || 0,
    totalXP, level, xpCurrent,
    xpNeeded: XP_PER_LEVEL,
    xpProgress, hpPct
  };
}

function calcRank(xp) {
  if (xp >= 50000) return { rank: 'S', color: '#FFD700', name: 'MONARCH' };
  if (xp >= 25000) return { rank: 'A', color: '#f472b6', name: 'S-RANK' };
  if (xp >= 12000) return { rank: 'B', color: '#c084fc', name: 'ELITE' };
  if (xp >= 5000)  return { rank: 'C', color: '#4fd1c7', name: 'VETERAN' };
  if (xp >= 1500)  return { rank: 'D', color: '#a855f7', name: 'HUNTER' };
  return { rank: 'E', color: '#fc8181', name: 'NOVICE' };
}

function dataYAML(user, cls, stats, rank, langTop) {
  const fl = flag(user.location);
  const langPreview = langTop[0] ? langTop[0][0] : 'Code';
  const totalXPFmt = fmt(stats.totalXP);
  const lines = [];
  const push = (indent, s) => lines.push(' '.repeat(indent) + s);
  const q = (s) => `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

  push(0, 'guild_card:');
  push(2, 'player:');
  push(4, `name: ${q(user.name || user.login)}`);
  push(4, `username: "@${user.login}"`);
  push(4, `avatar: ${q(user.avatar_url)}`);
  push(4, `avatar_fallback: ${q(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.login)}&background=b91c1c&color=fff&size=150`)}`);
  push(4, 'rank:');
  push(6, `code: ${q(rank.rank)}`);
  push(6, `label: ${q(rank.name)}`);
  push(6, `color: ${q(rank.color)}`);
  push(2, 'bio:');
  push(4, 'text: |');
  (user.bio || 'Aventureiro do código').split('\n').forEach(l => push(6, l));
  push(4, 'location:');
  push(6, `flag: ${q(fl)}`);
  push(6, `country: ${q(user.location || 'Terra Desconhecida')}`);
  push(2, 'class:');
  push(4, `name: ${q(cls.name)}`);
  push(4, `specialization: ${q(`${langPreview} Master ${cls.icon}`)}`);
  push(4, `description: ${q(cls.desc)}`);
  push(4, `icon: ${q(cls.icon)}`);
  push(2, 'stats:');
  push(4, `stars: ${stats.stars}`);
  push(4, `forks: ${stats.forks}`);
  push(4, `repositories: ${stats.repos}`);
  push(4, `followers: ${stats.followers}`);
  push(2, 'xp:');
  push(4, `level: ${stats.level}`);
  push(4, `current: ${stats.xpCurrent}`);
  push(4, `next_level: ${stats.xpNeeded}`);
  push(4, `total: ${q(totalXPFmt)}`);
  push(4, `progress_percent: ${Number(stats.xpProgress.toFixed(1))}`);

  push(2, 'featured:');
  const topList = (user.topRepos || []).slice(0, 3);
  if (topList.length) {
    topList.forEach(r => {
      push(4, `- name: ${q(r.name)}`);
      push(6, `stars: ${r.stargazers_count || 0}`);
      push(6, `url: ${q(r.html_url)}`);
      push(6, `description: ${q(r.description || '')}`);
    });
  } else {
    push(4, '[]');
  }

  push(2, 'meta:');
  push(4, `started_at: ${q(new Date(user.created_at).toISOString().split('T')[0])}`);
  push(4, `formatted: ${q(new Date(user.created_at).toLocaleDateString('pt-BR'))}`);
  push(2, 'actions:');
  [['resume','Currículo','fas fa-scroll'],['projects','Projetos','fas fa-project-diagram'],['certificate','Certificado','fas fa-award'],['qr','QR Code','fas fa-qrcode']]
    .forEach(([id, label, icon]) => {
      push(4, `- id: ${q(id)}`);
      push(6, `label: ${q(label)}`);
      push(6, `icon: ${q(icon)}`);
    });
  push(2, 'seal:');
  push(4, 'icon: "fas fa-dragon"');
  push(4, 'title: "GitHub Guild"');
  push(4, 'subtitle: "Gildenkai Authorization"');
  push(2, 'qr_modal:');
  push(4, 'title: "QR Code da Guilda"');
  return lines.join('\n') + '\n';
}

function generateSVG(user, cls, stats, rank) {
  const c = {
    bg1:'#1c0a0a', bg2:'#0d0505',
    accent:'#ef4444', bright:'#fca5a5', deep:'#7f1d1d',
    border:'#b91c1c', text:'#e5e5e5', dim:'#9ca3af'
  };
  const W = 560, H = 340;
  const font = "'Segoe UI',system-ui,-apple-system,sans-serif";
  const mainLang = Object.entries(cls.langTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topList = (user.topRepos || []).slice(0, 3);
  const today = new Date().toLocaleDateString('pt-BR');
  const avX = W - 66, avY = 66, avR = 36;

  const repoLines = topList.length
    ? topList.map((r, i) => `
        <text x="32" y="${268 + i * 20}" font-family="${font}" font-size="13" fill="${c.text}">
            • <tspan font-weight="700">${esc(trunc(r.name, 30))}</tspan> — ⭐ ${r.stargazers_count || 0}
        </text>`).join('')
    : `<text x="32" y="268" font-family="${font}" font-size="13" fill="${c.dim}" font-style="italic">Nenhum repositório em destaque</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.bg1}"/>
      <stop offset="100%" stop-color="${c.bg2}"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${c.accent}"/>
      <stop offset="100%" stop-color="${c.bright}"/>
    </linearGradient>
    <clipPath id="avClip"><circle cx="${avX}" cy="${avY}" r="${avR}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" rx="12" fill="url(#bg)"/>
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="11" fill="none" stroke="${c.border}" stroke-width="2"/>
  <text x="24" y="52" font-family="${font}" font-size="24" font-weight="700" fill="${c.accent}">${esc(trunc(user.name || user.login, 26))}</text>
  <text x="24" y="86" font-family="${font}" font-size="13" fill="${c.text}">
    🎓 ${esc(trunc(user.company || 'Independente', 18))} • 💼 ${esc(user.bio ? trunc(user.bio.split(' ')[0], 16) : 'developer')}
  </text>
  <text x="24" y="112" font-family="${font}" font-size="13" fill="${c.text}">
    ⚔️ ${esc(cls.name)} • 🩸 Rank ${esc(rank.rank)} — ${esc(rank.name)}
  </text>
  <image xlink:href="${esc(user.avatar_url)}" x="${avX - avR}" y="${avY - avR}" width="${avR * 2}" height="${avR * 2}"
         clip-path="url(#avClip)" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="${avX}" cy="${avY}" r="${avR}" fill="none" stroke="${c.border}" stroke-width="2"/>
  <line x1="24" y1="138" x2="${W - 24}" y2="138" stroke="${c.border}" stroke-opacity="0.35"/>
  <text x="24" y="166" font-family="${font}" font-size="13" fill="${c.text}">
    💻 Linguagem principal: <tspan font-weight="700" fill="${c.bright}">${esc(mainLang)}</tspan>
  </text>
  <text x="24" y="192" font-family="${font}" font-size="13" fill="${c.text}">
    🏆 Nível: <tspan font-weight="700" fill="${c.bright}">${stats.level}</tspan> • XP Total: <tspan font-weight="700" fill="${c.bright}">${stats.totalXP}</tspan>
  </text>
  <rect x="24" y="204" width="${W - 48}" height="8" rx="4" fill="rgba(255,255,255,0.06)"/>
  <rect x="24" y="204" width="${(((W - 48) * stats.xpProgress) / 100).toFixed(1)}" height="8" rx="4" fill="url(#bar)"/>
  <text x="24" y="244" font-family="${font}" font-size="14" font-weight="700" fill="${c.bright}">⭐ Destaques:</text>
  ${repoLines}
  <line x1="24" y1="${H - 36}" x2="${W - 24}" y2="${H - 36}" stroke="${c.border}" stroke-opacity="0.35"/>
  <text x="${W / 2}" y="${H - 14}" text-anchor="middle" font-family="${font}" font-size="11" fill="${c.dim}">
    Gerado em ${today} • ${stats.repos} repos • ${stats.stars} ⭐ • ${stats.followers} followers
  </text>
</svg>`;
}

(async () => {
  try {
    console.log(`⚔ Invocando ${USERNAME}...`);
    const user = await fetchUser(USERNAME);
    const cls = detectClass(user.repos);
    const stats = calcStats(user);
    const rank = calcRank(stats.totalXP);
    const langTop = Object.entries(cls.langTotals).sort((a, b) => b[1] - a[1]);

    fs.writeFileSync(OUTPUT_YML, dataYAML(user, cls, stats, rank, langTop), 'utf8');
    console.log(`📄 Data YAML escrito: ${OUTPUT_YML}`);

    fs.writeFileSync(OUTPUT_SVG, generateSVG(user, cls, stats, rank), 'utf8');
    console.log(`🖼️  SVG escrito: ${OUTPUT_SVG}`);

    console.log(`✅ Rank ${rank.rank} — Level ${stats.level} — ${fmt(stats.totalXP)} XP`);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
})();
