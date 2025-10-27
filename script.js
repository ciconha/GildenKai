// Guild Card RPG Generator - Sistema Completo Frontend
class GuildCardGenerator {
    constructor() {
        this.currentUser = '';
        this.currentStyle = 'medieval';
        this.currentSize = 'medium';
        this.currentSVG = '';
    }

    async generateCard() {
        const username = document.getElementById('username').value.trim();
        const style = document.getElementById('cardStyle').value;
        const size = document.getElementById('cardSize').value;
        
        if (!username) {
            this.showToast('❌ Digite um username do GitHub!', 'error');
            return;
        }

        this.currentUser = username;
        this.currentStyle = style;
        this.currentSize = size;

        // Mostrar loading
        this.showLoading(true);
        this.hideCardActions();
        this.hideUserStats();

        try {
            // Buscar dados do usuário
            const userData = await this.fetchGitHubData(username);
            
            // Calcular estatísticas RPG
            const stats = this.calculateUserStats(userData);
            
            // Gerar cartão SVG
            const svgContent = this.generateSVGCard(userData, stats, style, size);
            this.currentSVG = svgContent;
            
            // Atualizar preview
            this.updateCardPreview(svgContent, size);
            
            // Mostrar ações e estatísticas
            this.showCardActions(svgContent, username, style, size);
            this.showUserStats(stats, userData);
            
            this.showToast('🎉 Cartão gerado com sucesso!');

        } catch (error) {
            console.error('Erro ao gerar cartão:', error);
            this.showToast('❌ Erro ao buscar dados do GitHub', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async fetchGitHubData(username) {
        try {
            console.log(`📡 Buscando dados do GitHub para: ${username}`);
            
            const response = await fetch(`https://api.github.com/users/${username}`);
            
            if (!response.ok) {
                throw new Error(`Usuário não encontrado: ${username}`);
            }
            
            const userData = await response.json();
            
            // Buscar repositórios
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
            const reposData = reposResponse.ok ? await reposResponse.json() : [];
            
            return {
                username: userData.login,
                avatar_url: userData.avatar_url,
                public_repos: userData.public_repos,
                followers: userData.followers,
                following: userData.following,
                created_at: userData.created_at,
                repos: reposData,
                has_real_data: true
            };
            
        } catch (error) {
            console.log('⚠️ Usando dados simulados:', error.message);
            return this.generateSimulatedData(username);
        }
    }

    generateSimulatedData(username) {
        // Gerar dados consistentes baseados no username
        const seed = this.stringToSeed(username);
        const random = this.seededRandom(seed);
        
        return {
            username: username,
            avatar_url: `https://github.com/${username}.png`,
            public_repos: Math.floor(random() * 50) + 5,
            followers: Math.floor(random() * 200) + 10,
            following: Math.floor(random() * 100) + 5,
            created_at: new Date(Date.now() - random() * 31536000000 * 5).toISOString(), // 1-5 anos atrás
            repos: [],
            has_real_data: false
        };
    }

    stringToSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    calculateUserStats(userData) {
        const xpRates = {
            commit: 5,
            pull_request: 10,
            issue: 8,
            star: 2,
            repository: 15,
            fork: 3,
            follow: 1
        };

        let totalXP = 0;
        const activityBreakdown = {
            commits: 0,
            pull_requests: 0,
            issues: 0,
            stars: 0,
            repositories: 0,
            forks: 0,
            followers: 0
        };

        // XP por repositórios
        activityBreakdown.repositories = userData.public_repos;
        totalXP += userData.public_repos * xpRates.repository;

        // XP por stars e forks
        let totalStars = 0;
        let totalForks = 0;
        
        userData.repos.forEach(repo => {
            totalStars += repo.stargazers_count || 0;
            totalForks += repo.forks_count || 0;
        });

        activityBreakdown.stars = totalStars;
        activityBreakdown.forks = totalForks;
        totalXP += totalStars * xpRates.star;
        totalXP += totalForks * xpRates.fork;

        // XP por atividades (estimado)
        if (userData.has_real_data) {
            activityBreakdown.commits = Math.floor(totalStars * 0.5) + userData.public_repos * 10;
            activityBreakdown.pull_requests = Math.floor(userData.public_repos * 2.5);
            activityBreakdown.issues = Math.floor(userData.public_repos * 1.5);
        } else {
            // Dados simulados
            const seed = this.stringToSeed(userData.username);
            const random = this.seededRandom(seed);
            
            activityBreakdown.commits = Math.floor(random() * 500) + 50;
            activityBreakdown.pull_requests = Math.floor(random() * 100) + 10;
            activityBreakdown.issues = Math.floor(random() * 50) + 5;
        }

        totalXP += activityBreakdown.commits * xpRates.commit;
        totalXP += activityBreakdown.pull_requests * xpRates.pull_request;
        totalXP += activityBreakdown.issues * xpRates.issue;

        // XP por seguidores
        activityBreakdown.followers = userData.followers;
        totalXP += userData.followers * xpRates.follow;

        // Garantir XP mínimo
        if (totalXP < 100) {
            totalXP = Math.max(100, userData.followers * 20);
        }

        // Calcular nível
        const levelInfo = this.calculateLevel(totalXP);
        
        // Determinar classe e rank
        const userClass = this.determineClass(totalXP, userData);
        const userRank = this.determineRank(totalXP);
        
        // Top projetos
        const topProjects = this.getTopProjects(userData.repos, userData.username);

        return {
            total_xp: Math.floor(totalXP),
            level: levelInfo.level,
            xp_progress: levelInfo.progress,
            xp_for_next_level: levelInfo.xpForNextLevel,
            class: userClass,
            rank: userRank,
            top_projects: topProjects,
            activity_breakdown: activityBreakdown
        };
    }

    calculateLevel(xp) {
        let level, xpForNextLevel, progress;
        
        if (xp < 1000) {
            level = Math.floor(xp / 100) + 1;
            xpForNextLevel = 100;
            progress = (xp % 100) / 100 * 100;
        } else if (xp < 5000) {
            level = 10 + Math.floor((xp - 1000) / 250);
            xpForNextLevel = 250;
            progress = ((xp - 1000) % 250) / 250 * 100;
        } else if (xp < 20000) {
            level = 26 + Math.floor((xp - 5000) / 500);
            xpForNextLevel = 500;
            progress = ((xp - 5000) % 500) / 500 * 100;
        } else {
            level = 56 + Math.floor((xp - 20000) / 1000);
            xpForNextLevel = 1000;
            progress = ((xp - 20000) % 1000) / 1000 * 100;
        }

        return {
            level: level,
            progress: progress,
            xpForNextLevel: xpForNextLevel
        };
    }

    determineClass(xp, userData) {
        const classes = [
            [0, 1000, "🧭 Aventureiro"],
            [1000, 2500, "🏹 Caçador"],
            [2500, 5000, "🛡️ Cavaleiro"],
            [5000, 10000, "🎩 Duque"],
            [10000, 20000, "👑 Arquiduque"],
            [20000, 40000, "🔮 Mago"],
            [40000, 80000, "🧬 Cientista"],
            [80000, 160000, "🧙‍♂️ Bruxo"],
            [160000, 320000, "💥 Destruidor"],
            [320000, 640000, "👑 Rei"],
            [640000, 1280000, "✨ Divino"],
            [1280000, Infinity, "🌌 Arquimago"]
        ];

        for (let [min, max, className] of classes) {
            if (xp >= min && xp < max) return className;
        }
        return "🌌 Arquimago";
    }

    determineRank(xp) {
        const ranks = [
            [0, 500, "🥉 Bronze"],
            [500, 1500, "🥈 Prata"],
            [1500, 3000, "🥇 Ouro"],
            [3000, 5000, "💎 Platina"],
            [5000, Infinity, "🔥 Lendário"]
        ];

        for (let [min, max, rankName] of ranks) {
            if (xp >= min && xp < max) return rankName;
        }
        return "🔥 Lendário";
    }

    getTopProjects(repos, username) {
        if (!repos || repos.length === 0) {
            // Projetos simulados
            const seed = this.stringToSeed(username);
            const random = this.seededRandom(seed);
            
            return [
                {
                    name: `${username}-core`,
                    description: 'Sistema principal do projeto',
                    stars: Math.floor(random() * 100) + 10,
                    forks: Math.floor(random() * 50) + 5,
                    language: 'JavaScript',
                    language_emoji: '📜'
                },
                {
                    name: 'api-magic',
                    description: 'API com funcionalidades incríveis',
                    stars: Math.floor(random() * 50) + 5,
                    forks: Math.floor(random() * 30) + 3,
                    language: 'Python',
                    language_emoji: '🐍'
                },
                {
                    name: 'widgets-rpg',
                    description: 'Componentes reutilizáveis',
                    stars: Math.floor(random() * 30) + 3,
                    forks: Math.floor(random() * 20) + 1,
                    language: 'TypeScript',
                    language_emoji: '🔷'
                }
            ];
        }

        // Ordenar por popularidade
        const sortedRepos = [...repos].sort((a, b) => 
            (b.stargazers_count || 0) - (a.stargazers_count || 0)
        ).slice(0, 3);

        const langEmojis = {
            'Python': '🐍', 'JavaScript': '📜', 'TypeScript': '🔷',
            'Java': '☕', 'Go': '🐹', 'Rust': '🦀',
            'C++': '⚙️', 'C#': '🎵', 'Swift': '🐦',
            'Kotlin': '🤖', 'PHP': '🐘', 'Ruby': '💎',
            'HTML': '🌐', 'CSS': '🎨', 'Shell': '🐚'
        };

        return sortedRepos.map(repo => ({
            name: repo.name,
            description: repo.description || 'Sem descrição',
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            language: repo.language || 'Desconhecido',
            language_emoji: langEmojis[repo.language] || '⚡'
        }));
    }

    generateSVGCard(userData, stats, style, size) {
        const themes = {
            medieval: { background: '#2d3436', primary: '#feca57', secondary: '#ff6b6b', accent: '#48dbfb', text: '#ffffff' },
            cyberpunk: { background: '#3a7bd5', primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00', text: '#000000' },
            fantasy: { background: '#f5576c', primary: '#4ecdc4', secondary: '#44a08d', accent: '#ff6b6b', text: '#ffffff' },
            dark: { background: '#2c3e50', primary: '#e74c3c', secondary: '#3498db', accent: '#f1c40f', text: '#ecf0f1' },
            nature: { background: '#27ae60', primary: '#2ecc71', secondary: '#f1c40f', accent: '#e67e22', text: '#ffffff' },
            ocean: { background: '#0984e3', primary: '#74b9ff', secondary: '#81ecec', accent: '#dfe6e9', text: '#2d3436' }
        };

        const sizes = {
            small: { width: 300, height: 400, scale: 0.8 },
            medium: { width: 400, height: 500, scale: 1.0 },
            large: { width: 500, height: 600, scale: 1.2 }
        };

        const theme = themes[style] || themes.medieval;
        const sizeConfig = sizes[size] || sizes.medium;
        
        const width = sizeConfig.width;
        const height = sizeConfig.height;
        const scale = sizeConfig.scale;

        const baseY = 25 * scale;
        const avatarSize = 70 * scale;
        const textSmall = 10 * scale;
        const textMedium = 12 * scale;
        const textLarge = 16 * scale;
        const textXLarge = 18 * scale;

        // Calcular idade da conta
        const accountAge = this.calculateAccountAge(userData.created_at);

        const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.background}"/>
        <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0.3"/>
    </linearGradient>
    <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${theme.primary}"/>
        <stop offset="${stats.xp_progress}%" stop-color="${theme.primary}"/>
        <stop offset="${stats.xp_progress}%" stop-color="${theme.secondary}"/>
        <stop offset="100%" stop-color="${theme.secondary}" stop-opacity="0.5"/>
    </linearGradient>
    <clipPath id="avatarClip">
        <circle cx="${25 * scale + avatarSize/2}" cy="${baseY + avatarSize/2}" r="${avatarSize/2}"/>
    </clipPath>
</defs>

<!-- Fundo -->
<rect width="100%" height="100%" fill="url(#bgGrad)" rx="15"/>

<!-- Avatar -->
<g clip-path="url(#avatarClip)">
    <image href="${userData.avatar_url}" 
           x="${25 * scale}" y="${baseY}" 
           width="${avatarSize}" height="${avatarSize}"/>
</g>
<circle cx="${25 * scale + avatarSize/2}" cy="${baseY + avatarSize/2}" 
        r="${avatarSize/2 + 2}" fill="none" stroke="${theme.primary}" stroke-width="2"/>

<!-- Informações do jogador -->
<text x="${110 * scale}" y="${baseY + 25}" font-family="Arial, sans-serif" font-size="${textXLarge}" font-weight="bold" fill="${theme.primary}">
    ${userData.username}
</text>

<text x="${110 * scale}" y="${baseY + 50}" font-family="Arial, sans-serif" font-size="${textMedium}" fill="${theme.secondary}">
    🎯 Nv. ${stats.level} • ${accountAge} ano(s) no GitHub
</text>

<!-- Barra de XP -->
<rect x="${25 * scale}" y="${baseY + 85}" width="${350 * scale}" height="${10 * scale}" 
      fill="${theme.text}20" rx="${5 * scale}"/>
<rect x="${25 * scale}" y="${baseY + 85}" width="${350 * scale * stats.xp_progress / 100}" 
      height="${10 * scale}" fill="url(#xpGrad)" rx="${5 * scale}"/>

<text x="${25 * scale}" y="${baseY + 110}" font-family="Arial, sans-serif" font-size="${textSmall}" fill="${theme.text}">
    ⚡ ${stats.total_xp.toLocaleString()} XP • ${stats.xp_progress.toFixed(1)}% para o próximo nível
</text>

<!-- Stats principais -->
<text x="${25 * scale}" y="${baseY + 140}" font-family="Arial, sans-serif" font-size="${textMedium}" fill="${theme.text}">
    🧙 Classe: ${stats.class}
</text>

<text x="${25 * scale}" y="${baseY + 165}" font-family="Arial, sans-serif" font-size="${textMedium}" fill="${theme.accent}">
    🏆 Rank: ${stats.rank}
</text>

<text x="${25 * scale}" y="${baseY + 190}" font-family="Arial, sans-serif" font-size="${textSmall}" fill="${theme.secondary}">
    📚 ${userData.public_repos} repositórios • 👥 ${userData.followers} seguidores
</text>

<!-- Atividades -->
<text x="${25 * scale}" y="${baseY + 220}" font-family="Arial, sans-serif" font-size="${textSmall}" fill="${theme.primary}">
    📈 Atividades: ${stats.activity_breakdown.commits} commits • 
    ${stats.activity_breakdown.pull_requests} PRs • 
    ${stats.activity_breakdown.issues} issues
</text>

<!-- Projetos Destacados -->
<text x="${25 * scale}" y="${baseY + 250}" font-family="Arial, sans-serif" font-size="${textMedium}" font-weight="bold" fill="${theme.primary}">
    ⭐ Projetos Destacados:
</text>

${stats.top_projects.map((project, i) => {
    const yPos = baseY + 280 + (i * 55 * scale);
    const desc = project.description.length > 40 ? project.description.substring(0, 40) + '...' : project.description;
    
    return `
    <text x="${25 * scale}" y="${yPos}" font-family="Arial, sans-serif" font-size="${textSmall}" font-weight="bold" fill="${theme.text}">
        ${project.language_emoji} ${project.name} 
        <tspan fill="${theme.secondary}">⭐${project.stars} • 🍴${project.forks}</tspan>
    </text>
    
    <text x="${25 * scale}" y="${yPos + 18 * scale}" font-family="Arial, sans-serif" font-size="${9 * scale}" fill="${theme.text}AA">
        ${desc}
    </text>
    
    <text x="${25 * scale}" y="${yPos + 32 * scale}" font-family="Arial, sans-serif" font-size="${9 * scale}" fill="${theme.accent}">
        🔮 ${project.language}
    </text>
    `;
}).join('')}

<!-- Footer -->
<text x="${25 * scale}" y="${height - 25}" font-family="Arial, sans-serif" font-size="${10 * scale}" fill="${theme.secondary}">
    🛡️ Cartão da Guilda RPG • Gerado em ${new Date().toLocaleDateString('pt-BR')}
</text>

<text x="${25 * scale}" y="${height - 10}" font-family="Arial, sans-serif" font-size="${10 * scale}" fill="${theme.accent}">
    github-card-rpg.vercel.app
</text>

</svg>`;

        return svg;
    }

    calculateAccountAge(createdAt) {
        if (!createdAt) return 1;
        const created = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
        return Math.max(1, diffYears);
    }

    updateCardPreview(svgContent, size) {
        const cardPreview = document.getElementById('cardPreview');
        const sizeConfig = {
            small: { width: 300, height: 400 },
            medium: { width: 400, height: 500 },
            large: { width: 500, height: 600 }
        };
        
        const { width, height } = sizeConfig[size] || sizeConfig.medium;
        
        // Converter SVG para Data URL
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        cardPreview.innerHTML = `
            <div class="generated-card">
                <img src="${svgUrl}" 
                     alt="Cartão RPG de ${this.currentUser}" 
                     style="width: ${width}px; height: ${height}px;"
                     onload="URL.revokeObjectURL(this.src)">
                <div class="card-info">
                    <p><strong>@${this.currentUser}</strong> • ${size} • ${this.currentStyle}</p>
                </div>
            </div>
        `;
    }

    showCardActions(svgContent, username, style, size) {
        const actions = document.getElementById('cardActions');
        actions.classList.remove('hidden');

        // Converter SVG para Base64
        const base64SVG = btoa(unescape(encodeURIComponent(svgContent)));
        const dataURL = `data:image/svg+xml;base64,${base64SVG}`;

        // Atualizar códigos
        document.getElementById('embedCode').textContent = 
            `![Cartão RPG de ${username}](${dataURL})`;
        
        document.getElementById('htmlCode').textContent = 
            `<img src="${dataURL}" alt="Cartão RPG de ${username}" width="${sizes[size].width}" height="${sizes[size].height}" />`;
        
        document.getElementById('urlCode').textContent = dataURL;
    }

    showUserStats(stats, userData) {
        const statsGrid = document.getElementById('statsGrid');
        
        statsGrid.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${stats.level}</span>
                <span class="stat-label">Nível</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.class}</span>
                <span class="stat-label">Classe</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.rank}</span>
                <span class="stat-label">Rank</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.total_xp.toLocaleString()}</span>
                <span class="stat-label">XP Total</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${userData.public_repos}</span>
                <span class="stat-label">Repositórios</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${userData.followers}</span>
                <span class="stat-label">Seguidores</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.activity_breakdown.commits}</span>
                <span class="stat-label">Commits</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.activity_breakdown.stars}</span>
                <span class="stat-label">Stars</span>
            </div>
        `;

        document.getElementById('userStats').classList.remove('hidden');
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    hideCardActions() {
        document.getElementById('cardActions').classList.add('hidden');
    }

    hideUserStats() {
        document.getElementById('userStats').classList.add('hidden');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Tamanhos para referência
const sizes = {
    small: { width: 300, height: 400 },
    medium: { width: 400, height: 500 },
    large: { width: 500, height: 600 }
};

// Inicializar generator
const generator = new GuildCardGenerator();

// Funções globais
function generateCard() {
    generator.generateCard();
}

function downloadCard() {
    if (!generator.currentSVG) {
        generator.showToast('❌ Gere um cartão primeiro!', 'error');
        return;
    }

    const blob = new Blob([generator.currentSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-card-${generator.currentUser}-${generator.currentStyle}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    generator.showToast('💾 SVG baixado com sucesso!');
}

function copyEmbedCode() {
    const code = document.getElementById('embedCode');
    copyToClipboard(code.textContent);
    generator.showToast('📋 Markdown copiado para README!');
}

function copyHtmlCode() {
    const code = document.getElementById('htmlCode');
    copyToClipboard(code.textContent);
    generator.showToast('📋 HTML copiado!');
}

function copyUrlCode() {
    const code = document.getElementById('urlCode');
    copyToClipboard(code.textContent);
    generator.showToast('🔗 URL copiada!');
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// Auto-configuração quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Focar no input de username
    document.getElementById('username').focus();
    
    // Adicionar evento de Enter no input
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateCard();
        }
    });

    // Preencher exemplos automaticamente após 2 segundos
    setTimeout(loadExamples, 2000);
});

function loadExamples() {
    // Esta função pode ser usada para carregar exemplos pré-definidos
    console.log('✅ Sistema RPG Carregado!');
}

// Adicionar suporte para arrastar e soltar ou outras funcionalidades extras
document.addEventListener('dragover', function(e) {
    e.preventDefault();
});

document.addEventListener('drop', function(e) {
    e.preventDefault();
});