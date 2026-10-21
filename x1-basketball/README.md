# X1 Basketball

Projeto independente em TypeScript. Desenvolvimento incremental; etapas 0 e 1 autorizadas. Nenhuma alteração no site principal.

## Execução local

Node.js 22.12+ (testado com Node 24) e npm. No VSCode, abra esta pasta e execute:

```sh
npm install
npm run build
npm run dev
```

Cliente: http://localhost:5173. Worker: http://127.0.0.1:8787/api/health.
O Vite encaminha `/api` e WebSockets para o Worker local (workerd/SQLite), sem conta Cloudflare.

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

`build` inclui empacotamento do Worker em dry-run; não publica infraestrutura.

## Testar com dois jogadores

1. Execute os comandos acima na pasta `x1-basketball` (não no diretório pai).
2. Abra `http://localhost:5173`, informe seu apelido e clique em **Criar minha quadra**.
3. Em outro navegador ou janela anônima, abra o convite ou escolha **Entrar com código**.
4. Informe outro apelido. Clique em **Estou pronto** nos dois clientes.
5. Use **WASD**. Cada navegador controla apenas sua própria vaga; a câmera fica atrás do personagem local.
6. Atualize um cliente. Ele recupera a vaga pelo token da mesma aba; ambos confirmam novamente.
7. Abra um terceiro navegador e tente entrar: a sala deve rejeitar. Apelido igual não permite assumir vaga.

O código possui 12 caracteres hexadecimais. Não use uma aba duplicada que compartilhe a mesma sessão como segundo jogador; prefira janela anônima ou outro navegador. **Sair** apaga o token local e não libera a vaga para terceiros; crie outra sala para trocar participantes. Uma sala vazia é removida em até aproximadamente 60 segundos; tokens expiram em 30 minutos.

## Dois computadores na mesma rede

Vite escuta em `0.0.0.0:5173`; o Worker permanece no loopback e é acessado pelo proxy. Copie `apps/server/.dev.vars.example` para `.dev.vars`, acrescente `http://IP-DO-COMPUTADOR:5173` em `ALLOWED_ORIGINS` e reinicie `npm run dev`. Acesse esse endereço nos dois computadores. O firewall deve permitir a porta 5173 na rede escolhida. Não exponha o servidor de desenvolvimento na internet.

`localhost` não funciona como convite entre computadores. Para internet será necessário implantar o build e o Worker com DO em HTTPS/WSS, ajustar origens e proteção de criação. Nenhuma infraestrutura foi publicada nesta entrega; validação entre máquinas e redes reais continua pendente.

## Comandos e diagnóstico

- `npm ci`: reinstala as versões verificadas do lockfile.
- `npm run dev`: inicia cliente e Worker juntos; Ctrl+C encerra ambos.
- `npm run dev:client` / `npm run dev:server`: terminais separados, se preferir.
- `npm run build`: verifica tipos, gera cliente e empacota Worker sem deploy.
- `npm test`: testes unitários de protocolo, regras de sessão e movimento.
- `npm run test:e2e`: inicia os serviços locais e testa Chromium/Workers com WebSockets reais. Encerra os serviços que iniciou.
- `npm audit`: auditoria de dependências.

Se as portas 5173/8787 estiverem ocupadas, encerre a instância anterior. Se a cena 3D não abrir, habilite WebGL/aceleração gráfica. O cache SQLite local fica em `apps/server/.wrangler`, ignorado pelo Git. A etapa 1 tem chão de referência e personagens provisórios; ainda não é uma partida de basquete completa.

## Documentação

[Arquitetura](docs/ARCHITECTURE.md) · [Regras](docs/GAME_RULES.md) · [Controles](docs/CONTROLS.md) · [Progresso](docs/PROGRESS.md) · [Integração](docs/INTEGRATION.md) · [Custos](docs/COSTS.md)

Etapas 2–9 dependem de autorização. O arquivo removido `index.html` no diretório pai não foi restaurado nem alterado.

