# Calculadora de Notas

Uma aplicação web responsiva para calcular a média final de notas da faculdade com suporte a múltiplas avaliações (A1, A2, A3) com pesos individuais.

## Características
 
✅ **Mobile-First** - Totalmente responsivo com 4 breakpoints (desktop, 920px, 760px, 560px)  
✅ **Validação** - Notas 0-10, pesos 0-100, soma ≤100  
✅ **Regras Inteligentes** - A1 obrigatório, A2 opcional, A3 depende de A2  
✅ **Código Comentado** - Estrutura curta e objetiva

## Arquitetura

### Frontend (JavaScript Vanilla)

```
static/
├── script.js
│   ├── Estado global: objeto `estado` com quadros e resultado
│   ├── Utilitários: fmt(), porId(), quadroAtivo()
│   ├── API: calcular() → POST /api/calcular
│   ├── Renderização: renderizar() → atualiza DOM
│   ├── Eventos: adicionarNota, remover, atualizar, alternarQuadro, limpar
│   └── Init: calcular() ao carregar
└── style.css (560+ linhas)
    ├── Variáveis CSS (cores, sombras, raios)
    ├── Reset e base
    ├── Componentes (container, header, quadros, inputs, buttons)
    └── Media queries (responsivo)
```

**Padrão:**
- Estado centralizado em `const estado = { quadros: {...}, resultado: null }`
- Cada interação do usuário: `usuario → calcular() → renderizar()`
- Uma única chamada API para todas as ações

### Backend (Flask)

```
app.py
├── _to_float() → conversão de tipos com erro
├── _calcular_quadro(nome, quadro) → validação + cálculo de um quadro
├── GET / → retorna index.html
└── POST /api/calcular → recebe estado, valida, retorna resultado
    └── Regras:
        - A1 sempre ativo
        - A2 opcional
        - A3 só se A2 ativo
        - Validação de notas (0-10), pesos (0-100), soma (≤100)
```

**Fluxo:**
```
Frontend JSON → _calcular_quadro (x3) → Validações → Cálculos → JSON resposta
```

## Como Usar

### Instalação

```bash
# Clonar ou extrair o projeto
cd CalculadoraNotas

# Instalar dependências (apenas Flask)
pip install flask

# Executar
python app.py
```

Acesse: `http://localhost:5000`


## Regras de Negócio (resumido)

- A1 sempre ativo.
- A2 opcional (usuário ativa/desativa).
- A3 só pode ser ativado se A2 estiver ativo.
- Notas: 0 a 10.
- Pesos: 0 a 100; soma dos pesos de um quadro ≤ 100.
- Média final: média ponderada pelos pesos dos quadros ativos.

### Fluxo (curto)

1. Frontend envia estado para `POST /api/calcular`.
2. Backend valida e calcula parciais/finais por quadro.
3. Backend retorna todos os quadros e `mediaFinal`.


## Tecnologias

- **Backend:** Python + Flask
- **Frontend:** HTML + JavaScript + CSS
- **Design:** Google Fonts (Poppins, Inter) + CSS Gradients + Media Queries
- **API:** REST POST com JSON

## Hospedagem

- **Plataforma escolhida:** Render