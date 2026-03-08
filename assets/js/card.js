class GuildCardGenerator {
    constructor() {
        this.currentTheme = 'dark';
        this.userData = null;
        this.cardSVG = null;
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

    setupEventListeners() {
        // Navegação entre abas
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Botão de gerar cartão
        document.getElementById('generateCard').addEventListener('click', () => {
            this.generateGuildCard();
        });

        // Botões de ação do cartão
        document.getElementById('downloadCard').addEventListener('click', () => {
            this.downloadCard();
        });

        document.getElementById('shareCard').addEventListener('click', () => {
            this.shareCard();
        });

        document.getElementById('copyCode').addEventListener('click', () => {
            this.copySVGCode();
        });

        // Modal
        const modal = document.getElementById('qrModal');
        const closeModal = modal.querySelector('.close-modal');
        
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    setupThemeButtons() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
                
                // Atualizar estado ativo
                document.querySelectorAll('.theme-btn').forEach(b => {
                    b.dataset.active = 'false';
                    b.style.transform = 'translateY(0)';
                });
                
                e.currentTarget.dataset.active = 'true';
                e.currentTarget.style.transform = 'translateY(-2px)';
            });
        });
    }

    setTheme(theme) {
        this.currentTheme = theme;
        // Remover todas as classes de tema
        document.body.classList.remove('theme-dark', 'theme-abyss', 'theme-crimson', 'theme-mystic');
        // Adicionar a classe do tema atual
        if (theme !== 'dark') {
            document.body.classList.add(`theme-${theme}`);
        }
    }

    async checkAPIStatus() {
        const statusElement = document.getElementById('apiStatus');
        
        try {
            const response = await fetch('https://api.github.com');
            if (response.ok) {
                statusElement.innerHTML = '<i class="fas fa-circle"></i> GitHub API: Online';
                statusElement.className = 'status-online';
                return true;
            } else {
                throw new Error('API offline');
            }
        } catch (error) {
            statusElement.innerHTML = '<i class="fas fa-circle"></i> GitHub API: Offline';
            statusElement.className = 'status-offline';
            return false;
        }
    }

    async generateGuildCard() {
        const username = document.getElementById('githubUsername').value.trim();
        const charClass = document.getElementById('characterClass').value;
        const specialization = document.getElementById('specialization').value;
        
        if (!username) {
            this.showNotification('Digite um nome de usuário do GitHub!', 'error');
            return;
        }

        try {
            // Mostrar loading
            const cardElement = document.getElementById('guildCard');
            cardElement.innerHTML = `
                <div class="card-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Consultando os registros da guilda...</p>
                </div>
            `;

            // Verificar status da API
            const apiOnline = await this.checkAPIStatus();
            
            if (!apiOnline) {
                throw new Error('GitHub API está offline. Verifique sua conexão.');
            }

            // Buscar dados do GitHub
            this.userData = await this.fetchGitHubData(username);
            
            if (!this.userData) {
                throw new Error('Usuário não encontrado');
            }

            // Calcular estatísticas
            const stats = this.calculateStats(this.userData);
            const rank = this.calculateRank(stats.totalXP);

            // Gerar conteúdo do cartão
            this.generateCardContent({
                username: this.userData.login,
                name: this.userData.name || this.userData.login,
                avatar: this.userData.avatar_url,
                bio: this.userData.bio || 'Aventureiro do código',
                location: this.userData.location || 'Terra Desconhecida',
                charClass: this.getClassName(charClass),
                specialization: this.getSpecializationName(specialization),
                stats: stats,
                rank: rank,
                joinDate: new Date(this.userData.created_at).toLocaleDateString('pt-BR')
            });

            // Habilitar botões
            document.getElementById('downloadCard').disabled = false;
            document.getElementById('shareCard').disabled = false;
            document.getElementById('copyCode').disabled = false;

            this.showNotification('Cartão forjado com sucesso!', 'success');

            // Gerar QR Code
            this.generateQRCode(username);

        } catch (error) {
            console.error('Erro ao gerar cartão:', error);
            const cardElement = document.getElementById('guildCard');
            cardElement.innerHTML = `
                <div class="card-loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao consultar os registros: ${error.message}</p>
                </div>
            `;
            this.showNotification(`Erro: ${error.message}`, 'error');
        }
    }

    async fetchGitHubData(username) {
        try {
            // Buscar dados básicos do usuário
            const userResponse = await fetch(`https://api.github.com/users/${username}`);
            if (!userResponse.ok) {
                if (userResponse.status === 404) {
                    throw new Error('Usuário não encontrado no GitHub');
                }
                throw new Error(`Erro ${userResponse.status}: ${userResponse.statusText}`);
            }
            
            const userData = await userResponse.json();

            // Buscar repositórios
            let reposData = [];
            try {
                const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
                if (reposResponse.ok) {
                    reposData = await reposResponse.json();
                }
            } catch (error) {
                console.warn('Não foi possível buscar repositórios:', error);
            }

            // Calcular total de estrelas
            let totalStars = 0;
            let totalForks = 0;
            
            if (reposData.length > 0) {
                // Usar API para buscar estrelas de forma mais precisa (limitado a 100 repos)
                totalStars = reposData.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
                totalForks = reposData.reduce((acc, repo) => acc + (repo.forks_count || 0), 0);
            }

            // Buscar informações de contribuições (aproximado)
            let totalContributions = 0;
            try {
                const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
                if (eventsResponse.ok) {
                    const events = await eventsResponse.json();
                    // Contar diferentes tipos de eventos como contribuições
                    totalContributions = events.length;
                }
            } catch (error) {
                console.warn('Não foi possível buscar eventos:', error);
            }

            return {
                ...userData,
                repos: reposData,
                total_stars: totalStars,
                total_forks: totalForks,
                total_contributions: totalContributions,
                public_repos_count: userData.public_repos || 0,
                updated_at: userData.updated_at,
                hireable: userData.hireable || false,
                twitter_username: userData.twitter_username,
                company: userData.company,
                blog: userData.blog
            };

        } catch (error) {
            console.error('Erro ao buscar dados do GitHub:', error);
            throw error;
        }
    }

    calculateStats(userData) {
        // Sistema de XP baseado em múltiplas métricas
        const starsXP = (userData.total_stars || 0) * 10;       // 10 XP por estrela
        const forksXP = (userData.total_forks || 0) * 5;       // 5 XP por fork
        const reposXP = (userData.public_repos_count || 0) * 20; // 20 XP por repositório
        const followersXP = (userData.followers || 0) * 3;     // 3 XP por seguidor
        const followingXP = (userData.following || 0) * 1;     // 1 XP por seguindo
        const contributionsXP = (userData.total_contributions || 0) * 2; // 2 XP por contribuição
        
        const totalXP = starsXP + forksXP + reposXP + followersXP + followingXP + contributionsXP;
        const level = Math.min(Math.floor(totalXP / 1000) + 1, 100); // Máximo nível 100
        const xpProgress = totalXP % 1000; // XP para o próximo nível
        
        // Calcular porcentagem para barra de progresso
        const xpPercentage = Math.min((xpProgress / 1000) * 100, 100);
        
        return {
            stars: this.formatNumber(userData.total_stars || 0),
            forks: this.formatNumber(userData.total_forks || 0),
            repos: this.formatNumber(userData.public_repos_count || 0),
            followers: this.formatNumber(userData.followers || 0),
            following: this.formatNumber(userData.following || 0),
            contributions: this.formatNumber(userData.total_contributions || 0),
            totalXP: this.formatNumber(totalXP),
            level: level,
            xpProgress: xpPercentage,
            xpCurrent: xpProgress,
            xpNeeded: 1000
        };
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    calculateRank(totalXP) {
        const xpNum = parseInt(totalXP.replace(/[^0-9]/g, '')) * (totalXP.includes('M') ? 1000000 : totalXP.includes('K') ? 1000 : 1);
        
        if (xpNum >= 50000) return { rank: 'S', color: '#FFD700', name: 'Lendário', description: 'Mestre Supremo' };
        if (xpNum >= 25000) return { rank: 'A', color: '#C0C0C0', name: 'Épico', description: 'Mestre Avançado' };
        if (xpNum >= 10000) return { rank: 'B', color: '#CD7F32', name: 'Raro', description: 'Mestre' };
        if (xpNum >= 5000) return { rank: 'C', color: '#4fd1c7', name: 'Incomum', description: 'Veterano' };
        if (xpNum >= 1000) return { rank: 'D', color: '#9f7aea', name: 'Comum', description: 'Aventureiro' };
        return { rank: 'E', color: '#fc8181', name: 'Iniciante', description: 'Novato' };
    }

    getClassName(classId) {
        const classes = {
            mage: { name: 'Mago do Código', icon: '🧙', description: 'Manipulador de algoritmos complexos' },
            warrior: { name: 'Guerreiro Frontend', icon: '⚔️', description: 'Defensor da experiência do usuário' },
            rogue: { name: 'Ladino Backend', icon: '🗡️', description: 'Mestre das sombras do servidor' },
            ranger: { name: 'Arqueiro Fullstack', icon: '🏹', description: 'Preciso em todas as frentes' },
            cleric: { name: 'Clérigo DevOps', icon: '⛪', description: 'Curador dos pipelines e deploy' },
            alchemist: { name: 'Alquimista de Dados', icon: '⚗️', description: 'Transformador de dados em ouro' },
            artificer: { name: 'Artesão UI/UX', icon: '🔨', description: 'Criador de interfaces mágicas' },
            bard: { name: 'Bardo da Documentação', icon: '🎵', description: 'Contador de histórias do código' }
        };
        return classes[classId] || classes.mage;
    }

    getSpecializationName(specId) {
        const specializations = {
            frontend: { name: 'Frontend Master', icon: '🎨', description: 'Especialista em interfaces' },
            backend: { name: 'Backend Sorcerer', icon: '🔮', description: 'Mago dos servidores' },
            fullstack: { name: 'Fullstack Legend', icon: '🌟', description: 'Mestre de todas as camadas' },
            mobile: { name: 'Mobile Ranger', icon: '📱', description: 'Nômade dos dispositivos' },
            ai: { name: 'AI Alchemist', icon: '🤖', description: 'Transformador de inteligência' },
            security: { name: 'Security Guardian', icon: '🛡️', description: 'Protetor dos sistemas' },
            cloud: { name: 'Cloud Archmage', icon: '☁️', description: 'Mestre das nuvens' }
        };
        return specializations[specId] || { name: 'Especialista', icon: '✨', description: 'Habilidades variadas' };
    }

    generateCardContent(data) {
        const cardElement = document.getElementById('guildCard');
        const specialization = this.getSpecializationName(document.getElementById('specialization').value);
        
        cardElement.innerHTML = `
            <div class="card-content ${this.currentTheme}">
                <div class="card-header">
                    <div class="card-avatar">
                        <img src="${data.avatar}" alt="${data.username}" 
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=4fd1c7&color=fff&size=150'">
                        <div class="avatar-frame"></div>
                    </div>
                    <div class="card-title">
                        <h2 class="card-name">${data.name}</h2>
                        <p class="card-username">@${data.username}</p>
                        <div class="card-rank">
                            <span class="rank-badge" style="background: ${data.rank.color}">
                                ${data.rank.rank} - ${data.rank.name}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="card-bio">
                        <p>${data.bio || 'Sem biografia disponível'}</p>
                        <div class="card-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${data.location}
                        </div>
                    </div>
                    
                    <div class="card-class">
                        <h3><i class="fas fa-shield-alt"></i> Classe & Especialização</h3>
                        <div class="class-info">
                            <span class="class-icon">${data.charClass.icon}</span>
                            <div>
                                <p class="class-name">${data.charClass.name}</p>
                                <p class="specialization">${specialization.name} ${specialization.icon}</p>
                                <small>${data.charClass.description}</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-stats">
                        <h3><i class="fas fa-chart-line"></i> Estatísticas da Guilda</h3>
                        <div class="stats-grid">
                            <div class="stat">
                                <i class="fas fa-star"></i>
                                <span class="stat-value">${data.stats.stars}</span>
                                <span class="stat-label">Estrelas</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-code-branch"></i>
                                <span class="stat-value">${data.stats.forks}</span>
                                <span class="stat-label">Forks</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-book"></i>
                                <span class="stat-value">${data.stats.repos}</span>
                                <span class="stat-label">Repositórios</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-users"></i>
                                <span class="stat-value">${data.stats.followers}</span>
                                <span class="stat-label">Seguidores</span>
                            </div>
                        </div>
                        
                        <div class="xp-bar">
                            <div class="xp-label">
                                <span>Nível ${data.stats.level}</span>
                                <span>${data.stats.xpCurrent}/${data.stats.xpNeeded} XP</span>
                            </div>
                            <div class="xp-progress">
                                <div class="xp-fill" style="width: ${data.stats.xpProgress}%"></div>
                            </div>
                            <small class="xp-total">Total: ${data.stats.totalXP} XP</small>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <div class="card-qr" onclick="document.getElementById('qrModal').classList.add('active')">
                            <i class="fas fa-qrcode"></i>
                            <span>QR Code da Guilda</span>
                        </div>
                        <div class="card-date">
                            <i class="fas fa-calendar-alt"></i>
                            Iniciado em ${data.joinDate}
                        </div>
                    </div>
                    
                    <div class="card-navigation">
                        <div class="nav-buttons">
                            <button onclick="navigateToResume('${data.username}')" class="nav-page-btn">
                                <i class="fas fa-scroll"></i> Currículo
                            </button>
                            <button onclick="navigateToProjects('${data.username}')" class="nav-page-btn">
                                <i class="fas fa-project-diagram"></i> Projetos
                            </button>
                            <button onclick="navigateToCertificate('${data.username}')" class="nav-page-btn">
                                <i class="fas fa-award"></i> Certificado
                            </button>
                            <button onclick="navigateToQR('${data.username}')" class="nav-page-btn">
                                <i class="fas fa-qrcode"></i> QR Code
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card-seal">
                    <div class="seal-content">
                        <i class="fas fa-dragon"></i>
                        <span>GitHub Guild</span>
                        <small>Gildenkai Authorization</small>
                    </div>
                </div>
            </div>
        `;
    }

    generateQRCode(username) {
        const qrContainer = document.getElementById('qrCodeContainer');
        // Em produção, use uma biblioteca como qrcode.js
        qrContainer.innerHTML = `
            <div style="padding: 20px; background: white; border-radius: 8px;">
                <div style="text-align: center; font-family: monospace;">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">
                        GitHub Guild ID
                    </div>
                    <div style="background: #000; color: #fff; padding: 15px; margin: 10px 0; border-radius: 4px;">
                        <div style="margin-bottom: 5px;">╔══════════════╗</div>
                        <div>┃  ${username.padEnd(12, ' ')}  ┃</div>
                        <div style="margin-top: 5px;">╚══════════════╝</div>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 10px;">
                        ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </div>
                    <div style="font-size: 10px; color: #999; margin-top: 5px;">
                        Gildenkai Authorized
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(tabId) {
        // Atualizar botões de navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });

        // Mostrar conteúdo da aba selecionada
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
    }

    downloadCard() {
        if (!this.userData) {
            this.showNotification('Gere um cartão primeiro!', 'error');
            return;
        }
        
        this.showNotification('Funcionalidade de download em desenvolvimento. Use "Copiar SVG" por enquanto.', 'info');
        
        // Implementação futura:
        // 1. Usar html2canvas para converter para imagem
        // 2. Ou gerar SVG real e permitir download
    }

    shareCard() {
        if (!this.userData) {
            this.showNotification('Gere um cartão primeiro!', 'error');
            return;
        }
        
        const text = `🏆 GitHub Guild Card 🏆\n\n👤 ${this.userData.name || this.userData.login}\n⭐ ${this.calculateStats(this.userData).stars} Estrelas\n📊 Rank ${this.calculateRank(this.calculateStats(this.userData).totalXP).name}\n\nCrie seu cartão em: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Meu Cartão da GitHub Guild',
                text: text,
                url: window.location.href
            }).catch(error => {
                console.log('Erro ao compartilhar:', error);
                this.copyToClipboard(text);
            });
        } else {
            this.copyToClipboard(text);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Cartão copiado para a área de transferência!', 'success');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            this.showNotification('Erro ao copiar. Tente manualmente.', 'error');
        });
    }

    copySVGCode() {
        if (!this.userData) {
            this.showNotification('Gere um cartão primeiro!', 'error');
            return;
        }
        
        const cardElement = document.getElementById('guildCard');
        const svgContent = cardElement.innerHTML;
        
        navigator.clipboard.writeText(svgContent).then(() => {
            this.showNotification('Código SVG copiado! Cole em um arquivo .svg', 'success');
        }).catch(err => {
            console.error('Erro ao copiar SVG:', err);
            this.showNotification('Erro ao copiar SVG. Tente selecionar manualmente.', 'error');
        });
    }

    showNotification(message, type = 'info') {
        // Remover notificações existentes
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    loadAnnouncements() {
        const container = document.getElementById('announcements');
        const announcements = [
            {
                title: '🎉 Novo Sistema de Rank 2.0',
                content: 'O sistema de rank foi completamente reformulado! Agora considera mais métricas como contribuições, forks e tempo de atividade.',
                date: '2024-01-20',
                type: 'update'
            },
            {
                title: '🏆 Evento de Contribuição Coletiva',
                content: 'Participe do nosso primeiro evento de contribuição coletiva. Os top 3 contribuidores receberão badges especiais!',
                date: '2024-01-15',
                type: 'event'
            },
            {
                title: '📜 Atualização do Gildenkai',
                content: 'O Gildenkai atualizou as regras de autorização para desenvolvedores. Todos os cartões agora incluem QR Codes de verificação.',
                date: '2024-01-10',
                type: 'important'
            },
            {
                title: '✨ Novas Classes Disponíveis',
                content: 'Adicionamos novas classes: Alquimista de Dados e Artesão UI/UX. Atualize seu cartão para experimentar!',
                date: '2024-01-05',
                type: 'feature'
            }
        ];
        
        container.innerHTML = announcements.map(ann => `
            <div class="announcement-item">
                <h4>${ann.title}</h4>
                <p>${ann.content}</p>
                <small><i class="fas fa-calendar"></i> ${ann.date} • <i class="fas fa-tag"></i> ${ann.type}</small>
            </div>
        `).join('');
    }

    loadRanks() {
        const container = document.getElementById('ranksList');
        const ranks = [
            { 
                rank: 'S', 
                name: 'Lendário', 
                xp: '50.000+ XP', 
                color: '#FFD700',
                requirements: 'Projetos influentes, altas contribuições, reconhecimento na comunidade'
            },
            { 
                rank: 'A', 
                name: 'Épico', 
                xp: '25.000 - 49.999 XP', 
                color: '#C0C0C0',
                requirements: 'Vários projetos populares, contribuições consistentes'
            },
            { 
                rank: 'B', 
                name: 'Raro', 
                xp: '10.000 - 24.999 XP', 
                color: '#CD7F32',
                requirements: 'Projetos ativos, boa base de seguidores, contribuições regulares'
            },
            { 
                rank: 'C', 
                name: 'Incomum', 
                xp: '5.000 - 9.999 XP', 
                color: '#4fd1c7',
                requirements: 'Projetos próprios, começando a receber estrelas'
            },
            { 
                rank: 'D', 
                name: 'Comum', 
                xp: '1.000 - 4.999 XP', 
                color: '#9f7aea',
                requirements: 'Perfil ativo, primeiras contribuições'
            },
            { 
                rank: 'E', 
                name: 'Iniciante', 
                xp: '0 - 999 XP', 
                color: '#fc8181',
                requirements: 'Começando a jornada, primeiros passos'
            }
        ];
        
        container.innerHTML = ranks.map(r => `
            <div class="rank-item ${r.rank.toLowerCase()}-rank">
                <div class="rank-header">
                    <span class="rank-letter" style="color: ${r.color}">${r.rank}</span>
                    <h3>${r.name}</h3>
                </div>
                <p><strong>XP necessário:</strong> ${r.xp}</p>
                <p><small><strong>Requisitos:</strong> ${r.requirements}</small></p>
                <small>Privilégios especiais de guilda conforme o rank</small>
            </div>
        `).join('');
    }

    loadGuildStats() {
        const container = document.getElementById('guildStats');
        
        // Estatísticas simuladas da guilda (em produção, buscar de API)
        const stats = [
            { name: 'Membros Ativos', value: '1,247', icon: '👥', change: '+5%' },
            { name: 'Cartões Gerados', value: '8,942', icon: '🆔', change: '+12%' },
            { name: 'Total de Estrelas', value: '2.4M', icon: '⭐', change: '+8%' },
            { name: 'Projetos Coletivos', value: '156', icon: '🤝', change: '+3%' },
            { name: 'Rank S (Lendários)', value: '28', icon: '🏆', change: '+2' },
            { name: 'Países Ativos', value: '89', icon: '🌎', change: '+3' }
        ];
        
        container.innerHTML = stats.map(stat => `
            <div class="stat-item">
                <h4>${stat.value}</h4>
                <p>${stat.icon} ${stat.name}</p>
                <small style="color: var(--dark-success);">${stat.change}</small>
            </div>
        `).join('');
    }
}

// Funções de navegação para outras páginas
function navigateToResume(username) {
    localStorage.setItem('lastGuildUser', username);
    this.showNotification(`Redirecionando para currículo de ${username}...`, 'info');
    // window.open(`resume.html?user=${username}`, '_blank');
}

function navigateToProjects(username) {
    localStorage.setItem('lastGuildUser', username);
    this.showNotification(`Redirecionando para projetos de ${username}...`, 'info');
    // window.open(`projects.html?user=${username}`, '_blank');
}

function navigateToCertificate(username) {
    localStorage.setItem('lastGuildUser', username);
    this.showNotification(`Redirecionando para certificado de ${username}...`, 'info');
    // window.open(`certificate.html?user=${username}`, '_blank');
}

function navigateToQR(username) {
    localStorage.setItem('lastGuildUser', username);
    document.getElementById('qrModal').classList.add('active');
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.guildCardGenerator = new GuildCardGenerator();
    
    // Verificar se há usuário salvo
    const lastUser = localStorage.getItem('lastGuildUser');
    if (lastUser) {
        document.getElementById('githubUsername').value = lastUser;
    }
});

// Estilos para as notificações
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 400px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .notification-success {
        background: linear-gradient(135deg, var(--dark-success), #38a169);
        color: white;
    }
    
    .notification-error {
        background: linear-gradient(135deg, var(--dark-danger), #e53e3e);
        color: white;
    }
    
    .notification-info {
        background: linear-gradient(135deg, var(--dark-primary), #319795);
        color: white;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);