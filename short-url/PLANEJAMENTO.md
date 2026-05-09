# Planejamento: Melhorias no Link Shortener — somedia

**Projeto:** somedia — Social Media Management Platform  
**Fase:** 2.2 — Link Shortener Enhancements  
**Criado:** 2026-05-09  
**Status:** Planejamento Completo — Pronto para Execucao

---

## Resumo Executivo

Este documento detalha todas as melhorias e novos recursos a serem implementados na ferramenta de links curtos do somedia. O link shortener base ja foi construido na Fase 2.1 (tabelas `shortLinks`, `linkClicks`, `linkDeviceRules`, `customDomains`, redirect `/l/[slug]`, analytics basico, QR codes, dominios customizados). Este planejamento cobre **3 macro-areas** com **15 entregaveis** organizados em **5 ondas de execucao**.

---

## Estado Atual (Baseline)

### Ja Implementado (Fase 2.1)

| Recurso | Status |
|---------|--------|
| Criar link com URL origem, slug custom/aleatorio | OK |
| Titulo e descricao internos | OK |
| Data de inicio e expiracao | OK |
| Numero maximo de cliques | OK |
| Protecao por senha | OK |
| Redirecionamento por OS (device rules) | OK |
| Dominios customizados com verificacao DNS | OK |
| QR Code (PNG/SVG) | OK |
| Analytics basico: cliques por pais, device, browser, OS, referrer | OK |
| Filtro de data: 7d, 30d, 90d, all | OK |
| Lista de links com busca | OK |
| Copiar link encurtado | OK |
| Editar / excluir link | OK |
| Toggle ativo/inativo | OK |

### O que Falta (Gap Analysis)

| # | Area | Gap | Prioridade |
|---|------|-----|------------|
| 1 | Analytics | Device especifico (iPhone 16, Galaxy S25) | Alta |
| 2 | Analytics | OS com versao | Media |
| 3 | Analytics | Browser com versao | Media |
| 4 | Analytics | Language do visitante | Media |
| 5 | Analytics | Timezone do visitante | Baixa |
| 6 | Analytics | Mapa colorido de acessos | Alta |
| 7 | Analytics | Grafico historico global com filtros | Alta |
| 8 | Analytics | Visitantes unicos (fingerprint) | Alta |
| 9 | Analytics | Filtros: 24h, 1 semana, 1 mes, 90d, 1 ano, total, custom | Alta |
| 10 | Analytics | Download CSV | Media |
| 11 | Links | Filtros: A-Z, Z-A, novos, velhos, cliques, visitantes | Alta |
| 12 | Links | Contador de visitantes unicos na lista | Alta |
| 13 | Links | Pastas para organizacao | Media |
| 14 | Links | Tags com cores | Media |
| 15 | Criar Link | Open Graph preview (titulo/descricao externos) | Media |
| 16 | Criar Link | URL de redirecionamento quando expirado | Alta |
| 17 | Configs | URL default de redirecionamento para expirados | Alta |
| 18 | Configs | URL de redirecionamento para not found | Alta |

---

## Estrutura de Execucao

### Ondas (Waves)

```
Onda 1: Schema + API Foundation
  |- Plano 01: Expansao do Schema (clicks, links, folders, settings)
  |- Plano 02: API de Analytics Avancado + CSV Export

Onda 2: UI — Analytics Dashboard
  |- Plano 03: Mapa + Graficos + Filtros Avancados

Onda 3: UI — Link Management
  |- Plano 04: Filtros, Pastas, Tags com Cores

Onda 4: UI — Create Link + Settings
  |- Plano 05: OG Preview, Redirects, Configuracoes

Onda 5: Integracao + Polish
  |- Plano 06: i18n, Testes, Build Verification
```

---

## Plano 01: Expansao do Schema e API Foundation

**Onda:** 1  
**Dependencias:** Nenhuma (baseline da Fase 2.1)  
**Arquivos:** `src/db/schema.ts`, `drizzle/`, `src/lib/click-tracker.ts`, `src/lib/links.ts`

### Tarefa 1.1: Schema de Analytics Avancado

**Objetivo:** Expandir a tabela `linkClicks` e criar tabelas auxiliares para suportar analytics completo.

**Alteracoes em `linkClicks`:**
- Adicionar `language` (text) — Accept-Language header
- Adicionar `timezone` (text) — inferido do IP ou header
- Adicionar `deviceModel` (text) — iPhone 16, Galaxy S25, etc.
- Adicionar `osVersion` (text) — Android 14, iOS 17.4, etc.
- Adicionar `browserVersion` (text) — Chrome 124, etc.
- Adicionar `fingerprint` (text) — hash simples para visitantes unicos

**Nova tabela `linkFolders`:**
```sql
id uuid primary key default gen_random_uuid()
userId text not null references user(id) on delete cascade
name text not null
color text not null default "#3b82f6"
createdAt timestamp default now()
```

**Nova tabela `linkTags`:**
```sql
id uuid primary key default gen_random_uuid()
userId text not null references user(id) on delete cascade
name text not null
color text not null default "#8b5cf6"
createdAt timestamp default now()
```

**Tabela de juncao `shortLinkTags`:**
```sql
linkId uuid references shortLinks(id) on delete cascade
tagId uuid references linkTags(id) on delete cascade
primary key (linkId, tagId)
```

**Alteracao em `shortLinks`:**
- Adicionar `folderId` (uuid, nullable, FK para linkFolders)
- Adicionar `expiredRedirectUrl` (text, nullable)
- Adicionar `ogTitle` (text, nullable)
- Adicionar `ogDescription` (text, nullable)
- Adicionar `ogImageUrl` (text, nullable)

**Nova tabela `userSettings`:**
```sql
id uuid primary key default gen_random_uuid()
userId text not null unique references user(id) on delete cascade
defaultExpiredRedirectUrl text
notFoundRedirectUrl text
createdAt timestamp default now()
updatedAt timestamp default now()
```

**Verificacao:**
- `npm run db:generate` gera migracao sem erros
- `npm run db:push` aplica no Neon

### Tarefa 1.2: Click Tracker Avancado

**Objetivo:** Atualizar `src/lib/click-tracker.ts` para extrair todos os dados novos.

**Implementacao:**
- Parser de User-Agent aprimorado usando `ua-parser-js` (adicionar dependencia)
- Extrair device model: iPhone 16, Samsung Galaxy S25, etc.
- Extrair OS version: iOS 17.4.1, Android 14, Windows 11, etc.
- Extrair browser version: Chrome 124.0.6367.60, etc.
- Gerar fingerprint: hash de `ip + userAgent + acceptLanguage`
- Extrair language do header `Accept-Language`
- Timezone: usar API de geolocalizacao por IP (ipapi.co ou similar, fallback para header)

**Verificacao:**
- Teste unitario: `npm test -- click-tracker` passa
- Log de click contem todos os campos novos

### Tarefa 1.3: API de Analytics Avancado

**Objetivo:** Criar/expandir `GET /api/links/[id]/analytics` com agregacoes completas.

**Query params suportados:**
- `from`, `to` — datas ISO para filtro custom
- `preset` — `24h`, `7d`, `30d`, `90d`, `1y`, `all`

**Resposta expandida:**
```typescript
{
  totalClicks: number;
  uniqueVisitors: number; // baseado em fingerprint
  clicksOverTime: { date: string; clicks: number; uniqueVisitors: number }[];
  topCountries: { country: string; clicks: number; uniqueVisitors: number }[];
  topCities: { city: string; country: string; clicks: number }[];
  topRegions: { region: string; country: string; clicks: number }[];
  devices: { device: string; model: string; clicks: number }[];
  deviceTypes: { type: string; clicks: number }[]; // mobile, tablet, desktop
  browsers: { browser: string; version: string; clicks: number }[];
  operatingSystems: { os: string; version: string; clicks: number }[];
  languages: { language: string; clicks: number }[];
  timezones: { timezone: string; clicks: number }[];
  referrers: { referrer: string; clicks: number; uniqueVisitors: number }[];
  mapData: { country: string; clicks: number; lat: number; lng: number }[];
}
```

**Verificacao:**
- `curl /api/links/[id]/analytics?preset=30d` retorna JSON completo
- Todos os campos populados com dados reais

---

## Plano 02: API de Links e Export CSV

**Onda:** 1 (paralelo com Plano 01)  
**Dependencias:** Plano 01 (schema)  
**Arquivos:** `src/app/api/links/route.ts`, `src/app/api/links/[id]/route.ts`, `src/app/api/links/export/route.ts`

### Tarefa 2.1: API de Lista com Filtros e Ordenacao

**Objetivo:** Expandir `GET /api/links` para suportar filtros e ordenacao avancados.

**Query params:**
- `sort` — `createdAt_desc` (novos), `createdAt_asc` (velhos), `clicks_desc`, `clicks_asc`, `slug_asc` (A-Z), `slug_desc` (Z-A), `visitors_desc`
- `folderId` — filtrar por pasta
- `tagIds` — filtrar por tags (comma-separated)
- `status` — `active`, `inactive`, `expired`, `scheduled`

**Resposta expandida:**
```typescript
{
  links: {
    id: string;
    originalUrl: string;
    slug: string;
    title: string | null;
    clickCount: number;
    uniqueVisitors: number; // calculado na hora
    folder: { id: string; name: string; color: string } | null;
    tags: { id: string; name: string; color: string }[];
    createdAt: string;
    expiresAt: string | null;
    isActive: boolean;
  }[];
}
```

**Verificacao:**
- `curl "/api/links?sort=clicks_desc&folderId=xxx"` retorna ordenado
- Filtros combinados funcionam

### Tarefa 2.2: API de Export CSV

**Objetivo:** Criar `GET /api/links/export` e `GET /api/links/[id]/export` para download CSV.

**Formato CSV (global):**
```csv
Slug,URL Original,Titulo,Clicks,Visitantes Unicos,Pasta,Tags,Criado em,Expira em,Status
```

**Formato CSV (por link — analytics):**
```csv
Data,IP,Pais,Regiao,Cidade,Device,Modelo,OS,Browser,Language,Referrer
```

**Implementacao:**
- Gerar CSV server-side com streaming
- Headers `Content-Type: text/csv` + `Content-Disposition: attachment`
- Suportar filtros de data (mesmos params da API de analytics)

**Verificacao:**
- Download de CSV abre corretamente no Excel/LibreOffice
- Dados correspondem aos filtros aplicados

### Tarefa 2.3: API de Folders e Tags

**Objetivo:** CRUD completo para folders e tags.

**Endpoints:**
- `GET /api/links/folders` — listar folders do usuario
- `POST /api/links/folders` — criar folder (name, color)
- `PUT /api/links/folders/[id]` — renomear/mudar cor
- `DELETE /api/links/folders/[id]` — deletar (unlink links)
- `GET /api/links/tags` — listar tags do usuario
- `POST /api/links/tags` — criar tag (name, color)
- `PUT /api/links/tags/[id]` — renomear/mudar cor
- `DELETE /api/links/tags/[id]` — deletar (unlink links)

**Verificacao:**
- CRUD completo testado via curl/Postman
- Cascades funcionam (delete nao remove links, so desassocia)

---

## Plano 03: Analytics Dashboard UI

**Onda:** 2  
**Dependencias:** Plano 01, Plano 02  
**Arquivos:** `src/app/[locale]/(dashboard)/links/[id]/analytics/page.tsx`, `src/components/link-analytics.tsx`, `src/components/analytics-*.tsx`

### Tarefa 3.1: Componente de Mapa de Acessos

**Objetivo:** Criar mapa colorido mostrando acessos por pais.

**Tecnologia:** `recharts` (nao tem mapa nativo) + biblioteca de mapa
**Opcoes:**
- `react-simple-maps` — mapa SVG interativo, leve
- `@react-jvectormap/core` — mapa colorido com legendas

**Decisao:** `react-simple-maps` + `d3-geo` — mais leve, integra bem com React/Tailwind.

**Features:**
- Mapa mundi com paises coloridos por intensidade de cliques
- Tooltip ao hover: nome do pais + numero de cliques + visitantes unicos
- Legenda de cores (escala de calor)
- Zoom e pan

**Verificacao:**
- Mapa renderiza com dados reais
- Cores correspondem a intensidade
- Tooltip funciona

### Tarefa 3.2: Graficos de Historico e Filtros

**Objetivo:** Expandir o dashboard de analytics com graficos completos e filtros de tempo.

**Novos filtros de tempo:**
- 24h, 1 semana (7d), 1 mes (30d), 90 dias, 1 ano (365d), Total, Custom (date picker)

**Novos graficos (recharts):**
- **Linha temporal:** Clicks + visitantes unicos ao longo do tempo (area chart)
- **Barras:** Top 10 paises
- **Barras horizontais:** Top 10 cidades
- **Pizza/Donut:** Device types (mobile/tablet/desktop)
- **Pizza/Donut:** Browsers
- **Pizza/Donut:** Operating Systems
- **Tabela:** Top referrers com %
- **Tabela:** Languages
- **Tabela:** Device models mais comuns

**Layout:**
- Grid responsivo: 2 colunas em desktop, 1 em mobile
- Cards com skeleton loading
- Tabs para agrupar: Visao Geral | Localizacao | Tecnologia | Referrers

**Verificacao:**
- Todos os graficos renderizam com dados reais
- Filtros de tempo atualizam todos os graficos
- Layout responsivo funciona

### Tarefa 3.3: KPI Cards e Download CSV

**Objetivo:** Cards de metricas principais + botao de download.

**KPIs:**
- Total de cliques
- Visitantes unicos
- Clicks hoje
- Clicks esta semana
- Taxa de conversao (clicks / visitantes unicos)
- Top pais
- Top referrer

**Download CSV:**
- Botao no header do analytics
- Dropdown: "Exportar dados deste link" | "Exportar todos os links"
- Aplica filtros de data atuais

**Verificacao:**
- KPIs atualizam com filtros
- Download gera CSV correto

---

## Plano 04: Link Management UI

**Onda:** 3  
**Dependencias:** Plano 02  
**Arquivos:** `src/app/[locale]/(dashboard)/links/page.tsx`, `src/components/link-card.tsx`, `src/components/link-filters.tsx`, `src/components/folder-*.tsx`, `src/components/tag-*.tsx`

### Tarefa 4.1: Filtros e Ordenacao na Lista

**Objetivo:** Adicionar controles de filtro e ordenacao na pagina de links.

**UI:**
- Dropdown de ordenacao: A-Z, Z-A, Mais novos, Mais antigos, Mais cliques, Mais visitantes
- Filtro de status: Todos, Ativos, Inativos, Expirados, Agendados
- Filtro de pasta: dropdown com folders do usuario
- Filtro de tags: multi-select com chips coloridos
- Search existente mantido

**Implementacao:**
- State management com URL params (`?sort=clicks_desc&folder=xxx&tag=yyy`)
- Sync com API: `GET /api/links?sort=...&folderId=...`

**Verificacao:**
- Filtros combinados funcionam
- URL params sincronizam com UI
- Ordenacao correta

### Tarefa 4.2: Pastas (Folders)

**Objetivo:** Sistema de pastas para organizar links.

**UI:**
- Sidebar lateral na pagina de links com lista de pastas
- Cada pasta mostra: nome, cor (bolinha), quantidade de links
- "Sem pasta" como categoria default
- Botao "Nova pasta" com modal (nome + seletor de cor)
- Drag-and-drop de links para pastas (opcional v1: dropdown mover)
- Context menu na pasta: renomear, mudar cor, excluir

**Componentes:**
- `FolderSidebar`
- `FolderCreateDialog`
- `FolderEditDialog`
- `MoveToFolderDropdown` (no card de link)

**Verificacao:**
- Criar pasta funciona
- Mover link para pasta funciona
- Excluir pasta desassocia links

### Tarefa 4.3: Tags com Cores

**Objetivo:** Sistema de tags coloridas para links.

**UI:**
- No form de criar/editar link: multi-select de tags com criacao inline
- Tags renderizadas como chips coloridos no card de link
- Filtro por tag na sidebar (toggle chips)
- Gerenciamento de tags: pagina/modal para criar, renomear, mudar cor, excluir

**Cores pre-definidas:**
- Vermelho, Laranja, Amarelo, Verde, Azul, Indigo, Violeta, Rosa, Cinza

**Componentes:**
- `TagManager`
- `TagSelect` (multi-select com criacao)
- `TagChip`

**Verificacao:**
- Criar tag ao criar link funciona
- Filtro por tag funciona
- Cores renderizam corretamente

### Tarefa 4.4: Link Card Aprimorado

**Objetivo:** Atualizar o card de link com novas informacoes e acoes.

**Novas informacoes no card:**
- Data de criacao (formatada)
- Numero de cliques + visitantes unicos
- Pasta (com cor)
- Tags (chips coloridos)
- Status visual melhorado

**Acoes:**
- Copiar link original
- Copiar link encurtado (ja existe)
- Ver QR Code (modal)
- Editar
- Excluir
- Ver estatisticas avancadas
- Mover para pasta

**Verificacao:**
- Card mostra todas as informacoes
- Acoes funcionam

---

## Plano 05: Create Link e Settings

**Onda:** 4  
**Dependencias:** Plano 01, Plano 04  
**Arquivos:** `src/app/[locale]/(dashboard)/links/new/page.tsx`, `src/app/[locale]/(dashboard)/links/[id]/edit/page.tsx`, `src/app/[locale]/(dashboard)/settings/page.tsx`

### Tarefa 5.1: Open Graph Preview

**Objetivo:** Adicionar campos de Open Graph ao criar/editar link.

**Campos novos no form:**
- Titulo externo (og:title) — opcional, fallback para titulo interno
- Descricao externa (og:description) — opcional
- Imagem OG (og:image) — upload URL ou selecionar da media library
- Preview ao vivo do card de compartilhamento (simulacao)

**Comportamento do redirect `/l/[slug]`:**
- Se ogTitle/ogDescription/ogImageUrl existirem, renderizar HTML com meta tags OG
- Se nao, redirect 302 direto (comportamento atual)
- Pagina intermedia com: preview image, titulo, descricao, botao "Continuar"

**Verificacao:**
- Compartilhar no WhatsApp/Telegram mostra preview
- Fallback funciona quando nao ha OG

### Tarefa 5.2: URL de Redirecionamento para Expirados

**Objetivo:** Permitir configurar URL de fallback quando link expira.

**Campos no form:**
- "URL de redirecionamento quando expirado" — opcional
- Se preenchido: ao inves de mostrar erro 410, redirect para essa URL

**Comportamento do redirect:**
- Link expirado + expiredRedirectUrl = redirect 302 para URL
- Link expirado + sem expiredRedirectUrl = erro 410 (atual)
- Link expirado + settings.defaultExpiredRedirectUrl = redirect para default

**Verificacao:**
- Link expirado redireciona para URL configurada
- Fallback para settings funciona

### Tarefa 5.3: Settings do Usuario

**Objetivo:** Criar pagina/secao de configuracoes do link shortener.

**Campos:**
- URL default de redirecionamento para links expirados
- URL de redirecionamento para links nao encontrados (not found)

**Local:**
- Nova aba "Links" na pagina de Settings do dashboard
- Ou secao dentro da pagina Settings existente

**Comportamento:**
- Not found: se configurado, redirect 302 ao inves de erro 404
- Expirado: se link nao tem URL propria, usa default do usuario

**Verificacao:**
- Settings salvam no banco
- Redirects funcionam conforme configurado

---

## Plano 06: i18n, Testes e Finalizacao

**Onda:** 5  
**Dependencias:** Planos 01-05  
**Arquivos:** `messages/*.json`, `e2e/`, `src/**/*.test.ts`

### Tarefa 6.1: i18n Completo

**Objetivo:** Todas as strings novas em pt-BR, en, es.

**Arquivos:**
- `messages/pt-BR.json` — secao `links`, `linkAnalytics`, `folders`, `tags`, `linkSettings`
- `messages/en.json` — mesmas chaves
- `messages/es.json` — mesmas chaves

**Chaves necessarias:**
- Folders: title, create, name, color, delete, empty, moveTo
- Tags: title, create, name, color, delete, addTag
- LinkSettings: title, defaultExpiredRedirect, notFoundRedirect, save
- Analytics: filtros 24h, 1week, 1month, 1year, custom, downloadCSV
- OG: externalTitle, externalDescription, externalImage, preview

**Verificacao:**
- `npm run build` passa
- Nenhuma string hardcoded nas novas telas

### Tarefa 6.2: Testes E2E

**Objetivo:** Cobrir fluxos criticos com Playwright.

**Cenarios:**
1. Criar link com OG preview → verificar meta tags
2. Link expirado com redirect → verificar redirect
3. Link not found com redirect global → verificar redirect
4. Export CSV → verificar download
5. Criar pasta → mover link → filtrar por pasta
6. Analytics: mudar filtros de tempo → verificar graficos

**Verificacao:**
- `npx playwright test` passa

### Tarefa 6.3: Build e Migracao

**Objetivo:** Gerar migracao e verificar build.

**Passos:**
1. `npm run db:generate` — gerar migracao 0003
2. `npm run db:push` — aplicar no Neon
3. `npm run build` — verificar build
4. `npx tsc --noEmit` — verificar TypeScript
5. `npm test` — rodar testes unitarios

**Verificacao:**
- Build passa sem erros
- TypeScript sem erros
- Testes passam

---

## Dependencias Externas

| Pacote | Versao | Para |
|--------|--------|------|
| `ua-parser-js` | ^1.0.37 | Parser avancado de User-Agent |
| `react-simple-maps` | ^3.0.0 | Mapa de acessos |
| `d3-geo` | ^3.1.0 | Dependencia do react-simple-maps |
| `date-fns` | ja existe | Manipulacao de datas |

---

## Modelo de Dados Final

```
user
  |- shortLinks
  |    |- linkClicks (1:N)
  |    |- linkDeviceRules (1:N)
  |    |- shortLinkTags (N:M) -> linkTags
  |    |- folderId -> linkFolders
  |
  |- linkFolders (1:N)
  |- linkTags (1:N)
  |- customDomains (1:N)
  |- userSettings (1:1)
```

---

## Checklist de Entrega

- [ ] Schema expandido com migracao aplicada
- [ ] Click tracker extrai device model, OS version, browser version, language, fingerprint
- [ ] API de analytics retorna todos os dados agregados
- [ ] Mapa colorido de acessos funcional
- [ ] Graficos de historico com todos os filtros de tempo
- [ ] KPI cards com visitantes unicos
- [ ] Download CSV funcional
- [ ] Filtros e ordenacao na lista de links
- [ ] Sistema de pastas com cores
- [ ] Sistema de tags com cores
- [ ] Link card aprimorado
- [ ] Open Graph preview
- [ ] URL de redirect para expirados (por link e global)
- [ ] URL de redirect para not found
- [ ] i18n completo (pt-BR, en, es)
- [ ] Testes E2E passando
- [ ] Build e TypeScript sem erros

---

## Proximos Passos

1. **Revisar este planejamento** — confirmar escopo e prioridades
2. **Executar Plano 01** — Schema + API Foundation
3. **Executar Plano 02** — API de Links e CSV
4. **Executar Plano 03** — Analytics Dashboard
5. **Executar Plano 04** — Link Management
6. **Executar Plano 05** — Create Link + Settings
7. **Executar Plano 06** — i18n, Testes, Finalizacao
