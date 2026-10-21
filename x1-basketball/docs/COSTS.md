# Infraestrutura e custos

Consulta: 21/10/2026. Nenhuma infraestrutura publicada ou serviço contratado.

## Limites consultados
Workers Free: 100 mil requisições/dia, CPU de 10 ms por invocação comum e memória de 128 MB.
Durable Objects SQLite: 100 mil requisições/dia, 13 mil GB-s/dia, 5 milhões de linhas lidas/dia, 100 mil escritas/dia, 5 GB na conta.
Mensagens WebSocket recebidas têm relação de cobrança 20:1; enviadas não são cobradas como requisição.
Duração considera 128 MB alocados por objeto; timers ativos impedem hibernação.
DO: CPU padrão de 30 s por invocação, limite indicativo de 1.000 requisições/s/objeto e mensagens recebidas até 32 MiB.
O jogo restringe mensagens a 512 bytes e duas vagas. Isso é muito menor que os limites da plataforma.

A página de limites apresenta divergência: tabela de SQLite indica 10 GB/objeto, mas FAQ distingue 1 GB Free/10 GB Paid. Adotar 1 GB como teto conservador e conferir antes de publicar.

Fontes: [preços DO](https://developers.cloudflare.com/durable-objects/platform/pricing/), [limites DO](https://developers.cloudflare.com/durable-objects/platform/limits/), [Workers](https://developers.cloudflare.com/workers/platform/limits/).

## Estimativa própria, não medição nem garantia
Premissas: 10 salas simultâneas, 2 jogadores por sala, 20 comandos/s/jogador, 20 snapshots/s/sala, duração de 300 s.
- Recepção: 400 mensagens/s; 120.000 por rodada de cinco minutos.
- Equivalência estimada: 6.000 requisições DO por rodada, mais criação, conexões, pings e alarmes.
- Duração: 10 × 300 × 0,128 = 384 GB-s por rodada (hipótese conservadora em GB decimais).
- Uma hora: 4.608 GB-s e aproximadamente 72 mil requisições equivalentes, antes dos extras.
- Rodar dez salas continuamente por 24 h excederia as cotas diárias.
- Snapshot estimado em 350–600 bytes: saída de 140–240 kB/s para 20 clientes; medir JSON real.
- Não gravar posição a cada tick. Persistir metadados nas mudanças de sessão e estados de pausa.
- Estimar algumas dezenas de escritas por sala, não milhares por segundo; medir operações reais antes do deploy.

Na implementação inicial, tokens e salas expiram e objetos vazios são limpos. A proteção local de frequência não substitui limite distribuído de criação na borda.
Antes de abrir na internet: configurar origem permitida, limitação global de criação/conexão, observar métricas e validar orçamento.
O Free interrompe operações ao exceder cotas; não permite partidas ilimitadas.

