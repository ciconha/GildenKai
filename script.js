// Configuração do GildenKai
const SITE_URL = 'https://gilden-kai.vercel.app';

// Sistema RPG Completo
class GildenKaiGenerator {
    constructor() {
        this.currentUser = '';
        this.currentStyle = 'medieval';
        this.currentSize = 'medium';
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

        this.showLoading(true);
        this.hideCardActions();
        this.hideLivePreview();

        try {
            // Verificar se usuário existe
            await this.validateGitHubUser(username);
            
            // Gerar URLs do cartão
            this.generateCardUrls(username, style, size);
            
            // Mostrar preview ao vivo
            await this.showLivePreview(username, style, size);
            
            this.showToast('🎉 Cartão épico gerado com sucesso!');

        } catch (error) {
            console.error('Erro:', error);
            this.showToast('❌ ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async validateGitHubUser(username) {
        try {
            const response = await fetch(`https://api.github.com/users/${username}`);
            if (!response.ok) {
                throw new Error('Usuário não encontrado no GitHub');
            }
            const userData = await response.json();
            return userData;
        } catch (error) {
            throw new Error('Não foi possível acessar o GitHub');
        }
    }

    generateCardUrls(username, style, size) {
        const actions = document.getElementById('cardActions');
        actions.classList.remove('hidden');

        // Gerar URL base
        const baseUrl = `${SITE_URL}/api/card?user=${username}&style=${style}&size=${size}`;
        
        // Atualizar códigos
        document.getElementById('embedCode').textContent = 
            `![Cartão RPG de ${username}](${baseUrl})`;
        
        document.getElementById('htmlCode').textContent = 
            `<img src="${baseUrl}" alt="Cartão RPG de ${username}" />`;
        
        document.getElementById('urlCode').textContent = baseUrl;
    }

    async showLivePreview(username, style, size) {
        const previewUrl = `${SITE_URL}/api/card?user=${username}&style=${style}&size=${size}&timestamp=${Date.now()}`;
        
        try {
            // Verificar se a imagem existe
            const response = await fetch(previewUrl);
            if (response.ok) {
                const livePreview = document.getElementById('livePreview');
                const previewImg = document.getElementById('livePreviewImg');
                
                previewImg.src = previewUrl;
                previewImg.alt = `Cartão RPG de ${username}`;
                previewImg.onload = () => {
                    livePreview.classList.remove('hidden');
                };
                previewImg.onerror = () => {
                    this.showSimulatedPreview(username, style);
                };
            } else {
                this.showSimulatedPreview(username, style);
            }
        } catch (error) {
            this.showSimulatedPreview(username, style);
        }
    }

    showSimulatedPreview(username, style) {
        const cardPreview = document.getElementById('cardPreview');
        
        const themeColors = {
            medieval: { primary: '#feca57', secondary: '#ff6b6b', bg: '#2d3436' },
            cyberpunk: { primary: '#ff00ff', secondary: '#00ffff', bg: '#3a7bd5' },
            fantasy: { primary: '#4ecdc4', secondary: '#ff6b6b', bg: '#f5576c' },
            dark: { primary: '#e74c3c', secondary: '#3498db', bg: '#2c3e50' },
            nature: { primary: '#2ecc71', secondary: '#f1c40f', bg: '#27ae60' },
            ocean: { primary: '#74b9ff', secondary: '#81ecec', bg: '#0984e3' }
        };

        const theme = themeColors[style] || themeColors.medieval;

        cardPreview.innerHTML = `
            <div class="generated-card">
                <div style="
                    background: linear-gradient(135deg, ${theme.bg}, #1a1a2e);
                    border-radius: 20px;
                    padding: 30px;
                    text-align: center;
                    border: 3px solid ${theme.primary};
                    color: white;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: linear-gradient(90deg, transparent, ${theme.primary}, transparent);
                    "></div>
                    
                    <div style="font-size: 1.5em; margin-bottom: 15px; font-weight: bold; color: ${theme.primary}">
                        @${username}
                    </div>
                    
                    <div style="opacity: 0.8; margin-bottom: 20px; font-size: 1.1em;">
                        🎮 Nível 25 • 🏆 Rank Lendário
                    </div>
                    
                    <div style="
                        background: rgba(255,255,255,0.1);
                        padding: 20px;
                        border-radius: 12px;
                        margin-bottom: 20px;
                        border-left: 4px solid ${theme.secondary};
                    ">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
                            <div>
                                <div style="color: ${theme.primary}; font-weight: bold;">⚡ XP Total</div>
                                <div>15,240</div>
                            </div>
                            <div>
                                <div style="color: ${theme.primary}; font-weight: bold;">📚 Repos</div>
                                <div>24</div>
                            </div>
                            <div>
                                <div style="color: ${theme.primary}; font-weight: bold;">👥 Seguidores</div>
                                <div>128</div>
                            </div>
                            <div>
                                <div style="color: ${theme.primary}; font-weight: bold;">🧙 Classe</div>
                                <div>Mago</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.9em; opacity: 0.7;">
                        🛡️ GildenKai RPG • Estilo: ${style}
                    </div>
                    
                    <div style="
                        position: absolute;
                        bottom: 10px;
                        right: 15px;
                        font-size: 2em;
                        opacity: 0.3;
                    ">
                        ⚔️
                    </div>
                </div>
            </div>
        `;
    }

    generateQuickLink(style) {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            this.showToast('❌ Digite um username primeiro!', 'error');
            return;
        }

        const url = `${SITE_URL}/api/card?user=${username}&style=${style}`;
        const markdown = `![Cartão RPG de ${username}](${url})`;
        
        this.copyToClipboard(markdown);
        this.showToast(`📋 Link ${style} copiado! Cole no seu README!`);
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

    hideLivePreview() {
        document.getElementById('livePreview').classList.add('hidden');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// Inicializar sistema
const gildenKai = new GildenKaiGenerator();

// Funções globais
function generateCard() {
    gildenKai.generateCard();
}

function generateLink(style) {
    gildenKai.generateQuickLink(style);
}

function copyEmbedCode() {
    const code = document.getElementById('embedCode');
    gildenKai.copyToClipboard(code.textContent);
    gildenKai.showToast('📋 Markdown copiado! Cole no README.md');
}

function copyHtmlCode() {
    const code = document.getElementById('htmlCode');
    gildenKai.copyToClipboard(code.textContent);
    gildenKai.showToast('📋 HTML copiado! Perfeito para sites!');
}

function copyUrlCode() {
    const code = document.getElementById('urlCode');
    gildenKai.copyToClipboard(code.textContent);
    gildenKai.showToast('🔗 URL copiada! Use em APIs!');
}

// Configuração inicial
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('username').focus();
    
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateCard();
        }
    });

    // Exemplo automático para demonstração
    setTimeout(() => {
        document.getElementById('username').placeholder = 'ex: ciconha, torvalds, github';
    }, 2000);
});

console.log('⚔️ GildenKai RPG Carregado!');
console.log('🎯 Domínio: https://gilden-kai.vercel.app');
console.log('🚀 Pronto para gerar cartões épicos!');