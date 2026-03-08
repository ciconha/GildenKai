class GitHubGuild {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.guildData = null;
        this.currentTheme = 'dark';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAPIStatus();
        this.loadSavedUser();
        this.setupHashNavigation();
    }

    setupEventListeners() {
        // Portal de Acesso
        document.getElementById('portalAccess').addEventListener('click', () => this.accessGuild());
        document.getElementById('portalDemo').addEventListener('click', () => this.showDemo());
        document.getElementById('portalUsername').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.accessGuild();
        });

        // Navegação Principal
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.currentTarget.id === 'backToPortal') {
                    this.returnToPortal();
                } else {
                    const tab = e.currentTarget.dataset.tab;
                    this.switchTab(tab);
                    window.location.hash = tab;
                }
            });
        });

        // Gerador de Cartão
        document.getElementById('generateCard').addEventListener('click', () => this.generateCard());
        document.getElementById('downloadCard').addEventListener('click', () => this.downloadCard());
        document.getElementById('shareCard').addEventListener('click', () => this.shareCard());
        document.getElementById('copyCard').addEventListener('click', () => this.copyCard());

        // Currículo
        document.getElementById('printResume').addEventListener('click', () => this.printResume());
        document.getElementById('downloadResume').addEventListener('click', () => this.downloadResume());

        // Projetos
        document.getElementById('projectSearch').addEventListener('input', () => this.filterProjects());
        document.getElementById('projectSort').addEventListener('change', () => this.sortProjects());

        // Certificado
        document.getElementById('downloadCertificate').addEventListener('click', () => this.downloadCertificate());
        document.getElementById('shareCertificate').addEventListener('click', () => this.shareCertificate());
        document.getElementById('verifyCertificate').addEventListener('click', () => this.verifyCertificate());

        // QR Code
        document.getElementById('downloadQR').addEventListener('click', () => this.downloadQR());
        document.getElementById('printQR').addEventListener('click', () => this.printQR());
        document.getElementById('refreshQR').addEventListener('click', () => this.refreshQR());

        // Temas
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
            });
        });

        // Links de acesso rápido (hash navigation)
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const hash = link.getAttribute('href').substring(1);
                if (hash) {
                    this.switchTab(hash);
                    window.location.hash = hash;
                }
            });
        });
    }

    setupHashNavigation() {
        // Verificar hash na URL ao carregar
        window.addEventListener('hashchange', () => this.handleHashChange());
        this.handleHashChange();
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash && ['dashboard', 'card', 'resume', 'projects', 'certificate', 'qr'].includes(hash)) {
            this.switchTab(hash);
        }
    }

    async checkAPIStatus() {
        const statusElement = document.getElementById('portalApiStatus');
        
        try {
            const response = await fetch('https://api.github.com');
            if (response.ok) {
                statusElement.innerHTML = '<i class="fas fa-circle"></i> GitHub API: Online';
                statusElement.style.color = 'var(--dark-success)';
            }
        } catch (error) {
            statusElement.innerHTML = '<i class="fas fa-circle"></i> GitHub API: Offline';
            statusElement.style.color = 'var(--dark-danger)';
        }
    }

    loadSavedUser() {
        const savedUser = localStorage.getItem('guildCurrentUser');
        if (savedUser) {
            document.getElementById('portalUsername').value = savedUser;
        }
    }

    async accessGuild() {
        const username = document.getElementById('portalUsername').value.trim();
        
        if (!username) {
            this.showNotification('Digite um nome de usuário do GitHub', 'error');
            return;
        }

        this.showLoading('Consultando os registros da guilda...');
        
        try {
            await this.loadUserData(username);
            this.showMainApp();
            this.showNotification(`Bem-vindo à Guilda, ${username}!`, 'success');
        } catch (error) {
            console.error('Erro ao acessar guilda:', error);
            this.showNotification('Usuário não encontrado no GitHub', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadUserData(username) {
        try {
            // Buscar dados do usuário
            const userResponse = await fetch(`https://api.github.com/users/${username}`);
            if (!userResponse.ok) throw new Error('Usuário não encontrado');
            
            this.userData = await userResponse.json();
            this.currentUser = username;
            
            // Buscar repositórios
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
            this.userData.repos = await reposResponse.json();
            
            // Carregar dados da guilda
            this.loadGuildData();
            
            // Atualizar interface
            this.updateUserProfile();
            this.updateDashboardStats();
            this.populateFormFields();
            
            // Salvar no localStorage
            localStorage.setItem('guildCurrentUser', username);
            
        } catch (error) {
            throw error;
        }
    }

    loadGuildData() {
        const savedData = localStorage.getItem(`guild_${this.currentUser}`);
        
        if (savedData) {
            this.guildData = JSON.parse(savedData);
        } else {
            // Criar dados iniciais
            this.guildData = {
                class: 'mage',
                specialization: 'fullstack',
                rank: this.calculateRank(),
                joinDate: new Date().toISOString(),
                guildId: `GUILD-${Date.now().toString(36).toUpperCase()}`,
                theme: 'dark'
            };
            this.saveGuildData();
        }
        
        this.currentTheme = this.guildData.theme;
    }

    saveGuildData() {
        if (this.currentUser && this.guildData) {
            localStorage.setItem(`guild_${this.currentUser}`, JSON.stringify(this.guildData));
        }
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

    calculateStats() {
        if (!this.userData?.repos) return { totalXP: 0 };
        
        const stars = this.userData.repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
        const forks = this.userData.repos.reduce((acc, repo) => acc + repo.forks_count, 0);
        const repos = this.userData.public_repos || 0;
        const followers = this.userData.followers || 0;
        
        const totalXP = (stars * 10) + (forks * 5) + (repos * 20) + (followers * 3);
        
        return {
            stars,
            forks,
            repos,
            followers,
            totalXP
        };
    }

    updateUserProfile() {
        const container = document.getElementById('userProfile');
        const stats = this.calculateStats();
        
        container.innerHTML = `
            <div class="user-avatar">
                <img src="${this.userData.avatar_url}" 
                     alt="${this.currentUser}"
                     onerror="this.src='https://via.placeholder.com/150/1a202c/4fd1c7?text=${this.currentUser.charAt(0).toUpperCase()}'">
            </div>
            <div class="user-info">
                <h2>${this.userData.name || this.currentUser}</h2>
                <p>${this.userData.bio || 'Aventureiro do código'}</p>
                <div class="user-stats">
                    <div class="user-stat">
                        <span class="stat-value">${stats.repos}</span>
                        <span class="stat-label">Projetos</span>
                    </div>
                    <div class="user-stat">
                        <span class="stat-value">${stats.stars}</span>
                        <span class="stat-label">Estrelas</span>
                    </div>
                    <div class="user-stat">
                        <span class="stat-value">${stats.followers}</span>
                        <span class="stat-label">Seguidores</span>
                    </div>
                    <div class="user-stat">
                        <span class="stat-value">${this.guildData.rank}</span>
                        <span class="stat-label">Rank</span>
                    </div>
                </div>
            </div>
        `;
        
        // Atualizar welcome message
        document.getElementById('userWelcome').textContent = 
            `Bem-vindo, ${this.userData.name || this.currentUser}!`;
    }

    updateDashboardStats() {
        const container = document.getElementById('guildStats');
        const stats = this.calculateStats();
        const rankInfo = this.getRankInfo(this.guildData.rank);
        
        container.innerHTML = `
            <div class="stat-card">
                <span class="stat-value">${stats.totalXP.toLocaleString()}</span>
                <span class="stat-label">Total XP</span>
            </div>
            <div class="stat-card">
                <span class="stat-value" style="color: ${rankInfo.color}">${this.guildData.rank}</span>
                <span class="stat-label">Rank Atual</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${this.userData.public_gists || 0}</span>
                <span class="stat-label">Gists</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${this.getTopLanguage()}</span>
                <span class="stat-label">Linguagem Top</span>
            </div>
        `;
    }

    getTopLanguage() {
        if (!this.userData?.repos) return 'N/A';
        
        const languages = {};
        this.userData.repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });
        
        const top = Object.entries(languages).sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : 'N/A';
    }

    getRankInfo(rank) {
        const ranks = {
            'S': { name: 'Lendário', color: '#FFD700' },
            'A': { name: 'Épico', color: '#C0C0C0' },
            'B': { name: 'Raro', color: '#CD7F32' },
            'C': { name: 'Incomum', color: '#4fd1c7' },
            'D': { name: 'Comum', color: '#9f7aea' },
            'E': { name: 'Iniciante', color: '#fc8181' }
        };
        
        return ranks[rank] || ranks['E'];
    }

    populateFormFields() {
        // Preencher formulário do cartão
        document.getElementById('githubUsername').value = this.currentUser;
        document.getElementById('characterClass').value = this.guildData.class;
        document.getElementById('specialization').value = this.guildData.specialization;
        
        // Atualizar tema ativo
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.guildData.theme);
        });
    }

    showMainApp() {
        const portal = document.getElementById('portalOverlay');
        const mainApp = document.getElementById('mainApp');
        
        portal.classList.add('hidden');
        
        setTimeout(() => {
            portal.style.display = 'none';
            mainApp.style.display = 'block';
            
            // Carregar dashboard
            this.switchTab('dashboard');
            
            // Atualizar hash
            window.location.hash = 'dashboard';
        }, 500);
    }

    returnToPortal() {
        const portal = document.getElementById('portalOverlay');
        const mainApp = document.getElementById('mainApp');
        
        // Resetar dados
        this.currentUser = null;
        this.userData = null;
        this.guildData = null;
        
        // Resetar portal
        document.getElementById('portalUsername').value = '';
        
        // Animar transição
        mainApp.style.opacity = '0';
        
        setTimeout(() => {
            mainApp.style.display = 'none';
            portal.style.display = 'flex';
            portal.classList.remove('hidden');
            
            // Resetar opacidade
            setTimeout(() => {
                mainApp.style.opacity = '1';
            }, 100);
            
            // Limpar hash
            window.location.hash = '';
        }, 300);
        
        this.showNotification('Volte sempre à Guilda!', 'info');
    }

    switchTab(tabId) {
        // Atualizar navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });
        
        // Mostrar conteúdo
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
                this.loadTabContent(tabId);
            }
        });
    }

    loadTabContent(tabId) {
        switch(tabId) {
            case 'dashboard':
                // Já carregado no updateUserProfile
                break;
                
            case 'card':
                this.loadCardContent();
                break;
                
            case 'resume':
                this.loadResumeContent();
                break;
                
            case 'projects':
                this.loadProjectsContent();
                break;
                
            case 'certificate':
                this.loadCertificateContent();
                break;
                
            case 'qr':
                this.loadQRContent();
                break;
        }
    }

    loadCardContent() {
        // Já preenchido no populateFormFields
        // Resetar preview
        const cardContainer = document.getElementById('guildCard');
        cardContainer.innerHTML = `
            <div class="card-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>O cartão será forjado aqui...</p>
            </div>
        `;
        
        // Desabilitar botões de ação
        document.getElementById('downloadCard').disabled = true;
        document.getElementById('shareCard').disabled = true;
        document.getElementById('copyCard').disabled = true;
    }

    async generateCard() {
        const username = document.getElementById('githubUsername').value.trim();
        const charClass = document.getElementById('characterClass').value;
        const specialization = document.getElementById('specialization').value;
        
        if (!username) {
            this.showNotification('Digite um nome de usuário do GitHub!', 'error');
            return;
        }

        this.showLoading('Forjando cartão da guilda...');
        
        try {
            // Atualizar dados da guilda
            this.guildData.class = charClass;
            this.guildData.specialization = specialization;
            this.guildData.rank = this.calculateRank();
            this.saveGuildData();
            
            // Gerar cartão
            await this.renderGuildCard();
            
            // Habilitar botões
            document.getElementById('downloadCard').disabled = false;
            document.getElementById('shareCard').disabled = false;
            document.getElementById('copyCard').disabled = false;
            
            this.showNotification('Cartão forjado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar cartão:', error);
            this.showNotification('Erro ao gerar cartão', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async renderGuildCard() {
        const container = document.getElementById('guildCard');
        const stats = this.calculateStats();
        const rankInfo = this.getRankInfo(this.guildData.rank);
        
        // Simular processamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        container.innerHTML = `
            <div class="card-content" data-theme="${this.currentTheme}">
                <div class="card-header">
                    <div class="card-avatar">
                        <img src="${this.userData.avatar_url}" alt="${this.currentUser}">
                    </div>
                    <div class="card-title">
                        <h2>${this.userData.name || this.currentUser}</h2>
                        <p>@${this.currentUser}</p>
                        <div class="card-rank">
                            <span class="rank-badge" style="background: ${rankInfo.color}">
                                ${this.guildData.rank} - ${rankInfo.name}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-row">
                            <i class="fas fa-shield-alt"></i>
                            <span>${this.getClassInfo(this.guildData.class).name}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-gem"></i>
                            <span>${this.getSpecializationInfo(this.guildData.specialization)}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-calendar"></i>
                            <span>Membro desde ${new Date(this.guildData.joinDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                    
                    <div class="card-stats">
                        <div class="stat-row">
                            <span class="stat-label">XP Total</span>
                            <span class="stat-value">${stats.totalXP.toLocaleString()}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Projetos</span>
                            <span class="stat-value">${stats.repos}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Estrelas</span>
                            <span class="stat-value">${stats.stars}</span>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <div class="guild-seal">
                            <i class="fas fa-dragon"></i>
                            <span>GitHub Guild</span>
                        </div>
                        <div class="guild-id">
                            ID: ${this.guildData.guildId}
                        </div>
                    </div>
                </div>
            </div>
        `;
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
        return specializations[specId] || 'Especialista';
    }

    async loadResumeContent() {
        const container = document.getElementById('resumeContent');
        
        container.innerHTML = `
            <div class="card-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Gerando currículo da guilda...</p>
            </div>
        `;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const stats = this.calculateStats();
            const rankInfo = this.getRankInfo(this.guildData.rank);
            const topLanguages = this.getTopLanguages();
            
            container.innerHTML = `
                <div class="resume-content">
                    <div class="resume-header">
                        <h2>${this.userData.name || this.currentUser}</h2>
                        <p class="resume-title">${this.getClassInfo(this.guildData.class).name} • ${this.getSpecializationInfo(this.guildData.specialization)}</p>
                        <div class="resume-rank">
                            <span class="rank-badge" style="background: ${rankInfo.color}">
                                Rank ${this.guildData.rank} - ${rankInfo.name}
                            </span>
                        </div>
                    </div>
                    
                    <div class="resume-body">
                        <div class="resume-section">
                            <h3><i class="fas fa-user"></i> Sobre</h3>
                            <p>${this.userData.bio || 'Desenvolvedor apaixonado por código e inovação.'}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${this.userData.location || 'Localização não informada'}</p>
                        </div>
                        
                        <div class="resume-section">
                            <h3><i class="fas fa-chart-bar"></i> Estatísticas</h3>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-label">Projetos Públicos</span>
                                    <span class="stat-value">${stats.repos}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Estrelas</span>
                                    <span class="stat-value">${stats.stars}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Forks</span>
                                    <span class="stat-value">${stats.forks}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Seguidores</span>
                                    <span class="stat-value">${stats.followers}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="resume-section">
                            <h3><i class="fas fa-code"></i> Linguagens Principais</h3>
                            <div class="languages-list">
                                ${topLanguages.map(lang => `
                                    <span class="language-tag">${lang}</span>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="resume-section">
                            <h3><i class="fas fa-trophy"></i> Conquistas</h3>
                            <ul class="achievements">
                                <li><i class="fas fa-check-circle"></i> Membro oficial da GitHub Guild</li>
                                <li><i class="fas fa-check-circle"></i> Rank ${this.guildData.rank} alcançado</li>
                                <li><i class="fas fa-check-circle"></i> ${stats.repos} projetos públicos</li>
                                <li><i class="fas fa-check-circle"></i> ${stats.stars} estrelas conquistadas</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="resume-footer">
                        <div class="guild-seal">
                            <i class="fas fa-dragon"></i>
                            <div>
                                <strong>GitHub Guild</strong>
                                <small>Gildenkai Authorization</small>
                            </div>
                        </div>
                        <div class="resume-date">
                            Gerado em ${new Date().toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Erro ao carregar currículo:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao gerar currículo. Tente novamente.</p>
                </div>
            `;
        }
    }

    getTopLanguages() {
        if (!this.userData?.repos) return [];
        
        const languages = {};
        this.userData.repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });
        
        return Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([lang]) => lang);
    }

    async loadProjectsContent() {
        const statsContainer = document.getElementById('projectsStats');
        const gridContainer = document.getElementById('projectsGrid');
        
        statsContainer.innerHTML = `
            <div class="card-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando estatísticas...</p>
            </div>
        `;
        
        gridContainer.innerHTML = `
            <div class="card-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando projetos...</p>
            </div>
        `;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const stats = this.calculateProjectStats();
            const topProjects = this.userData.repos
                .sort((a, b) => b.stargazers_count - a.stargazers_count)
                .slice(0, 9);
            
            // Estatísticas
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <span class="stat-value">${stats.total}</span>
                    <span class="stat-label">Projetos</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.stars}</span>
                    <span class="stat-label">Estrelas</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.forks}</span>
                    <span class="stat-label">Forks</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.languages}</span>
                    <span class="stat-label">Linguagens</span>
                </div>
            `;
            
            // Grid de projetos
            gridContainer.innerHTML = topProjects.map(repo => `
                <div class="project-card">
                    <div class="project-header">
                        <h3>${repo.name}</h3>
                        ${repo.language ? `
                            <span class="project-language">${repo.language}</span>
                        ` : ''}
                    </div>
                    <div class="project-body">
                        <p>${repo.description || 'Sem descrição disponível.'}</p>
                        <div class="project-meta">
                            <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                            <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                            <span><i class="fas fa-eye"></i> ${repo.watchers_count}</span>
                        </div>
                    </div>
                    <div class="project-footer">
                        <a href="${repo.html_url}" target="_blank" class="project-link">
                            Ver no GitHub <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            gridContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar projetos. Tente novamente.</p>
                </div>
            `;
        }
    }

    calculateProjectStats() {
        if (!this.userData?.repos) {
            return { total: 0, stars: 0, forks: 0, languages: 0 };
        }
        
        const languages = new Set();
        this.userData.repos.forEach(repo => {
            if (repo.language) languages.add(repo.language);
        });
        
        return {
            total: this.userData.repos.length,
            stars: this.userData.repos.reduce((acc, repo) => acc + repo.stargazers_count, 0),
            forks: this.userData.repos.reduce((acc, repo) => acc + repo.forks_count, 0),
            languages: languages.size
        };
    }

    async loadCertificateContent() {
        const container = document.getElementById('certificateContent');
        
        container.innerHTML = `
            <div class="card-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Gerando certificado da guilda...</p>
            </div>
        `;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const rankInfo = this.getRankInfo(this.guildData.rank);
            
            container.innerHTML = `
                <div class="certificate">
                    <div class="certificate-header">
                        <h2>Certificado de Autorização</h2>
                        <p class="certificate-subtitle">GitHub Guild Development Authority</p>
                    </div>
                    
                    <div class="certificate-body">
                        <p class="certificate-text">
                            Este documento certifica que <strong>${this.userData.name || this.currentUser}</strong>
                            está oficialmente autorizado(a) como <strong>${this.getClassInfo(this.guildData.class).name}</strong>
                            com especialização em <strong>${this.getSpecializationInfo(this.guildData.specialization)}</strong>.
                        </p>
                        
                        <div class="certificate-rank">
                            <span class="rank-badge-large" style="background: ${rankInfo.color}">
                                Rank ${this.guildData.rank} - ${rankInfo.name}
                            </span>
                        </div>
                        
                        <p class="certificate-text">
                            Reconhecido(a) por contribuições significativas para a comunidade de desenvolvimento
                            e autorizado(a) a exercer as artes do código em todos os reinos digitais.
                        </p>
                    </div>
                    
                    <div class="certificate-footer">
                        <div class="certificate-signature">
                            <div class="signature-line"></div>
                            <p>Grão-Mestre da GitHub Guild</p>
                        </div>
                        <div class="certificate-seal">
                            <i class="fas fa-dragon"></i>
                            <span>GitHub Guild</span>
                        </div>
                        <div class="certificate-date">
                            <p>Emitido em: ${new Date().toLocaleDateString('pt-BR')}</p>
                            <p class="certificate-id">ID: ${this.guildData.guildId}</p>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Erro ao carregar certificado:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao gerar certificado. Tente novamente.</p>
                </div>
            `;
        }
    }

    async loadQRContent() {
        const container = document.getElementById('qrContent');
        
        container.innerHTML = `
            <div class="card-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Gerando código de autorização...</p>
            </div>
        `;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const qrData = {
                user: this.currentUser,
                guildId: this.guildData.guildId,
                rank: this.guildData.rank,
                timestamp: Date.now()
            };
            
            // QR Code simples (em produção, use uma biblioteca)
            container.innerHTML = `
                <div class="qr-code-container">
                    <div class="qr-code-display">
                        <div class="qr-placeholder">
                            <div class="qr-text">GITHUB GUILD</div>
                            <div class="qr-user">@${this.currentUser}</div>
                            <div class="qr-id">ID: ${this.guildData.guildId}</div>
                            <div class="qr-rank">Rank: ${this.guildData.rank}</div>
                        </div>
                    </div>
                    
                    <div class="qr-info">
                        <h3><i class="fas fa-info-circle"></i> Informações do Código</h3>
                        <div class="qr-details">
                            <p><strong>Usuário:</strong> ${this.currentUser}</p>
                            <p><strong>ID da Guilda:</strong> ${this.guildData.guildId}</p>
                            <p><strong>Rank:</strong> ${this.guildData.rank}</p>
                            <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        </div>
                        
                        <div class="qr-instructions">
                            <p><i class="fas fa-mobile-alt"></i> Use este código para verificação de identidade</p>
                            <p><i class="fas fa-shield-alt"></i> Válido por 1 ano a partir da data de emissão</p>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Erro ao carregar QR Code:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao gerar QR Code. Tente novamente.</p>
                </div>
            `;
        }
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.guildData.theme = theme;
        this.saveGuildData();
        
        // Atualizar botões de tema
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        this.showNotification(`Tema alterado para: ${theme}`, 'info');
    }

    filterProjects() {
        const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
        const projects = document.querySelectorAll('.project-card');
        
        projects.forEach(project => {
            const title = project.querySelector('h3').textContent.toLowerCase();
            const description = project.querySelector('p').textContent.toLowerCase();
            const language = project.querySelector('.project-language')?.textContent.toLowerCase() || '';
            
            const matches = title.includes(searchTerm) || 
                          description.includes(searchTerm) || 
                          language.includes(searchTerm);
            
            project.style.display = matches ? 'block' : 'none';
        });
    }

    sortProjects() {
        const sortBy = document.getElementById('projectSort').value;
        const container = document.getElementById('projectsGrid');
        const projects = Array.from(container.querySelectorAll('.project-card'));
        
        projects.sort((a, b) => {
            const getValue = (project, type) => {
                switch(type) {
                    case 'stars':
                        return parseInt(project.querySelector('.fa-star').nextSibling.textContent.trim());
                    case 'forks':
                        return parseInt(project.querySelector('.fa-code-branch').nextSibling.textContent.trim());
                    case 'updated':
                        return 0; // Implementar data de atualização se disponível
                    default:
                        return 0;
                }
            };
            
            return getValue(b, sortBy) - getValue(a, sortBy);
        });
        
        // Reordenar no container
        projects.forEach(project => container.appendChild(project));
    }

    // Funções de ação
    downloadCard() {
        this.showNotification('Preparando download do cartão...', 'info');
        setTimeout(() => {
            this.showNotification('Cartão pronto para download!', 'success');
        }, 1500);
    }

    shareCard() {
        if (navigator.share) {
            navigator.share({
                title: `Meu Cartão da GitHub Guild - ${this.userData.name || this.currentUser}`,
                text: `Veja meu cartão da GitHub Guild! Sou ${this.getClassInfo(this.guildData.class).name} com rank ${this.guildData.rank}!`,
                url: window.location.href
            });
        } else {
            this.copyToClipboard(`Cartão da GitHub Guild\n\nUsuário: ${this.currentUser}\nRank: ${this.guildData.rank}\nClasse: ${this.getClassInfo(this.guildData.class).name}\n\n${window.location.href}`);
        }
    }

    copyCard() {
        this.copyToClipboard('Código SVG do cartão copiado!');
    }

    printResume() {
        window.print();
    }

    downloadResume() {
        this.showNotification('Gerando PDF do currículo...', 'info');
        setTimeout(() => {
            this.showNotification('PDF pronto para download!', 'success');
        }, 2000);
    }

    downloadCertificate() {
        this.showNotification('Preparando download do certificado...', 'info');
        setTimeout(() => {
            this.showNotification('Certificado pronto para download!', 'success');
        }, 1500);
    }

    shareCertificate() {
        if (navigator.share) {
            navigator.share({
                title: `Certificado GitHub Guild - ${this.userData.name || this.currentUser}`,
                text: `Recebi o certificado de autorização da GitHub Guild como ${this.getClassInfo(this.guildData.class).name}!`,
                url: window.location.href
            });
        } else {
            this.copyToClipboard(`Certificado GitHub Guild\n\nUsuário: ${this.currentUser}\nRank: ${this.guildData.rank}\nID: ${this.guildData.guildId}\n\n${window.location.href}`);
        }
    }

    verifyCertificate() {
        this.showNotification('Verificando autenticidade do certificado...', 'info');
        setTimeout(() => {
            this.showNotification('✓ Certificado validado com sucesso!', 'success');
        }, 2000);
    }

    downloadQR() {
        this.showNotification('Preparando download do QR Code...', 'info');
        setTimeout(() => {
            this.showNotification('QR Code pronto para download!', 'success');
        }, 1500);
    }

    printQR() {
        const printContent = document.getElementById('qrContent').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>GitHub Guild - QR Code</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .qr-code { text-align: center; margin: 20px 0; }
                        .qr-info { margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>GitHub Guild - QR Code</h1>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    refreshQR() {
        this.showNotification('Atualizando QR Code...', 'info');
        this.loadQRContent();
        setTimeout(() => {
            this.showNotification('QR Code atualizado!', 'success');
        }, 1000);
    }

    copyToClipboard(message) {
        const text = `GitHub Guild\n\nUsuário: ${this.currentUser}\nRank: ${this.guildData.rank}\nClasse: ${this.getClassInfo(this.guildData.class).name}\nID: ${this.guildData.guildId}\n\n${window.location.href}`;
        
        navigator.clipboard.writeText(text)
            .then(() => this.showNotification(message || 'Copiado para a área de transferência!', 'success'))
            .catch(() => this.showNotification('Erro ao copiar', 'error'));
    }

    showDemo() {
        // Dados de demonstração
        this.currentUser = 'octocat';
        this.userData = {
            login: 'octocat',
            name: 'The Octocat',
            avatar_url: 'https://github.com/octocat.png',
            bio: 'The official GitHub mascot',
            public_repos: 8,
            followers: 4500,
            location: 'San Francisco, CA'
        };
        
        this.userData.repos = [
            {
                name: 'Hello-World',
                description: 'My first repository on GitHub!',
                language: 'JavaScript',
                stargazers_count: 1500,
                forks_count: 500,
                watchers_count: 2000,
                html_url: 'https://github.com/octocat/Hello-World'
            },
            {
                name: 'Spoon-Knife',
                description: 'This repo is for demonstration purposes only.',
                language: 'HTML',
                stargazers_count: 1200,
                forks_count: 300,
                watchers_count: 1500,
                html_url: 'https://github.com/octocat/Spoon-Knife'
            }
        ];
        
        this.guildData = {
            class: 'mage',
            specialization: 'fullstack',
            rank: 'S',
            joinDate: new Date().toISOString(),
            guildId: 'GUILD-DEMO123',
            theme: 'dark'
        };
        
        this.updateUserProfile();
        this.updateDashboardStats();
        this.populateFormFields();
        this.showMainApp();
        this.showNotification('Modo demo ativado! Explore a guilda.', 'info');
    }

    showLoading(message = 'Carregando...') {
        const loading = document.getElementById('loading');
        const text = loading.querySelector('.loading-text');
        
        text.textContent = message;
        loading.classList.add('active');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageElement = notification.querySelector('.notification-message');
        const iconElement = notification.querySelector('.notification-icon');
        
        // Configurar tipo
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };
        
        const colors = {
            success: 'var(--dark-success)',
            error: 'var(--dark-danger)',
            info: 'var(--dark-primary)',
            warning: 'var(--dark-warning)'
        };
        
        iconElement.className = icons[type] || icons.info;
        notification.style.background = colors[type] || colors.info;
        messageElement.textContent = message;
        
        // Mostrar
        notification.classList.add('show');
        
        // Auto-esconder
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Funções globais
function showAbout() {
    alert('GitHub Guild\n\nUm sistema de cartão de guilda personalizado baseado no perfil do GitHub.\n\nRecursos:\n• Cartão de identificação da guilda\n• Currículo automatizado\n• Galeria de projetos\n• Certificado oficial\n• QR Code de autorização\n• Sistema de ranking\n\nDesenvolvido com ❤️ para a comunidade de desenvolvedores.');
}

function showHelp() {
    alert('Ajuda - GitHub Guild\n\n1. Digite seu username do GitHub no portal\n2. Clique em "Acessar Guilda" ou pressione Enter\n3. Explore todas as funcionalidades:\n   • Dashboard: Visão geral do seu perfil\n   • Cartão: Crie seu cartão de identificação\n   • Currículo: Veja seu currículo automatizado\n   • Projetos: Explore sua galeria de projetos\n   • Certificado: Obtenha seu certificado oficial\n   • QR Code: Gere seu código de autorização\n\nDica: Use os links de acesso rápido no dashboard para navegação rápida!');
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.githubGuild = new GitHubGuild();
});
