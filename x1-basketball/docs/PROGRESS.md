# Progresso

## Atualização autorizada — treinamento individual (21/10/2026)

Os blocos A, B e C substituem a experiência padrão da etapa 1 pelo treino solo. O histórico abaixo registra a entrega anterior; suas pendências de quadra, bola, corrida e arremesso foram atendidas localmente nesta atualização. Nenhuma mecânica competitiva adicional foi implementada.

- **A:** entrada direta, simulação local real, um jogador, teclado e Canvas completo, sem Worker, sala, restauração de sessão ou transporte de partida. Validado antes do bloco B: tipos, 21 testes unitários e E2E de entrada/movimento sem rede de jogo.
- **B:** meia quadra 15 × 14 m, linhas, textura procedural, cesta completa a 3,05 m, alambrado e ambiente urbano discreto. Movimento com aceleração/corrida/limites e câmera relativa suave. Validado antes do bloco C: tipos, 29 testes unitários, montagem, duas resoluções, limite lateral e recuperação WebGL. A inspeção lateral revelou alambrado entre câmera e personagem; limite lateral da câmera corrigido e verificação repetida.
- **C:** bola com costuras, posse/drible, carga e soltura por Espaço, trajetória balística, colisões, cesta geométrica, R/proximidade/devolução automática, estatísticas, reinício e tela cheia. A separação do bloco A permitiu implementar sem alteração estrutural extensa nem modificação do protocolo online.
- Diagnóstico diferencia exceção JavaScript, inicialização e perda de WebGL. Erro real aparece em desenvolvimento, com remontagem da cena. E2E injeta falha de montagem somente na resposta do módulo do teste e testa perda real do contexto.
- Revisão visual ajustou a aproximação dos braços à bola e suavizou a transição de posse/drible/preparação. O relógio controlado do Playwright passou a ser instalado antes de React/Three: instalá-lo após a montagem trocava a origem temporal e tornava a atualização do HUD intermitente no teste. Uma verificação adicional observa o medidor com o relógio real do navegador.
- Infraestrutura e testes online preservados. Suíte explícita `test:e2e:multiplayer` aprovada: **4 testes**, **1,1 min**, Worker/DO e sockets reais locais. Aviso `ECONNABORTED` no proxy ocorreu durante a interrupção deliberada de conexão.

### Organização dos arquivos desta atualização

| Área | Criados / modificados |
|---|---|
| Entrada | `App.tsx`, novo `OnlineApp.tsx`, `game/TrainingGame.tsx`, `.env.example`, `styles.css`, `online.css` |
| Fontes de estado | `game/GameController.ts`, `LocalGameController.ts`, `RemoteGameController.ts` |
| Regras puras | `packages/shared/src/gameplay/{config,types,motion,camera,TrainingSimulation,possession,shooting,ballPhysics,collisions,scoring}.ts`; exports, controles e normalização compartilhada |
| Cena | `Scene`, `Court`, `Player`, `FollowCamera`, novos `Basketball`, `BasketballHoop`, `StreetEnvironment`, `Surface`, `geometry`, `GraphicsGuard` |
| Interface | `ui/TrainingHud.tsx`, `ui/SceneBoundary.tsx`, `controls/useKeyboard.ts` |
| Ferramentas/testes | `scripts/dev.mjs`, `package.json`, `vite.config.ts`, duas configurações Playwright, E2E de treino e três arquivos unitários; teste online usa baseURL da configuração |
| Documentação | README, PROGRESS, ARCHITECTURE, CONTROLS, GAME_RULES, INTEGRATION, COSTS e novo TRAINING |

`apps/server`, `GameConnection.ts`, `session.ts`, Lobby, RoomPanel e protocolo/validação de rede não foram alterados. A normalização de direção foi extraída sem mudar o cálculo online. Não houve instalação de dependências, publicação, integração ao site principal ou alteração de `grupobolao1-0`.

### Validação final da atualização

| Comando / verificação | Resultado real |
|---|---|
| `npm run typecheck` | Aprovado; também executado novamente pelo build final |
| `npm test` | **40 testes em 5 arquivos aprovados**; rodada final 4,91 s |
| `npm run build` | Cliente e Worker dry-run aprovados; nenhuma publicação |
| `npm run test:e2e` | **9 testes aprovados**, 2,7 min, após corrigir a preparação temporal dos testes |
| `npm run test:e2e:multiplayer` | **4 testes aprovados**, 1,1 min, com Worker/DO e WebSockets reais |
| `git diff --check` | Sem erros de whitespace |
| Inspeção visual | Capturas de 1366 × 768, 1920 × 1080, lateral, drible, medidor, bola em voo e cesta inspecionadas |

O E2E solo cobre entrada sem rede de partida mesmo com convite/sessão salva, movimento, limites, ausência de rolagem, recuperação de contexto e falha JavaScript, arremesso físico, cesta única, erro, R, reinício, medidor em tempo real, drible, perda de foco e Fullscreen API. Para soltar no instante preciso, o teste de trajetória controla apenas o relógio e o teclado; não altera posição, velocidade ou placar da simulação. A rodada anterior ao último ajuste tinha 8 E2E aprovados; a final inclui a nova verificação do medidor.

Build final: Three/Fiber **894,87 kB minificados / 242,78 kB gzip** (aviso de tamanho conhecido); Worker **17,28 KiB / 5,34 KiB gzip**. As capturas ficam em `artifacts/`, ignorado pelo Git. Não houve medição de desempenho em GPU física nem promessa de 60 FPS.

Limitações: física e animação simplificadas, rede estática, sem áudio/persistência, métricas de 60 FPS e teste entre máquinas físicas pendentes. Bola e pontuação ainda não migraram para autoridade online. Bundle Three/Fiber mantém aviso de tamanho; detalhes em [TRAINING.md](TRAINING.md).

### Histórico do protótipo anterior

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

