# Treinamento individual

Atualizado pelo [protótipo 3.0](PROTOTYPE_3.md): estados de locomoção e ação separados; rig articulado; E para finalizar; F para fintar; soltura após preparação; varredura contínua da tabela e dispersão com seed explícita.

## Fluxo e fontes de estado

`App.tsx` não abre sockets. Com flag ausente ou diferente de `true`, monta `TrainingGame`, um único controlador local e p1. Só a entrada `OnlineApp` importa sessão, Lobby e GameConnection. Links de convite e sessionStorage não mudam a escolha. O WebSocket do HMR do Vite é ferramenta de desenvolvimento, não conexão de partida.

`GameController` fornece consulta visual, movimento, comandos, avanço e referência da câmera. `RemoteGameController` conserva a semântica online anterior. `LocalGameController` acumula tempo, executa passos de 1/120 s, interpola posições para a cena e publica uma visão compacta da HUD a 20 Hz. Renderização não decide acertos. O modo de teste expõe somente cópia de leitura do estado sob `VITE_TEST_MODE=true`, sem comandos secretos para conceder cesta ou teleportar.

## Movimento e câmera

Meia quadra 15 × 14 m; aro a 3,05 m. `config.ts` de gameplay centraliza quadra, cesta, bola, velocidade, aceleração e câmera. A direção diagonal reutiliza a normalização do movimento online. Inputs são relativos à orientação visual da câmera; corpo aponta suavemente para a cesta. Corrida: 6 m/s; caminhada: 3,8 m/s. Preparar arremesso reduz a velocidade. O raio do jogador fica dentro dos limites, mantendo-o afastado do suporte atrás da linha de fundo.

A câmera combina posição do jogador e cesta, suaviza yaw e deslocamento e limita a posição lateral a ±8,35 m, antes do alambrado em ±9 m. Distância, altura, alvo vertical (inclinação), FOV e suavização são configuráveis. Testes projetam jogador e aro em seis extremos/posições representativas; navegador verifica também deslocamento até a lateral.

## Bola e arremesso

- `possession.ts`: posse real, altura de drible sincronizada com a velocidade e chão mínimo. Inicia o drible no alto e suaviza o retorno à mão/preparação. Bola em posse tem trajetória prescrita, sem dinâmica de mão completa.
- `shooting.ts`: resolve velocidade balística até a altura do aro na descida, com arco reduzido para finalizações próximas e solução de reflexão para bandeja na tabela. Timing, distância, velocidade, orientação e tipo alteram o alvo físico. Dispersão determinística pelo estado de `random.ts`, sem sorteio de acerto nem alternância por tentativa. Medidor vai de 0 a 1 em 1,1 s; ponto ideal 0,72, faixa verde ±0,07; feedback de soltura muito cedo/boa/excelente/muito tarde.
- `ballPhysics.ts`: gravidade 9,81 m/s², integração parabólica, subpassos por distância percorrida e atrito no chão. O solver não aplica resistência do ar, compatível com a solução do lançamento.
- `boardCollision.ts` + `collisions.ts`: varredura conservadora esfera/caixa, incluindo faces, arestas e cantos; impulso no instante do impacto e continuação do tempo restante. Toro do aro, piso, poste e cercas mantêm subpassos/contato discreto. Posição em posse e interpolação também são limitadas pela caixa. Dimensões físicas e visuais são compartilhadas, inclusive o contorno externo das costuras da bola.
- `scoring.ts`: registra entrada acima do aro e saída abaixo dele, na descida, com folga suficiente para o raio da bola. Um `shotId` só pode marcar uma vez. Proximidade, subida e entrada lateral não contam. Um toque no aro invalida a travessia em curso, que precisa recomeçar por cima.
- `TrainingSimulation.ts`: orquestra estados `held`, `dribbling`, `flight`, `loose`, carga, soltura, contatos, estatísticas e recuperação. Comandos não decidem pontuação.
- `actions.ts`: seleção contextual, preparação, execução, soltura, aterrissagem e recuperação. Salto balístico do corpo e condução contínua da bola até a mão de finalização. Bloqueia sobreposição de ações e segunda bola.
- `locomotion.ts`: caminhada/corrida/lateral/recuo/frenagem/pivô, apoio e balanço dos pés, inclinação e torção. `PlayerRig` resolve joelhos e cotovelos por cinemática inversa e usa a mesma bola interpolada do renderizador.

R recoloca a bola na posse, aguardando terminar uma ação em andamento; recuperação por proximidade exige bola livre e baixa. Retorno automático após 10 s evita treino preso. Reiniciar limpa estatísticas e reposiciona jogador. Perda de foco cancela a carga sem tentativa e zera movimento; uma ação já comprometida termina. Segurar além da faixa verde termina no máximo do medidor, produzindo soltura tardia sem travar.

## Visual e diagnóstico

Quadra, cesta, bola, ambiente, câmera e personagem são componentes separados. Textura sutil do piso é gerada localmente; sem modelos, fontes ou imagens externos. O medidor e ajuda ficam abaixo do jogador; não cobrem o aro. Fullscreen API trata indisponibilidade/rejeição. Sem som nesta versão, portanto não há botão de silenciar sem função.

`SceneBoundary` diferencia falha de montagem, criação de contexto e perda de contexto. Registra exceção e stack de componente em desenvolvimento e permite remontar o Canvas. `GraphicsGuard` detecta perda real do contexto; o E2E provoca a perda via extensão WebGL e verifica recuperação.

## Limites desta versão

Física simplificada e determinística para treino, sem solver profissional, deformação da rede, colisão de membros, contato detalhado do braço do suporte ou spin aerodinâmico. O sensor conservador pode rejeitar rolamentos limítrofes no aro. Animações são procedurais, sem captura de movimento. Cercas são barreiras simplificadas abaixo de 2,7 m; a devolução cobre bolas fora de alcance. Não há persistência, áudio, defesa, IA, relógio de posse ou partida competitiva. A simulação online antiga ainda não executa estas regras; a extração pura prepara sua migração futura sem alterar o protocolo agora.

Capturas verificáveis são geradas pelos testes em `artifacts/treino-1366.png`, `treino-1920.png`, `treino-lateral.png`, `treino-drible.png`, `treino-medidor.png`, `treino-arremesso.png` e `treino-cesta.png`.
