# Protótipo 3.0 — 22/10/2026

Evolução localizada sobre `42830fc` (protótipo 2.0). Treino segue como padrão; Worker, DO, GameConnection, sessões, protocolos e entrada online preservados. Sem dependências novas, cenário novo, IA, menus ou publicação.

## Diagnóstico da tabela: evidência e limite da conclusão

O centro e as dimensões da tabela já coincidiam entre mesh e caixa física: `(0, 3,45, -6,05)`, `1,8 × 1,05 × 0,075 m`. O raio da bola era 0,12 m. Portanto, adicionar outra caixa ou deslocar a existente não seria uma correção justificada.

Foram examinadas 252 combinações de posição/soltura da simulação 2.0, amostrando a posição visual a 240 Hz por três segundos. Não apareceu penetração nesses arremessos comuns. Sem a sequência exata do relato, não é possível atribuir aquela observação específica a uma causa confirmada.

Após a informação adicional do usuário — arremessos longos, com soltura cedo e no tempo certo — foi executada uma comparação isolada usando o `LocalGameController` original extraído do commit 2.0 e o atual. Foram nove posições (`x = -4, 0, 4`; `z = 1,5; 4; 6`) e três tempos de carga (0,2; 0,5; 0,792 s), totalizando **54 lançamentos**, amostrados a 240 Hz durante três segundos. Medimos a bola física e a posição interpolada: nenhuma penetração da esfera em ambas as versões. Houve oito lançamentos com contato na versão antiga e dez na nova. Dados completos em `artifacts/v3-long-shot-comparison.json`.

Na posição inicial da versão 2.0, a carga de 0,2 s cruzou o plano da tabela pelo lado, com `x ≈ -1,25 m` (a borda lateral fica em -0,90 m); a carga ideal converteu a cesta e cruzou o plano depois, com centro a aproximadamente 1,63 m de altura, abaixo do painel (borda inferior em 2,925 m). São passagens válidas ao redor do objeto, não evidência de travessia do painel. Isso não prova que sejam a causa da percepção relatada. A comparação fica separada do defeito artificial de alta velocidade demonstrado abaixo.

Defeitos demonstráveis encontrados:

1. O solver anterior limitava a subdivisão a 16 e verificava somente a posição final. Reexecutando a função do commit 2.0 com bola em `(0,5; 3,45; -5,55)`, velocidade `(0; 0; -1200)` e passo de `1/120 s`, a bola atravessou a tabela sem contato. É um **teste de estresse artificial**, não a velocidade de uma jogada normal. A mesma entrada agora rebate na frente. Registro local em `artifacts/v3-reproduction.json`.
2. O contorno das costuras visuais chegava a 0,1221 m, além do raio físico de 0,12 m. Isso permitia sobreposição visual milimétrica, sem demonstrar travessia completa. Corpo e costuras agora respeitam o envelope externo de 0,12 m.
3. O jogador recebia suavização adicional após interpolação, enquanto a bola não recebia, produzindo atraso relativo. O treino agora consulta um único estado interpolado para corpo e bola; mãos são resolvidas em relação à posição amostrada da bola.

Correção: `boardCollision.ts` mede a distância exata até a caixa e avança conservadoramente a esfera pelo segmento. A normal é obtida na superfície, incluindo cantos arredondados pelo raio. O solver aplica restituição 0,7 no instante do impacto e integra o tempo restante com a velocidade refletida. Mantém correção de penetração e limita também posse e interpolação. Não muda a posição da tabela nem transforma impacto em cesta.

Validação cobre frente, trás, lateral, canto, alta velocidade, 15/30/60/144 Hz, penetração inicial, passagem rasante que não deve colidir, quique na tabela seguido de cesta e de erro. No navegador, há impacto instrumentado e uma bandeja iniciada por WASD/E que toca a tabela e entra: a física real registra o contato antes da cesta, sem fixture de resultado.

## Locomoção e rig

`locomotion.ts` separa `idle`, `walk`, `run`, `strafe`, `backpedal`, `stop` e `pivot`. A direção é decomposta nos eixos do corpo; ciclo depende da distância percorrida. Pés têm fases de apoio no mundo e balanço, com reposicionamento de segurança no limite do alcance. Frenagem decai a pose, em vez de congelar membros. Tronco reage à aceleração e inversão, quadril torce discretamente e joelhos flexionam.

`Player.tsx` tornou-se a entrada pequena para `PlayerRig.tsx`. O rig tem dois segmentos por membro, cotovelos/joelhos e alvos de mãos/pés. Crouch e retorno da pose têm suavização; a raiz acompanha a fonte de estado sem atraso adicional em relação à bola. Não é captura de movimento nem um sistema completo de contato pé/solo.

## Finalizações e regras de transição

| Ação | Seleção e comportamento |
|---|---|
| Espaço | Mantém carga e precisão. Soltar inicia a extensão; a bola é liberada depois de 0,18 s. A curta distância usa arco e gesto curtos. |
| E parado/próximo | Arremesso curto até 2,2 m; salto baixo e arco proporcional à cesta. |
| E em aproximação | Bandeja até 3,1 m, velocidade ≥1,2 m/s e direção voltada ao aro. Mão acompanha o lado; aproximação lateral pode usar a tabela. |
| E correndo | Enterrada entre 0,65–2,35 m, velocidade ≥4,5 m/s, alinhamento de aproximação ≥0,82, orientação do corpo dentro de 0,5 rad, faixa lateral de 1,3 m e entrada pela frente. |
| F | Pump fake de 0,64 s, elevação parcial, hesitação discreta de ombros e retorno com posse. Intervalo adicional de 0,24 s impede repetição quebrada. |

As ações têm fases de preparação, execução, soltura, aterrissagem e recuperação. A altura corporal usa gravidade; a enterrada chega a 1,18 m de salto e solta a bola acima do aro, com velocidade descendente. A mão conduz a esfera continuamente, sem colocá-la instantaneamente dentro do aro. A pontuação só ocorre no sensor descendente já existente.

A regressão completa revelou uma faixa de arremessos curtos em que a bola atingia a face inferior do aro durante a subida. O ponto de soltura agora se adapta: a menos de 0,5 m do centro, a mão conduz a bola sob o centro; entre 0,5 e 1,1 m, solta pelo lado externo. A preparação continua interpolada, e a física livre não é alterada depois da soltura. Um teste permanente percorre 25 posições, verificando continuidade, ausência desse impacto indevido e cesta física única. O resultado posterior à correção está em `artifacts/v3-short-sweep.json`.

E avalia contexto antes de iniciar. Falha de elegibilidade pode resultar em bandeja/curto; longe demais exibe orientação para aproximar-se. E/F durante carga ou ação são ignorados. Uma ação não cria outra bola. R aguarda a ação terminar; proximidade e devolução automática também aguardam. Reiniciar zera ação, altura, carga, intenção e recuperação agendada. Perda de foco cancela carga, mas não interrompe artificialmente um salto comprometido.

## Precisão e câmera

Saiu a alternância artificial por paridade da tentativa. Xorshift32 tem seed no estado da simulação e é avançado apenas em solturas válidas. Timing, distância, velocidade, orientação e multiplicadores por finalização produzem desvio no alvo físico. A faixa verde reduz a sensibilidade ao timing; excelente não significa cesta automática. Segurar além do limite mantém o medidor em 100% e permite soltar normalmente.

Para tabela, a trajetória usa uma solução balística com distância refletida corrigida pela restituição. O impacto continua sendo executado pelo solver; a solução não concede pontos nem muda a bola após o lançamento.

A câmera mantém sua perspectiva e referência de WASD. Acrescenta apenas 35% da elevação corporal à altura e ao alvo vertical, usando a suavização existente; retorna junto da aterrissagem, sem cortes.

## Depuração local

`?physics=1` mostra volume da tabela, esfera física, rastro, normal e último contato. Cenários adicionais: `scenario=board-front`, `board-back`, `board-side`, `board-corner`, `board-fast`. Só são carregados em desenvolvimento. Nenhum cenário altera o resultado da física. O acesso de testes normal continua sendo apenas leitura; E2E das finalizações usa teclado, sem teleportar ou conceder pontos.

## Arquivos

- Regras modificadas: `TrainingSimulation.ts`, `motion.ts`, `possession.ts`, `shooting.ts`, `ballPhysics.ts`, `collisions.ts`, `types.ts`, `gameplay/config.ts`, controles compartilhados e exports.
- Regras novas: `actions.ts`, `locomotion.ts`, `boardCollision.ts`, `random.ts`.
- Cliente modificado: `LocalGameController`, `TrainingGame`, `Player`, `Basketball`, `FollowCamera`, `Scene`, `TrainingHud`, `useKeyboard`.
- Cliente novo: `PlayerRig`, `PhysicsDebug`, `debugScenarios`.
- Testes novos: `actions.test.ts`, `board-collision.test.ts`, `locomotion.test.ts`, `finishes.spec.ts`, `physics.spec.ts`, `locomotion.spec.ts`. O helper do teste anterior de arremesso agora aguarda a extensão antes de esperar voo; verificações de cesta/erro continuam. Capturas de resolução receberam prefixo v3.
- Configuração online: `playwright.multiplayer.config.ts` aguarda `/api/health`, garantindo que o Worker esteja pronto antes do primeiro teste.
- Documentação: README, CONTROLS, TRAINING, ARCHITECTURE, PROGRESS e este documento.

## Validação e evidências

Tipos e build aprovados; **71 testes unitários** (8 arquivos, 1,78 s), **16 E2E solo** (6,6 min) e **4 E2E multiplayer** (1,4 min). `git diff --check` sem erros. O build do Worker foi somente dry-run. A rodada solo final inclui o ajuste de soltura curta e os dois casos de longa distância solicitados pelo usuário.

Capturas locais em `artifacts/`: `v3-quadra-1920.png`, `v3-corrida.png`, `v3-lateral.png`, `v3-enterrada-impulsao.png`, `v3-enterrada-elevacao.png`, `v3-enterrada-soltura.png`, `v3-enterrada-aterrissagem.png`, `v3-bandeja-preparacao.png`, `v3-bandeja-tabela.png`, `v3-finta.png`, `v3-arremesso-curto.png`, `v3-longo-cedo.png` e `v3-longo-ideal.png`. Capturas e dados de diagnóstico são ignorados pelo Git.

## Limitações

Rig e contatos são aproximações procedurais. Rede estática; sem agarrar o aro, contato de dedos, defesa ou colisão completa corpo/tabela. O poste fica fora da área acessível ao jogador e enterradas por trás são rejeitadas. Aro e piso continuam com subpassos discretos; CCD foi adicionado à tabela. O sensor de cesta é conservador para rolamentos no aro. Ainda não há medição em GPU física ou garantia de 60 FPS. A sequência exata do relato original da tabela permanece não identificada; os casos reproduzidos e as jogadas descritas acima foram verificados separadamente.
