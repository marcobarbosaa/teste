# Arquitetura

Monorepo npm: `apps/client` (React 19, Vite 7, Three.js e Fiber 9), `apps/server` (Worker + Durable Objects SQLite), `packages/shared` (protocolo, validação e matemática pura), `docs` (decisões).

Apenas o navegador importa Three/Fiber. O servidor usa APIs Web e Cloudflare, sem DOM, React ou motor físico. Um objeto por sala serializa os comandos dos dois participantes e é autoridade da simulação. Renderização e transporte não decidem regras. Frequência inicial: 20 Hz, a ser medida. Não haverá simulação contínua em salas aguardando.

Compatibilidade: [Fiber 9 e React 19](https://r3f.docs.pmnd.rs/getting-started/installation), [Vite](https://vite.dev/guide/), [DO WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/). Verificado em 21/10/2026; versões exatas no lockfile.

Etapas 0 e 1 concluídas. A atualização de treino individual acrescenta movimento, bola, aro, colisões e contagem de cestas localmente. O online mantém seu protocolo e simulação anteriores.

## Entrada padrão de treino

`App` escolhe `TrainingGame` ou carrega `OnlineApp` sob `VITE_ENABLE_MULTIPLAYER=true`. A primeira entrada não lê sessão nem abre transporte. A cena e o teclado dependem de `GameController`; `LocalGameController` executa a simulação pura em passo fixo de 1/120 s, enquanto `RemoteGameController` adapta `GameConnection` sem mudar sua autenticação ou snapshots.

`packages/shared/src/gameplay` separa movimento, câmera, posse, lançamento, física, colisões, sensor geométrico e orquestração. A normalização de direção é compartilhada com o movimento online. Dimensões físicas e visuais usam as mesmas constantes. Three e React não entram nas regras; a cena consulta posições interpoladas, e apenas o HUD recebe snapshots React a 20 Hz. Detalhes em [TRAINING.md](TRAINING.md).

## Implementação da etapa 1

- `src/index.ts`: rotas HTTP, origem permitida, leitura limitada do corpo e limites básicos por IP/isolate.
- `src/room.ts`: adapter Cloudflare, Hibernation API, armazenamento de sessão e ciclo autoritativo.
- `src/simulation.ts`: regras de entrada, presença, pausa e movimento, sem dependência do runtime Cloudflare.
- `src/security.ts`: geração criptográfica e limite de mensagens por conexão.
- `packages/shared`: protocolo discriminado, validação em tempo de execução e movimento determinístico.
- Cliente: `network`, `controls`, `scene` e `ui` independentes. Posições não passam pelo estado React a cada tick; `useFrame` consulta os snapshots.

Fluxo: POST `/api/rooms` reserva p1, devolvendo código aleatório (48 bits) e token (256 bits). GET `/api/rooms/:code/socket` abre transporte; primeiro frame `hello` autentica a vaga ou ocupa p2. O token nunca vai na URL, convite ou snapshot. Somente `hello`/resposta privada e armazenamento de sessão o carregam. `sessionStorage` permite atualizar a mesma aba; sair apaga a credencial local. Apelido não é identidade autenticada.

Dois `ready` liberam movimento. Cada socket só envia direção e sequência para sua própria vaga. Servidor normaliza diagonal, limita frequência (40 mensagens/s), executa um passo de 50 ms por tick e expira intenção após 250 ms sem renovação. Timestamp/duração/posição/pontuação enviados pelo cliente não são aceitos. Há proteção numérica de coordenadas em ±50; não é limite físico da quadra (etapa 2).

Renderização: interpolação remota com atraso de 100 ms. Jogador local usa extrapolação visual limitada a 100 ms e correção suave ao último snapshot; ainda não implementa replay completo de inputs/rollback. Câmera fixa na orientação -Z atrás de cada personagem, sem mouse. Modelos são cápsulas/esferas provisórias. Cena estática usa renderização sob demanda; durante movimento o loop visual é independente dos 20 Hz da rede.

Desconectar pausa a sessão, zera intenções e confirmações; ambos confirmam novamente. Vaga fica reservada ao token, inclusive se um terceiro souber o código. Sessão/sala expira em 30 min; sala sem participantes conectados é removida por alarme (até aproximadamente 60 s). Reconexão automática tenta cinco vezes com espera progressiva. Falhas de protocolo não provocam repetição infinita.

Enquanto aguardando não há loop de simulação. Um alarme a cada 30 s verifica presença/expiração; handshake incompleto tem prazo de 10 s. Pings a cada 5 s atualizam presença; ausência de resposta por 20 s fecha a conexão no servidor (verificação pelo tick ativo ou pelo alarme ocioso). Hibernação restaura metadados de SQLite e identifica conexões por attachments. Confirmação de um único participante é preservada. Se o runtime reiniciar uma sessão ativa, ela volta à espera e às posições do último checkpoint de transição; ambos devem confirmar. Não prometemos continuidade de partidas em deploys nesta etapa. Não existe resultado a persistir ainda.

Persistência só nas transições de entrada, confirmação e desconexão, nunca em cada frame. `setInterval` ativo impede hibernação. Sob saturação, a simulação desacelera em vez de executar um grande salto; medir e refinar antes de implementar relógios competitivos.

Limites do online: antispam de criação é local por isolate, não distribuído. Produção pública exige revisão da proteção de borda e orçamento. Não há ranking, contas, bola ou pontuação online. Bola e estatísticas locais não são resultados competitivos. Nenhuma biblioteca de física foi adotada.

Riscos: atraso de rede exige interpolação/predição; JavaScript de DO não é servidor de física pesada; timers impedem hibernação; reinício do runtime não pode inventar resultados; sessão de convidado é credencial portadora; implantação pública precisará controles adicionais de abuso e orçamento.

