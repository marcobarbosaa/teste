# X1 Basketball

Treino individual de basquete 3D no navegador. Abre diretamente em uma meia quadra de rua, com personagem, drible, arremesso, colisões e estatísticas. A base multiplayer com Cloudflare Durable Objects permanece disponível em uma entrada opcional.

**Protótipo 3.0:** locomoção com apoio dos pés, joelhos/cotovelos articulados, arremesso curto, bandeja, enterrada contextual e finta. A soltura acompanha as fases da ação, e a tabela usa varredura contínua da bola. [Diagnóstico, parâmetros e validação](docs/PROTOTYPE_3.md).

## Executar no VSCode

Abra a pasta `x1-basketball` no VSCode. Use Node.js 22.12+ (validado com Node 24) e, no terminal integrado:

```sh
npm ci
npm run dev
```

Abra **http://localhost:5173**. O comando inicia somente o Vite: o treino não precisa de conta, sala, outro jogador, internet ou Worker. Não restaura sessões nem segue convites antigos. Se já houver uma instância antiga na porta 5173, encerre aquele terminal e execute o comando novamente.

O padrão é `VITE_ENABLE_MULTIPLAYER=false`. Exemplo em `apps/client/.env.example`. Variáveis `VITE_*` são públicas e resolvidas na inicialização/build. `npm run dev` fixa o padrão solo; `dev:multiplayer` habilita explicitamente o online. Para usar `.env.local` diretamente, execute `npm run dev:client`.

| Controle | Treino |
|---|---|
| WASD | Movimento relativo à câmera |
| Shift + WASD | Corrida e drible mais rápido |
| Espaço | Segure e solte próximo do centro verde para arremessar |
| E | Finalização contextual: curta, bandeja ou enterrada |
| F | Finta de arremesso com posse, sem lançar |
| R | Recuperar a bola, mantendo as estatísticas |
| Reiniciar treino | Zerar cestas/tentativas e voltar ao início |
| Tela cheia | Entrar/sair com a Fullscreen API; Esc também sai |

A bola livre pode ser recuperada por proximidade e retorna automaticamente após 10 segundos. A zona verde melhora a trajetória; não garante pontos. A cesta exige passagem descendente completa pelo interior do aro. Estatísticas pertencem à sessão local e não são salvas após recarregar.

Para enterrar, aproxime-se correndo com Shift + W e pressione E enquanto ainda tem impulso, aproximadamente entre 0,65 e 2,35 m do aro, pela frente e bem orientado. Com aproximação moderada, E faz bandeja; próximo e parado, faz arremesso curto. F é ignorado durante carga de Espaço ou uma finalização. R durante a finalização aguarda a aterrissagem; reiniciar treino cancela tudo imediatamente.

Em desenvolvimento, `http://localhost:5173/?physics=1` mostra caixa da tabela, esfera, trajetória, normal e último contato. Acrescente `&scenario=board-front` para reproduzir um lançamento de diagnóstico (também `board-back`, `board-side`, `board-corner` e `board-fast`). O último é um estresse artificial de 1.200 m/s, não uma jogada normal. Esses recursos ficam excluídos da entrada de produção.

## Verificação

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:e2e:multiplayer
```

`build` verifica tipos, gera o cliente e empacota o Worker com `wrangler deploy --dry-run`; não publica. E2E solo inicia apenas Vite na porta 5183. E2E online inicia Vite 5184 e Worker 8887, usando WebSockets e Durable Objects reais locais. Ambos encerram os serviços que iniciaram, sem reutilizar o servidor de desenvolvimento. Capturas são geradas em `artifacts/` (ignoradas pelo Git).

## Multiplayer preservado

```sh
npm run dev:multiplayer
```

Cliente em http://localhost:5173 e Worker em http://127.0.0.1:8787/api/health. A entrada antiga reaparece somente nesse modo:

1. Informe apelido e escolha **Criar minha quadra**.
2. Abra o convite em outro navegador ou janela anônima e informe outro apelido.
3. Confirme **Estou pronto** nos dois clientes e movimente com WASD.
4. Recarregar recupera a vaga pelo token da aba; os dois confirmam novamente. Um terceiro participante é rejeitado.

O online continua no estágio de movimentação de dois jogadores. Bola, arremesso e estatísticas desta atualização existem no treino; migrá-los para a autoridade do servidor é trabalho futuro. Worker, DO, autenticação, `GameConnection`, sessões e protocolo permanecem preservados.

Código de sala: 12 caracteres hexadecimais. Não use aba duplicada com a mesma sessão como segundo jogador. **Sair** apaga o token local e não libera a vaga para terceiros; crie outra sala para trocar participantes. Tokens expiram em 30 minutos; salas vazias são removidas em aproximadamente 60 segundos.

Para dois computadores na mesma rede: copie `apps/server/.dev.vars.example` para `.dev.vars`, inclua `http://IP-DO-COMPUTADOR:5173` em `ALLOWED_ORIGINS` e reinicie `npm run dev:multiplayer`. O Vite atende na rede; o Worker fica no loopback, atrás do proxy. Use o IP no convite e permita a porta 5173 no firewall da rede escolhida. Validação entre máquinas físicas permanece pendente.

Portas alternativas em PowerShell: `$env:X1_DEV_PORT='5175'` antes de `npm run dev`. Para online, `X1_SERVER_PORT` muda a porta do Worker; `ALLOWED_ORIGINS` permite informar a lista de origens. Nenhuma implantação pública foi feita.

## Arquitetura e limites

`App` escolhe a entrada. A cena recebe `GameController`, implementado por `LocalGameController` ou `RemoteGameController`. O primeiro executa `TrainingSimulation` com passo fixo de 1/120 s; o segundo adapta os snapshots e comandos do `GameConnection`. Movimento, trajetória, colisões e sensor de cesta são funções TypeScript em `packages/shared/src/gameplay`, sem React, Three ou rede. A HUD recebe apenas estatísticas a 20 Hz.

Geometria procedural leve; rede da cesta estática, animações simples, colisão da bola aproximada por esfera/toro/caixa e subpassos. Sem áudio, adversário, regras competitivas, persistência ou integração ao site principal. Em máquinas muito lentas o acumulador limita o avanço para evitar saltos. Testes Chromium usam WebGL por software e não comprovam 60 FPS em hardware real.

Falha na cena mostra uma opção de remontagem. Em desenvolvimento, **Detalhes do erro** e o console apresentam a exceção real. Perda de contexto WebGL é diferenciada de falha JavaScript; a aplicação não atribui automaticamente qualquer erro à aceleração gráfica. O bundle Three/Fiber ainda gera aviso de tamanho no build.

[Arquitetura](docs/ARCHITECTURE.md) · [Treinamento e física](docs/TRAINING.md) · [Regras](docs/GAME_RULES.md) · [Controles](docs/CONTROLS.md) · [Progresso](docs/PROGRESS.md) · [Integração](docs/INTEGRATION.md) · [Custos](docs/COSTS.md)

