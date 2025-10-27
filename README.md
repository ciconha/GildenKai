# 🛡️ Cartão da Guilda RPG - Gerador GitHub

## 📖 Sobre o Projeto

Este é um **gerador de cartões RPG para GitHub** que transforma seu perfil do GitHub em uma aventura épica! Inicialmente desenvolvido em HTML, CSS e JavaScript, agora foi **otimizado e migrado para JavaScript puro** para melhor performance e eficiência.

> ⚠️ **Aviso:** Esta é uma versão protótipo - funcional, mas em desenvolvimento. Use com entendimento que pode haver ajustes futuros.

## 🚀 Como Usar no Seu README

### Método 1: Copiar e Colar Direto (Recomendado)

1. **Acesse o gerador:** [Link do Seu Site]
2. **Digite seu username** do GitHub
3. **Escolha o estilo** e tamanho desejado
4. **Clique em "Gerar Meu Cartão"**
5. **Clique no botão "📋 Copiar Markdown"**
6. **Cole no seu README.md**

### Método 2: Usando URL Direta

```markdown
![Cartão RPG](https://seu-site.com/api/card?user=SEU_USERNAME&style=medieval&size=medium)
```

### Exemplo Prático:

```markdown
# 🎮 Meu Perfil GitHub

![Cartão RPG](https://seu-site.com/api/card?user=seuusername&style=cyberpunk)

## 📊 Minhas Estatísticas

- 🔥 Nível: 45
- 🏆 Rank: Lendário  
- ⚡ XP: 15,000
- 🧙 Classe: Mago Sênior
```

## 🎨 Personalização

### Parâmetros Disponíveis:

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `user` | qualquer username | Usuário do GitHub |
| `style` | `medieval`, `cyberpunk`, `fantasy`, `dark`, `nature`, `ocean` | Estilo visual |
| `size` | `small`, `medium`, `large` | Tamanho do cartão |

### Exemplos de URLs:

```markdown
<!-- Estilo Medieval -->
![Cartão](https://seu-site.com/api/card?user=seunome&style=medieval)

<!-- Estilo Cyberpunk -->
![Cartão](https://seu-site.com/api/card?user=seunome&style=cyberpunk&size=large)

<!-- Estilo Fantasy Pequeno -->
![Cartão](https://seu-site.com/api/card?user=seunome&style=fantasy&size=small)
```

## ⚡ Sistema RPG

### 🎯 Como as Estatísticas São Calculadas:

| Atividade | XP Ganho |
|-----------|----------|
| 💾 Cada Commit | +5 XP |
| 🔄 Pull Request | +10 XP |
| 🐛 Issue Reportada | +8 XP |
| ⭐ Star em Repo | +2 XP |
| 📚 Novo Repositório | +15 XP |
| 👥 Novo Seguidor | +1 XP |

### 🏆 Sistema de Classes:

| Nível | Classe | XP Necessário |
|-------|--------|---------------|
| 1-10 | 🧭 Aventureiro | 0-1,000 |
| 11-25 | 🏹 Caçador | 1,000-2,500 |
| 26-40 | 🛡️ Cavaleiro | 2,500-5,000 |
| 41-55 | 🎩 Duque | 5,000-10,000 |
| 56-70 | 👑 Arquiduque | 10,000-20,000 |
| 71+ | 🔮 Mago | 20,000+ |

## 🔧 Para Desenvolvedores

### Estrutura do Projeto:

```
github-card-rpg/
├── index.html          # Interface principal
├── style.css           # Estilos responsivos
├── script.js           # Lógica principal (JavaScript Otimizado)
└── api/
    └── card.js         # Gerador de cartões SVG
```

### Tecnologias Utilizadas:

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **API:** GitHub REST API v3
- **SVG:** Gerador dinâmico de cartões
- **Design:** Gradientes, Animações CSS, Temas

### Migração para JavaScript:

**Antes (HTML):**
```html
<div class="card">
  <!-- Conteúdo estático -->
</div>
```

**Agora (JavaScript):**
```javascript
class CardGenerator {
  generateSVG(userData, stats) {
    // Geração dinâmica do SVG
    return `<svg>...</svg>`;
  }
}
```

## 🎯 Recursos Incluídos

### ✅ Funcionalidades Principais:
- [x] **Integração com API GitHub**
- [x] **6 temas visuais diferentes**
- [x] **3 tamanhos de cartão**
- [x] **Sistema de XP inteligente**
- [x] **Download em SVG**
- [x] **Códigos prontos para README**
- [x] **Design totalmente responsivo**
- [x] **Cache para performance**

### 🎨 Temas Disponíveis:
1. **🏰 Medieval** - Cores clássicas de RPG
2. **🌃 Cyberpunk** - Neon e futurista
3. **🧙 Fantasy** - Mágico e encantado
4. **🌑 Dark Mode** - Escuro e elegante
5. **🌿 Natureza** - Verde e natural
6. **🌊 Oceano** - Azul e refrescante

## 📱 Compatibilidade

- ✅ **GitHub README.md**
- ✅ **GitHub Profile**
- ✅ **GitHub Pages**
- ✅ **Discord** (com Markdown)
- ✅ **Fóruns de Desenvolvimento**
- ✅ **Blogs Técnicos**
- ✅ **Portfólios Pessoais**

## 🚨 Limitações Atuais (Protótipo)

1. **Rate Limit GitHub:** Máximo 60 requisições/hora sem token
2. **Usuários Privados:** Dados limitados sem autenticação
3. **Cache:** Cartões atualizam a cada 1 hora
4. **Performance:** SVG pode ser pesado em dispositivos antigos

## 🔮 Próximas Atualizações

- [ ] **Sistema de Badges**
- [ ] **Mais temas customizáveis**
- [ ] **Estatísticas em tempo real**
- [ ] **API GraphQL para mais dados**
- [ ] **Modo offline**
- [ ] **Widget para sites**

## 🤝 Como Contribuir

1. **Reporte bugs** através das Issues
2. **Sugira novas features** 
3. **Faça fork e envie PRs**
4. **Compartilhe com a comunidade**

## 📄 Licença

Este projeto é open-source e está sob licença MIT. Sinta-se à vontade para usar e modificar.

## 💡 Dicas de Uso

### Para Melhor Visualização:

1. **Use no topo** do seu README para impacto visual
2. **Combine com badges** do Shields.io
3. **Atualize regularmente** para stats atualizados
4. **Experimente diferentes temas** para combinar com seu perfil

### Exemplo de README Completo:

```markdown
# 👋 Olá, eu sou [Seu Nome]!

![Cartão RPG](https://seu-site.com/api/card?user=seunome&style=cyberpunk)

## 🚀 Sobre Mim
Desenvolvedor full-stack apaixonado por...

## 💼 Tecnologias
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

## 📊 Estatísticas GitHub
![Estatísticas](https://github-readme-stats.vercel.app/api?username=seunome&show_icons=true)
```

---

**⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!**

**🔗 Compartilhe com outros desenvolvedores para ajudar a comunidade!**

---

*Desenvolvido com 💙 pela comunidade de desenvolvedores RPG*