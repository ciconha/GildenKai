/* =========================================================
   ⚔ GuildenKain — GitHub Guild Card Generator
   Solo Leveling System • Complete Card Generator
   ========================================================= */

class GuildCardGenerator {
    constructor() {
        this.currentTheme = 'dark';
        this.userData = null;
        this.payload = null;
        this.dataYamlContent = '';
        this.workflowYamlContent = '';
        this.nodeScriptContent = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeButtons();
        this.checkAPIStatus();
        this.loadAnnouncements();
        this.loadRanks();
        this.loadGuildStats();
    }

    /* ===================================================
       EVENTOS
       =================================================== */
    setupEventListeners() {
        // Navegação entre abas
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Gerar cartão
        document.getElementById('generateCard').addEventListener('click', () => this.generateGuildCard());

        // Enter no input
        document.getElementById('githubUsername').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.generateGuildCard();
        });

        // Botões de ação
        document.getElementById('downloadSvg').addEventListener('click', () => this.downloadSvg());
        document.getElementById('copySvg').addEventListener('click', () => this.copySvg());
        document.getElementById('copyDataYaml').addEventListener('click', () => this.copyDataYaml());
        document.getElementById('copyWorkflowYaml').addEventListener('click', () => this.copyWorkflowYaml());
        document.getElementById('downloadBundle').addEventListener('click', () => this.downloadBundle());
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

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.classList.remove('theme-dark', 'theme-abyss', 'theme-crimson', 'theme-mystic');
        if (theme !== 'dark') document.body.classList.add(`theme-${theme}`);
    }

    /* ===================================================
       API STATUS
       =================================================== */
    async checkAPIStatus() {
        const statusElement = document.getElementById('apiStatus');
        try {
            const response = await fetch('https://api.github.com');
            if (response.ok) {
                statusElement.innerHTML = '<i class="fas fa-circle"></i> GitHub API: Online';
                statusElement.className = 'status-online';
                return true;
            }
            throw new Error('offline');
        } catch (error) {
            statusElement.innerHTML = '<i class="fas fa-circle"></i> GitHub API: Offline';
            statusElement.className = 'status-offline';
            return false;
        }
    }

    /* ===================================================
       FETCH GITHUB
       =================================================== */
    async fetchGitHubData(username) {
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) {
            if (userRes.status === 404) throw new Error('Usuário não encontrado no GitHub');
            if (userRes.status === 403) throw new Error('Rate limit do GitHub. Tente em alguns minutos.');
            throw new Error(`Erro ${userRes.status}`);
        }
        const user = await userRes.json();

        let repos = [];
        try {
            const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
            if (reposRes.ok) repos = await reposRes.json();
        } catch (_) {}

        let events = [];
        try {
            const evRes = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
            if (evRes.ok) events = await evRes.json();
        } catch (_) {}

        let contributions = [];
        try {
            const cRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
            if (cRes.ok) {
                const cData = await cRes.json();
                contributions = cData.contributions || [];
            }
        } catch (_) {}

        const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
        const forks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);

        return {
            ...user,
            repos,
            events,
            contributions,
            total_stars: stars,
            total_forks: forks,
            public_repos_count: user.public_repos || 0,
            total_contributions: events.length
        };
    }

    /* ===================================================
       DETECÇÃO AUTOMÁTICA DE CLASSE
       =================================================== */
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

    /* ===================================================
       XP / RANK / LEVEL / HP
       =================================================== */
    calculateStats(userData) {
        const starsXP = (userData.total_stars || 0) * 15;
        const forksXP = (userData.total_forks || 0) * 8;
        const reposXP = (userData.public_repos_count || 0) * 30;
        const followersXP = (userData.followers || 0) * 6;
        const ageYears = (Date.now() - new Date(userData.created_at)) / (365.25 * 24 * 3600 * 1000);
        const ageXP = Math.floor(ageYears * 400);

        const totalXP = starsXP + forksXP + reposXP + followersXP + ageXP;
        const XP_PER_LEVEL = 2000;
        const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
        const xpCurrent = totalXP % XP_PER_LEVEL;
        const xpProgress = Math.min((xpCurrent / XP_PER_LEVEL) * 100, 100);

        const hpPct = Math.min(100, Math.round(
            Math.log10(userData.followers + 1) * 20 +
            Math.log10(userData.total_stars + 1) * 25 +
            Math.log10(userData.public_repos_count + 1) * 20
        ));

        return {
            stars: userData.total_stars || 0,
            forks: userData.total_forks || 0,
            repos: userData.public_repos_count || 0,
            followers: userData.followers || 0,
            totalXP,
            level,
            xpCurrent,
            xpNeeded: XP_PER_LEVEL,
            xpProgress,
            hpPct
        };
    }

    formatNumber(num) {
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return String(num);
    }

    calculateRank(totalXP) {
        if (totalXP >= 50000) return { rank: 'S', color: '#FFD700', name: 'MONARCH',  description: 'Mestre Supremo' };
        if (totalXP >= 25000) return { rank: 'A', color: '#f472b6', name: 'S-RANK',   description: 'Elite' };
        if (totalXP >= 12000) return { rank: 'B', color: '#c084fc', name: 'ELITE',    description: 'Veterano Elite' };
        if (totalXP >= 5000)  return { rank: 'C', color: '#4fd1c7', name: 'VETERAN',  description: 'Veterano' };
        if (totalXP >= 1500)  return { rank: 'D', color: '#a855f7', name: 'HUNTER',   description: 'Caçador' };
        return { rank: 'E', color: '#fc8181', name: 'NOVICE', description: 'Novato' };
    }

    /* ===================================================
       CONQUISTAS DINÂMICAS
       =================================================== */
    calculateAchievements(userData, stats, cls) {
        const langs = Object.keys(cls.langTotals);
        const age = (Date.now() - new Date(userData.created_at)) / (365.25 * 24 * 3600 * 1000);
        const totalContribs = userData.contributions
            ? userData.contributions.reduce((a, d) => a + (d.count || 0), 0)
            : 0;

        return [
            { id:'first_blood',   icon:'🩸', name:'FIRST BLOOD',       desc:'Criou seu primeiro repositório',      unlocked: stats.repos >= 1 },
            { id:'knowledge',     icon:'📚', name:'KNOWLEDGE SEEKER',  desc:'Publicou 5+ repositórios',            unlocked: stats.repos >= 5 },
            { id:'strategist',    icon:'🧠', name:'MASTER STRATEGIST', desc:'Publicou 20+ repositórios',           unlocked: stats.repos >= 20 },
            { id:'prolific',      icon:'⚡', name:'PROLIFIC CODER',    desc:'Publicou 50+ repositórios',           unlocked: stats.repos >= 50 },
            { id:'star_seed',     icon:'⭐', name:'STAR SEED',         desc:'Coletou 50+ estrelas',                unlocked: stats.stars >= 50 },
            { id:'star_lord',     icon:'🌟', name:'STAR LORD',         desc:'Coletou 500+ estrelas',               unlocked: stats.stars >= 500 },
            { id:'constellation', icon:'💫', name:'CONSTELLATION',     desc:'Coletou 5000+ estrelas',              unlocked: stats.stars >= 5000 },
            { id:'forager',       icon:'🍴', name:'FORAGER',           desc:'Recebeu 50+ forks',                   unlocked: stats.forks >= 50 },
            { id:'community',     icon:'👥', name:'COMMUNITY LEADER',  desc:'Alcançou 100+ seguidores',            unlocked: stats.followers >= 100 },
            { id:'influencer',    icon:'📢', name:'INFLUENCER',        desc:'Alcançou 1000+ seguidores',           unlocked: stats.followers >= 1000 },
            { id:'veteran',       icon:'🔥', name:'VETERAN',           desc:'Conta com 5+ anos',                   unlocked: age >= 5 },
            { id:'ancient',       icon:'🏛️', name:'ANCIENT ONE',       desc:'Conta com 10+ anos',                  unlocked: age >= 10 },
            { id:'polyglot',      icon:'🌐', name:'POLYGLOT',          desc:'Usa 4+ linguagens',                   unlocked: langs.length >= 4 },
            { id:'polyglot_m',    icon:'🗺️', name:'LINGUA MASTER',     desc:'Usa 8+ linguagens',                   unlocked: langs.length >= 8 },
            { id:'active',        icon:'📅', name:'ACTIVE HUNTER',     desc:'500+ contribuições no último ano',    unlocked: totalContribs >= 500 },
            { id:'grinder',       icon:'⚙️', name:'GRINDER',           desc:'2000+ contribuições no último ano',   unlocked: totalContribs >= 2000 }
        ];
    }

    /* ===================================================
       HEATMAP
       =================================================== */
    buildHeatmap(contributions, weeks = 26) {
        let cells = [];
        if (contributions && contributions.length) {
            cells = contributions.slice(-weeks * 7).map(d => d.count || 0);
        } else {
            cells = Array.from({ length: weeks * 7 }, () => 0);
        }
        const max = Math.max(...cells, 1);
        return cells.map(v => v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));
    }

    heatHTML(levels) {
        return levels.map(l => `<div class="sl-heat-cell ${l ? 'l' + l : ''}"></div>`).join('');
    }

    /* ===================================================
       GERAÇÃO DO CARTÃO (main)
       =================================================== */
    async generateGuildCard() {
        const username = document.getElementById('githubUsername').value.trim();
        if (!username) {
            this.showNotification('Digite um nome de usuário do GitHub!', 'error');
            return;
        }

        const btn = document.getElementById('generateCard');
        btn.disabled = true;

        const cardElement = document.getElementById('guildCard');
        cardElement.innerHTML = `
            <div class="card-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Invocando caçador...</p>
            </div>`;

        try {
            const apiOnline = await this.checkAPIStatus();
            if (!apiOnline) throw new Error('GitHub API indisponível');

            this.userData = await this.fetchGitHubData(username);

            const cls = this.detectClass(this.userData.repos);
            const stats = this.calculateStats(this.userData);
            const rank = this.calculateRank(stats.totalXP);
            const ach = this.calculateAchievements(this.userData, stats, cls);
            const langTop = Object.entries(cls.langTotals).sort((a, b) => b[1] - a[1]);
            const heatLevels = this.buildHeatmap(this.userData.contributions);

            this.payload = {
                user: this.userData,
                cls, stats, rank, ach, langTop, heatLevels,
                theme: this.currentTheme
            };

            // Classe detectada
            const detected = document.getElementById('detectedClass');
            detected.innerHTML = `<i class="fas fa-shield-alt"></i> <span>${cls.icon} ${cls.name} — ${cls.desc}</span>`;

            // Render
            this.generateCardContent(this.payload);
            this.renderAchievements(ach);

            // 3 YAMLs
            this.dataYamlContent     = this.generateDataYAML(this.payload);
            this.workflowYamlContent = this.generateWorkflowYAML(username);
            this.nodeScriptContent   = this.generateNodeScript();

            document.getElementById('dataYamlPreview').textContent = this.dataYamlContent;
            document.getElementById('yamlPreview').textContent     = this.workflowYamlContent;
            document.getElementById('scriptPreview').textContent   = this.nodeScriptContent;

            // Habilita botões
            ['downloadSvg','copySvg','copyDataYaml','copyWorkflowYaml','downloadBundle']
                .forEach(id => document.getElementById(id).disabled = false);

            ['achievementsSection','yamlSection','dataYamlSection','scriptSection']
                .forEach(id => document.getElementById(id).classList.remove('hidden'));

            this.showNotification('Caçador invocado com sucesso!', 'success');
        } catch (error) {
            console.error(error);
            cardElement.innerHTML = `
                <div class="card-loading">
                    <i class="fas fa-exclamation-triangle" style="animation:none;color:#fc8181"></i>
                    <p>Erro: ${error.message}</p>
                </div>`;
            this.showNotification(`Erro: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    /* ===================================================
       RENDER DO CARTÃO
       =================================================== */
    generateCardContent(payload) {
        const { user, cls, stats, rank, ach, langTop, heatLevels, theme } = payload;
        const cardElement = document.getElementById('guildCard');

        const quests = [
            { label: 'Name',     value: user.name || user.login },
            { label: 'Bio',      value: user.bio || '—' },
            { label: 'Location', value: user.location || 'Unknown' },
            { label: 'Company',  value: user.company || '—' },
            { label: 'Joined',   value: new Date(user.created_at).toLocaleDateString('pt-BR') }
        ];

        const achHTML = ach.map(a => `
            <div class="sl-ach ${a.unlocked ? 'unlocked' : 'locked'}" title="${a.name} — ${a.desc}">
                <div class="sl-ach-icon">${a.icon}</div>
                <div class="sl-ach-name">${a.name}</div>
            </div>`).join('');

        const skillsHTML = langTop.slice(0, 4).map(([lang, count]) => {
            const max = langTop[0][1] || 1;
            const pct = Math.round((count / max) * 100);
            return `
                <div class="sl-skill">
                    <div class="sl-skill-head"><span class="lang">${lang}</span><span>${count}</span></div>
                    <div class="sl-skill-bar"><div class="sl-skill-fill" style="width:${pct}%"></div></div>
                </div>`;
        }).join('') || '<div style="color:var(--dark-secondary);font-size:11px">Sem dados de linguagem</div>';

        cardElement.innerHTML = `
            <div class="sl-card theme-${theme === 'dark' ? 'shadow' : theme}">
                <div class="sl-card-header">
                    <h1 class="sl-title">GuildenKain</h1>
                    <div class="sl-subtitle">◈ GITHUB GUILD CARD ◈</div>
                </div>

                <div class="sl-card-grid">
                    <div class="sl-panel">
                        <div class="sl-panel-title">QUEST LOG</div>
                        <div class="sl-quest-list">
                            ${quests.map(q => `
                                <div class="sl-quest-item done">
                                    <span class="q-check"></span>
                                    <span class="q-label">${q.label}</span>
                                    <span class="q-value" title="${q.value}">${q.value}</span>
                                </div>`).join('')}
                        </div>
                    </div>

                    <div class="sl-panel">
                        <div class="sl-panel-title">ACHIEVEMENTS (${ach.filter(a => a.unlocked).length}/${ach.length})</div>
                        <div class="sl-ach-grid">${achHTML}</div>
                    </div>

                    <div class="sl-avatar-zone">
                        <div class="sl-avatar-ring">
                            <img class="sl-avatar-img" src="${user.avatar_url}" alt="${user.login}"
                                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.login)}&background=4c1d95&color=fff&size=300'">
                        </div>
                        <div class="sl-rank-badge" style="color:${rank.color};border-color:${rank.color}">
                            RANK ${rank.rank} — ${rank.name}
                        </div>
                        <div class="sl-hunter-name">${user.name || user.login}</div>
                        <div class="sl-hunter-class">${cls.icon} ${cls.name}</div>
                    </div>

                    <div class="sl-panel">
                        <div class="sl-panel-title">LEVEL UP PROGRESSION</div>
                        <div class="sl-level-display">
                            <span class="sl-level-icon">⚔</span>
                            <span class="sl-level-num">LEVEL ${stats.level}</span>
                        </div>
                        <div class="sl-xp-bar">
                            <div class="sl-xp-fill" style="width:${stats.xpProgress}%"></div>
                        </div>
                        <div class="sl-xp-text">${stats.xpCurrent} / ${stats.xpNeeded} XP</div>
                    </div>

                    <div class="sl-panel">
                        <div class="sl-panel-title">CHARACTER STATS</div>
                        <div class="sl-stat-row"><span class="k">LEVEL</span><span class="v">${stats.level}</span></div>
                        <div class="sl-stat-row">
                            <span class="k">HP</span>
                            <div class="sl-hp-bar"><div class="sl-hp-fill" style="width:${stats.hpPct}%"></div></div>
                            <span class="v">${stats.hpPct}%</span>
                        </div>
                        <div class="sl-stat-row"><span class="k">COINS</span><span class="v">🪙 ${this.formatNumber(stats.stars)}</span></div>
                        <div class="sl-stat-row"><span class="k">REPOS</span><span class="v">${stats.repos}</span></div>
                        <div class="sl-stat-row"><span class="k">FOLLOWERS</span><span class="v">${this.formatNumber(stats.followers)}</span></div>
                        <div class="sl-stat-row"><span class="k">TOTAL XP</span><span class="v">${this.formatNumber(stats.totalXP)}</span></div>
                    </div>

                    <div class="sl-panel">
                        <div class="sl-panel-title">SKILL DISTRIBUTION</div>
                        ${skillsHTML}
                    </div>

                    <div class="sl-panel" style="grid-column: 1 / -1;">
                        <div class="sl-panel-title">ACTIVITY LOG</div>
                        <div class="sl-heatmap">${this.heatHTML(heatLevels)}</div>
                    </div>
                </div>

                <div class="sl-card-footer">
                    <span>⚔ GILDENKAI AUTHORIZED</span>
                    <span>@${user.login} • github.com/${user.login}</span>
                </div>
            </div>
        `;
    }

    renderAchievements(ach) {
        const grid = document.getElementById('achievementsGrid');
        grid.innerHTML = ach.map(a => `
            <div class="ach-card ${a.unlocked ? 'unlocked' : 'locked'}">
                <div class="icon" style="color:${a.unlocked ? '#d8b4fe' : '#666'}">${a.icon}</div>
                <div class="name">${a.name}</div>
                <div class="desc">${a.desc}</div>
            </div>`).join('');
    }

    /* ===================================================
       DATA YAML (formato do usuário)
       =================================================== */
    countryFlag(country) {
        if (!country) return '🌍';
        // Detecta código de país de 2 letras em qualquer lugar da string
        const match = String(country).match(/\b([A-Z]{2})\b/);
        if (!match) return '🌍';
        const cc = match[1];
        return cc.replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
    }

    generateDataYAML(payload) {
        const { user, cls, stats, rank, langTop } = payload;
        const flag = this.countryFlag(user.location);
        const langPreview = langTop[0] ? langTop[0][0] : 'Code';
        const totalXPFmt = this.formatNumber(stats.totalXP);

        const lines = [];
        const push = (indent, s) => lines.push(' '.repeat(indent) + s);
        const q = (s) => `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

        push(0, 'guild_card:');
        push(2, 'player:');
        push(4, `name: ${q(user.name || user.login)}`);
        push(4, `username: "@${user.login}"`);
        push(4, `avatar: ${q(user.avatar_url)}`);
        push(4, `avatar_fallback: ${q(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.login)}&background=4fd1c7&color=fff&size=150`)}`);
        push(4, 'rank:');
        push(6, `code: ${q(rank.rank)}`);
        push(6, `label: ${q(rank.name)}`);
        push(6, `color: ${q(rank.color)}`);

        push(2, 'bio:');
        push(4, 'text: |');
        const bioLines = (user.bio || 'Aventureiro do código').split('\n');
        bioLines.forEach(l => push(6, l));
        push(4, 'location:');
        push(6, `flag: ${q(flag)}`);
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

        push(2, 'meta:');
        push(4, `started_at: ${q(new Date(user.created_at).toISOString().split('T')[0])}`);
        push(4, `formatted: ${q(new Date(user.created_at).toLocaleDateString('pt-BR'))}`);

        push(2, 'actions:');
        const actions = [
            ['resume',      'Currículo',   'fas fa-scroll'],
            ['projects',    'Projetos',    'fas fa-project-diagram'],
            ['certificate', 'Certificado', 'fas fa-award'],
            ['qr',          'QR Code',     'fas fa-qrcode']
        ];
        actions.forEach(([id, label, icon]) => {
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

    /* ===================================================
       WORKFLOW YAML
       =================================================== */
    generateWorkflowYAML(username) {
        return `name: Update Guild Card

on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:
  push:
    branches: [main]

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
        run: node .github/scripts/guild-card.mjs

      - name: Commit & Push
        run: |
          git config user.name "Guild Bot"
          git config user.email "guild-bot@users.noreply.github.com"
          git add guild-card.svg guild-card.yml
          git diff --staged --quiet || git commit -m "⚔ Update Guild Card [skip ci]"
          git push
`;
    }

    /* ===================================================
       NODE SCRIPT (.github/scripts/guild-card.mjs)
       =================================================== */
    generateNodeScript() {
        return `#!/usr/bin/env node
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

const HEADERS = TOKEN ? { Authorization: \`Bearer \${TOKEN}\` } : {};

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
  const match = String(country).match(/\\b([A-Z]{2})\\b/);
  if (!match) return '🌍';
  return match[1].replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
};

async function fetchGH(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(\`GitHub \${res.status} on \${url}\`);
  }
  return res.json();
}

async function fetchUser(username) {
  const user = await fetchGH(\`https://api.github.com/users/\${username}\`);
  if (!user) throw new Error('Usuário não encontrado');
  const repos = await fetchGH(\`https://api.github.com/users/\${username}/repos?per_page=100&sort=updated\`) || [];

  let contributions = [];
  try {
    const cRes = await fetch(\`https://github-contributions-api.jogruber.de/v4/\${username}?y=last\`);
    if (cRes.ok) {
      const cData = await cRes.json();
      contributions = cData.contributions || [];
    }
  } catch (_) {}

  const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const forks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);

  return {
    ...user, repos, contributions,
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

function calcAchievements(user, stats, cls) {
  const langs = Object.keys(cls.langTotals);
  const age = (Date.now() - new Date(user.created_at)) / (365.25 * 24 * 3600 * 1000);
  const totalContribs = user.contributions.reduce((a, d) => a + (d.count || 0), 0);
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
    { icon:'🗺️', name:'LINGUA MASTER',     unlocked: langs.length >= 8 },
    { icon:'📅', name:'ACTIVE HUNTER',     unlocked: totalContribs >= 500 },
    { icon:'⚙️', name:'GRINDER',           unlocked: totalContribs >= 2000 }
  ];
}

function buildHeatmap(contributions, weeks = 26) {
  let cells = [];
  if (contributions && contributions.length) {
    cells = contributions.slice(-weeks * 7).map(d => d.count || 0);
  } else {
    cells = Array.from({ length: weeks * 7 }, () => 0);
  }
  const max = Math.max(...cells, 1);
  return cells.map(v => v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));
}

function dataYAML(user, cls, stats, rank, langTop) {
  const fl = flag(user.location);
  const langPreview = langTop[0] ? langTop[0][0] : 'Code';
  const totalXPFmt = fmt(stats.totalXP);
  const lines = [];
  const push = (indent, s) => lines.push(' '.repeat(indent) + s);
  const q = (s) => \`"\${String(s ?? '').replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"')}"\`;

  push(0, 'guild_card:');
  push(2, 'player:');
  push(4, \`name: \${q(user.name || user.login)}\`);
  push(4, \`username: "@\${user.login}"\`);
  push(4, \`avatar: \${q(user.avatar_url)}\`);
  push(4, \`avatar_fallback: \${q(\`https://ui-avatars.com/api/?name=\${encodeURIComponent(user.name || user.login)}&background=4fd1c7&color=fff&size=150\`)}\`);
  push(4, 'rank:');
  push(6, \`code: \${q(rank.rank)}\`);
  push(6, \`label: \${q(rank.name)}\`);
  push(6, \`color: \${q(rank.color)}\`);
  push(2, 'bio:');
  push(4, 'text: |');
  (user.bio || 'Aventureiro do código').split('\\n').forEach(l => push(6, l));
  push(4, 'location:');
  push(6, \`flag: \${q(fl)}\`);
  push(6, \`country: \${q(user.location || 'Terra Desconhecida')}\`);
  push(2, 'class:');
  push(4, \`name: \${q(cls.name)}\`);
  push(4, \`specialization: \${q(\`\${langPreview} Master \${cls.icon}\`)}\`);
  push(4, \`description: \${q(cls.desc)}\`);
  push(4, \`icon: \${q(cls.icon)}\`);
  push(2, 'stats:');
  push(4, \`stars: \${stats.stars}\`);
  push(4, \`forks: \${stats.forks}\`);
  push(4, \`repositories: \${stats.repos}\`);
  push(4, \`followers: \${stats.followers}\`);
  push(2, 'xp:');
  push(4, \`level: \${stats.level}\`);
  push(4, \`current: \${stats.xpCurrent}\`);
  push(4, \`next_level: \${stats.xpNeeded}\`);
  push(4, \`total: \${q(totalXPFmt)}\`);
  push(4, \`progress_percent: \${Number(stats.xpProgress.toFixed(1))}\`);
  push(2, 'meta:');
  push(4, \`started_at: \${q(new Date(user.created_at).toISOString().split('T')[0])}\`);
  push(4, \`formatted: \${q(new Date(user.created_at).toLocaleDateString('pt-BR'))}\`);
  push(2, 'actions:');
  [['resume','Currículo','fas fa-scroll'],['projects','Projetos','fas fa-project-diagram'],['certificate','Certificado','fas fa-award'],['qr','QR Code','fas fa-qrcode']]
    .forEach(([id, label, icon]) => {
      push(4, \`- id: \${q(id)}\`);
      push(6, \`label: \${q(label)}\`);
      push(6, \`icon: \${q(icon)}\`);
    });
  push(2, 'seal:');
  push(4, 'icon: "fas fa-dragon"');
  push(4, 'title: "GitHub Guild"');
  push(4, 'subtitle: "Gildenkai Authorization"');
  push(2, 'qr_modal:');
  push(4, 'title: "QR Code da Guilda"');
  return lines.join('\\n') + '\\n';
}

function generateSVG(user, cls, stats, rank, ach, langTop, heatLevels) {
  const c = {
    bg1:'#0a0418', bg2:'#05010e',
    accent:'#a855f7', bright:'#d8b4fe', deep:'#6b21a8',
    border:'#7c3aed', text:'#e9d5ff', dim:'#a78bfa'
  };
  const W = 900, H = 800;
  const panel = (x, y, w, h, title) => \`
    <g>
      <rect x="\${x}" y="\${y}" width="\${w}" height="\${h}" fill="rgba(20,8,40,0.7)" stroke="\${c.border}" stroke-width="1.5" rx="4"/>
      <line x1="\${x}" y1="\${y+28}" x2="\${x+w}" y2="\${y+28}" stroke="\${c.border}" stroke-opacity="0.5" stroke-dasharray="4 4"/>
      <text x="\${x+12}" y="\${y+19}" font-family="Orbitron,sans-serif" font-size="11" font-weight="700" letter-spacing="2" fill="\${c.bright}">◈ \${esc(title)}</text>
    </g>\`;

  const quests = [
    ['NAME', user.name || user.login],
    ['BIO', trunc(user.bio || '—', 30)],
    ['LOCATION', trunc(user.location || 'Unknown', 22)],
    ['COMPANY', trunc(user.company || '—', 22)],
    ['JOINED', new Date(user.created_at).toLocaleDateString('pt-BR')]
  ];
  const questRows = quests.map((q, i) => \`
    <g transform="translate(0, \${i * 22})">
      <rect x="0" y="0" width="14" height="14" fill="none" stroke="\${c.accent}" stroke-width="1"/>
      <text x="3" y="11" font-family="Rajdhani,sans-serif" font-size="10" fill="\${c.accent}">✓</text>
      <text x="22" y="11" font-family="Rajdhani,sans-serif" font-size="11" fill="\${c.dim}">\${esc(q[0])}</text>
      <text x="398" y="11" text-anchor="end" font-family="Rajdhani,sans-serif" font-size="11" font-weight="600" fill="\${c.text}">\${esc(q[1])}</text>
    </g>\`).join('');

  const achIcons = ach.slice(0, 8).map((a, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = col * 100 + 20, y = row * 62 + 40;
    const op = a.unlocked ? 1 : 0.25;
    return \`
      <g opacity="\${op}">
        <rect x="\${x-10}" y="\${y-20}" width="90" height="52" fill="rgba(168,85,247,0.15)" stroke="\${c.border}" stroke-width="1" rx="3"/>
        <text x="\${x+35}" y="\${y-2}" text-anchor="middle" font-size="20">\${a.icon}</text>
        <text x="\${x+35}" y="\${y+22}" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="7" fill="\${c.bright}">\${esc(a.name)}</text>
      </g>\`;
  }).join('');

  const skillRows = langTop.slice(0, 4).map(([lang, count], i) => {
    const max = langTop[0][1] || 1;
    const pct = (count / max) * 100;
    const y = i * 26;
    return \`
      <g transform="translate(0, \${y})">
        <text x="0" y="10" font-family="Orbitron,sans-serif" font-size="10" fill="\${c.text}">\${esc(trunc(lang, 14))}</text>
        <text x="398" y="10" text-anchor="end" font-family="Rajdhani,sans-serif" font-size="10" fill="\${c.dim}">\${count}</text>
        <rect x="0" y="14" width="398" height="6" fill="rgba(0,0,0,0.5)" stroke="\${c.border}" stroke-opacity="0.5"/>
        <rect x="0" y="14" width="\${pct * 3.98}" height="6" fill="\${c.accent}"/>
      </g>\`;
  }).join('');

  const cell = 12;
  const heatCells = heatLevels.slice(0, 26 * 7).map((lvl, i) => {
    const col = Math.floor(i / 7), row = i % 7;
    const op = lvl === 0 ? 0.08 : lvl === 1 ? 0.3 : lvl === 2 ? 0.55 : lvl === 3 ? 0.8 : 1;
    return \`<rect x="\${col*cell}" y="\${row*cell}" width="10" height="10" fill="\${c.accent}" fill-opacity="\${op}" rx="1"/>\`;
  }).join('');

  return \`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="\${W}" height="\${H}" viewBox="0 0 \${W} \${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="\${c.bg1}"/>
      <stop offset="100%" stop-color="\${c.bg2}"/>
    </linearGradient>
    <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="\${c.deep}"/>
      <stop offset="100%" stop-color="\${c.bright}"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5f3ff"/>
      <stop offset="50%" stop-color="\${c.bright}"/>
      <stop offset="100%" stop-color="\${c.deep}"/>
    </linearGradient>
    <clipPath id="avatarClip"><circle cx="160" cy="420" r="78"/></clipPath>
  </defs>
  <rect width="\${W}" height="\${H}" fill="url(#bgGrad)"/>
  <rect x="4" y="4" width="\${W-8}" height="\${H-8}" fill="none" stroke="\${c.border}" stroke-width="2"/>
  <rect x="12" y="12" width="\${W-24}" height="\${H-24}" fill="none" stroke="\${c.border}" stroke-opacity="0.35" stroke-width="1"/>
  <text x="\${W/2}" y="70" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="34" font-weight="900" letter-spacing="6" fill="url(#titleGrad)">GuildenKain</text>
  <text x="\${W/2}" y="96" text-anchor="middle" font-family="Cinzel,serif" font-size="12" letter-spacing="6" fill="\${c.bright}" opacity="0.85">◈ GITHUB GUILD CARD ◈</text>
  <line x1="60" y1="112" x2="\${W-60}" y2="112" stroke="\${c.border}" stroke-opacity="0.4"/>
  \${panel(40, 130, 400, 170, 'QUEST LOG')}
  <g transform="translate(60, 175)">\${questRows}</g>
  \${panel(460, 130, 400, 170, \`ACHIEVEMENTS (\${ach.filter(a=>a.unlocked).length}/\${ach.length})\`)}
  <g transform="translate(475, 165)">\${achIcons}</g>
  <circle cx="160" cy="420" r="95" fill="none" stroke="\${c.accent}" stroke-width="3" stroke-dasharray="6 4"/>
  <circle cx="160" cy="420" r="86" fill="none" stroke="\${c.bright}" stroke-width="2"/>
  <image xlink:href="\${esc(user.avatar_url)}" x="82" y="342" width="156" height="156" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>
  <rect x="80" y="530" width="160" height="30" fill="\${c.bg2}" stroke="\${rank.color}" stroke-width="2"/>
  <text x="160" y="550" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="12" font-weight="700" fill="\${rank.color}">RANK \${rank.rank} — \${rank.name}</text>
  <text x="160" y="590" text-anchor="middle" font-family="Cinzel,serif" font-size="20" font-weight="700" fill="#ffffff">\${esc(trunc(user.name || user.login, 22))}</text>
  <text x="160" y="612" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="11" letter-spacing="2" fill="\${c.bright}">\${cls.icon} \${esc(cls.name)}</text>
  \${panel(320, 330, 540, 130, 'LEVEL UP PROGRESSION')}
  <text x="360" y="395" font-family="Orbitron,sans-serif" font-size="26" font-weight="900" fill="#ffffff">LEVEL \${stats.level}</text>
  <rect x="360" y="415" width="470" height="16" fill="rgba(0,0,0,0.55)" stroke="\${c.border}"/>
  <rect x="360" y="415" width="\${(stats.xpProgress/100)*470}" height="16" fill="url(#xpGrad)"/>
  <text x="830" y="428" text-anchor="end" font-family="Orbitron,sans-serif" font-size="11" fill="\${c.bright}">\${stats.xpCurrent} / \${stats.xpNeeded} XP</text>
  \${panel(320, 475, 260, 210, 'CHARACTER STATS')}
  <g transform="translate(340, 520)" font-family="Orbitron,sans-serif" font-size="11">
    <text x="0" y="0" fill="\${c.dim}">LEVEL</text>
    <text x="220" y="0" text-anchor="end" fill="#fff" font-weight="700">\${stats.level}</text>
    <text x="0" y="26" fill="\${c.dim}">HP</text>
    <rect x="60" y="16" width="130" height="8" fill="rgba(0,0,0,0.6)" stroke="\${c.border}" stroke-opacity="0.5"/>
    <rect x="60" y="16" width="\${(stats.hpPct/100)*130}" height="8" fill="#ef4444"/>
    <text x="220" y="26" text-anchor="end" fill="#fff" font-weight="700">\${stats.hpPct}%</text>
    <text x="0" y="52" fill="\${c.dim}">COINS</text>
    <text x="220" y="52" text-anchor="end" fill="#fff" font-weight="700">\${fmt(stats.stars)}</text>
    <text x="0" y="78" fill="\${c.dim}">REPOS</text>
    <text x="220" y="78" text-anchor="end" fill="#fff" font-weight="700">\${stats.repos}</text>
    <text x="0" y="104" fill="\${c.dim}">FOLLOWERS</text>
    <text x="220" y="104" text-anchor="end" fill="#fff" font-weight="700">\${fmt(stats.followers)}</text>
    <text x="0" y="130" fill="\${c.dim}">TOTAL XP</text>
    <text x="220" y="130" text-anchor="end" fill="\${c.bright}" font-weight="700">\${fmt(stats.totalXP)}</text>
  </g>
  \${panel(600, 475, 260, 210, 'SKILL DISTRIBUTION')}
  <g transform="translate(620, 520)">\${skillRows}</g>
  \${panel(40, 660, 820, 110, 'ACTIVITY LOG')}
  <g transform="translate(60, 705)">\${heatCells}</g>
  <text x="60" y="\${H-18}" font-family="Cinzel,serif" font-size="10" letter-spacing="3" fill="\${c.bright}" opacity="0.7">⚔ GILDENKAI AUTHORIZED</text>
  <text x="\${W-60}" y="\${H-18}" text-anchor="end" font-family="Cinzel,serif" font-size="10" letter-spacing="3" fill="\${c.bright}" opacity="0.7">github.com/\${esc(user.login)}</text>
</svg>\`;
}

(async () => {
  try {
    console.log(\`⚔ Invocando \${USERNAME}...\`);
    const user = await fetchUser(USERNAME);
    const cls = detectClass(user.repos);
    const stats = calcStats(user);
    const rank = calcRank(stats.totalXP);
    const ach = calcAchievements(user, stats, cls);
    const langTop = Object.entries(cls.langTotals).sort((a, b) => b[1] - a[1]);
    const heatLevels = buildHeatmap(user.contributions);

    fs.writeFileSync(OUTPUT_YML, dataYAML(user, cls, stats, rank, langTop), 'utf8');
    console.log(\`📄 Data YAML escrito: \${OUTPUT_YML}\`);

    fs.writeFileSync(OUTPUT_SVG, generateSVG(user, cls, stats, rank, ach, langTop, heatLevels), 'utf8');
    console.log(\`🖼️  SVG escrito: \${OUTPUT_SVG}\`);

    console.log(\`✅ Rank \${rank.rank} — Level \${stats.level} — \${fmt(stats.totalXP)} XP\`);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
})();
`;
    }

    /* ===================================================
       SVG (gerado no browser para download)
       =================================================== */
    escapeXml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    themeColors(theme) {
        const map = {
            dark:    { bg1:'#0a0418', bg2:'#05010e', accent:'#a855f7', bright:'#d8b4fe', deep:'#6b21a8', border:'#7c3aed', text:'#e9d5ff', dim:'#a78bfa' },
            abyss:   { bg1:'#03131a', bg2:'#01080c', accent:'#06b6d4', bright:'#67e8f9', deep:'#0e7490', border:'#0891b2', text:'#cffafe', dim:'#67e8f9' },
            crimson: { bg1:'#1a0303', bg2:'#0c0101', accent:'#ef4444', bright:'#fca5a5', deep:'#991b1b', border:'#dc2626', text:'#fee2e2', dim:'#fca5a5' },
            monarch: { bg1:'#1a1003', bg2:'#0c0701', accent:'#f59e0b', bright:'#fcd34d', deep:'#92400e', border:'#d97706', text:'#fef3c7', dim:'#fcd34d' }
        };
        return map[theme] || map.dark;
    }

    generateSVG() {
        const { user, cls, stats, rank, ach, langTop, heatLevels, theme } = this.payload;
        const c = this.themeColors(theme === 'dark' ? 'dark' : theme);

        const W = 900, H = 800;
        const esc = (s) => this.escapeXml(s);
        const trunc = (s, n) => s && s.length > n ? s.slice(0, n - 1) + '…' : (s || '');

        const panel = (x, y, w, h, title) => `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(20,8,40,0.7)" stroke="${c.border}" stroke-width="1.5" rx="4"/>
      <line x1="${x}" y1="${y+28}" x2="${x+w}" y2="${y+28}" stroke="${c.border}" stroke-opacity="0.5" stroke-dasharray="4 4"/>
      <text x="${x+12}" y="${y+19}" font-family="Orbitron,sans-serif" font-size="11" font-weight="700" letter-spacing="2" fill="${c.bright}">◈ ${esc(title)}</text>
    </g>`;

        const quests = [
            ['NAME', user.name || user.login],
            ['BIO', trunc(user.bio || '—', 30)],
            ['LOCATION', trunc(user.location || 'Unknown', 22)],
            ['COMPANY', trunc(user.company || '—', 22)],
            ['JOINED', new Date(user.created_at).toLocaleDateString('pt-BR')]
        ];
        const questRows = quests.map((q, i) => `
    <g transform="translate(0, ${i * 22})">
      <rect x="0" y="0" width="14" height="14" fill="none" stroke="${c.accent}" stroke-width="1"/>
      <text x="3" y="11" font-family="Rajdhani,sans-serif" font-size="10" fill="${c.accent}">✓</text>
      <text x="22" y="11" font-family="Rajdhani,sans-serif" font-size="11" fill="${c.dim}">${esc(q[0])}</text>
      <text x="398" y="11" text-anchor="end" font-family="Rajdhani,sans-serif" font-size="11" font-weight="600" fill="${c.text}">${esc(q[1])}</text>
    </g>`).join('');

        const achIcons = ach.slice(0, 8).map((a, i) => {
            const col = i % 4, row = Math.floor(i / 4);
            const x = col * 100 + 20, y = row * 62 + 40;
            const op = a.unlocked ? 1 : 0.25;
            return `
      <g opacity="${op}">
        <rect x="${x-10}" y="${y-20}" width="90" height="52" fill="rgba(168,85,247,0.15)" stroke="${c.border}" stroke-width="1" rx="3"/>
        <text x="${x+35}" y="${y-2}" text-anchor="middle" font-size="20">${a.icon}</text>
        <text x="${x+35}" y="${y+22}" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="7" fill="${c.bright}">${esc(a.name)}</text>
      </g>`;
        }).join('');

        const skillRows = langTop.slice(0, 4).map(([lang, count], i) => {
            const max = langTop[0][1] || 1;
            const pct = (count / max) * 100;
            const y = i * 26;
            return `
      <g transform="translate(0, ${y})">
        <text x="0" y="10" font-family="Orbitron,sans-serif" font-size="10" fill="${c.text}">${esc(trunc(lang, 14))}</text>
        <text x="398" y="10" text-anchor="end" font-family="Rajdhani,sans-serif" font-size="10" fill="${c.dim}">${count}</text>
        <rect x="0" y="14" width="398" height="6" fill="rgba(0,0,0,0.5)" stroke="${c.border}" stroke-opacity="0.5"/>
        <rect x="0" y="14" width="${pct * 3.98}" height="6" fill="${c.accent}"/>
      </g>`;
        }).join('');

        const cell = 12;
        const heatCells = heatLevels.slice(0, 26 * 7).map((lvl, i) => {
            const col = Math.floor(i / 7), row = i % 7;
            const op = lvl === 0 ? 0.08 : lvl === 1 ? 0.3 : lvl === 2 ? 0.55 : lvl === 3 ? 0.8 : 1;
            return `<rect x="${col*cell}" y="${row*cell}" width="10" height="10" fill="${c.accent}" fill-opacity="${op}" rx="1"/>`;
        }).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.bg1}"/>
      <stop offset="100%" stop-color="${c.bg2}"/>
    </linearGradient>
    <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${c.deep}"/>
      <stop offset="100%" stop-color="${c.bright}"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5f3ff"/>
      <stop offset="50%" stop-color="${c.bright}"/>
      <stop offset="100%" stop-color="${c.deep}"/>
    </linearGradient>
    <clipPath id="avatarClip"><circle cx="160" cy="420" r="78"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect x="4" y="4" width="${W-8}" height="${H-8}" fill="none" stroke="${c.border}" stroke-width="2"/>
  <rect x="12" y="12" width="${W-24}" height="${H-24}" fill="none" stroke="${c.border}" stroke-opacity="0.35" stroke-width="1"/>

  <text x="${W/2}" y="70" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="34" font-weight="900" letter-spacing="6" fill="url(#titleGrad)">GuildenKain</text>
  <text x="${W/2}" y="96" text-anchor="middle" font-family="Cinzel,serif" font-size="12" letter-spacing="6" fill="${c.bright}" opacity="0.85">◈ GITHUB GUILD CARD ◈</text>
  <line x1="60" y1="112" x2="${W-60}" y2="112" stroke="${c.border}" stroke-opacity="0.4"/>

  ${panel(40, 130, 400, 170, 'QUEST LOG')}
  <g transform="translate(60, 175)">${questRows}</g>

  ${panel(460, 130, 400, 170, `ACHIEVEMENTS (${ach.filter(a=>a.unlocked).length}/${ach.length})`)}
  <g transform="translate(475, 165)">${achIcons}</g>

  <circle cx="160" cy="420" r="95" fill="none" stroke="${c.accent}" stroke-width="3" stroke-dasharray="6 4"/>
  <circle cx="160" cy="420" r="86" fill="none" stroke="${c.bright}" stroke-width="2"/>
  <image xlink:href="${esc(user.avatar_url)}" x="82" y="342" width="156" height="156" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>

  <rect x="80" y="530" width="160" height="30" fill="${c.bg2}" stroke="${rank.color}" stroke-width="2"/>
  <text x="160" y="550" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="12" font-weight="700" fill="${rank.color}">RANK ${rank.rank} — ${rank.name}</text>

  <text x="160" y="590" text-anchor="middle" font-family="Cinzel,serif" font-size="20" font-weight="700" fill="#ffffff">${esc(trunc(user.name || user.login, 22))}</text>
  <text x="160" y="612" text-anchor="middle" font-family="Orbitron,sans-serif" font-size="11" letter-spacing="2" fill="${c.bright}">${cls.icon} ${esc(cls.name)}</text>

  ${panel(320, 330, 540, 130, 'LEVEL UP PROGRESSION')}
  <text x="360" y="395" font-family="Orbitron,sans-serif" font-size="26" font-weight="900" fill="#ffffff">LEVEL ${stats.level}</text>
  <rect x="360" y="415" width="470" height="16" fill="rgba(0,0,0,0.55)" stroke="${c.border}"/>
  <rect x="360" y="415" width="${(stats.xpProgress/100)*470}" height="16" fill="url(#xpGrad)"/>
  <text x="830" y="428" text-anchor="end" font-family="Orbitron,sans-serif" font-size="11" fill="${c.bright}">${stats.xpCurrent} / ${stats.xpNeeded} XP</text>

  ${panel(320, 475, 260, 210, 'CHARACTER STATS')}
  <g transform="translate(340, 520)" font-family="Orbitron,sans-serif" font-size="11">
    <text x="0" y="0" fill="${c.dim}">LEVEL</text>
    <text x="220" y="0" text-anchor="end" fill="#fff" font-weight="700">${stats.level}</text>
    <text x="0" y="26" fill="${c.dim}">HP</text>
    <rect x="60" y="16" width="130" height="8" fill="rgba(0,0,0,0.6)" stroke="${c.border}" stroke-opacity="0.5"/>
    <rect x="60" y="16" width="${(stats.hpPct/100)*130}" height="8" fill="#ef4444"/>
    <text x="220" y="26" text-anchor="end" fill="#fff" font-weight="700">${stats.hpPct}%</text>
    <text x="0" y="52" fill="${c.dim}">COINS</text>
    <text x="220" y="52" text-anchor="end" fill="#fff" font-weight="700">${this.formatNumber(stats.stars)}</text>
    <text x="0" y="78" fill="${c.dim}">REPOS</text>
    <text x="220" y="78" text-anchor="end" fill="#fff" font-weight="700">${stats.repos}</text>
    <text x="0" y="104" fill="${c.dim}">FOLLOWERS</text>
    <text x="220" y="104" text-anchor="end" fill="#fff" font-weight="700">${this.formatNumber(stats.followers)}</text>
    <text x="0" y="130" fill="${c.dim}">TOTAL XP</text>
    <text x="220" y="130" text-anchor="end" fill="${c.bright}" font-weight="700">${this.formatNumber(stats.totalXP)}</text>
  </g>

  ${panel(600, 475, 260, 210, 'SKILL DISTRIBUTION')}
  <g transform="translate(620, 520)">${skillRows}</g>

  ${panel(40, 660, 820, 110, 'ACTIVITY LOG')}
  <g transform="translate(60, 705)">${heatCells}</g>

  <text x="60" y="${H-18}" font-family="Cinzel,serif" font-size="10" letter-spacing="3" fill="${c.bright}" opacity="0.7">⚔ GILDENKAI AUTHORIZED</text>
  <text x="${W-60}" y="${H-18}" text-anchor="end" font-family="Cinzel,serif" font-size="10" letter-spacing="3" fill="${c.bright}" opacity="0.7">github.com/${esc(user.login)}</text>
</svg>`;
    }

    /* ===================================================
       DOWNLOAD / COPY
       =================================================== */
    downloadSvg() {
        if (!this.payload) return;
        const svg = this.generateSVG();
        this._saveFile(`guild-card-${this.userData.login}.svg`, svg, 'image/svg+xml');
        this.showNotification('SVG baixado com sucesso!', 'success');
    }

    async copySvg() {
        if (!this.payload) return;
        try {
            await navigator.clipboard.writeText(this.generateSVG());
            this.showNotification('SVG copiado para o clipboard!', 'success');
        } catch (e) {
            this.showNotification('Erro ao copiar SVG.', 'error');
        }
    }

    async copyDataYaml() {
        if (!this.dataYamlContent) return;
        try {
            await navigator.clipboard.writeText(this.dataYamlContent);
            this.showNotification('Data YAML copiado! Salve como guild-card.yml', 'success');
        } catch (e) {
            this.showNotification('Erro ao copiar Data YAML.', 'error');
        }
    }

    async copyWorkflowYaml() {
        if (!this.workflowYamlContent) return;
        try {
            await navigator.clipboard.writeText(this.workflowYamlContent);
            this.showNotification('Workflow copiado! Cole em .github/workflows/guild-card.yml', 'success');
        } catch (e) {
            this.showNotification('Erro ao copiar Workflow.', 'error');
        }
    }

    downloadBundle() {
        if (!this.payload) return;

        const files = [
            { name: `guild-card-${this.userData.login}.svg`, content: this.generateSVG(), mime: 'image/svg+xml' },
            { name: 'guild-card.yml',                        content: this.dataYamlContent,     mime: 'text/yaml' },
            { name: 'guild-card-workflow.yml',               content: this.workflowYamlContent, mime: 'text/yaml' },
            { name: 'guild-card.mjs',                        content: this.nodeScriptContent,   mime: 'text/javascript' }
        ];

        files.forEach((f, i) => {
            setTimeout(() => this._saveFile(f.name, f.content, f.mime), i * 300);
        });

        this.showNotification('Baixando 4 arquivos... ⚔', 'success');
    }

    _saveFile(name, content, mime) {
        const blob = new Blob([content], { type: mime + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ===================================================
       UI
       =================================================== */
    switchTab(tabId) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    }

    showNotification(message, type = 'info') {
        document.querySelectorAll('.notification').forEach(n => n.remove());
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    loadAnnouncements() {
        const container = document.getElementById('announcements');
        const announcements = [
            { title: '🎉 Sistema de Detecção Automática', content: 'Agora sua classe e especialização são detectadas automaticamente pelos seus repositórios!', date: '2024-01-20', type: 'update' },
            { title: '🏆 Novo Sistema de Conquistas', content: 'Adicionamos 16 conquistas dinâmicas que refletem seu progresso real no GitHub.', date: '2024-01-15', type: 'event' },
            { title: '📜 Workflow YAML Automático', content: 'Agora você pode copiar o YAML e ter seu cartão atualizado diariamente no README!', date: '2024-01-10', type: 'important' },
            { title: '✨ Novos Temas Disponíveis', content: 'Novos temas: Shadow, Abismo, Carmesim e Monarca.', date: '2024-01-05', type: 'feature' }
        ];
        container.innerHTML = announcements.map(ann => `
            <div class="announcement-item">
                <h4>${ann.title}</h4>
                <p>${ann.content}</p>
                <small><i class="fas fa-calendar"></i> ${ann.date} • <i class="fas fa-tag"></i> ${ann.type}</small>
            </div>`).join('');
    }

    loadRanks() {
        const container = document.getElementById('ranksList');
        const ranks = [
            { rank: 'S', name: 'MONARCH', xp: '50.000+ XP', color: '#FFD700', requirements: 'Projetos influentes, altas contribuições, reconhecimento na comunidade' },
            { rank: 'A', name: 'S-RANK',  xp: '25.000 - 49.999 XP', color: '#f472b6', requirements: 'Vários projetos populares, contribuições consistentes' },
            { rank: 'B', name: 'ELITE',   xp: '12.000 - 24.999 XP', color: '#c084fc', requirements: 'Projetos ativos, boa base de seguidores' },
            { rank: 'C', name: 'VETERAN', xp: '5.000 - 11.999 XP', color: '#4fd1c7', requirements: 'Projetos próprios, começando a receber estrelas' },
            { rank: 'D', name: 'HUNTER',  xp: '1.500 - 4.999 XP', color: '#a855f7', requirements: 'Perfil ativo, primeiras contribuições' },
            { rank: 'E', name: 'NOVICE',  xp: '0 - 1.499 XP', color: '#fc8181', requirements: 'Começando a jornada, primeiros passos' }
        ];
        container.innerHTML = ranks.map(r => `
            <div class="rank-item ${r.rank.toLowerCase()}-rank">
                <div class="rank-header">
                    <span class="rank-letter" style="color: ${r.color}">${r.rank}</span>
                    <h3>${r.name}</h3>
                </div>
                <p><strong>XP necessário:</strong> ${r.xp}</p>
                <p><small><strong>Requisitos:</strong> ${r.requirements}</small></p>
            </div>`).join('');
    }

    loadGuildStats() {
        const container = document.getElementById('guildStats');
        const stats = [
            { name: 'Membros Ativos', value: '1,247', icon: '👥', change: '+5%' },
            { name: 'Cartões Gerados', value: '8,942', icon: '🆔', change: '+12%' },
            { name: 'Total de Estrelas', value: '2.4M', icon: '⭐', change: '+8%' },
            { name: 'Projetos Coletivos', value: '156', icon: '🤝', change: '+3%' },
            { name: 'Rank S (Monarcas)', value: '28', icon: '🏆', change: '+2' },
            { name: 'Países Ativos', value: '89', icon: '🌎', change: '+3' }
        ];
        container.innerHTML = stats.map(stat => `
            <div class="stat-item">
                <h4>${stat.value}</h4>
                <p>${stat.icon} ${stat.name}</p>
                <small style="color: var(--dark-success);">${stat.change}</small>
            </div>`).join('');
    }
}

/* ===================================================
   BOOT
   =================================================== */
document.addEventListener('DOMContentLoaded', () => {
    window.guildCardGenerator = new GuildCardGenerator();
});
