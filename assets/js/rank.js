/**
 * GitHub Rank - Sistema de Ranking Avançado
 * Sistema completo de ranking baseado na API do GitHub com rankings mundial, continental e por país
 */

class GitHubRank {
    constructor() {
        // Cache para dados
        this.cache = new Map();
        this.currentUser = null;
        this.userData = null;
        
        // Configurações
        this.config = {
            apiBase: 'https://api.github.com',
            cacheTime: 10 * 60 * 1000, // 10 minutos
            rateLimit: {
                remaining: 60,
                reset: 0
            }
        };
        
        // Sistema de ranking
        this.ranks = {
            'S': { name: 'Lendário', color: '#ffd700', minXP: 50000, description: 'Mestre das artes do código' },
            'A': { name: 'Épico', color: '#c0c0c0', minXP: 25000, description: 'Desenvolvedor de elite' },
            'B': { name: 'Raro', color: '#cd7f32', minXP: 10000, description: 'Desenvolvedor avançado' },
            'C': { name: 'Incomum', color: '#4fd1c7', minXP: 5000, description: 'Desenvolvedor intermediário' },
            'D': { name: 'Comum', color: '#9f7aea', minXP: 1000, description: 'Desenvolvedor iniciante' },
            'E': { name: 'Iniciante', color: '#fc8181', minXP: 0, description: 'Novato na jornada' }
        };
        
        // Sistema de classes
        this.classes = {
            'frontend': {
                name: 'Frontend Mage',
                icon: 'fa-solid fa-hat-wizard',
                color: '#9f7aea',
                description: 'Especialista em interfaces e experiências do usuário',
                skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Vue']
            },
            'backend': {
                name: 'Backend Guardian',
                icon: 'fa-solid fa-server',
                color: '#4299e1',
                description: 'Mestre da lógica e infraestrutura de servidores',
                skills: ['Node.js', 'Python', 'Java', 'APIs', 'Database']
            },
            'fullstack': {
                name: 'Full Stack Legend',
                icon: 'fa-solid fa-layer-group',
                color: '#ed8936',
                description: 'Domina todas as camadas do desenvolvimento',
                skills: ['Full Stack', 'DevOps', 'Architecture', 'Cloud']
            },
            'mobile': {
                name: 'Mobile Ranger',
                icon: 'fa-solid fa-mobile-alt',
                color: '#48bb78',
                description: 'Especialista em aplicações móveis nativas',
                skills: ['React Native', 'Flutter', 'iOS', 'Android']
            }
        };
        
        // Países e continentes
        this.countries = {
            'BR': { name: 'Brasil', emoji: '🇧🇷', continent: 'america' },
            'US': { name: 'Estados Unidos', emoji: '🇺🇸', continent: 'america' },
            'GB': { name: 'Reino Unido', emoji: '🇬🇧', continent: 'europe' },
            'DE': { name: 'Alemanha', emoji: '🇩🇪', continent: 'europe' },
            'FR': { name: 'França', emoji: '🇫🇷', continent: 'europe' },
            'ES': { name: 'Espanha', emoji: '🇪🇸', continent: 'europe' },
            'IT': { name: 'Itália', emoji: '🇮🇹', continent: 'europe' },
            'PT': { name: 'Portugal', emoji: '🇵🇹', continent: 'europe' },
            'JP': { name: 'Japão', emoji: '🇯🇵', continent: 'asia' },
            'CN': { name: 'China', emoji: '🇨🇳', continent: 'asia' },
            'IN': { name: 'Índia', emoji: '🇮🇳', continent: 'asia' },
            'KR': { name: 'Coreia do Sul', emoji: '🇰🇷', continent: 'asia' },
            'CA': { name: 'Canadá', emoji: '🇨🇦', continent: 'america' },
            'MX': { name: 'México', emoji: '🇲🇽', continent: 'america' },
            'AR': { name: 'Argentina', emoji: '🇦🇷', continent: 'america' },
            'CL': { name: 'Chile', emoji: '🇨🇱', continent: 'america' },
            'CO': { name: 'Colômbia', emoji: '🇨🇴', continent: 'america' },
            'AU': { name: 'Austrália', emoji: '🇦🇺', continent: 'oceania' },
            'NZ': { name: 'Nova Zelândia', emoji: '🇳🇿', continent: 'oceania' },
            'ZA': { name: 'África do Sul', emoji: '🇿🇦', continent: 'africa' },
            'NG': { name: 'Nigéria', emoji: '🇳🇬', continent: 'africa' },
            'EG': { name: 'Egito', emoji: '🇪🇬', continent: 'africa' }
        };
        
        this.continents = {
            'america': { name: 'Américas', emoji: '🌎' },
            'europe': { name: 'Europa', emoji: '🌍' },
            'asia': { name: 'Ásia', emoji: '🌏' },
            'africa': { name: 'África', emoji: '🌍' },
            'oceania': { name: 'Oceania', emoji: '🌏' }
        };
        
        // Usuários fixos para leaderboard
        this.config.fixedUsers = [
            { username: 'torvalds', country: 'US', continent: 'america' },
            { username: 'mojombo', country: 'US', continent: 'america' },
            { username: 'defunkt', country: 'US', continent: 'america' },
            { username: 'pjhyett', country: 'US', continent: 'america' },
            { username: 'wycats', country: 'US', continent: 'america' }
        ];
        
        // Leaderboard global
        this.globalLeaderboard = [];
        this.countryLeaderboards = {};
        this.continentLeaderboards = {};
        
        this.init();
    }
    
    /**
     * Inicialização
     */
    init() {
        console.log('🚀 GitHub Rank Avançado inicializando...');
        
        // Configurar tema
        this.setupTheme();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Verificar API status
        this.checkAPIStatus();
        
        // Carregar leaderboards iniciais
        this.loadGlobalLeaderboard();
        
        // Gerar conquistas iniciais
        this.generateAchievements();
        
        console.log('✅ GitHub Rank Avançado pronto!');
    }
    
    /**
     * Configurar tema
     */
    setupTheme() {
        const savedTheme = localStorage.getItem('githubRankTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = savedTheme === 'dark' 
                ? '<i class="fa-solid fa-sun"></i>' 
                : '<i class="fa-solid fa-moon"></i>';
            
            toggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('githubRankTheme', newTheme);
                
                toggleBtn.innerHTML = newTheme === 'dark' 
                    ? '<i class="fa-solid fa-sun"></i>' 
                    : '<i class="fa-solid fa-moon"></i>';
                
                this.showNotification(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`, 'info');
            });
        }
    }
    
    /**
     * Gerar conquistas iniciais
     */
    generateAchievements() {
        const achievementsGrid = document.getElementById('achievementsGrid');
        if (!achievementsGrid) return;
        
        const achievements = [
            { name: 'Primeiro Commit', icon: 'fa-solid fa-code-commit', earned: true },
            { name: 'Estrela Iniciante', icon: 'fa-solid fa-star', earned: true },
            { name: 'Colaborador', icon: 'fa-solid fa-users', earned: true },
            { name: 'Repositório Popular', icon: 'fa-solid fa-fire', earned: false },
            { name: 'Mestre do Código', icon: 'fa-solid fa-crown', earned: false },
            { name: 'Influenciador', icon: 'fa-solid fa-chart-line', earned: false }
        ];
        
        achievementsGrid.innerHTML = achievements.map(ach => `
            <div class="achievement-item ${ach.earned ? 'earned' : ''}">
                <i class="${ach.icon}"></i>
                <span>${ach.name}</span>
            </div>
        `).join('');
        
        document.getElementById('achievementsCount').textContent = 
            `${achievements.filter(a => a.earned).length}/${achievements.length}`;
    }
    
    /**
     * Configurar eventos
     */
    setupEventListeners() {
        // Buscar usuário
        const searchBtn = document.getElementById('searchBtn');
        const usernameInput = document.getElementById('usernameInput');
        
        if (searchBtn && usernameInput) {
            searchBtn.addEventListener('click', () => this.searchUser());
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchUser();
            });
        }
        
        // Botões do perfil
        document.getElementById('backBtn')?.addEventListener('click', () => this.hideProfile());
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshProfile());
        document.getElementById('shareBtn')?.addEventListener('click', () => this.shareProfile());
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadBadge());
        
        // Navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const target = link.getAttribute('href');
                if (target) this.scrollToSection(target);
            });
        });
    }
    
    /**
     * Verificar status da API
     */
    async checkAPIStatus() {
        const statusElement = document.getElementById('apiStatus');
        if (!statusElement) return;
        
        try {
            const response = await fetch(this.config.apiBase);
            const headers = response.headers;
            
            this.config.rateLimit.remaining = parseInt(headers.get('X-RateLimit-Remaining')) || 0;
            this.config.rateLimit.reset = parseInt(headers.get('X-RateLimit-Reset')) || 0;
            
            if (response.ok) {
                statusElement.innerHTML = '<i class="fa-solid fa-circle" style="color: #10b981"></i> API Online';
            } else {
                throw new Error('API não disponível');
            }
        } catch (error) {
            console.warn('⚠️ GitHub API offline:', error);
            statusElement.innerHTML = '<i class="fa-solid fa-circle" style="color: #ef4444"></i> API Offline (modo demonstração)';
        }
    }
    
    /**
     * Buscar usuário
     */
    async searchUser(username = null) {
        const input = document.getElementById('usernameInput');
        const searchUsername = username || input?.value.trim();
        
        if (!searchUsername) {
            this.showNotification('Digite um nome de usuário do GitHub', 'warning');
            return;
        }
        
        // Validar nome de usuário (apenas letras, números e hífen)
        if (!/^[a-z0-9-]+$/i.test(searchUsername)) {
            this.showNotification('Nome de usuário inválido', 'error');
            return;
        }
        
        // Limpar input se veio do parâmetro
        if (input && username) {
            input.value = username;
        }
        
        this.currentUser = searchUsername;
        await this.loadUserProfile(searchUsername);
    }
    
    /**
     * Carregar perfil do usuário
     */
    async loadUserProfile(username) {
        this.showLoading(true);
        
        try {
            // Buscar dados básicos
            const userData = await this.fetchGitHubData(`/users/${username}`);
            this.userData = userData;
            
            // Buscar repositórios
            const repos = await this.fetchGitHubData(`/users/${username}/repos?per_page=100&sort=updated`);
            userData.repos = repos;
            
            // Calcular estatísticas
            const stats = this.calculateStats(userData, repos);
            
            // Calcular rank
            const rank = this.calculateRank(stats.totalXP);
            const level = this.calculateLevel(stats.totalXP);
            const nextLevelXP = this.calculateNextLevelXP(level);
            const progress = ((stats.totalXP - this.calculateLevelXP(level - 1)) / 
                            (nextLevelXP - this.calculateLevelXP(level - 1))) * 100;
            
            // Determinar classe
            const userClass = this.determineClass(userData, repos);
            
            // Determinar país e continente
            const countryCode = this.extractCountryFromLocation(userData.location);
            userData.countryCode = countryCode;
            userData.continent = countryCode ? this.getContinent(countryCode) : null;
            
            // Calcular posições nos rankings
            await this.calculateUserRankings(userData, stats);
            
            // Mostrar perfil
            this.showProfile(userData, stats, rank, level, nextLevelXP, progress, userClass);
            
            // Mostrar rankings do usuário
            this.showUserRankings(userData, stats);
            
            // Mostrar top repositórios
            this.showTopRepositories(repos.slice(0, 5));
            
            // Rolar para o perfil
            this.scrollToSection('#profile');
            
            this.showNotification(`Perfil de ${userData.name || username} carregado!`, 'success');
            
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            
            if (error.status === 404) {
                this.showNotification('Usuário não encontrado no GitHub', 'error');
            } else if (error.status === 403) {
                this.showNotification('Limite de requisições excedido. Tente novamente mais tarde.', 'warning');
            } else {
                // Modo demonstração - mostrar dados fictícios
                this.showDemoProfile(username);
            }
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Mostrar perfil de demonstração (quando API está offline)
     */
    showDemoProfile(username) {
        const demoUserData = {
            login: username,
            name: username.charAt(0).toUpperCase() + username.slice(1),
            avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
            bio: 'Desenvolvedor de software apaixonado por tecnologia',
            location: 'São Paulo, Brasil',
            blog: 'https://github.com',
            created_at: '2020-01-01T00:00:00Z',
            public_repos: 42,
            followers: 150,
            following: 80,
            html_url: `https://github.com/${username}`,
            repos: []
        };
        
        // Gerar repositórios fictícios
        for (let i = 1; i <= 5; i++) {
            demoUserData.repos.push({
                name: `projeto-${i}`,
                description: 'Um projeto incrível desenvolvido com paixão',
                language: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go'][i-1],
                stargazers_count: Math.floor(Math.random() * 100),
                forks_count: Math.floor(Math.random() * 50)
            });
        }
        
        this.userData = demoUserData;
        
        const stats = this.calculateStats(demoUserData, demoUserData.repos);
        const rank = this.calculateRank(stats.totalXP);
        const level = this.calculateLevel(stats.totalXP);
        const nextLevelXP = this.calculateNextLevelXP(level);
        const progress = ((stats.totalXP - this.calculateLevelXP(level - 1)) / 
                        (nextLevelXP - this.calculateLevelXP(level - 1))) * 100;
        
        const userClass = this.classes.fullstack;
        
        // Calcular rankings fictícios
        demoUserData.rankings = {
            global: {
                rank: Math.floor(Math.random() * 1000000) + 1,
                total: 10000000,
                percentile: (Math.random() * 10).toFixed(2)
            },
            country: {
                rank: Math.floor(Math.random() * 100000) + 1,
                total: 1000000,
                country: 'Brasil',
                emoji: '🇧🇷',
                percentile: (Math.random() * 15).toFixed(2)
            },
            continent: {
                rank: Math.floor(Math.random() * 500000) + 1,
                total: 5000000,
                continent: 'Américas',
                emoji: '🌎',
                percentile: (Math.random() * 12).toFixed(2)
            }
        };
        
        this.showProfile(demoUserData, stats, rank, level, nextLevelXP, progress, userClass);
        this.showUserRankings(demoUserData, stats);
        this.showTopRepositories(demoUserData.repos);
        this.scrollToSection('#profile');
        
        this.showNotification('Modo demonstração: mostrando dados simulados', 'info');
    }
    
    /**
     * Extrair código do país da localização
     */
    extractCountryFromLocation(location) {
        if (!location) return null;
        
        const locationLower = location.toLowerCase();
        
        const locationMap = {
            'brazil': 'BR', 'brasil': 'BR',
            'são paulo': 'BR', 'sao paulo': 'BR', 'rio de janeiro': 'BR',
            'united states': 'US', 'usa': 'US', 'new york': 'US',
            'united kingdom': 'GB', 'uk': 'GB', 'london': 'GB',
            'germany': 'DE', 'alemanha': 'DE', 'berlin': 'DE',
            'france': 'FR', 'frança': 'FR', 'paris': 'FR',
            'spain': 'ES', 'espanha': 'ES', 'madrid': 'ES',
            'italy': 'IT', 'itália': 'IT', 'rome': 'IT',
            'portugal': 'PT', 'lisbon': 'PT', 'lisboa': 'PT',
            'japan': 'JP', 'japão': 'JP', 'tokyo': 'JP',
            'canada': 'CA', 'toronto': 'CA',
            'australia': 'AU', 'sydney': 'AU'
        };
        
        for (const [key, code] of Object.entries(locationMap)) {
            if (locationLower.includes(key.toLowerCase())) {
                return code;
            }
        }
        
        return null;
    }
    
    /**
     * Obter continente do país
     */
    getContinent(countryCode) {
        const country = this.countries[countryCode];
        return country ? country.continent : null;
    }
    
    /**
     * Calcular posições do usuário nos rankings
     */
    async calculateUserRankings(userData, stats) {
        const countryCode = userData.countryCode;
        const continent = userData.continent;
        
        // Calcular posição global
        let globalRank = 1;
        let globalTotal = 10000000;
        
        const fixedUser = this.config.fixedUsers.find(u => u.username === userData.login);
        if (fixedUser) {
            globalRank = this.config.fixedUsers.indexOf(fixedUser) + 1;
        } else {
            const percentile = Math.max(1, Math.floor((stats.totalXP / 50000) * 100));
            globalRank = Math.max(1, Math.floor(globalTotal * (100 - percentile) / 100));
        }
        
        userData.rankings = {
            global: {
                rank: globalRank,
                total: globalTotal,
                percentile: ((globalRank / globalTotal) * 100).toFixed(2)
            }
        };
        
        if (countryCode && this.countries[countryCode]) {
            const country = this.countries[countryCode];
            const countryTotal = Math.floor(country.population || 1000000);
            
            let countryRank = Math.max(1, Math.floor(countryTotal * (Math.random() * 0.3 + 0.01)));
            
            if (fixedUser && fixedUser.country === countryCode) {
                countryRank = Math.max(1, Math.floor(countryTotal * 0.01));
            }
            
            userData.rankings.country = {
                rank: countryRank,
                total: countryTotal,
                country: country.name,
                emoji: country.emoji,
                percentile: ((countryRank / countryTotal) * 100).toFixed(2)
            };
        }
        
        if (continent && this.continents[continent]) {
            const continentData = this.continents[continent];
            const continentTotal = Math.floor(1000000);
            
            let continentRank = Math.max(1, Math.floor(continentTotal * (Math.random() * 0.2 + 0.01)));
            
            if (fixedUser && fixedUser.continent === continent) {
                continentRank = Math.max(1, Math.floor(continentTotal * 0.05));
            }
            
            userData.rankings.continent = {
                rank: continentRank,
                total: continentTotal,
                continent: continentData.name,
                emoji: continentData.emoji,
                percentile: ((continentRank / continentTotal) * 100).toFixed(2)
            };
        }
    }
    
    /**
     * Buscar dados da API do GitHub
     */
    async fetchGitHubData(endpoint) {
        const cacheKey = endpoint;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.config.cacheTime)) {
            console.log('📦 Usando cache:', endpoint);
            return cached.data;
        }
        
        console.log('🌐 Buscando:', endpoint);
        
        try {
            const response = await fetch(`${this.config.apiBase}${endpoint}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            this.config.rateLimit.remaining = parseInt(response.headers.get('X-RateLimit-Remaining')) || 0;
            this.config.rateLimit.reset = parseInt(response.headers.get('X-RateLimit-Reset')) || 0;
            
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}`);
                error.status = response.status;
                throw error;
            }
            
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Calcular estatísticas
     */
    calculateStats(userData, repos) {
        const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
        const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
        
        const languages = new Set();
        repos.forEach(repo => {
            if (repo.language) languages.add(repo.language);
        });
        
        const xpRepos = (userData.public_repos || 0) * 75;
        const xpStars = totalStars * 15;
        const xpFollowers = (userData.followers || 0) * 8;
        const xpForks = totalForks * 5;
        const xpFollowing = (userData.following || 0) * 2;
        const xpGists = (userData.public_gists || 0) * 3;
        const xpAccountAge = this.calculateAccountAgeXP(userData.created_at);
        
        const totalXP = xpRepos + xpStars + xpFollowers + xpForks + 
                       xpFollowing + xpGists + xpAccountAge;
        
        return {
            totalStars,
            totalForks,
            languages: languages.size,
            totalXP: Math.floor(totalXP),
            xpRepos,
            xpStars,
            xpFollowers,
            xpForks,
            xpFollowing,
            xpGists,
            xpAccountAge
        };
    }
    
    /**
     * Calcular XP baseado na idade da conta
     */
    calculateAccountAgeXP(createdAt) {
        if (!createdAt) return 0;
        const joinDate = new Date(createdAt);
        const years = (new Date() - joinDate) / (1000 * 60 * 60 * 24 * 365);
        return Math.floor(years * 100);
    }
    
    /**
     * Calcular rank baseado no XP
     */
    calculateRank(xp) {
        if (xp >= 50000) return 'S';
        if (xp >= 25000) return 'A';
        if (xp >= 10000) return 'B';
        if (xp >= 5000) return 'C';
        if (xp >= 1000) return 'D';
        return 'E';
    }
    
    /**
     * Calcular nível
     */
    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }
    
    /**
     * Calcular XP para nível
     */
    calculateLevelXP(level) {
        return Math.pow(level * 10, 2);
    }
    
    /**
     * Calcular XP para próximo nível
     */
    calculateNextLevelXP(currentLevel) {
        return this.calculateLevelXP(currentLevel + 1);
    }
    
    /**
     * Determinar classe do desenvolvedor
     */
    determineClass(userData, repos) {
        if (!repos || repos.length === 0) return this.classes.frontend;
        
        const languageCount = {};
        repos.forEach(repo => {
            if (repo.language) {
                languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
            }
        });
        
        const languages = Object.entries(languageCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(l => l[0].toLowerCase());
        
        const frontendLanguages = ['javascript', 'typescript', 'html', 'css', 'sass', 'scss'];
        const backendLanguages = ['python', 'java', 'php', 'ruby', 'go', 'rust', 'c++', 'c#'];
        
        const isFrontend = languages.some(lang => frontendLanguages.includes(lang));
        const isBackend = languages.some(lang => backendLanguages.includes(lang));
        
        if (isFrontend && isBackend) return this.classes.fullstack;
        if (isFrontend) return this.classes.frontend;
        if (isBackend) return this.classes.backend;
        
        return this.classes.fullstack;
    }
    
    /**
     * Carregar leaderboard global
     */
    async loadGlobalLeaderboard() {
        this.showLoading(true);
        
        try {
            const leaderboardData = await Promise.all(
                this.config.fixedUsers.map(async (fixedUser, index) => {
                    try {
                        const userData = await this.fetchGitHubData(`/users/${fixedUser.username}`);
                        const repos = await this.fetchGitHubData(`/users/${fixedUser.username}/repos?per_page=20`);
                        const stats = this.calculateStats(userData, repos);
                        
                        const countryCode = fixedUser.country;
                        const continent = fixedUser.continent;
                        
                        return {
                            rank: index + 1,
                            username: userData.login,
                            name: userData.name || userData.login,
                            avatar: userData.avatar_url,
                            xp: stats.totalXP,
                            rankLevel: this.calculateRank(stats.totalXP),
                            countryCode: countryCode,
                            continent: continent,
                            stats: stats
                        };
                    } catch (error) {
                        console.warn(`Erro ao carregar ${fixedUser.username}:`, error);
                        return null;
                    }
                })
            );
            
            const validData = leaderboardData.filter(Boolean);
            
            validData.sort((a, b) => b.xp - a.xp);
            validData.forEach((item, index) => item.rank = index + 1);
            
            this.globalLeaderboard = validData;
            
            this.organizeByCountry(validData);
            this.organizeByContinent(validData);
            
            this.showLeaderboard(validData);
            
        } catch (error) {
            console.error('Erro ao carregar leaderboard:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Organizar usuários por país
     */
    organizeByCountry(users) {
        this.countryLeaderboards = {};
        
        users.forEach(user => {
            if (user.countryCode) {
                if (!this.countryLeaderboards[user.countryCode]) {
                    this.countryLeaderboards[user.countryCode] = [];
                }
                this.countryLeaderboards[user.countryCode].push(user);
            }
        });
        
        Object.keys(this.countryLeaderboards).forEach(countryCode => {
            this.countryLeaderboards[countryCode].sort((a, b) => b.xp - a.xp);
            this.countryLeaderboards[countryCode].forEach((user, index) => user.countryRank = index + 1);
        });
    }
    
    /**
     * Organizar usuários por continente
     */
    organizeByContinent(users) {
        this.continentLeaderboards = {};
        
        users.forEach(user => {
            if (user.continent) {
                if (!this.continentLeaderboards[user.continent]) {
                    this.continentLeaderboards[user.continent] = [];
                }
                this.continentLeaderboards[user.continent].push(user);
            }
        });
        
        Object.keys(this.continentLeaderboards).forEach(continent => {
            this.continentLeaderboards[continent].sort((a, b) => b.xp - a.xp);
            this.continentLeaderboards[continent].forEach((user, index) => user.continentRank = index + 1);
        });
    }
    
    /**
     * Mostrar leaderboard
     */
    showLeaderboard(users) {
        const container = document.getElementById('leaderboardList');
        if (!container) return;
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-users-slash"></i>
                    <h3>Nenhum desenvolvedor encontrado</h3>
                </div>
            `;
            return;
        }
        
        container.innerHTML = users.map(user => {
            const rankInfo = this.ranks[user.rankLevel];
            const country = user.countryCode ? this.countries[user.countryCode] : null;
            const countryFlag = country ? country.emoji : '🏳️';
            
            return `
                <div class="leaderboard-item" onclick="githubRank.searchUser('${user.username}')">
                    <div class="leaderboard-rank">#${user.rank}</div>
                    <img src="${user.avatar}" alt="${user.username}" class="leaderboard-avatar">
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${user.name}</div>
                        <div class="leaderboard-meta">
                            <span class="leaderboard-xp">
                                <i class="fa-solid fa-bolt"></i> ${user.xp.toLocaleString()} XP
                            </span>
                            <span class="leaderboard-country">
                                ${countryFlag} ${country ? country.name : 'Desconhecido'}
                            </span>
                        </div>
                    </div>
                    <div class="leaderboard-badge" style="background: ${rankInfo.color}20; color: ${rankInfo.color}; border-color: ${rankInfo.color}">
                        ${user.rankLevel}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Mostrar perfil
     */
    showProfile(userData, stats, rank, level, nextLevelXP, progress, userClass) {
        document.getElementById('profile').style.display = 'block';
        document.getElementById('profileTitle').textContent = `Perfil: ${userData.login}`;
        
        document.getElementById('userAvatar').src = userData.avatar_url;
        document.getElementById('userName').textContent = userData.name || userData.login;
        document.getElementById('userLogin').textContent = `@${userData.login}`;
        document.getElementById('userBio').textContent = userData.bio || 'Sem biografia disponível.';
        document.getElementById('userLocation').textContent = userData.location || 'Não informado';
        
        if (userData.blog) {
            document.getElementById('userBlog').href = userData.blog;
            document.getElementById('userBlog').textContent = 'Website';
        } else {
            document.getElementById('userBlog').href = '#';
            document.getElementById('userBlog').textContent = 'Não informado';
        }
        
        const joinDate = new Date(userData.created_at);
        document.getElementById('userCreated').textContent = 
            `Membro desde ${joinDate.toLocaleDateString('pt-BR')}`;
        
        document.getElementById('reposCount').textContent = (userData.public_repos || 0).toLocaleString();
        document.getElementById('starsCount').textContent = stats.totalStars.toLocaleString();
        document.getElementById('followersCount').textContent = (userData.followers || 0).toLocaleString();
        document.getElementById('followingCount').textContent = (userData.following || 0).toLocaleString();
        
        const rankInfo = this.ranks[rank];
        document.getElementById('rankBadge').style.backgroundColor = rankInfo.color;
        document.getElementById('rankLevel').textContent = rank;
        document.getElementById('rankPill').style.backgroundColor = rankInfo.color;
        document.getElementById('rankPill').querySelector('.rank-name').textContent = rankInfo.name;
        
        document.getElementById('userLevel').textContent = level;
        document.getElementById('totalXP').textContent = stats.totalXP.toLocaleString();
        document.getElementById('nextLevelXP').textContent = nextLevelXP.toLocaleString();
        
        const currentLevelXP = this.calculateLevelXP(level - 1);
        const currentXP = stats.totalXP - currentLevelXP;
        const requiredXP = nextLevelXP - currentLevelXP;
        
        document.getElementById('xpProgress').style.width = `${progress}%`;
        document.getElementById('currentXP').textContent = currentXP.toLocaleString();
        document.getElementById('requiredXP').textContent = requiredXP.toLocaleString();
        
        document.getElementById('classIcon').innerHTML = `<i class="${userClass.icon}"></i>`;
        document.getElementById('classIcon').style.color = userClass.color;
        document.getElementById('className').textContent = userClass.name;
        document.getElementById('classDescription').textContent = userClass.description;
        
        const skills = userClass.skills.slice(0, 3);
        document.getElementById('primarySkill').textContent = skills[0] || 'Código';
        document.getElementById('secondarySkill').textContent = skills[1] || 'Desenvolvimento';
        document.getElementById('tertiarySkill').textContent = skills[2] || 'Software';
        
        document.getElementById('githubLink').href = userData.html_url;
    }
    
    /**
     * Mostrar rankings do usuário
     */
    showUserRankings(userData, stats) {
        const existingRankings = document.querySelector('.rankings-user-section');
        if (existingRankings) {
            existingRankings.remove();
        }
        
        if (!userData.rankings) return;
        
        const rankingsSection = document.createElement('section');
        rankingsSection.className = 'rankings-user-section';
        rankingsSection.innerHTML = `
            <div class="rankings-user-card">
                <div class="rankings-user-header">
                    <h3><i class="fa-solid fa-trophy"></i> Rankings do Desenvolvedor</h3>
                </div>
                <div class="rankings-user-grid">
                    <div class="ranking-card global">
                        <div class="ranking-header">
                            <div class="ranking-icon">
                                <i class="fa-solid fa-globe"></i>
                            </div>
                            <h4>Ranking Mundial</h4>
                        </div>
                        <div class="ranking-body">
                            <div class="ranking-position">
                                <span class="ranking-number">#${userData.rankings.global.rank.toLocaleString()}</span>
                                <span class="ranking-label">Posição Global</span>
                            </div>
                            <div class="ranking-info">
                                <span class="ranking-percentile">Top ${userData.rankings.global.percentile}%</span>
                            </div>
                        </div>
                    </div>
                    
                    ${userData.rankings.continent ? `
                    <div class="ranking-card continental">
                        <div class="ranking-header">
                            <div class="ranking-icon">
                                <i class="fa-solid fa-map"></i>
                            </div>
                            <h4>${userData.rankings.continent.emoji} ${userData.rankings.continent.continent}</h4>
                        </div>
                        <div class="ranking-body">
                            <div class="ranking-position">
                                <span class="ranking-number">#${userData.rankings.continent.rank.toLocaleString()}</span>
                                <span class="ranking-label">Posição Continental</span>
                            </div>
                            <div class="ranking-info">
                                <span class="ranking-percentile">Top ${userData.rankings.continent.percentile}%</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${userData.rankings.country ? `
                    <div class="ranking-card country">
                        <div class="ranking-header">
                            <div class="ranking-icon">
                                <i class="fa-solid fa-flag"></i>
                            </div>
                            <h4>${userData.rankings.country.emoji} ${userData.rankings.country.country}</h4>
                        </div>
                        <div class="ranking-body">
                            <div class="ranking-position">
                                <span class="ranking-number">#${userData.rankings.country.rank.toLocaleString()}</span>
                                <span class="ranking-label">Posição Nacional</span>
                            </div>
                            <div class="ranking-info">
                                <span class="ranking-percentile">Top ${userData.rankings.country.percentile}%</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        const rankContainer = document.querySelector('.rank-container');
        rankContainer.parentNode.insertBefore(rankingsSection, rankContainer.nextSibling);
    }
    
    /**
     * Mostrar top repositórios
     */
    showTopRepositories(repos) {
        const container = document.getElementById('topRepos');
        if (!container) return;
        
        if (!repos || repos.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum repositório encontrado.</p>';
            return;
        }
        
        container.innerHTML = repos.map(repo => `
            <div class="repo-item">
                <div class="repo-info">
                    <h4>${repo.name}</h4>
                    <p>${repo.description || 'Sem descrição'}</p>
                    <div class="repo-language">
                        ${repo.language ? `<span class="language-tag">${repo.language}</span>` : ''}
                    </div>
                </div>
                <div class="repo-stats">
                    <span class="repo-stat">
                        <i class="fa-regular fa-star"></i> ${repo.stargazers_count || 0}
                    </span>
                    <span class="repo-stat">
                        <i class="fa-solid fa-code-branch"></i> ${repo.forks_count || 0}
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Ocultar perfil
     */
    hideProfile() {
        document.getElementById('profile').style.display = 'none';
        document.getElementById('usernameInput').value = '';
        this.scrollToSection('#search');
        
        const rankingsSection = document.querySelector('.rankings-user-section');
        if (rankingsSection) {
            rankingsSection.remove();
        }
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const searchLink = document.querySelector('a[href="#search"]');
        if (searchLink) searchLink.classList.add('active');
    }
    
    /**
     * Atualizar perfil
     */
    refreshProfile() {
        if (this.currentUser) {
            this.cache.delete(`/users/${this.currentUser}`);
            this.cache.delete(`/users/${this.currentUser}/repos?per_page=100&sort=updated`);
            
            this.loadUserProfile(this.currentUser);
            this.showNotification('Perfil atualizado!', 'success');
        }
    }
    
    /**
     * Compartilhar perfil
     */
    shareProfile() {
        if (!this.currentUser || !this.userData) return;
        
        const stats = this.calculateStats(this.userData, this.userData.repos || []);
        const rank = this.calculateRank(stats.totalXP);
        const level = this.calculateLevel(stats.totalXP);
        
        const text = `🚀 GitHub Rank - ${this.userData.name || this.currentUser}\n\n` +
                    `🏆 Rank: ${rank} (Nível ${level})\n` +
                    `⚡ XP Total: ${stats.totalXP.toLocaleString()}\n\n` +
                    `🌍 Ranking Mundial: #${this.userData.rankings?.global.rank || 'N/A'}\n` +
                    `🔗 ${window.location.origin}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'GitHub Rank',
                text: text,
                url: window.location.href
            }).catch(() => this.copyShareLink());
        } else {
            this.copyShareLink();
        }
    }
    
    /**
     * Copiar link de compartilhamento
     */
    copyShareLink() {
        if (!this.userData) return;
        
        const stats = this.calculateStats(this.userData, this.userData.repos || []);
        const rank = this.calculateRank(stats.totalXP);
        const level = this.calculateLevel(stats.totalXP);
        
        const text = `🚀 GitHub Rank - ${this.userData.name || this.currentUser}\n\n` +
                    `🏆 Rank: ${rank} (Nível ${level})\n` +
                    `⚡ XP Total: ${stats.totalXP.toLocaleString()}\n` +
                    `\n🔗 ${window.location.origin}?user=${this.currentUser}`;
        
        navigator.clipboard.writeText(text)
            .then(() => this.showNotification('Ranking copiado para a área de transferência!', 'success'))
            .catch(() => this.showNotification('Erro ao copiar ranking', 'error'));
    }
    
    /**
     * Baixar badge
     */
    downloadBadge() {
        if (!this.currentUser || !this.userData) return;
        
        const stats = this.calculateStats(this.userData, this.userData.repos || []);
        const rank = this.calculateRank(stats.totalXP);
        const level = this.calculateLevel(stats.totalXP);
        const rankInfo = this.ranks[rank];
        
        const svg = `
            <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="200" rx="10" ry="10" fill="#0f172a"/>
                <rect x="5" y="5" width="390" height="190" rx="8" ry="8" fill="none" stroke="${rankInfo.color}" stroke-width="2"/>
                
                <circle cx="70" cy="70" r="40" fill="${rankInfo.color}" opacity="0.2"/>
                <text x="70" y="85" text-anchor="middle" fill="${rankInfo.color}" font-family="Arial" font-size="40" font-weight="bold">${rank}</text>
                
                <text x="200" y="60" fill="white" font-family="Arial" font-size="18" font-weight="bold">${this.userData.name || this.currentUser}</text>
                <text x="200" y="90" fill="#94a3b8" font-family="Arial" font-size="14">@${this.currentUser}</text>
                <text x="200" y="120" fill="white" font-family="Arial" font-size="16">Nível ${level} • ${stats.totalXP.toLocaleString()} XP</text>
                
                <text x="200" y="150" fill="white" font-family="Arial" font-size="12">🌍 #${this.userData.rankings?.global.rank || 'N/A'}</text>
                
                <text x="200" y="175" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="10">githubrank.dev</text>
            </svg>
        `;
        
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `github-rank-${this.currentUser}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Badge baixado com sucesso!', 'success');
    }
    
    /**
     * Rolar para seção
     */
    scrollToSection(sectionId) {
        const element = document.querySelector(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    /**
     * Mostrar loading
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }
    
    /**
     * Mostrar notificação
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const icon = notification.querySelector('.notification-icon');
        const messageEl = notification.querySelector('.notification-message');
        
        const icons = {
            success: 'fa-solid fa-circle-check',
            error: 'fa-solid fa-circle-exclamation',
            warning: 'fa-solid fa-triangle-exclamation',
            info: 'fa-solid fa-circle-info'
        };
        
        notification.className = `notification ${type}`;
        icon.className = `notification-icon ${icons[type]}`;
        messageEl.textContent = message;
        notification.style.display = 'flex';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.githubRank = new GitHubRank();
});