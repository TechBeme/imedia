## Arquitetura geral

### Framework e runtime

* **Next.js + React**
  * Estrutura base do app web: páginas/rotas, renderização (SSR/SPA), componentes, build e deploy.

* **TypeScript**
  * Tipagem de UI, rotas, requests e respostas.

### UI / Design System

* **shadcn/ui (prioridade máxima)**
  * **ALWAYS try to use the shadcn/ui library.**
  * Use componentes prontos após importar/adicionar.
  * **Não editar** arquivos de componentes do shadcn/ui: se precisar alterar comportamento/estilo de forma mais profunda, crie **novos componentes wrapper/composição**.

* **Radix UI (quando necessário)**
  * Utilize apenas se o shadcn não possui algum componente já pronto que o usuário precise.

* **Ícones react-icons**
  * Bibliotecas de ícones prontas para compor a interface e melhorar a comunicação visual.

* **Tailwind CSS**
  * **Sempre usar Tailwind CSS** para estilizar componentes.
  * Utilize classes extensivamente para layout, spacing, tipografia, cores e responsividade.
  * **ALWAYS generate responsive designs.**
    (mobile-first, grids flexíveis, breakpoints consistentes)

* **recharts**
  * Biblioteca disponível para gráficos e dashboards (linhas, barras, pizza, área etc.).
  * Preferir componentes simples e legíveis.

### Animações e microinterações

* **Motion**
  * Biblioteca para criar animações e transições em componentes, melhorando a experiência (entradas/saídas, estados, motion UI).

* **Tailwind animations**
  * Conjunto de animações utilitárias para efeitos rápidos e padronizados (ex.: fade, slide, pulse) diretamente nas classes.

### Formulários e validação

* **React Hook Form**
  * Camada para controlar formulários (estado, validação, submit, erros) com performance e integração fácil com inputs.

* **Zod (schema validation)**
  * Regras de validação e parse de dados via schemas, garantindo consistência de dados recebidos (formulários e payloads de API).

* **date-fns**
  * Funções para lidar com datas no app (formatar, comparar, somar/subtrair períodos) de forma simples e reutilizável.

### Dados, auth e backend

* **better-auth**
  * autenticação de usuários.

* **Neon**
  * Banco de dados pronto para o app: acesso ao banco (Postgres), centralizando a parte de dados e identidade.

* **Drizzle ORM**
  * Camada de acesso a dados padrão do projeto para interagir com Postgres de forma tipada e previsível.
  * Deve ser utilizado como ORM principal em integrações com Postgres.
  * Preferir queries e modelagem de schema via Drizzle, mantendo tipagem forte, simplicidade e boa integração com TypeScript/Next.js.
  * Evitar abstrações desnecessárias: usar Drizzle de forma direta, com foco em clareza, manutenção e controle sobre o SQL.

### i18n (Internacionalização)
  * O produto deve ser projetado desde o início para **sempre usar i18n em qualquer parte do site** (UI, páginas, componentes, validações, notificações, textos de email se existirem, placeholders, labels, etc.). Idiomas suportados (inicial)
  * **pt-BR** (padrão)
  * **en**
  * **es**
  
### Pagamentos

* **Stripe**
  * Infra de pagamentos e assinaturas: checkout, cobrança recorrente e eventos (webhooks) para sincronizar o status de pagamento com o seu sistema.

### IA

* **Vercel AI SDK** (`ai`)
  * Camada para integrar experiências de IA no app (chat, geração, streaming de respostas), conectando UI e endpoints de forma mais direta.


### Erros e mensagens vindas de API (regra crítica)

**APIs NUNCA devem retornar mensagens de erro localizadas.**
As APIs devem retornar **códigos de erro estáveis** (machine-readable), e o frontend traduz conforme o locale do usuário.


## Regras de implementação (importantes)

* **Do not hesitate to extensively use console logs** para acompanhar fluxo e facilitar debugging (principalmente durante desenvolvimento).
* **DO NOT OVERENGINEER THE CODE.** Manter simples e elegante: implementar o mínimo necessário para cumprir o pedido.
* **DON'T DO MORE THAN WHAT THE USER ASKS FOR.** Evitar escopo extra, abstrações prematuras e “infra” desnecessária.