/* =========================================================
   ⚔ GuildenKain — Main Generator v6
   - Habilita TODOS os .action-btn de uma vez
   - Bind por classe, não por ID fixo
   - Log de versão pra debug
   ========================================================= */

console.log('⚔ [GuildenKain] Carregando generator v6...');

class GuildCardGenerator {
    constructor() {
        this.VERSION = 'v6';
        this.currentTheme = 'dark';
        this.userData = null;
        this.payload = null;
        this.workflowContent = '';
        this.token = '';
        this.rateLimit = null;
        this.T = window.GuildCardTemplates;
        if (!this.T) {
            console.error('❌ [GuildenKain] GuildCardTemplates NÃO carregou! Verifique a ordem dos <script> no HTML.');
        } else {
            console.log('✅ [GuildenKain] Templates carregados');
        }
        this.init();
    }

    init() {
        this.loadToken();
        this.setupEventListeners();
        this.setupThemeButtons();
        this.setupTokenUI();
        this.checkAPIStatus();
        this.loadAnnouncements();
        this.loadRanks();
        this.loadGuildStats();
        console.log(`✅ [GuildenKain] Generator ${this.VERSION} pronto`);
    }

    /* ---------- TOKEN ---------- */
    loadToken() {
        try { this.token = localStorage.getItem('gk_github_token') || ''; }
        catch (_) { this.token = ''; }
    }

    saveToken(t) {
        this.token = (t || '').trim();
        try {
            if (this.token) localStorage.setItem('gk_github_token', this.token);
            else localStorage.removeItem('gk_github_token');
        } catch (_) {}
    }

    setupTokenUI() {
        const ex = document.getElementById('ghToken');
        if (ex) {
            ex.value = this.token;
            ex.addEventListener('change', (e) => { this.saveToken(e.target.value); this.checkAPIStatus(); });
            return;
        }
        const anchor = document.getElementById('githubUsername');
        if (!anchor || !anchor.parentNode) return;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin:8px 0;display:flex;gap:8px;align-items:center';
        wrap.innerHTML = `
            <input id="ghToken" type="password" placeholder="Token GitHub (opcional)"
                   value="${this.token}" style="flex:1;padding:8px;border-radius:6px;border:1px solid #b91c1c;background:#0d0505;color:#e5e5e5">
            <a href="https://github.com/settings/tokens/new?scopes=public_repo&description=GuildenKain" target="_blank"
               style="font-size:11px;color:#fca5a5">gerar token</a>`;
        anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
        document.getElementById('ghToken').addEventListener('change', (e) => {
            this.saveToken(e.target.value);
            this.checkAPIStatus();
        });
    }

    /* ---------- EVENTOS ---------- */
    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
        });

        const handlers = {
            generateCard:   () => this.generateGuildCard(),
            downloadSvg:    () => this.downloadSvg(),
            copySvg:        () => this.copySvg(),
            downloadYaml:   () => this.downloadYaml(),
            copyYaml:       () => this.copyYaml(),
            downloadBundle: () => this.downloadBundle()
        };

        Object.entries(handlers).forEach(([id, fn]) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', fn);
                console.log(`   ✓ bind: #${id}`);
            } else {
                console.warn(`   ✗ não encontrado: #${id}`);
            }
        });

        const u = document.getElementById('githubUsername');
        if (u) u.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.generateGuildCard(); });
    }

    setupThemeButtons() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
                document.querySelectorAll('.theme-btn').forEach(b => b.dataset.active = 'false');
                e.currentTarget.dataset.active = 'true';
                if (this.userData && this.payload) {
                    this.payload.theme = theme;
                    this.generateCardContent(this.payload);
                }
            });
        });
    }

    setTheme(t) {
        this.currentTheme = t;
        document.body.classList.remove('theme-dark', 'theme-abyss', 'theme-crimson', 'theme-monarch');
        if (t !== 'dark') document.body.classList.add(`theme-${t}`);
    }

    /* ---------- API ---------- */
    async checkAPIStatus() {
        const el = document.getElementById('apiStatus');
        if (!el) return false;
        el.innerHTML = '<i class="fas fa-circle"></i> Verificando...';
        el.className = '';
        try {
            const h = { 'Accept': 'application/vnd.github+json' };
            if (this.token) h['Authorization'] = `Bearer ${this.token}`;
            const r = await fetch('https://api.github.com/rate_limit', { headers: h });
            if (!r.ok) throw 0;
            const d = await r.json();
            const core = d.resources?.core || {};
            this.rateLimit = { remaining: core.remaining ?? 0, limit: core.limit ?? 60 };
            if (this.rateLimit.remaining <= 0) {
                el.innerHTML = '<i class="fas fa-circle"></i> API: limite atingido';
                el.className = 'status-offline';
                return false;
            }
            el.innerHTML = `<i class="fas fa-circle"></i> API: Online ${this.token ? '🔑' : ''}`;
            el.className = 'status-online';
            return true;
        } catch (_) {
            el.innerHTML = '<i class="fas fa-circle"></i> API: Offline';
            el.className = 'status-offline';
            return false;
        }
    }

    /* ---------- FETCH ---------- */
    async fetchGitHubData(username) {
        const h = { 'Accept': 'application/vnd.github+json' };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        const cacheKey = `gk_user_${username}`;
        try {
            const c = JSON.parse(localStorage.getItem(cacheKey) || 'null');
            if (c && Date.now() - c.ts < 5 * 60 * 1000) return c.data;
        } catch (_) {}

        const ur = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers: h });
        if (!ur.ok) {
            if (ur.status === 404) throw new Error('Usuário não encontrado');
            if (ur.status === 403) throw new Error('Limite da API. Adicione um token.');
            throw new Error(`Erro ${ur.status}`);
        }
        const user = await ur.json();
        let repos = [];
        try {
            const r = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: h });
            if (r.ok) repos = await r.json();
        } catch (_) {}

        const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
        const forks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);
        const topRepos = [...repos].filter(r => !r.fork)
            .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 3);

        const result = {
            ...user, repos, topRepos,
            total_stars: stars, total_forks: forks,
            public_repos_count: user.public_repos || 0
        };
        try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result })); } catch (_) {}
        return result;
    }

    /* ---------- CLASS ---------- */
    detectClass(repos) {
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
            for (const [k, l] of Object.entries(groups)) if (l.includes(r.language)) counts[k]++;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const active = sorted.filter(([, v]) => v > 0).length;
        let key = 'adventurer';
        if (active >= 3) {
            if (counts.frontend > 0 && counts.backend > 0 && counts.frontend >= counts.backend * 0.6) key = 'fullstack';
            else key = sorted[0][0];
        } else if (active >= 1) key = sorted[0][0];
        const map = {
            frontend:  { name: 'FRONTEND WARRIOR',  icon: '⚔️', desc: 'Defensor da experiência do usuário' },
            backend:   { name: 'BACKEND MAGE',      icon: '🔮', desc: 'Manipulador de algoritmos no servidor' },
            fullstack: { name: 'FULLSTACK RANGER',  icon: '🏹', desc: 'Preciso em todas as camadas' },
            mobile:    { name: 'MOBILE ASSASSIN',   icon: '🗡️', desc: 'Mestre dos dispositivos' },
            data:      { name: 'DATA ALCHEMIST',    icon: '⚗️', desc: 'Transforma dados em ouro' },
            devops:    { name: 'DEVOPS CLERIC',     icon: '⛪', desc: 'Curador dos pipelines' },
            systems:   { name: 'SYSTEMS BERSERKER', icon: '🛡️', desc: 'Força bruta de baixo nível' },
            adventurer:{ name: 'CODE ADVENTURER',   icon: '✨', desc: 'Explorador de múltiplas stacks' }
        };
        return { key, ...map[key], langTotals };
    }

    /* ---------- STATS ---------- */
    calculateStats(u) {
        const age = (Date.now() - new Date(u.created_at)) / (365.25 * 24 * 3600 * 1000);
        const totalXP = (u.total_stars || 0) * 15 + (u.total_forks || 0) * 8 +
                        (u.public_repos_count || 0) * 30 + (u.followers || 0) * 6 +
                        Math.floor(age * 400);
        const XP_PER_LEVEL = 2000;
        const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
        const xpCurrent = totalXP % XP_PER_LEVEL;
        return {
            stars: u.total_stars || 0, forks: u.total_forks || 0,
            repos: u.public_repos_count || 0, followers: u.followers || 0,
            totalXP, level, xpCurrent, xpNeeded: XP_PER_LEVEL,
            xpProgress: Math.min((xpCurrent / XP_PER_LEVEL) * 100, 100)
        };
    }

    formatNumber(n) { return this.T ? this.T.formatNumber(n) : String(n); }

    calculateRank(xp) {
        if (xp >= 50000) return { rank: 'S', color: '#FFD700', name: 'MONARCH' };
        if (xp >= 25000) return { rank: 'A', color: '#f472b6', name: 'S-RANK' };
        if (xp >= 12000) return { rank: 'B', color: '#c084fc', name: 'ELITE' };
        if (xp >= 5000)  return { rank: 'C', color: '#4fd1c7', name: 'VETERAN' };
        if (xp >= 1500)  return { rank: 'D', color: '#a855f7', name: 'HUNTER' };
        return { rank: 'E', color: '#fc8181', name: 'NOVICE' };
    }

    calculateAchievements(u, stats, cls) {
        const langs = Object.keys(cls.langTotals);
        const age = (Date.now() - new Date(u.created_at)) / (365.25 * 24 * 3600 * 1000);
        return [
            { icon:'🩸', name:'FIRST BLOOD',       unlocked: stats.repos >= 1 },
            { icon:'📚', name:'KNOWLEDGE SEEKER',  unlocked: stats.repos >= 5 },
            { icon:'🧠', name:'MASTER STRATEGIST', unlocked: stats.repos >= 20 },
            { icon:'⚡', name:'PROLIFIC CODER',    unlocked: stats.repos >= 50 },
            { icon:'⭐', name:'STAR SEED',         unlocked: stats.stars >= 50 },
            { icon:'🌟', name:'STAR LORD',         unlocked: stats.stars >= 500 },
            { icon:'💫', name:'CONSTELLATION',     unlocked: stats.stars >= 5000 },
            { icon:'🍴', name:'FORAGER',           unlocked: stats.forks >= 50 },
            { icon:'👥', name:'COMMUNITY LEADER',  unlocked: stats.followers >= 100 },
            { icon:'📢', name:'INFLUENCER',        unlocked: stats.followers >= 1000 },
            { icon:'🔥', name:'VETERAN',           unlocked: age >= 5 },
            { icon:'🏛️', name:'ANCIENT ONE',       unlocked: age >= 10 },
            { icon:'🌐', name:'POLYGLOT',          unlocked: langs.length >= 4 },
            { icon:'🗺️', name:'LINGUA MASTER',     unlocked: langs.length >= 8 }
        ];
    }

    /* ---------- MAIN ---------- */
    async generateGuildCard() {
        const input = document.getElementById('githubUsername');
        const username = (input?.value || '').trim();
        if (!username) { this.showNotification('Digite um username!', 'error'); return; }

        const btn = document.getElementById('generateCard');
        if (btn) btn.disabled = true;
        const card = document.getElementById('guildCard');
        if (card) card.innerHTML = `<div class="card-loading"><i class="fas fa-spinner fa-spin"></i><p>Invocando caçador...</p></div>`;

        try {
            const online = await this.checkAPIStatus();
            if (!online) throw new Error('API indisponível. Adicione um token ou aguarde.');

            this.userData = await this.fetchGitHubData(username);
            const cls = this.detectClass(this.userData.repos);
            const stats = this.calculateStats(this.userData);
            const rank = this.calculateRank(stats.totalXP);
            const ach = this.calculateAchievements(this.userData, stats, cls);
            const langTop = Object.entries(cls.langTotals).sort((a, b) => b[1] - a[1]);

            this.payload = {
                user: this.userData, cls, stats, rank, ach, langTop,
                topRepos: this.userData.topRepos || [],
                theme: this.currentTheme
            };

            const detected = document.getElementById('detectedClass');
            if (detected) detected.innerHTML = `<i class="fas fa-shield-alt"></i> <span>${cls.icon} ${cls.name} — ${cls.desc}</span>`;

            this.generateCardContent(this.payload);
            this.renderAchievements(ach);

            // Gera o workflow apenas se templates existir
            if (this.T && this.T.workflowYAML) {
                this.workflowContent = this.T.workflowYAML(username);
            } else {
                this.workflowContent = '# Erro: templates não carregaram. Verifique guild-card-templates.js';
            }
            const yp = document.getElementById('yamlPreview');
            if (yp) yp.textContent = this.workflowContent;

            // ⬇ HABILITA TODOS OS BOTÕES .action-btn DE UMA VEZ
            this.enableAllActionButtons();

            ['achievementsSection','yamlSection']
                .forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); });

            this.showNotification('Caçador invocado!', 'success');
        } catch (err) {
            console.error(err);
            if (card) card.innerHTML = `<div class="card-loading"><i class="fas fa-exclamation-triangle" style="animation:none;color:#fc8181"></i><p>Erro: ${err.message}</p></div>`;
            this.showNotification(`Erro: ${err.message}`, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    /* ⬇ NOVO: habilita TODOS os botões com classe .action-btn */
    enableAllActionButtons() {
        const btns = document.querySelectorAll('.action-btn');
        console.log(`⚔ [GuildenKain] Habilitando ${btns.length} botões .action-btn`);
        btns.forEach(el => {
            el.disabled = false;
            el.removeAttribute('disabled');
            console.log(`   ✓ habilitado: #${el.id}`);
        });
    }

    /* ---------- PREVIEW ---------- */
    generateCardContent(payload) {
        const { user, cls, stats, rank, langTop, topRepos } = payload;
        const card = document.getElementById('guildCard');
        if (!card) return;
        const mainLang = langTop[0] ? langTop[0][0] : 'N/A';
        const top = (topRepos || []).slice(0, 3);
        const today = new Date().toLocaleDateString('pt-BR');
        const rows = top.length
            ? top.map(r => `<div style="margin:4px 0;font-size:13px">• <strong>${r.name}</strong> — ⭐ ${r.stargazers_count || 0}</div>`).join('')
            : `<div style="margin:4px 0;font-size:13px;opacity:0.5;font-style:italic">Nenhum repositório em destaque</div>`;

        card.innerHTML = `
            <div style="max-width:560px;margin:0 auto;background:linear-gradient(180deg,#1c0a0a,#0d0505);border:2px solid #b91c1c;border-radius:12px;padding:22px 26px;font-family:'Segoe UI',system-ui,sans-serif;color:#e5e5e5;box-shadow:0 0 28px rgba(185,28,28,0.35)">
                <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
                    <div style="flex:1;min-width:0">
                        <div style="font-size:24px;font-weight:700;color:#ef4444;margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.name || user.login}</div>
                        <div style="font-size:13px;margin-bottom:4px">🎓 ${user.company || 'Independente'} • 💼 ${user.bio ? user.bio.split(' ')[0] : 'developer'}</div>
                        <div style="font-size:13px">⚔️ ${cls.name} • 🩸 Rank ${rank.rank} — ${rank.name}</div>
                    </div>
                    <img src="${user.avatar_url}" alt="${user.login}"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.login)}&background=b91c1c&color=fff&size=150'"
                         style="width:76px;height:76px;border-radius:50%;border:2px solid #b91c1c;object-fit:cover;flex-shrink:0">
                </div>
                <div style="height:1px;background:rgba(185,28,28,0.3);margin:16px 0"></div>
                <div style="font-size:13px;margin-bottom:6px">💻 Linguagem principal: <strong style="color:#fca5a5">${mainLang}</strong></div>
                <div style="font-size:13px;margin-bottom:10px">🏆 Nível: <strong style="color:#fca5a5">${stats.level}</strong> • XP Total: <strong style="color:#fca5a5">${stats.totalXP}</strong></div>
                <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;margin-bottom:18px">
                    <div style="height:100%;width:${stats.xpProgress}%;background:linear-gradient(90deg,#ef4444,#fca5a5);border-radius:4px"></div>
                </div>
                <div style="font-size:14px;font-weight:700;color:#fca5a5;margin-bottom:6px">⭐ Destaques:</div>
                ${rows}
                <div style="height:1px;background:rgba(185,28,28,0.3);margin:16px 0 12px"></div>
                <div style="font-size:11px;color:#9ca3af;text-align:center">
                    Gerado em ${today} • ${stats.repos} repos • ${stats.stars} ⭐ • ${stats.followers} seguidores
                </div>
            </div>`;
    }

    renderAchievements(ach) {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;
        grid.innerHTML = ach.map(a => `
            <div class="ach-card ${a.unlocked ? 'unlocked' : 'locked'}">
                <div class="icon" style="color:${a.unlocked ? '#fca5a5' : '#666'}">${a.icon}</div>
                <div class="name">${a.name}</div>
            </div>`).join('');
    }

    /* ---------- AÇÕES ---------- */
    downloadSvg() {
        if (!this.payload || !this.T) return;
        this._saveFile(`guild-card-${this.userData.login}.svg`, this.T.svg(this.payload), 'image/svg+xml');
        this.showNotification('SVG baixado!', 'success');
    }

    async copySvg() {
        if (!this.payload || !this.T) return;
        try { await navigator.clipboard.writeText(this.T.svg(this.payload)); this.showNotification('SVG copiado!', 'success'); }
        catch (_) { this.showNotification('Erro ao copiar SVG', 'error'); }
    }

    downloadYaml() {
        if (!this.workflowContent) { this.showNotification('Gere o cartão primeiro!', 'error'); return; }
        this._saveFile('guild-card.yml', this.workflowContent, 'text/yaml');
        this.showNotification('Workflow baixado! Coloque em .github/workflows/', 'success');
    }

    async copyYaml() {
        if (!this.workflowContent) { this.showNotification('Gere o cartão primeiro!', 'error'); return; }
        try { await navigator.clipboard.writeText(this.workflowContent); this.showNotification('Workflow copiado!', 'success'); }
        catch (_) { this.showNotification('Erro ao copiar Workflow', 'error'); }
    }

    downloadBundle() {
        if (!this.payload || !this.T) return;
        const files = [
            { name: `guild-card-${this.userData.login}.svg`, content: this.T.svg(this.payload), mime: 'image/svg+xml' },
            { name: 'guild-card.yml', content: this.workflowContent, mime: 'text/yaml' },
            { name: 'INSTRUCOES.txt', content: this._instructions(), mime: 'text/plain' }
        ];
        files.forEach((f, i) => setTimeout(() => this._saveFile(f.name, f.content, f.mime), i * 250));
        this.showNotification('Baixando tudo... ⚔', 'success');
    }

    _instructions() {
        return `═══════════════════════════════════════════════════════
  ⚔ GuildenKain — Instruções
═══════════════════════════════════════════════════════

1) No seu repo GitHub, crie: .github/workflows/
2) Coloque "guild-card.yml" dentro.
3) Commit na branch main.
4) Actions → Update Guild Card → Run workflow.
5) Aguarde ~15s. guild-card.svg será commitado.

No README:
  ![Guild Card](./guild-card.svg)

═══════════════════════════════════════════════════════
`;
    }

    _saveFile(name, content, mime) {
        const blob = new Blob([content], { type: mime + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /* ---------- UI ---------- */
    switchTab(tabId) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
    }

    showNotification(msg, type = 'info') {
        document.querySelectorAll('.notification').forEach(n => n.remove());
        const n = document.createElement('div');
        n.className = `notification notification-${type}`;
        n.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i><span>${msg}</span>`;
        document.body.appendChild(n);
        setTimeout(() => { n.style.animation = 'slideOut 0.3s ease'; setTimeout(() => n.remove(), 300); }, 4000);
    }

    loadAnnouncements() {
        const c = document.getElementById('announcements'); if (!c) return;
        const items = [
            { title: '🚀 Workflow Auto-Contido', content: 'Baixe 1 arquivo e jogue no GitHub.', date: '2024-01-25', type: 'update' },
            { title: '⭐ Destaques', content: 'Top 3 repos no cartão.', date: '2024-01-20', type: 'feature' },
            { title: '🖼️ Avatar Embutido', content: 'Avatar vira base64 — funciona no README.', date: '2024-01-15', type: 'update' }
        ];
        c.innerHTML = items.map(a => `<div class="announcement-item"><h4>${a.title}</h4><p>${a.content}</p><small>${a.date} • ${a.type}</small></div>`).join('');
    }

    loadRanks() {
        const c = document.getElementById('ranksList'); if (!c) return;
        const ranks = [
            { rank: 'S', name: 'MONARCH', xp: '50.000+', color: '#FFD700' },
            { rank: 'A', name: 'S-RANK',  xp: '25.000 - 49.999', color: '#f472b6' },
            { rank: 'B', name: 'ELITE',   xp: '12.000 - 24.999', color: '#c084fc' },
            { rank: 'C', name: 'VETERAN', xp: '5.000 - 11.999', color: '#4fd1c7' },
            { rank: 'D', name: 'HUNTER',  xp: '1.500 - 4.999', color: '#a855f7' },
            { rank: 'E', name: 'NOVICE',  xp: '0 - 1.499', color: '#fc8181' }
        ];
        c.innerHTML = ranks.map(r => `<div class="rank-item"><span style="color:${r.color}">${r.rank}</span> <strong>${r.name}</strong> — ${r.xp} XP</div>`).join('');
    }

    loadGuildStats() {
        const c = document.getElementById('guildStats'); if (!c) return;
        const stats = [
            { name: 'Membros', value: '1,247', icon: '👥' },
            { name: 'Cartões', value: '8,942', icon: '🆔' },
            { name: 'Estrelas', value: '2.4M', icon: '⭐' },
            { name: 'Países', value: '89', icon: '🌎' }
        ];
        c.innerHTML = stats.map(s => `<div class="stat-item"><h4>${s.value}</h4><p>${s.icon} ${s.name}</p></div>`).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.guildCardGenerator = new GuildCardGenerator();
});
