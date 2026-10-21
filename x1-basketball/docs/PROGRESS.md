# Progresso

## Etapa 0 — concluída e verificada antes da etapa 1

- Monorepo independente, TypeScript estrito, React/Vite/Three/Fiber.
- Worker local, Durable Object SQLite e endpoints de saúde.
- Cena WebGL básica verificada em Chromium sem erros de aplicação.
- Build do cliente e dry-run do Worker aprovados.
- Ferramentas e documentação de execução, arquitetura, regras, controles, integração e custos.

## Etapa 1 — concluída e verificada localmente

- Criação, convite por link e entrada por código aleatório.
- Duas vagas com apelido; terceiro rejeitado, inclusive após desconexão.
- WebSockets reais com Durable Object autoritativo, sem bots ou jogador local substituto.
- Confirmação dos dois participantes para iniciar movimentação.
- WASD, câmera atrás de cada jogador e personagens provisórios distintos.
- Passos fixos a 20 Hz, direções normalizadas, input expirável e controle de sequência.
- Interpolação remota, previsão visual limitada e correção ao servidor.
- Pausa, limpeza de intenção, token temporário, reconexão automática e recuperação após recarga.
- Limites de tamanho/frequência, origem permitida, validação estrita e limpeza de sala abandonada.

## Não implementado / não autorizado

Etapas 2–9. Corrida, quadra regulamentada, colisões entre jogadores, orientação defensiva, bola, dribles, arremessos, pontuação, cronômetros, resultado, áudio, personalização e integração ao site principal.
O plano de renderização é provisório. Movimento pode atravessar o limite visual da área de referência; limites físicos são da etapa 2.
Teste entre computadores/redes distintos, produção Cloudflare, medição de 60 FPS, carga de 10 salas e auditoria de custos reais permanecem pendentes.

## Problemas encontrados e resolvidos

- Terminal restrito não iniciou: comandos locais executados com elevação aprovada automaticamente.
- Dependência antiga do executor de testes tinha alertas: atualização para Vitest 5.0.5; auditoria passou sem vulnerabilidades.
- Primeiro teste ocorreu antes de terminar o download do navegador: repetido após instalação.
- Chromium com renderização por software não manteve intervalos curtos previsíveis em segundo plano: testes passaram a focar o jogador e aguardar estados observáveis; cena ociosa renderiza sob demanda.
- Simulação de offline não garantiu fechamento de WebSocket existente: teste encerra o transporte real e verifica retomada automática, sem substituir servidor ou mensagens.
- Fechamento do socket precisava de resposta explícita no runtime local: corrigido e reconexão verificada.
- Confirmações na espera precisavam sobreviver à hibernação: restauração corrigida; validação de ciclo de hibernação em produção ainda pendente.

Avisos conhecidos: bundle Three/Fiber de aproximadamente 895 kB minificado (243 kB gzip); Vite pode registrar ECONNABORTED/ECONNRESET durante interrupções deliberadas dos testes. Não houve erro JavaScript da aplicação no teste de dois clientes aprovado.

## Resultado final — 21/10/2026

- `npm test`: 20 testes passaram em 2 arquivos (rodada final: 801 ms).
- `npm run build`: TypeScript, build Vite e `wrangler deploy --dry-run` passaram. Worker: 16,91 KiB, 5,20 KiB gzip.
- `npm run test:e2e`: 4 testes passaram, 54,9 s, contra Worker/workerd e Durable Objects locais.
- `npm audit`: zero vulnerabilidades reportadas.
- Capturas da tela inicial e dos dois jogadores inspecionadas visualmente em `artifacts/`.

E2E cobre: cena WebGL e endpoints Worker/DO; dois contextos isolados Chromium, controle por vaga e snapshots convergentes; rejeição do terceiro; queda real de WebSocket, reconexão automática e recarga preservando identidade; rejeição de origem, corpo excessivo, apelido inválido, manipulação de input e flood.

Testes usam o backend real local, sem mock de sala ou substituição por bots. O mecanismo de teste só captura a referência do WebSocket nativo para provocar seu fechamento; os dados continuam passando pelo Worker e DO. Isso não comprova resiliência em todas as redes reais.

Nenhum serviço publicado. Nenhuma modificação no repositório `grupobolao1-0`. A etapa 2 aguarda autorização expressa.

