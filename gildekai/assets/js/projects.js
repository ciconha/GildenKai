class ProjectsGallery {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.currentView = 'grid';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserFromURL();
        this.setupEventListeners();
        this.setupFilters();
    }

    loadUserFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentUser = urlParams.get('user') || localStorage.getItem('lastGuildUser');
        
        if (this.currentUser) {
            this.fetchUserProjects();
        } else {
            this.showEmptyState();
        }
    }

    async fetchUserProjects() {
        try {
            this.showLoading(true);
            
            // Buscar repositórios do usuário
            const response = await fetch(`https://api.github.com/users/${this.currentUser}/repos?per_page=100&sort=updated`);
            
            if (!response.ok) throw new Error('Erro ao carregar projetos');
            
            this.projects = await response.json();
            this.filteredProjects = [...this.projects];
            
            this.renderProjects();
            this.renderStats();
            this.populateLanguageFilter();
            
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            this.showErrorState(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    renderProjects() {
        const grid = document.getElementById('projectsGrid');
        const totalElement = document.getElementById('totalProjects');
        
        totalElement.textContent = this.filteredProjects.length;
        
        if (this.filteredProjects.length === 0) {
            grid.innerHTML = `
                <div class="no-projects" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                    <i class="fas fa-box-open fa-3x" style="color: var(--projects-muted); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--projects-text); margin-bottom: 1rem;">Nenhum projeto encontrado</h3>
                    <p style="color: var(--projects-muted);">Tente ajustar os filtros de busca</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.filteredProjects.map(project => `
            <div class="project-item" data-project-id="${project.id}">
                <div class="project-header">
                    <div>
                        <h3 class="project-title">${project.name}</h3>
                        ${project.language ? `
                            <span class="project-language">
                                <i class="fas fa-circle" style="color: ${this.getLanguageColor(project.language)}"></i>
                                ${project.language}
                            </span>
                        ` : ''}
                    </div>
                    <div class="project-meta">
                        <span class="meta-item">
                            <i class="fas fa-star"></i>
                            ${project.stargazers_count}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-code-branch"></i>
                            ${project.forks_count}
                        </span>
                    </div>
                </div>
                
                <div class="project-body">
                    <p class="project-description">
                        ${project.description || 'Sem descrição disponível.'}
                    </p>
                    
                    ${project.topics && project.topics.length > 0 ? `
                        <div class="project-tech">
                            ${project.topics.slice(0, 5).map(topic => `
                                <span class="tech-tag">${topic}</span>
                            `).join('')}
                            ${project.topics.length > 5 ? `<span class="tech-tag">+${project.topics.length - 5}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="project-footer">
                    <span class="project-date">
                        Atualizado em ${new Date(project.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                    <a href="${project.html_url}" target="_blank" class="project-link">
                        Ver Projeto <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `).join('');
        
        // Adicionar eventos de clique
        document.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('a')) {
                    const projectId = item.dataset.projectId;
                    const project = this.projects.find(p => p.id == projectId);
                    this.openProjectModal(project);
                }
            });
        });
    }

    renderStats() {
        const statsContainer = document.getElementById('projectsStats');
        
        const stats = {
            total: this.projects.length,
            stars: this.projects.reduce((acc, p) => acc + p.stargazers_count, 0),
            forks: this.projects.reduce((acc, p) => acc + p.forks_count, 0),
            languages: new Set(this.projects.map(p => p.language).filter(Boolean)).size,
            size: this.projects.reduce((acc, p) => acc + p.size, 0)
        };
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-value">${stats.total}</span>
                <span class="stat-label">Total de Projetos</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${stats.stars}</span>
                <span class="stat-label">Estrelas Conquistadas</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${stats.forks}</span>
                <span class="stat-label">Forks Recebidos</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${stats.languages}</span>
                <span class="stat-label">Linguagens Utilizadas</span>
            </div>
        `;
    }

    populateLanguageFilter() {
        const filter = document.getElementById('languageFilter');
        const languages = [...new Set(this.projects.map(p => p.language).filter(Boolean))];
        
        languages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            filter.appendChild(option);
        });
    }

    setupEventListeners() {
        // Botões de visualização
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
        
        // Busca
        document.getElementById('projectSearch').addEventListener('input', (e) => {
            this.filterProjects();
        });
        
        // Filtros
        document.getElementById('languageFilter').addEventListener('change', () => {
            this.filterProjects();
        });
        
        document.getElementById('sortFilter').addEventListener('change', () => {
            this.sortProjects();
        });
        
        // Modal
        const modal = document.getElementById('projectModal');
        const closeBtn = modal.querySelector('.close-modal');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    setupFilters() {
        // Implementar lógica de filtros
    }

    filterProjects() {
        const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
        const languageFilter = document.getElementById('languageFilter').value;
        
        this.filteredProjects = this.projects.filter(project => {
            const matchesSearch = !searchTerm || 
                project.name.toLowerCase().includes(searchTerm) ||
                (project.description && project.description.toLowerCase().includes(searchTerm));
            
            const matchesLanguage = !languageFilter || project.language === languageFilter;
            
            return matchesSearch && matchesLanguage;
        });
        
        this.renderProjects();
    }

    sortProjects() {
        const sortBy = document.getElementById('sortFilter').value;
        
        this.filteredProjects.sort((a, b) => {
            switch(sortBy) {
                case 'stars':
                    return b.stargazers_count - a.stargazers_count;
                case 'forks':
                    return b.forks_count - a.forks_count;
                case 'updated':
                    return new Date(b.updated_at) - new Date(a.updated_at);
                case 'size':
                    return b.size - a.size;
                default:
                    return 0;
            }
        });
        
        this.renderProjects();
    }

    switchView(view) {
        this.currentView = view;
        const grid = document.getElementById('projectsGrid');
        
        // Atualizar botões ativos
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Atualizar classe do grid
        grid.classList.toggle('list-view', view === 'list');
        
        // Re-renderizar projetos se necessário
        this.renderProjects();
    }

    openProjectModal(project) {
        const modal = document.getElementById('projectModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${project.name}</h2>
                ${project.language ? `
                    <span class="modal-language">
                        <i class="fas fa-circle" style="color: ${this.getLanguageColor(project.language)}"></i>
                        ${project.language}
                    </span>
                ` : ''}
            </div>
            
            <div class="modal-stats">
                <div class="modal-stat">
                    <span class="modal-stat-value">${project.stargazers_count}</span>
                    <span class="modal-stat-label">Estrelas</span>
                </div>
                <div class="modal-stat">
                    <span class="modal-stat-value">${project.forks_count}</span>
                    <span class="modal-stat-label">Forks</span>
                </div>
                <div class="modal-stat">
                    <span class="modal-stat-value">${project.watchers_count}</span>
                    <span class="modal-stat-label">Watchers</span>
                </div>
                <div class="modal-stat">
                    <span class="modal-stat-value">${project.open_issues_count}</span>
                    <span class="modal-stat-label">Issues</span>
                </div>
            </div>
            
            <div class="modal-description">
                ${project.description || 'Este projeto não possui descrição.'}
            </div>
            
            ${project.topics && project.topics.length > 0 ? `
                <div class="modal-tech-stack">
                    <h3 class="modal-tech-title">Tecnologias e Tópicos</h3>
                    <div class="modal-tech-grid">
                        ${project.topics.map(topic => `
                            <span class="modal-tech-tag">${topic}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="modal-details">
                <p><strong>Criado em:</strong> ${new Date(project.created_at).toLocaleDateString('pt-BR')}</p>
                <p><strong>Última atualização:</strong> ${new Date(project.updated_at).toLocaleDateString('pt-BR')}</p>
                ${project.homepage ? `<p><strong>Website:</strong> <a href="${project.homepage}" target="_blank">${project.homepage}</a></p>` : ''}
            </div>
            
            <div class="modal-links">
                <a href="${project.html_url}" target="_blank" class="modal-link">
                    <i class="fab fa-github"></i> Ver no GitHub
                </a>
                ${project.homepage ? `
                    <a href="${project.homepage}" target="_blank" class="modal-link">
                        <i class="fas fa-external-link-alt"></i> Visitar Website
                    </a>
                ` : ''}
            </div>
        `;
        
        modal.classList.add('active');
    }

    getLanguageColor(language) {
        const colors = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#2b7489',
            'Python': '#3572A5',
            'Java': '#b07219',
            'C++': '#f34b7d',
            'C#': '#178600',
            'PHP': '#4F5D95',
            'Ruby': '#701516',
            'Go': '#00ADD8',
            'Rust': '#dea584',
            'Swift': '#ffac45',
            'Kotlin': '#F18E33',
            'HTML': '#e34c26',
            'CSS': '#563d7c'
        };
        
        return colors[language] || '#cccccc';
    }

    showLoading(show) {
        const loading = document.getElementById('loadingProjects');
        loading.style.display = show ? 'flex' : 'none';
    }

    showEmptyState() {
        const grid = document.getElementById('projectsGrid');
        grid.innerHTML = `
            <div class="no-user" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <i class="fas fa-user-slash fa-3x" style="color: var(--projects-muted); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--projects-text); margin-bottom: 1rem;">Nenhum usuário selecionado</h3>
                <p style="color: var(--projects-muted); margin-bottom: 2rem;">
                    Volte à página principal para gerar seu cartão primeiro
                </p>
                <a href="index.html" class="action-btn" style="display: inline-flex;">
                    <i class="fas fa-arrow-left"></i> Voltar à Guilda
                </a>
            </div>
        `;
        
        this.showLoading(false);
    }

    showErrorState(message) {
        const grid = document.getElementById('projectsGrid');
        grid.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-triangle fa-3x" style="color: #fc8181; margin-bottom: 1rem;"></i>
                <h3 style="color: var(--projects-text); margin-bottom: 1rem;">Erro ao carregar projetos</h3>
                <p style="color: var(--projects-muted); margin-bottom: 2rem;">
                    ${message || 'Não foi possível carregar os projetos do usuário.'}
                </p>
                <button onclick="location.reload()" class="action-btn">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
        
        this.showLoading(false);
    }
}

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    window.projectsGallery = new ProjectsGallery();
});