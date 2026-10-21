# Integração futura

O repositório `marcobarbosaa/grupobolao1-0` não foi alterado nem importado.
A stack do site (TypeScript, React, Vite, TanStack Start e Cloudflare) é a informada na especificação; nenhuma auditoria do repositório foi realizada.

Primeira integração sugerida: aplicação isolada sob um caminho/origem própria, preservando Worker e DO como autoridade.
Posteriormente extrair a entrada React e transporte, mantendo regras em `packages/shared`.
Não compartilhar estado React com o loop de simulação.

A entrada atual já abre diretamente no treino, sem identidade visual ou painel do site hospedeiro. `GameController` separa a cena da fonte local/remota e as regras de bola ficam em TypeScript puro. O CSS do treino ocupa o viewport; uma futura incorporação em container precisará ajustar esse limite explicitamente. Nenhuma integração, ticket ou publicação foi adicionada nesta atualização.

Identidade futura: backend do site emite ticket assinado de curta duração com usuário, sala, expiração e nonce; Worker verifica assinatura e vínculo da vaga.
Nunca aceitar um userId arbitrário como autenticação nem expor segredos no bundle.
Resultados futuros: mensagem servidor-servidor autenticada e idempotente, com identificador da partida e versão das regras. Cliente não informa o vencedor.
Nenhuma conta, ranking ou resultado persistente existe nas etapas iniciais.

Antes de integrar: revisar rotas, cabeçalhos, CSP, autenticação, migrações e ciclo de deploy do site principal com autorização.

