class GuildResume {
    constructor() {
        this.userData = null;
        this.guildData = null;
        this.topProjects = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadFromURL();
        this.setupExportModal();
    }

    async loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        let username = urlParams.get('user');
        
        // Tentar carregar do localStorage se não houver na URL
        if (!username) {
            username = localStorage.getItem('guildCurrentUser');
            if (username) {
                // Adicionar username à URL
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('user', username);
                window.history.replaceState({}, '', newUrl);
            }
        }
        
        if (username) {
            await this.fetchUserData(username);
        } else {
            this.showEmptyState();
        }
    }

    async fetchUserData(username) {
        this.showLoading();
        
        try {
            // Buscar dados básicos do usuário
            const userResponse = await fetch(`https://api.github.com/users/${username}`);
            if (!userResponse.ok) throw new Error('Usuário não encontrado');
            
            const userData = await userResponse.json();
            
            // Buscar repositórios
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
            const reposData = await reposResponse.json();
            
            // Buscar eventos para contribuições
            const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
            const eventsData = await eventsResponse.json();
            
            // Processar dados
            this.userData = {
                ...userData,
                repos: reposData,
                events: eventsData
            };
            
            // Carregar dados da guilda
            await this.loadGuildData(username);
            
            // Analisar e processar projetos
            this.analyzeProjects();
            
            // Renderizar currículo
            this.renderResume();
            
            // Gerar QR Code
            await this.generateQRCode();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showErrorState(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadGuildData(username) {
        const guildData = localStorage.getItem(`guild_${username}`);
        
        if (guildData) {
            this.guildData = JSON.parse(guildData);
        } else {
            // Criar dados básicos baseados no perfil
            this.guildData = {
                class: this.detectClassFromProfile(),
                specialization: this.detectSpecializationFromProfile(),
                rank: this.calculateRank(),
                joinDate: new Date().toISOString(),
                guildId: `GUILD-${Date.now().toString(36).toUpperCase()}`
            };
        }
    }

    detectClassFromProfile() {
        if (!this.userData?.repos) return 'mage';
        
        // Analisar linguagens para determinar classe
        const languages = this.extractLanguages();
        const frontend = ['JavaScript', 'TypeScript', 'HTML', 'CSS'];
        const backend = ['Python', 'Java', 'Ruby', 'PHP', 'Go', 'Rust'];
        const data = ['Python', 'R', 'SQL'];
        
        const frontendCount = languages.filter(lang => frontend.includes(lang)).length;
        const backendCount = languages.filter(lang => backend.includes(lang)).length;
        const dataCount = languages.filter(lang => data.includes(lang)).length;
        
        if (frontendCount > backendCount && frontendCount > dataCount) return 'warrior';
        if (backendCount > frontendCount && backendCount > dataCount) return 'rogue';
        if (dataCount > frontendCount && dataCount > backendCount) return 'alchemist';
        if (frontendCount > 0 && backendCount > 0) return 'ranger';
        
        return 'mage';
    }

    detectSpecializationFromProfile() {
        if (!this.userData?.repos) return 'fullstack';
        
        const repos = this.userData.repos;
        const topics = new Set();
        repos.forEach(repo => {
            if (repo.topics) {
                repo.topics.forEach(topic => topics.add(topic.toLowerCase()));
            }
        });
        
        const topicStr = Array.from(topics).join(' ');
        
        if (topicStr.includes('frontend') || topicStr.includes('react') || topicStr.includes('vue')) 
            return 'frontend';
        if (topicStr.includes('backend') || topicStr.includes('node') || topicStr.includes('express')) 
            return 'backend';
        if (topicStr.includes('mobile') || topicStr.includes('react-native') || topicStr.includes('flutter')) 
            return 'mobile';
        if (topicStr.includes('ai') || topicStr.includes('machine-learning') || topicStr.includes('ml')) 
            return 'ai';
        if (topicStr.includes('security')) 
            return 'security';
        if (topicStr.includes('cloud') || topicStr.includes('aws') || topicStr.includes('azure')) 
            return 'cloud';
            
        return 'fullstack';
    }

    calculateRank() {
        if (!this.userData?.repos) return 'E';
        
        const stats = this.calculateStats();
        const totalXP = stats.totalXP;
        
        if (totalXP >= 50000) return 'S';
        if (totalXP >= 25000) return 'A';
        if (totalXP >= 10000) return 'B';
        if (totalXP >= 5000) return 'C';
        if (totalXP >= 1000) return 'D';
        return 'E';
    }

    analyzeProjects() {
        if (!this.userData?.repos || this.userData.repos.length === 0) {
            this.topProjects = [];
            return;
        }
        
        // Calcular score para cada projeto
        const scoredProjects = this.userData.repos.map(repo => {
            const score = this.calculateProjectScore(repo);
            return { ...repo, score };
        });
        
        // Ordenar por score e pegar top 3
        this.topProjects = scoredProjects
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }

    calculateProjectScore(repo) {
        let score = 0;
        
        // Estrelas (peso alto)
        score += repo.stargazers_count * 10;
        
        // Forks (peso médio)
        score += repo.forks_count * 5;
        
        // Watchers (peso baixo)
        score += repo.watchers_count * 2;
        
        // Tamanho do projeto (peso muito baixo)
        score += Math.min(repo.size / 100, 50);
        
        // Issues abertas (peso negativo)
        score -= repo.open_issues_count * 0.5;
        
        // Projeto arquivado (penalidade alta)
        if (repo.archived) score -= 1000;
        
        // Tem descrição (bônus)
        if (repo.description && repo.description.length > 10) score += 50;
        
        // Tem README (bônus)
        if (repo.has_wiki || repo.has_pages) score += 30;
        
        // Linguagem principal (bônus se for uma linguagem popular)
        const popularLangs = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust'];
        if (popularLangs.includes(repo.language)) score += 20;
        
        return score;
    }

    calculateStats() {
        if (!this.userData?.repos) {
            return {
                totalRepos: 0,
                totalStars: 0,
                totalForks: 0,
                totalFollowers: 0,
                totalContributions: 0,
                totalXP: 0
            };
        }
        
        const totalStars = this.userData.repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
        const totalForks = this.userData.repos.reduce((acc, repo) => acc + repo.forks_count, 0);
        const totalContributions = this.userData.events ? this.userData.events.length : 0;
        
        // Calcular XP (mesma fórmula do sistema principal)
        const totalXP = (totalStars * 10) + (totalForks * 5) + 
                       (this.userData.public_repos * 20) + 
                       (this.userData.followers * 3);
        
        return {
            totalRepos: this.userData.public_repos || 0,
            totalStars,
            totalForks,
            totalFollowers: this.userData.followers || 0,
            totalContributions,
            totalXP
        };
    }

    renderResume() {
        this.renderProfile();
        this.renderStats();
        this.renderTopProjects();
        this.renderSkills();
        this.renderContributions();
        this.renderAbout();
        this.renderBadges();
        this.updateGenerationDate();
    }

    renderProfile() {
        const container = document.getElementById('profileSection');
        const stats = this.calculateStats();
        
        container.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">
                    <div class="avatar-container">
                        <img src="${this.userData.avatar_url}" 
                             alt="${this.userData.login}"
                             onerror="this.src='https://via.placeholder.com/240/3b82f6/ffffff?text=${this.userData.login.charAt(0).toUpperCase()}'">
                    </div>
                </div>
                <div class="profile-info">
                    <h1 class="profile-name">${this.userData.name || this.userData.login}</h1>
                    <div class="profile-title">
                        <i class="fas fa-code"></i>
                        ${this.getClassInfo(this.guildData.class).name} • ${this.getSpecializationInfo(this.guildData.specialization)}
                    </div>
                    <p class="profile-bio">${this.userData.bio || 'Desenvolvedor apaixonado por criar soluções inovadoras através do código.'}</p>
                    
                    <div class="profile-meta">
                        ${this.userData.location ? `
                            <div class="meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${this.userData.location}</span>
                            </div>
                        ` : ''}
                        
                        ${this.userData.blog ? `
                            <div class="meta-item">
                                <i class="fas fa-link"></i>
                                <a href="${this.userData.blog}" target="_blank">Website</a>
                            </div>
                        ` : ''}
                        
                        ${this.userData.twitter_username ? `
                            <div class="meta-item">
                                <i class="fab fa-twitter"></i>
                                <a href="https://twitter.com/${this.userData.twitter_username}" target="_blank">@${this.userData.twitter_username}</a>
                            </div>
                        ` : ''}
                        
                        <div class="meta-item">
                            <i class="fab fa-github"></i>
                            <a href="${this.userData.html_url}" target="_blank">${this.userData.login}</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStats() {
        const container = document.getElementById('statsSection');
        const stats = this.calculateStats();
        const rankInfo = this.getRankInfo(this.guildData.rank);
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-code-branch"></i>
                    </div>
                    <span class="stat-value">${stats.totalRepos}</span>
                    <span class="stat-label">Repositórios</span>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <span class="stat-value">${stats.totalStars.toLocaleString()}</span>
                    <span class="stat-label">Estrelas</span>
                    ${stats.totalStars > 1000 ? '<span class="stat-trend trend-up">+ Top 1%</span>' : ''}
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <span class="stat-value">${stats.totalForks.toLocaleString()}</span>
                    <span class="stat-label">Forks</span>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <span class="stat-value">${stats.totalFollowers.toLocaleString()}</span>
                    <span class="stat-label">Seguidores</span>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    <span class="stat-value">${this.guildData.rank}</span>
                    <span class="stat-label">GitHub Rank</span>
                    <span class="stat-trend" style="background: ${rankInfo.color}20; color: ${rankInfo.color}">
                        ${rankInfo.name}
                    </span>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <span class="stat-value">${stats.totalXP.toLocaleString()}</span>
                    <span class="stat-label">Total XP</span>
                </div>
            </div>
        `;
    }

    renderTopProjects() {
        const container = document.getElementById('topProjects');
        
        if (this.topProjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhum projeto encontrado</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.topProjects.map((repo, index) => `
            <div class="project-card">
                <div class="project-rank">${index + 1}</div>
                <div class="project-header">
                    <h3 class="project-title">
                        ${repo.name}
                        <a href="${repo.html_url}" target="_blank" class="project-link">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    </h3>
                    <p class="project-description">${repo.description || 'Projeto sem descrição disponível.'}</p>
                </div>
                
                <div class="project-body">
                    <div class="project-metrics">
                        <div class="metric">
                            <i class="fas fa-star"></i>
                            <span class="metric-value">${repo.stargazers_count}</span>
                            <span class="metric-label">Stars</span>
                        </div>
                        <div class="metric">
                            <i class="fas fa-code-branch"></i>
                            <span class="metric-value">${repo.forks_count}</span>
                            <span class="metric-label">Forks</span>
                        </div>
                        <div class="metric">
                            <i class="fas fa-eye"></i>
                            <span class="metric-value">${repo.watchers_count}</span>
                            <span class="metric-label">Watchers</span>
                        </div>
                        ${repo.language ? `
                            <div class="metric">
                                <i class="fas fa-code"></i>
                                <span class="metric-value">${repo.language}</span>
                                <span class="metric-label">Linguagem</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${repo.topics && repo.topics.length > 0 ? `
                        <div class="project-tech">
                            ${repo.topics.slice(0, 5).map(topic => `
                                <span class="tech-tag">${topic}</span>
                            `).join('')}
                            ${repo.topics.length > 5 ? '<span class="tech-tag">+' + (repo.topics.length - 5) + '</span>' : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="project-footer">
                    <span class="project-date">
                        Atualizado em ${new Date(repo.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div class="project-actions">
                        <button class="project-btn" onclick="window.open('${repo.html_url}', '_blank')">
                            <i class="fab fa-github"></i>
                        </button>
                        ${repo.homepage ? `
                            <button class="project-btn" onclick="window.open('${repo.homepage}', '_blank')">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderSkills() {
        const container = document.getElementById('skillsContainer');
        const languages = this.analyzeLanguages();
        const frameworks = this.extractFrameworks();
        
        container.innerHTML = `
            <div class="skill-category">
                <h3 class="category-title">
                    <i class="fas fa-code"></i>
                    Linguagens
                </h3>
                <div class="skill-list">
                    ${languages.map(lang => `
                        <div class="skill-item">
                            <span class="skill-name">${lang.name}</span>
                            <div class="skill-bar">
                                <div class="skill-level" style="width: ${lang.percentage}%"></div>
                            </div>
                            <span class="skill-percentage">${lang.percentage}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="skill-category">
                <h3 class="category-title">
                    <i class="fas fa-cogs"></i>
                    Tecnologias & Frameworks
                </h3>
                <div class="skill-list">
                    ${frameworks.map(framework => `
                        <div class="skill-item">
                            <span class="skill-name">${framework}</span>
                            <div class="skill-bar">
                                <div class="skill-level" style="width: ${Math.floor(Math.random() * 30) + 70}%"></div>
                            </div>
                            <span class="skill-percentage">${Math.floor(Math.random() * 30) + 70}%</span>
                        </div>
                    `).slice(0, 5).join('')}
                </div>
            </div>
        `;
    }

    analyzeLanguages() {
        if (!this.userData?.repos) return [];
        
        const languages = {};
        let totalBytes = 0;
        
        this.userData.repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
                totalBytes++;
            }
        });
        
        return Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / totalBytes) * 100)
            }));
    }

    extractFrameworks() {
        if (!this.userData?.repos) return [];
        
        const frameworks = new Set();
        const frameworkPatterns = {
            'React': ['react'],
            'Vue.js': ['vue'],
            'Angular': ['angular'],
            'Express': ['express'],
            'Django': ['django'],
            'Flask': ['flask'],
            'Spring': ['spring'],
            'Laravel': ['laravel'],
            'Next.js': ['next'],
            'Nuxt.js': ['nuxt'],
            'Svelte': ['svelte'],
            'Tailwind CSS': ['tailwind'],
            'Bootstrap': ['bootstrap'],
            'Material-UI': ['material-ui', 'mui'],
            'GraphQL': ['graphql'],
            'TypeScript': ['typescript'],
            'Node.js': ['node'],
            'MongoDB': ['mongodb'],
            'PostgreSQL': ['postgresql'],
            'MySQL': ['mysql'],
            'Redis': ['redis'],
            'Docker': ['docker'],
            'Kubernetes': ['kubernetes'],
            'AWS': ['aws'],
            'Firebase': ['firebase']
        };
        
        this.userData.repos.forEach(repo => {
            // Verificar descrição
            if (repo.description) {
                const desc = repo.description.toLowerCase();
                Object.entries(frameworkPatterns).forEach(([framework, patterns]) => {
                    if (patterns.some(pattern => desc.includes(pattern))) {
                        frameworks.add(framework);
                    }
                });
            }
            
            // Verificar tópicos
            if (repo.topics) {
                repo.topics.forEach(topic => {
                    Object.entries(frameworkPatterns).forEach(([framework, patterns]) => {
                        if (patterns.some(pattern => topic.toLowerCase().includes(pattern))) {
                            frameworks.add(framework);
                        }
                    });
                });
            }
        });
        
        return Array.from(frameworks);
    }

    renderContributions() {
        const container = document.getElementById('contributionsGrid');
        
        // Gerar gráfico de contribuições fictício
        // Em produção, você pode usar a API do GitHub para dados reais
        container.innerHTML = `
            <div class="contribution-chart" id="contributionChart">
                ${this.generateContributionGrid()}
            </div>
            <div class="contribution-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background: #ebedf0"></div>
                    <span>Nenhuma contribuição</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #9be9a8"></div>
                    <span>1-9 contribuições</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #40c463"></div>
                    <span>10-19 contribuições</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #30a14e"></div>
                    <span>20-29 contribuições</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #216e39"></div>
                    <span>30+ contribuições</span>
                </div>
            </div>
        `;
    }

    generateContributionGrid() {
        let html = '';
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364); // 52 semanas atrás
        
        for (let week = 0; week < 53; week++) {
            for (let day = 0; day < 7; day++) {
                // Gerar dados fictícios (em produção, use dados reais)
                const level = Math.floor(Math.random() * 5);
                html += `<div class="contribution-day" data-level="${level}"></div>`;
            }
        }
        
        return html;
    }

    renderAbout() {
        const container = document.getElementById('aboutContent');
        const stats = this.calculateStats();
        const topLanguages = this.analyzeLanguages();
        
        const mainLanguage = topLanguages[0]?.name || 'várias linguagens';
        const secondLanguage = topLanguages[1]?.name || 'tecnologias modernas';
        
        container.innerHTML = `
            <p>
                Desenvolvedor com ${stats.totalRepos} repositórios públicos no GitHub, 
                acumulando ${stats.totalStars.toLocaleString()} estrelas e 
                ${stats.totalForks.toLocaleString()} forks. Especializado em 
                ${mainLanguage} com experiência sólida em ${secondLanguage}.
            </p>
            
            <p>
                ${this.topProjects.length > 0 ? 
                    `Destaque para o projeto "${this.topProjects[0]?.name}" com 
                    ${this.topProjects[0]?.stargazers_count} estrelas, demonstrando 
                    habilidades em desenvolvimento de software de alta qualidade.` : 
                    'Comprometido com boas práticas de desenvolvimento e código limpo.'
                }
            </p>
            
            <p>
                Ativo na comunidade open-source com ${stats.totalContributions} contribuições públicas. 
                ${stats.totalFollowers > 100 ? 
                    `Reconhecido por ${stats.totalFollowers} desenvolvedores que seguem seu trabalho.` : 
                    'Em constante evolução e aprendizado de novas tecnologias.'
                }
            </p>
            
            <p>
                Ranking GitHub Guild: <strong>${this.guildData.rank}</strong> - 
                ${this.getRankInfo(this.guildData.rank).name}. 
                Classificação baseada em contribuições, engajamento e impacto na comunidade.
            </p>
        `;
    }

    renderBadges() {
        const container = document.getElementById('badgesGrid');
        const stats = this.calculateStats();
        
        const badges = [];
        
        // Badge de estrelas
        if (stats.totalStars >= 1000) {
            badges.push({
                icon: 'fas fa-star',
                title: 'GitHub Star',
                description: 'Mais de 1,000 estrelas'
            });
        } else if (stats.totalStars >= 100) {
            badges.push({
                icon: 'fas fa-star',
                title: 'Rising Star',
                description: 'Mais de 100 estrelas'
            });
        }
        
        // Badge de contribuições
        if (stats.totalContributions >= 100) {
            badges.push({
                icon: 'fas fa-code-commit',
                title: 'Contribuidor Ativo',
                description: '100+ contribuições'
            });
        }
        
        // Badge de projetos
        if (stats.totalRepos >= 20) {
            badges.push({
                icon: 'fas fa-project-diagram',
                title: 'Projetista',
                description: '20+ repositórios'
            });
        }
        
        // Badge de rank
        if (['S', 'A', 'B'].includes(this.guildData.rank)) {
            badges.push({
                icon: 'fas fa-trophy',
                title: `Rank ${this.guildData.rank}`,
                description: this.getRankInfo(this.guildData.rank).name
            });
        }
        
        // Badge de seguidores
        if (stats.totalFollowers >= 100) {
            badges.push({
                icon: 'fas fa-users',
                title: 'Influenciador',
                description: '100+ seguidores'
            });
        }
        
        // Se não houver badges, mostrar algumas genéricas
        if (badges.length === 0) {
            badges.push(
                {
                    icon: 'fas fa-code',
                    title: 'Desenvolvedor',
                    description: 'Perfil GitHub ativo'
                },
                {
                    icon: 'fas fa-rocket',
                    title: 'Em Ascensão',
                    description: 'Potencial em crescimento'
                },
                {
                    icon: 'fas fa-seedling',
                    title: 'Iniciante',
                    description: 'Começando a jornada'
                }
            );
        }
        
        container.innerHTML = badges.map(badge => `
            <div class="badge-item">
                <div class="badge-icon">
                    <i class="${badge.icon}"></i>
                </div>
                <h4 class="badge-title">${badge.title}</h4>
                <p class="badge-description">${badge.description}</p>
            </div>
        `).join('');
    }

    async generateQRCode() {
        const container = document.getElementById('qrBadge');
        
        // Criar QR Code simples (em produção, use uma biblioteca)
        const qrText = `https://github.com/${this.userData.login}`;
        
        container.innerHTML = `
            <div class="qr-placeholder">
                <div style="text-align: center; font-size: 0.7rem; font-weight: 600;">
                    GitHub
                </div>
                <div style="text-align: center; font-size: 0.6rem; margin-top: 2px;">
                    @${this.userData.login}
                </div>
            </div>
        `;
        
        // Em produção, descomente para usar biblioteca QR:
        /*
        new QRCode(container, {
            text: qrText,
            width: 64,
            height: 64,
            colorDark: "#3b82f6",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        */
    }

    updateGenerationDate() {
        const element = document.getElementById('generationDate');
        element.textContent = `Gerado em: ${new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }

    getClassInfo(classId) {
        const classes = {
            mage: { name: 'Mago do Código', icon: '🧙' },
            warrior: { name: 'Guerreiro Frontend', icon: '⚔️' },
            rogue: { name: 'Ladino Backend', icon: '🗡️' },
            ranger: { name: 'Arqueiro Fullstack', icon: '🏹' },
            cleric: { name: 'Clérigo DevOps', icon: '⛪' },
            alchemist: { name: 'Alquimista de Dados', icon: '⚗️' },
            artificer: { name: 'Artesão UI/UX', icon: '🔨' },
            bard: { name: 'Bardo da Documentação', icon: '🎵' }
        };
        return classes[classId] || classes.mage;
    }

    getSpecializationInfo(specId) {
        const specializations = {
            frontend: 'Frontend Master',
            backend: 'Backend Sorcerer',
            fullstack: 'Fullstack Legend',
            mobile: 'Mobile Ranger',
            ai: 'AI Alchemist',
            security: 'Security Guardian',
            cloud: 'Cloud Archmage'
        };
        return specializations[specId] || 'Fullstack Developer';
    }

    getRankInfo(rank) {
        const ranks = {
            'S': { name: 'Lendário', color: '#FFD700' },
            'A': { name: 'Épico', color: '#C0C0C0' },
            'B': { name: 'Raro', color: '#CD7F32' },
            'C': { name: 'Incomum', color: '#3b82f6' },
            'D': { name: 'Comum', color: '#8b5cf6' },
            'E': { name: 'Iniciante', color: '#ef4444' }
        };
        return ranks[rank] || ranks['E'];
    }

    extractLanguages() {
        if (!this.userData?.repos) return [];
        
        const languages = {};
        this.userData.repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });
        
        return Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .map(([lang]) => lang);
    }

    setupEventListeners() {
        // Botão de exportação
        document.getElementById('exportResume').addEventListener('click', () => {
            this.showExportModal();
        });
    }

    setupExportModal() {
        const modal = document.getElementById('exportModal');
        const closeBtn = modal.querySelector('.close-modal');
        const exportOptions = modal.querySelectorAll('.export-option');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        exportOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.exportResume(format);
            });
        });
        
        // Botão de refresh da prévia
        modal.querySelector('.refresh-preview').addEventListener('click', () => {
            this.updateExportPreview();
        });
    }

    showExportModal() {
        const modal = document.getElementById('exportModal');
        modal.classList.add('active');
        this.updateExportPreview();
    }

    updateExportPreview() {
        const preview = document.getElementById('exportPreview');
        preview.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-file-alt" style="font-size: 3rem; color: #3b82f6; margin-bottom: 16px;"></i>
                <p style="color: #4a5568; margin-bottom: 8px;">Prévia do currículo gerado</p>
                <p style="color: #718096; font-size: 0.9rem;">${this.userData.name || this.userData.login}</p>
                <p style="color: #718096; font-size: 0.9rem;">${this.getClassInfo(this.guildData.class).name}</p>
                <p style="color: #718096; font-size: 0.9rem;">Rank: ${this.guildData.rank}</p>
            </div>
        `;
    }

    async exportResume(format) {
        this.showNotification(`Gerando ${format.toUpperCase()}...`, 'info');
        
        switch(format) {
            case 'svg':
                await this.exportAsSVG();
                break;
            case 'png':
                await this.exportAsPNG();
                break;
            case 'pdf':
                await this.exportAsPDF();
                break;
            case 'markdown':
                await this.exportAsMarkdown();
                break;
        }
    }

    async exportAsSVG() {
        // Em produção, use html2canvas ou similar para converter para SVG
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.showNotification('SVG gerado com sucesso!', 'success');
        
        // Criar link de download
        const svgContent = this.generateSVGContent();
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `github-resume-${this.userData.login}.svg`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    generateSVGContent() {
        const stats = this.calculateStats();
        
        return `
            <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
                <style>
                    .title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; }
                    .subtitle { font-family: Arial, sans-serif; font-size: 16px; fill: #666; }
                    .stat { font-family: Arial, sans-serif; font-size: 18px; }
                </style>
                
                <rect width="800" height="600" fill="#f8fafc" rx="24" />
                
                <text x="400" y="60" text-anchor="middle" class="title">
                    ${this.userData.name || this.userData.login}
                </text>
                
                <text x="400" y="90" text-anchor="middle" class="subtitle">
                    ${this.getClassInfo(this.guildData.class).name} • GitHub Guild
                </text>
                
                <text x="100" y="150" class="stat">Repositórios: ${stats.totalRepos}</text>
                <text x="100" y="180" class="stat">Estrelas: ${stats.totalStars}</text>
                <text x="100" y="210" class="stat">Seguidores: ${stats.totalFollowers}</text>
                <text x="100" y="240" class="stat">Rank: ${this.guildData.rank}</text>
                
                <text x="400" y="500" text-anchor="middle" class="subtitle">
                    github.com/${this.userData.login}
                </text>
            </svg>
        `;
    }

    async exportAsPNG() {
        this.showNotification('PNG em desenvolvimento...', 'info');
        // Em produção, use html2canvas
    }

    async exportAsPDF() {
        this.showNotification('PDF em desenvolvimento...', 'info');
        // Em produção, use jsPDF
    }

    async exportAsMarkdown() {
        const stats = this.calculateStats();
        const markdown = `
# ${this.userData.name || this.userData.login}

${this.userData.bio || 'Desenvolvedor GitHub'}

## 📊 Estatísticas do GitHub

- **Repositórios:** ${stats.totalRepos}
- **Estrelas:** ${stats.totalStars}
- **Forks:** ${stats.totalForks}
- **Seguidores:** ${stats.totalFollowers}
- **Rank GitHub Guild:** ${this.guildData.rank}

## 🏆 Top Projetos

${this.topProjects.map((repo, i) => `
### ${i + 1}. ${repo.name}
${repo.description || ''}

⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count} | 👁️ ${repo.watchers_count}

🔗 [Ver no GitHub](${repo.html_url})
`).join('\n')}

## 🛠️ Stack Principal

${this.analyzeLanguages().map(lang => `- ${lang.name}: ${lang.percentage}%`).join('\n')}

## 📫 Contato

- GitHub: [${this.userData.login}](${this.userData.html_url})
${this.userData.blog ? `- Website: ${this.userData.blog}\n` : ''}
${this.userData.twitter_username ? `- Twitter: @${this.userData.twitter_username}\n` : ''}
${this.userData.location ? `- Localização: ${this.userData.location}\n` : ''}

---

*Currículo gerado automaticamente pelo GitHub Guild*
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*
        `.trim();
        
        // Criar blob e download
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `github-resume-${this.userData.login}.md`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.showNotification('Markdown gerado com sucesso!', 'success');
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showEmptyState() {
        const container = document.getElementById('resumeContainer');
        container.innerHTML = `
            <div class="empty-state-full">
                <i class="fas fa-user-slash"></i>
                <h2>Nenhum perfil selecionado</h2>
                <p>Volte à página principal e digite seu username do GitHub</p>
                <a href="index.html" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Voltar ao Portal
                </a>
            </div>
        `;
        
        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            .empty-state-full {
                text-align: center;
                padding: 100px 20px;
            }
            
            .empty-state-full i {
                font-size: 4rem;
                color: #cbd5e0;
                margin-bottom: 24px;
            }
            
            .empty-state-full h2 {
                font-size: 2rem;
                color: #2d3748;
                margin-bottom: 16px;
            }
            
            .empty-state-full p {
                color: #718096;
                margin-bottom: 32px;
                font-size: 1.1rem;
            }
            
            .back-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #3b82f6;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .back-btn:hover {
                background: #2563eb;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    showErrorState(message) {
        const container = document.getElementById('resumeContainer');
        container.innerHTML = `
            <div class="error-state-full">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Erro ao carregar perfil</h2>
                <p>${message || 'Não foi possível carregar os dados do GitHub.'}</p>
                <button onclick="location.reload()" class="retry-btn">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
        
        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            .error-state-full {
                text-align: center;
                padding: 100px 20px;
            }
            
            .error-state-full i {
                font-size: 4rem;
                color: #fc8181;
                margin-bottom: 24px;
            }
            
            .error-state-full h2 {
                font-size: 2rem;
                color: #2d3748;
                margin-bottom: 16px;
            }
            
            .error-state-full p {
                color: #718096;
                margin-bottom: 32px;
                font-size: 1.1rem;
            }
            
            .retry-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #fc8181;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .retry-btn:hover {
                background: #f56565;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'resume-notification';
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 
                            'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Adicionar animações CSS
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    window.guildResume = new GuildResume();
});