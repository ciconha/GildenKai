// generateCard.js
// Rodado no GitHub Actions (Node 18+)
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const USERNAME = process.env.USERNAME;
  const CARD_STYLE = process.env.CARD_STYLE || 'medieval';
  const CARD_SIZE = process.env.CARD_SIZE || 'medium';
  const LAYOUT = process.env.LAYOUT || 'banner';
  const AREA = process.env.AREA || '';
  const EMPRESA = process.env.EMPRESA || '';
  const IDADE = process.env.IDADE || '';
  const INCLUDE_STATS = process.env.INCLUDE_STATS || 'basic';
  const PERSONAL_TOKEN = process.env.PERSONAL_TOKEN || '';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

  if (!USERNAME) {
    console.error('USERNAME não informado. Abortando.');
    process.exit(1);
  }

  const token = PERSONAL_TOKEN || GITHUB_TOKEN || '';
  const headers = token ? { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' } : { Accept: 'application/vnd.github+json' };

  // Fetch user + repos + events
  const userRes = await fetch(`https://api.github.com/users/${USERNAME}`, { headers });
  if (!userRes.ok) {
    const txt = await userRes.text();
    console.error('Erro buscando usuário:', userRes.status, txt);
    process.exit(1);
  }
  const user = await userRes.json();

  const reposRes = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=stars`, { headers });
  const repos = reposRes.ok ? await reposRes.json() : [];

  let events = [];
  try {
    const evRes = await fetch(`https://api.github.com/users/${USERNAME}/events?per_page=100`, { headers });
    events = evRes.ok ? await evRes.json() : [];
  } catch(e) { events = []; }

  const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const forks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
  const commits = events.filter(e => e.type === 'PushEvent').length;
  const prs = events.filter(e => e.type === 'PullRequestEvent').length;
  const issues = events.filter(e => e.type === 'IssuesEvent').length;

  const metadata = {
    public_repos: user.public_repos || 0,
    followers: user.followers || 0,
    stars,
    forks,
    commits,
    prs,
    issues
  };

  // XP calculation (same logic do front pra consistência)
  const totalXP = metadata.public_repos * 60 + metadata.followers * 40 + metadata.stars * 8 + metadata.forks * 4 + metadata.commits * 2 + metadata.prs * 10 + metadata.issues * 5;
  const level = Math.floor(totalXP / 1000) + 1;
  const xpPercent = Math.round((totalXP % 1000) * 100 / 1000);
  let rank;
  if (totalXP < 500) rank = 'F';
  else if (totalXP < 1500) rank = 'E';
  else if (totalXP < 4000) rank = 'D';
  else if (totalXP < 8000) rank = 'C';
  else if (totalXP < 15000) rank = 'B';
  else if (totalXP < 30000) rank = 'A';
  else if (totalXP < 60000) rank = 'S';
  else rank = 'SS';

  const classes = ['Aventureiro','Caçador','Cavaleiro','Mago','Duque','Arquiduque','Rei','Cientista','Bruxo','Destroyer','Divino'];
  const classIndex = Math.min(Math.floor(totalXP / 50000), classes.length - 1);
  const currentClass = classes[classIndex];

  // top 2 repos
  const topRepos = repos.sort((a,b)=>b.stargazers_count - a.stargazers_count).slice(0,2).map(r => ({
    name: r.name,
    desc: r.description || '',
    stars: r.stargazers_count || 0,
    lang: r.language || 'Indefinida'
  }));

  // prepare svg sizes
  const sizes = {
    small: { w: 300, h: 400 },
    medium: { w: 400, h: 500 },
    large: { w: 500, h: 600 }
  };
  const s = sizes[CARD_SIZE] || sizes.medium;

  // pick theme colors by CARD_STYLE
  const themes = {
    medieval: { bg1: '#F4EBD3', bg2: '#D8BFA7', text: '#4B2E2E', accent: '#8B4513' },
    cyberpunk: { bg1: '#0f0c1a', bg2: '#2b003a', text: '#e0e0ff', accent: '#00ffea' },
    fantasy: { bg1: '#F9F7FF', bg2: '#E1D7FF', text: '#3a1f6b', accent: '#7C4DFF' },
    dark: { bg1: '#0f0f12', bg2: '#121217', text: '#dcdcdc', accent: '#ff6b6b' },
    nature: { bg1: '#f4fcf2', bg2: '#d8efe0', text: '#174c31', accent: '#2e8b57' },
    ocean: { bg1: '#e8f6ff', bg2: '#cfeeff', text: '#083d77', accent: '#0077b6' }
  };
  const theme = themes[CARD_STYLE] || themes.medieval;

  // create cards folder
  if (!fs.existsSync('cards')) fs.mkdirSync('cards', { recursive: true });

  // SVG content (avatar external link, text with escapes)
  const safe = txt => String(txt || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}" viewBox="0 0 ${s.w} ${s.h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.bg1}"/>
      <stop offset="100%" stop-color="${theme.bg2}"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" rx="18" fill="url(#g)" stroke="${theme.accent}" stroke-width="4"/>

  <!-- avatar -->
  <image href="${user.avatar_url}" x="24" y="24" width="96" height="96" preserveAspectRatio="xMidYMid slice" clip-path="url(#c1)"/>
  <defs>
    <clipPath id="c1"><circle cx="72" cy="72" r="48"/></clipPath>
  </defs>

  <!-- main text -->
  <text x="136" y="56" font-family="Segoe UI, Tahoma, sans-serif" font-size="20" fill="${theme.text}" font-weight="700">${safe(user.login)}</text>
  <text x="136" y="82" font-family="Segoe UI, Tahoma, sans-serif" font-size="12" fill="${theme.text}">${safe(currentClass)} • Rank ${rank} • Nível ${level}</text>

  <!-- xp bar -->
  <text x="24" y="${s.h - 80}" font-family="Segoe UI" font-size="12" fill="${theme.text}">${totalXP} XP</text>
  <rect x="24" y="${s.h - 68}" width="${s.w - 48}" height="12" rx="6" fill="#eee"/>
  <rect x="24" y="${s.h - 68}" width="${Math.max(8, Math.floor((s.w - 48)*(xpPercent/100)))}" height="12" rx="6" fill="${theme.accent}"/>

  <!-- stats -->
  <text x="136" y="110" font-family="Segoe UI" font-size="12" fill="${theme.text}">🏢 ${safe(EMPRESA || user.company || 'Independente')} • 🧭 ${safe(AREA || user.followers ? user.followers : '')}</text>
  <text x="136" y="130" font-family="Segoe UI" font-size="12" fill="${theme.text}">📚 Repos: ${metadata.public_repos} • ⭐ Stars: ${stars} • 👥 Followers: ${metadata.followers}</text>

  <!-- top repos -->
  <g transform="translate(24,150)">
    <text x="0" y="0" font-family="Segoe UI" font-size="12" fill="${theme.text}" font-weight="700">Projetos em destaque</text>
    ${topRepos.map((p, i) => `
      <text x="0" y="${20 + i*48}" font-family="Segoe UI" font-size="11" fill="${theme.text}">• ${safe(p.name)} — ⭐${p.stars} • ${safe(p.lang)}</text>
      <text x="0" y="${34 + i*48}" font-family="Segoe UI" font-size="10" fill="${theme.text}" opacity="0.9">${safe(p.desc)}</text>
    `).join('')}
  </g>

  <text x="${s.w - 20}" y="${s.h - 12}" text-anchor="end" font-family="Segoe UI" font-size="10" fill="${theme.text}">Gerado por GuildAction • ${new Date().toLocaleDateString()}</text>
</svg>
`;

  const outPath = `cards/${USERNAME}.svg`;
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('SVG salvo em', outPath);

  // Commit & push
  try {
    execSync('git add -A cards/', { stdio: 'inherit' });
    execSync(`git commit -m "🤖 Atualiza Guild Card - ${USERNAME}" || true`, { stdio: 'inherit' });
    // Push may fail if GITHUB_TOKEN lacks permission; it's OK - we capture output
    execSync('git push || true', { stdio: 'inherit' });
    console.log('Commit e push (se permitido) executados.');
  } catch(e) {
    console.error('Erro ao commitar/push:', e.message);
  }
}

main().catch(err => {
  console.error('Erro no generateCard.js:', err);
  process.exit(1);
});
