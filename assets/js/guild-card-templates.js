/* =========================================================
   ⚔ GuildenKain — Templates Module v10.2 (Safe Math)
   ========================================================= */

window.GuildCardTemplates = (function () {
    'use strict';

    console.log('⚔ [Templates] Carregando v10.2...');

    const q = (s) => `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

    function escapeXml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    function formatNumber(n) {
        n = n || 0;
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return String(n);
    }

    function countryFlag(country) {
        if (!country) return '🌍';
        const m = String(country).match(/\b([A-Z]{2})\b/);
        if (!m) return '🌍';
        return m[1].replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
    }

    const THEMES = {
        dark:    { bg1:'#1c0a0a', bg2:'#0d0505', accent:'#ef4444', bright:'#fca5a5', deep:'#7f1d1d', border:'#b91c1c', text:'#e5e5e5', dim:'#9ca3af' },
        abyss:   { bg1:'#03131a', bg2:'#01080c', accent:'#06b6d4', bright:'#67e8f9', deep:'#0e7490', border:'#0891b2', text:'#e5f7ff', dim:'#94a3b8' },
        crimson: { bg1:'#1c0a0a', bg2:'#0d0505', accent:'#ef4444', bright:'#fca5a5', deep:'#7f1d1d', border:'#b91c1c', text:'#e5e5e5', dim:'#9ca3af' },
        monarch: { bg1:'#1a1003', bg2:'#0c0701', accent:'#f59e0b', bright:'#fcd34d', deep:'#92400e', border:'#d97706', text:'#fef3c7', dim:'#a3a380' }
    };
    const themeColors = (t) => THEMES[t] || THEMES.dark;

    /* ============ DATA YAML — guild-card.yml ============ */
    function dataYAML(payload) {
        const { user, cls, stats, rank, langTop, topRepos } = payload;
        const flag = countryFlag(user.location);
        const mainLang = langTop[0] ? langTop[0][0] : 'Code';
        const today = new Date().toLocaleDateString('pt-BR');

        const lines = [];
        const push = (i, s) => lines.push(' '.repeat(i) + s);

        push(0, 'guild_card:');
        push(2, 'player:');
        push(4, `name: ${q(user.name || user.login)}`);
        push(4, `username: ${q('@' + user.login)}`);
        push(4, `avatar: ${q(user.avatar_url)}`);
        push(4, `rank:`);
        push(6, `code: ${q(rank.rank)}`);
        push(6, `label: ${q(rank.name)}`);
        push(6, `color: ${q(rank.color)}`);
        push(2, 'bio:');
        push(4, 'text: |');
        const bio = (user.bio || 'Aventureiro do código').split('\n');
        bio.forEach(l => push(6, l));
        push(4, 'location:');
        push(6, `flag: ${q(flag)}`);
        push(6, `country: ${q(user.location || 'Terra Desconhecida')}`);
        push(2, 'class:');
        push(4, `name: ${q(cls.name)}`);
        push(4, `icon: ${q(cls.icon || '')}`);
        push(2, 'stats:');
        push(4, `stars: ${stats.stars}`);
        push(4, `forks: ${stats.forks}`);
        push(4, `repositories: ${stats.repos}`);
        push(4, `followers: ${stats.followers}`);
        push(2, 'xp:');
        push(4, `level: ${stats.level}`);
        push(4, `total: ${q(formatNumber(stats.totalXP))}`);
        push(4, `progress_percent: ${Number(stats.xpProgress.toFixed(1))}`);
        push(2, 'featured:');
        const top = (topRepos || []).slice(0, 3);
        if (top.length) {
            top.forEach(r => {
                push(4, `- name: ${q(r.name)}`);
                push(6, `stars: ${r.stargazers_count || 0}`);
            });
        } else push(4, '[]');
        push(2, 'meta:');
        push(4, `generated_at: ${q(today)}`);
        return lines.join('\n') + '\n';
    }

    /* ============ WORKFLOW YAML ============ */
    function workflowYAML(username) {
        return `name: Update Guild Card

on:
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * *'
  push:
    branches: [main]
    paths-ignore:
      - 'guild-card.svg'
      - 'guild-card.yml'
      - '**.md'

permissions:
  contents: write

jobs:
  update-card:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Generate Guild Card
        env:
          GH_USERNAME: ${username}
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: node scripts/guild-card.mjs

      - name: Commit & Push
        run: |
          git config user.name "Guild Bot"
          git config user.email "guild-bot@users.noreply.github.com"
          git add guild-card.svg guild-card.yml
          git diff --staged --quiet || git commit -m "Update Guild Card [skip ci]"
          git push
`;
    }

    /* ============ SCRIPT NODE — scripts/guild-card.mjs ============ */
    function scriptNode() {
        const lines = [
            "import fs from 'node:fs';",
            "",
            "const USERNAME = process.env.GH_USERNAME || (process.env.GITHUB_REPOSITORY || '').split('/')[0];",
            "const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';",
            "const OUTPUT_SVG = 'guild-card.svg';",
            "const OUTPUT_YML = 'guild-card.yml';",
            "",
            "if (!USERNAME) { console.error('GH_USERNAME nao definido'); process.exit(1); }",
            "",
            "const HEADERS = TOKEN ? { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json' } : { Accept: 'application/vnd.github+json' };",
            "",
            "async function fetchGH(url) {",
            "  const res = await fetch(url, { headers: HEADERS });",
            "  if (!res.ok) { if (res.status === 404) return null; throw new Error('GitHub ' + res.status); }",
            "  return res.json();",
            "}",
            "",
            "function esc(s) {",
            "  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\\"/g, '&quot;').replace(/'/g, '&apos;');",
            "}",
            "",
            "function trunc(s, n) {",
            "  return s && s.length > n ? s.slice(0, n - 1) + '...' : (s || '');",
            "}",
            "",
            "async function fetchAllData(username) {",
            "  const user = await fetchGH('https://api.github.com/users/' + username);",
            "  if (!user) throw new Error('Usuario nao encontrado');",
            "  const repos = await fetchGH('https://api.github.com/users/' + username + '/repos?per_page=100&sort=updated') || [];",
            "",
            "  const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);",
            "  const forks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);",
            "  const topRepos = repos.filter(r => !r.fork).sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 3);",
            "",
            "  // Detectar Classe",
            "  const groups = {",
            "    frontend: ['JavaScript','TypeScript','HTML','CSS','Vue','Svelte','SCSS','Less','Astro'],",
            "    backend:  ['Python','Java','Go','Rust','Ruby','PHP','C#','Elixir','Scala','Kotlin','Perl','Clojure'],",
            "    mobile:   ['Swift','Kotlin','Dart','Objective-C'],",
            "    data:     ['Jupyter Notebook','R','MATLAB','Julia'],",
            "    devops:   ['Shell','Dockerfile','HCL','Makefile','PowerShell','Nix'],",
            "    systems:  ['C','C++','Assembly','Zig','CUDA']",
            "  };",
            "  const counts = { frontend:0, backend:0, mobile:0, data:0, devops:0, systems:0 };",
            "  const langTotals = {};",
            "  repos.forEach(r => {",
            "    if (!r.language) return;",
            "    langTotals[r.language] = (langTotals[r.language] || 0) + 1;",
            "    for (const [k, list] of Object.entries(groups)) if (list.includes(r.language)) counts[k]++;",
            "  });",
            "  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);",
            "  const active = sorted.filter(([, v]) => v > 0).length;",
            "  let key = 'adventurer';",
            "  if (active >= 3) {",
            "    if (counts.frontend > 0 && counts.backend > 0 && counts.frontend >= counts.backend * 0.6) key = 'fullstack';",
            "    else key = sorted[0][0];",
            "  } else if (active >= 1) key = sorted[0][0];",
            "  const classMap = {",
            "    frontend:  { name: 'FRONTEND WARRIOR', icon: '⚔️' },",
            "    backend:   { name: 'BACKEND MAGE', icon: '🔮' },",
            "    fullstack: { name: 'FULLSTACK RANGER', icon: '🏹' },",
            "    mobile:    { name: 'MOBILE ASSASSIN', icon: '🗡️' },",
            "    data:      { name: 'DATA ALCHEMIST', icon: '⚗️' },",
            "    devops:    { name: 'DEVOPS CLERIC', icon: '⛪' },",
            "    systems:   { name: 'SYSTEMS BERSERKER', icon: '🛡️' },",
            "    adventurer:{ name: 'CODE ADVENTURER', icon: '✨' }",
            "  };",
            "  const cls = { key, ...classMap[key], langTotals };",
            "",
            "  // SAFE MATH: Calcular Stats",
            "  const created = new Date(user.created_at).getTime();",
            "  const now = Date.now();",
            "  const age = isNaN(created) ? 0 : (now - created) / (365.25 * 24 * 3600 * 1000);",
            "  const totalXP = (stars || 0) * 15 + (forks || 0) * 8 + (user.public_repos || 0) * 30 + (user.followers || 0) * 6 + Math.floor((age || 0) * 400);",
            "  const safeTotalXP = isNaN(totalXP) ? 0 : totalXP;",
            "  const safeLevel = Math.floor(safeTotalXP / 2000) + 1;",
            "  const safeXpCurrent = safeTotalXP % 2000;",
            "  const safeXpProgress = isNaN(safeXpCurrent) ? 0 : Math.min((safeXpCurrent / 2000) * 100, 100);",
            "",
            "  const stats = {",
            "    stars: stars || 0, forks: forks || 0, repos: user.public_repos || 0, followers: user.followers || 0,",
            "    totalXP: safeTotalXP, level: safeLevel, xpCurrent: safeXpCurrent, xpNeeded: 2000,",
            "    xpProgress: safeXpProgress",
            "  };",
            "",
            "  // SAFE MATH: Calcular Rank",
            "  let rank = { rank: 'E', color: '#fc8181', name: 'NOVICE' };",
            "  if (safeTotalXP >= 50000) rank = { rank: 'S', color: '#FFD700', name: 'MONARCH' };",
            "  else if (safeTotalXP >= 25000) rank = { rank: 'A', color: '#f472b6', name: 'S-RANK' };",
            "  else if (safeTotalXP >= 12000) rank = { rank: 'B', color: '#c084fc', name: 'ELITE' };",
            "  else if (safeTotalXP >= 5000) rank = { rank: 'C', color: '#4fd1c7', name: 'VETERAN' };",
            "  else if (safeTotalXP >= 1500) rank = { rank: 'D', color: '#a855f7', name: 'HUNTER' };",
            "",
            "  const langTop = Object.entries(langTotals).sort((a, b) => b[1] - a[1]);",
            "  return { user, repos, topRepos, cls, stats, rank, langTop };",
            "}",
            "",
            "async function avatarToDataURL(url) {",
            "  try {",
            "    const res = await fetch(url);",
            "    if (!res.ok) return url;",
            "    const buf = Buffer.from(await res.arrayBuffer());",
            "    const ct = res.headers.get('content-type') || 'image/png';",
            "    return 'data:' + ct + ';base64,' + buf.toString('base64');",
            "  } catch (_) { return url; }",
            "}",
            "",
            "async function run() {",
            "  console.log('Invocando ' + USERNAME + '...');",
            "  const data = await fetchAllData(USERNAME);",
            "  const avatar = await avatarToDataURL(data.user.avatar_url);",
            "",
            "  const c = { bg1:'#1c0a0a', bg2:'#0d0505', accent:'#ef4444', bright:'#fca5a5', deep:'#7f1d1d', border:'#b91c1c', text:'#e5e5e5', dim:'#9ca3af' };",
            "  const W = 560, H = 340;",
            "  const F = 'Segoe UI,Helvetica,Arial,sans-serif';",
            "  const mainLang = data.langTop[0] ? data.langTop[0][0] : 'N/A';",
            "  const top = (data.topRepos || []).slice(0, 3);",
            "  const today = new Date().toLocaleDateString('pt-BR');",
            "  const avX = W - 66, avY = 66, avR = 36;",
            "",
            "  let rows = '';",
            "  if (top.length) {",
            "    rows = top.map((r, i) => '<text x=\"32\" y=\"' + (268 + i * 20) + '\" font-family=\"' + F + '\" font-size=\"13\" fill=\"' + c.text + '\">• ' + esc(trunc(r.name, 32)) + ' — ⭐ ' + (r.stargazers_count || 0) + '</text>').join('');",
            "  } else {",
            "    rows = '<text x=\"32\" y=\"268\" font-family=\"' + F + '\" font-size=\"13\" fill=\"' + c.dim + '\" font-style=\"italic\">Nenhum repositório em destaque</text>';",
            "  }",
            "",
            "  const p = [];",
            "  p.push('<?xml version=\"1.0\" encoding=\"UTF-8\"?>');",
            "  p.push('<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"' + W + '\" height=\"' + H + '\" viewBox=\"0 0 ' + W + ' ' + H + '\">');",
            "  p.push('  <defs>');",
            "  p.push('    <linearGradient id=\"bgGrad\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\" stop-color=\"' + c.bg1 + '\"/><stop offset=\"100%\" stop-color=\"' + c.bg2 + '\"/></linearGradient>');",
            "  p.push('    <linearGradient id=\"barGrad\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0%\" stop-color=\"' + c.accent + '\"/><stop offset=\"100%\" stop-color=\"' + c.bright + '\"/></linearGradient>');",
            "  p.push('    <clipPath id=\"avClip\"><circle cx=\"' + avX + '\" cy=\"' + avY + '\" r=\"' + avR + '\"/></clipPath>');",
            "  p.push('  </defs>');",
            "  p.push('  <rect width=\"' + W + '\" height=\"' + H + '\" rx=\"12\" fill=\"url(#bgGrad)\"/>');",
            "  p.push('  <rect x=\"2\" y=\"2\" width=\"' + (W - 4) + '\" height=\"' + (H - 4) + '\" rx=\"11\" fill=\"none\" stroke=\"' + c.border + '\" stroke-width=\"2\"/>');",
            "  p.push('  <text x=\"24\" y=\"52\" font-family=\"' + F + '\" font-size=\"24\" font-weight=\"700\" fill=\"' + c.accent + '\">' + esc(trunc(data.user.name || data.user.login, 26)) + '</text>');",
            "  p.push('  <text x=\"24\" y=\"86\" font-family=\"' + F + '\" font-size=\"13\" fill=\"' + c.text + '\">🎓 ' + esc(trunc(data.user.company || 'Independente', 20)) + ' • 💼 ' + esc(data.user.bio ? trunc(data.user.bio.split(' ')[0], 18) : 'developer') + '</text>');",
            "  p.push('  <text x=\"24\" y=\"112\" font-family=\"' + F + '\" font-size=\"13\" fill=\"' + c.text + '\">⚔️ ' + esc(data.cls.name) + ' • 🩸 Rank ' + esc(data.rank.rank) + ' — ' + esc(data.rank.name) + '</text>');",
            "  if (avatar.startsWith('data:')) {",
            "    p.push('  <image xlink:href=\"' + avatar + '\" x=\"' + (avX - avR) + '\" y=\"' + (avY - avR) + '\" width=\"' + (avR * 2) + '\" height=\"' + (avR * 2) + '\" clip-path=\"url(#avClip)\" preserveAspectRatio=\"xMidYMid slice\"/>');",
            "  } else {",
            "    p.push('  <circle cx=\"' + avX + '\" cy=\"' + avY + '\" r=\"' + avR + '\" fill=\"' + c.deep + '\"/>');",
            "    p.push('  <text x=\"' + avX + '\" y=\"' + (avY + 12) + '\" text-anchor=\"middle\" font-family=\"' + F + '\" font-size=\"32\" font-weight=\"700\" fill=\"' + c.bright + '\">' + (data.user.name || data.user.login).charAt(0).toUpperCase() + '</text>');",
            "  }",
            "  p.push('  <circle cx=\"' + avX + '\" cy=\"' + avY + '\" r=\"' + avR + '\" fill=\"none\" stroke=\"' + c.border + '\" stroke-width=\"2\"/>');",
            "  p.push('  <line x1=\"24\" y1=\"138\" x2=\"' + (W - 24) + '\" y2=\"138\" stroke=\"' + c.border + '\" stroke-opacity=\"0.35\"/>');",
            "  p.push('  <text x=\"24\" y=\"166\" font-family=\"' + F + '\" font-size=\"13\" fill=\"' + c.text + '\">💻 Linguagem principal: <tspan font-weight=\"700\" fill=\"' + c.bright + '\">' + esc(mainLang) + '</tspan></text>');",
            "  p.push('  <text x=\"24\" y=\"192\" font-family=\"' + F + '\" font-size=\"13\" fill=\"' + c.text + '\">🏆 Nível: <tspan font-weight=\"700\" fill=\"' + c.bright + '\">' + data.stats.level + '</tspan> • XP Total: <tspan font-weight=\"700\" fill=\"' + c.bright + '\">' + data.stats.totalXP + '</tspan></text>');",
            "  p.push('  <rect x=\"24\" y=\"204\" width=\"' + (W - 48) + '\" height=\"8\" rx=\"4\" fill=\"rgba(255,255,255,0.06)\"/>');",
            "  p.push('  <rect x=\"24\" y=\"204\" width=\"' + (((W - 48) * data.stats.xpProgress) / 100).toFixed(1) + '\" height=\"8\" rx=\"4\" fill=\"url(#barGrad)\"/>');",
            "  p.push('  <text x=\"24\" y=\"244\" font-family=\"' + F + '\" font-size=\"14\" font-weight=\"700\" fill=\"' + c.bright + '\">⭐ Destaques:</text>');",
            "  p.push('  ' + rows);",
            "  p.push('  <line x1=\"24\" y1=\"' + (H - 36) + '\" x2=\"' + (W - 24) + '\" y2=\"' + (H - 36) + '\" stroke=\"' + c.border + '\" stroke-opacity=\"0.35\"/>');",
            "  p.push('  <text x=\"' + (W / 2) + '\" y=\"' + (H - 14) + '\" text-anchor=\"middle\" font-family=\"' + F + '\" font-size=\"11\" fill=\"' + c.dim + '\">Gerado em ' + today + ' • ' + data.stats.repos + ' repos • ' + data.stats.stars + ' ⭐ • ' + data.stats.followers + ' seguidores</text>');",
            "  p.push('</svg>');",
            "  const finalSvg = p.join('\\n');",
            "",
            "  // Gerar YAML para salvar",
            "  const lines = [",
            "    'guild_card:',",
            "    '  player:',",
            "    '    name: \"' + (data.user.name || data.user.login) + '\"',",
            "    '    username: \"@' + data.user.login + '\"',",
            "    '  class:',",
            "    '    name: \"' + data.cls.name + '\"',",
            "    '  stats:',",
            "    '    stars: ' + data.stats.stars,",
            "    '    forks: ' + data.stats.forks,",
            "    '    repositories: ' + data.stats.repos,",
            "    '    followers: ' + data.stats.followers,",
            "    '  xp:',",
            "    '    level: ' + data.stats.level,",
            "    '    total: \"' + data.stats.totalXP + '\"',",
            "    '  meta:',",
            "    '    generated_at: \"' + today + '\"'",
            "  ];",
            "  const finalYml = lines.join('\\n');",
            "",
            "  fs.writeFileSync(OUTPUT_SVG, finalSvg, 'utf8');",
            "  fs.writeFileSync(OUTPUT_YML, finalYml, 'utf8');",
            "  console.log('SVG e YML gerados com sucesso!');",
            "}",
            "",
            "run().catch(err => { console.error('Erro:', err.message); process.exit(1); });"
        ];
        return lines.join('\n');
    }

    /* ============ SVG (browser) — preview ============ */
    function svg(payload) {
        const { user, cls, stats, rank, langTop, topRepos, theme, avatarDataUrl } = payload;
        const c = themeColors(theme);
        const W = 560, H = 340;
        const font = "'Segoe UI',system-ui,-apple-system,sans-serif";
        const trunc = (s, n) => s && s.length > n ? s.slice(0, n - 1) + '…' : (s || '');
        const mainLang = langTop[0] ? langTop[0][0] : 'N/A';
        const top = (topRepos || []).slice(0, 3);
        const today = new Date().toLocaleDateString('pt-BR');
        const avX = W - 66, avY = 66, avR = 36;

        // SAFE MATH para a UI também
        const safeLevel = isNaN(stats.level) ? 1 : stats.level;
        const safeTotalXP = isNaN(stats.totalXP) ? 0 : stats.totalXP;
        const safeXpProgress = isNaN(stats.xpProgress) ? 0 : stats.xpProgress;

        const initial = ((user.name || user.login || '?').trim()[0] || '?').toUpperCase();
        const hasData = !!(avatarDataUrl && avatarDataUrl.startsWith('data:'));
        const avatarBlock = hasData
            ? `<image xlink:href="${avatarDataUrl}" x="${avX - avR}" y="${avY - avR}" width="${avR * 2}" height="${avR * 2}" clip-path="url(#avClip)" preserveAspectRatio="xMidYMid slice"/>`
            : `<circle cx="${avX}" cy="${avY}" r="${avR}" fill="${c.deep}"/><text x="${avX}" y="${avY + 12}" text-anchor="middle" font-family="${font}" font-size="32" font-weight="700" fill="${c.bright}">${escapeXml(initial)}</text>`;

        const repoLines = top.length
            ? top.map((r, i) => `<text x="32" y="${268 + i * 20}" font-family="${font}" font-size="13" fill="${c.text}">• <tspan font-weight="700">${escapeXml(trunc(r.name, 32))}</tspan> — ⭐ ${r.stargazers_count || 0}</text>`).join('')
            : `<text x="32" y="268" font-family="${font}" font-size="13" fill="${c.dim}" font-style="italic">Nenhum repositório em destaque</text>`;

        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c.bg1}"/><stop offset="100%" stop-color="${c.bg2}"/></linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c.accent}"/><stop offset="100%" stop-color="${c.bright}"/></linearGradient>
    <clipPath id="avClip"><circle cx="${avX}" cy="${avY}" r="${avR}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" rx="12" fill="url(#bg)"/>
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="11" fill="none" stroke="${c.border}" stroke-width="2"/>
  <text x="24" y="52" font-family="${font}" font-size="24" font-weight="700" fill="${c.accent}">${escapeXml(trunc(user.name || user.login, 26))}</text>
  <text x="24" y="86" font-family="${font}" font-size="13" fill="${c.text}">🎓 ${escapeXml(trunc(user.company || 'Independente', 20))} • 💼 ${escapeXml(user.bio ? trunc(user.bio.split(' ')[0], 18) : 'developer')}</text>
  <text x="24" y="112" font-family="${font}" font-size="13" fill="${c.text}">⚔️ ${escapeXml(cls.name)} • 🩸 Rank ${escapeXml(rank.rank)} — ${escapeXml(rank.name)}</text>
  ${avatarBlock}
  <circle cx="${avX}" cy="${avY}" r="${avR}" fill="none" stroke="${c.border}" stroke-width="2"/>
  <line x1="24" y1="138" x2="${W - 24}" y2="138" stroke="${c.border}" stroke-opacity="0.35"/>
  <text x="24" y="166" font-family="${font}" font-size="13" fill="${c.text}">💻 Linguagem principal: <tspan font-weight="700" fill="${c.bright}">${escapeXml(mainLang)}</tspan></text>
  <text x="24" y="192" font-family="${font}" font-size="13" fill="${c.text}">🏆 Nível: <tspan font-weight="700" fill="${c.bright}">${safeLevel}</tspan> • XP Total: <tspan font-weight="700" fill="${c.bright}">${safeTotalXP}</tspan></text>
  <rect x="24" y="204" width="${W - 48}" height="8" rx="4" fill="rgba(255,255,255,0.06)"/>
  <rect x="24" y="204" width="${(((W - 48) * safeXpProgress) / 100).toFixed(1)}" height="8" rx="4" fill="url(#bar)"/>
  <text x="24" y="244" font-family="${font}" font-size="14" font-weight="700" fill="${c.bright}">⭐ Destaques:</text>
  ${repoLines}
  <line x1="24" y1="${H - 36}" x2="${W - 24}" y2="${H - 36}" stroke="${c.border}" stroke-opacity="0.35"/>
  <text x="${W / 2}" y="${H - 14}" text-anchor="middle" font-family="${font}" font-size="11" fill="${c.dim}">Gerado em ${today} • ${stats.repos} repos • ${stats.stars} ⭐ • ${stats.followers} seguidores</text>
</svg>`;
    }

    console.log('✅ [Templates] v10.2 pronto');
    return { dataYAML, workflowYAML, scriptNode, svg, themeColors, escapeXml, formatNumber, countryFlag, THEMES };
})();
