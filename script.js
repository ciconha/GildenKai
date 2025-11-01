// ==============================
// ⚔️ Guild Workflow Generator - v2.5
// ==============================
class GuildWorkflowGenerator {
    constructor() {
        this.formData = {};
    }

    collectFormData() {
        this.formData = {
            username: document.getElementById('username')?.value.trim() || '',
            empresa: document.getElementById('empresa')?.value.trim() || '',
            area: document.getElementById('area')?.value.trim() || '',
            token: document.getElementById('token')?.value.trim() || '',
            workflowName: document.getElementById('workflowName')?.value.trim() || 'guild-workflow'
        };
        return this.formData;
    }

    validateForm() {
        const d = this.formData;
        if (!d.username) return this.showToast('❌ GitHub username é obrigatório!', 'error');
        if (!d.area) return this.showToast('❌ Selecione sua área!', 'error');
        return true;
    }

    generateWorkflowYAML() {
        const d = this.formData;

        const tokenField = d.token
            ? `          token: \${{ secrets.${d.token} }}`
            : `          token: \${{ secrets.GITHUB_TOKEN }}`;

        const yamlContent = `name: ${d.workflowName}

on:
  workflow_dispatch:
    inputs:
      usuario:
        description: 'Usuário do GitHub'
        required: true
        default: '${d.username}'
      empresa:
        description: 'Nome da empresa'
        required: false
        default: '${d.empresa || 'Independente'}'
      area:
        description: 'Área de atuação'
        required: false
        default: '${d.area}'

permissions:
  contents: write

jobs:
  gerar-svg:
    runs-on: ubuntu-latest

    steps:
      - name: 🧩 Checkout do repositório
        uses: actions/checkout@v4

      - name: ⚙️ Instalar dependências
        run: |
          sudo apt-get update -y
          sudo apt-get install -y curl jq

      - name: 🔍 Buscar dados do GitHub
        id: fetch-data
        env:
          GH_TOKEN: \${{ secrets.GH_TOKEN || secrets.GITHUB_TOKEN }}
        run: |
          USER="\${{ github.event.inputs.usuario }}"
          
          # Decide qual token usar
          if [ -n "$GH_TOKEN" ]; then
            TOKEN=$GH_TOKEN
          else
            TOKEN=\${{ secrets.GITHUB_TOKEN }}
          fi

          echo "📡 Coletando dados do usuário: $USER"

          # Dados principais
          curl -s -H "Authorization: token $TOKEN" "https://api.github.com/users/$USER" > user.json
          curl -s -H "Authorization: token $TOKEN" "https://api.github.com/users/$USER/repos?per_page=100" > repos.json
          curl -s -H "Authorization: token $TOKEN" "https://api.github.com/users/$USER/events?per_page=100" > events.json

          sanitize() {
            echo "$1" | iconv -c -t UTF-8//TRANSLIT | tr -d '\\n' | sed 's/"/\\\\"/g'
          }

          LOGIN=$(sanitize "$(jq -r '.login' user.json)")
          NAME=$(sanitize "$(jq -r '.name // "Usuário Desconhecido"' user.json)")
          BIO=$(sanitize "$(jq -r '.bio // "Desenvolvedor apaixonado por tecnologia."' user.json)")
          REPOS=$(jq -r '.public_repos' user.json)
          FOLLOWERS=$(jq -r '.followers' user.json)
          COMMITS=$(jq '[.[] | select(.type == "PushEvent")] | length' events.json)
          PRS=$(jq '[.[] | select(.type == "PullRequestEvent")] | length' events.json)
          ISSUES=$(jq '[.[] | select(.type == "IssuesEvent")] | length' events.json)

          # Linguagem mais usada
          LANG=$(jq -r '.[].language' repos.json | sort | uniq -c | sort -nr | head -1 | awk '{print $2}')
          if [ -z "$LANG" ] || [ "$LANG" = "null" ]; then
            LANG="Desconhecida"
          fi

          # XP e classificação
          TOTAL_XP=$((REPOS * 50 + FOLLOWERS * 30 + COMMITS * 2 + PRS * 10 + ISSUES * 5))
          LEVEL=$((TOTAL_XP / 1000 + 1))
          XP_PERCENTAGE=$(( (TOTAL_XP % 1000) * 100 / 1000 ))

          if [ "$REPOS" -gt 50 ]; then
            CLASS="Arquiteto"
          elif [ "$FOLLOWERS" -gt 100 ]; then
            CLASS="Lenda"
          elif [ "$REPOS" -gt 30 ] && [ "$FOLLOWERS" -gt 50 ]; then
            CLASS="Mestre"
          else
            CLASS="Aventureiro"
          fi

          if [ "$REPOS" -gt 100 ]; then
            RANK="Lendário"
          elif [ "$REPOS" -gt 50 ]; then
            RANK="Épico"
          else
            RANK="Herói"
          fi

          # Top 2 projetos
          jq 'sort_by(-.stargazers_count) | .[0:2] | .[] | {name: .name, stars: .stargazers_count}' repos.json > top_projects.json

          echo "login=$LOGIN" >> $GITHUB_OUTPUT
          echo "name=$NAME" >> $GITHUB_OUTPUT
          echo "bio=$BIO" >> $GITHUB_OUTPUT
          echo "repos=$REPOS" >> $GITHUB_OUTPUT
          echo "followers=$FOLLOWERS" >> $GITHUB_OUTPUT
          echo "commits=$COMMITS" >> $GITHUB_OUTPUT
          echo "prs=$PRS" >> $GITHUB_OUTPUT
          echo "issues=$ISSUES" >> $GITHUB_OUTPUT
          echo "lang=$LANG" >> $GITHUB_OUTPUT
          echo "total_xp=$TOTAL_XP" >> $GITHUB_OUTPUT
          echo "level=$LEVEL" >> $GITHUB_OUTPUT
          echo "xp_percentage=$XP_PERCENTAGE" >> $GITHUB_OUTPUT
          echo "class=$CLASS" >> $GITHUB_OUTPUT
          echo "rank=$RANK" >> $GITHUB_OUTPUT

      - name: 🎨 Gerar SVG Dark Red Minimalista
        run: |
          mkdir -p cards
          PROJECT1_NAME=$(jq -r '.name' top_projects.json | head -1)
          PROJECT1_STARS=$(jq -r '.stars' top_projects.json | head -1)
          PROJECT2_NAME=$(jq -r '.name' top_projects.json | tail -1)
          PROJECT2_STARS=$(jq -r '.stars' top_projects.json | tail -1)
          CURRENT_DATE=$(date +'%d/%m/%Y')

          cat > cards/\${{ github.event.inputs.usuario }}.svg << EOF
          <svg xmlns="http://www.w3.org/2000/svg" width="460" height="280" viewBox="0 0 460 280">
            <defs>
              <linearGradient id="darkRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#120000"/>
                <stop offset="100%" stop-color="#360000"/>
              </linearGradient>
              <style>
                .title { font-size: 22px; font-weight: bold; fill: #FF3333; }
                .subtitle { font-size: 13px; fill: #FF7777; }
                .text { font-size: 11px; fill: #FFAAAA; }
                .bar-bg { fill: #1a0000; }
                .bar-fill { fill: #FF2222; }
              </style>
            </defs>

            <rect width="460" height="280" rx="15" ry="15" fill="url(#darkRed)" stroke="#880000" stroke-width="3"/>

            <!-- Cabeçalho -->
            <text x="30" y="55" class="title">\${{ steps.fetch-data.outputs.name }}</text>
            <text x="30" y="75" class="subtitle">🏢 \${{ github.event.inputs.empresa }} • 💼 \${{ github.event.inputs.area }}</text>
            <text x="30" y="93" class="subtitle">⚔️ \${{ steps.fetch-data.outputs.class }} • 🩸 \${{ steps.fetch-data.outputs.rank }}</text>

            <!-- Bio -->
            <text x="30" y="115" class="text">\${{ steps.fetch-data.outputs.bio }}</text>

            <!-- Linguagem + XP -->
            <text x="30" y="140" class="text">💻 Linguagem principal: \${{ steps.fetch-data.outputs.lang }}</text>
            <text x="30" y="158" class="text">🏆 Nível: \${{ steps.fetch-data.outputs.level }} • XP Total: \${{ steps.fetch-data.outputs.total_xp }}</text>

            <!-- Barra de XP -->
            <rect x="30" y="165" width="280" height="8" class="bar-bg" rx="4" ry="4"/>
            <rect x="30" y="165" width="\$((280 * \${{ steps.fetch-data.outputs.xp_percentage }} / 100))" height="8" class="bar-fill" rx="4" ry="4"/>

            <!-- Projetos -->
            <text x="30" y="195" class="subtitle">⭐ Destaques:</text>
            <text x="30" y="215" class="text">• $PROJECT1_NAME — ⭐ $PROJECT1_STARS</text>
            <text x="30" y="232" class="text">• $PROJECT2_NAME — ⭐ $PROJECT2_STARS</text>

            <!-- Rodapé -->
            <text x="230" y="265" text-anchor="middle" class="text">
              Gerado em $CURRENT_DATE • \${{ steps.fetch-data.outputs.commits }} commits • \${{ steps.fetch-data.outputs.prs }} PRs • \${{ steps.fetch-data.outputs.issues }} issues
            </text>
          </svg>
          EOF

          echo "✅ SVG minimalista Dark Red gerado com sucesso!"

      - name: 💾 Commit e Push automático
        run: |
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          git add cards/
          git commit -m "🩸 Atualização do cartão da guilda para \${{ github.event.inputs.usuario }}" || echo "Nenhuma mudança detectada"
          git push
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

        return yamlContent;
    }

    previewWorkflow() {
        this.collectFormData();
        if (!this.validateForm()) return;
        const yml = this.generateWorkflowYAML();
        document.getElementById('workflowPreview').textContent = yml;
        document.getElementById('previewActions').classList.remove('hidden');
        this.showToast('👁️ Workflow gerado com sucesso!');
    }

    generateWorkflow() {
        this.collectFormData();
        if (!this.validateForm()) return;
        const yml = this.generateWorkflowYAML();
        const fileName = `${this.formData.workflowName}.yml`;
        this.downloadYAML(yml, fileName);
        this.showToast(`⚡ ${fileName} baixado! Coloque em .github/workflows/`);
    }

    downloadYAML(content, filename) {
        const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copyWorkflow() {
        const text = document.getElementById('workflowPreview').textContent;
        navigator.clipboard.writeText(text);
        this.showToast('📋 Workflow copiado!');
    }

    showToast(msg, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = 'toast ' + type + ' show';
        setTimeout(() => toast.classList.remove('show'), 4000);
    }
}

const workflowGenerator = new GuildWorkflowGenerator();

function previewWorkflow() { workflowGenerator.previewWorkflow(); }
function generateWorkflow() { workflowGenerator.generateWorkflow(); }
function copyWorkflow() { workflowGenerator.copyWorkflow(); }

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('username').focus();

    // Adiciona campo de token se não existir
    if (!document.getElementById('token')) {
        const tokenInput = document.createElement('input');
        tokenInput.id = 'token';
        tokenInput.placeholder = 'Nome do token secreto (opcional)';
        document.querySelector('form')?.appendChild(tokenInput);
    }

    workflowGenerator.showToast('⚙️ Guild Workflow Generator pronto!');
});