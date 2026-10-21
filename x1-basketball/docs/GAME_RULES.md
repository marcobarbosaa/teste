# Regras

## Treino implementado

Um jogador, sem adversário nem relógio. Cada soltura válida soma uma tentativa. A passagem completa da bola pelo interior do aro, de cima para baixo, soma uma cesta, uma vez por lançamento. Aproveitamento = cestas / tentativas. R recupera sem apagar estatísticas; reiniciar zera tudo. Não há valor de 2/3 pontos ou vencedor nesse modo. A soltura altera a trajetória; o medidor não concede cesta. Ver [física do treino](TRAINING.md).

## Especificação competitiva futura, ainda não implementada

Meia quadra, uma cesta e dois jogadores. Dentro do arco: 2 pontos; além: 3.
Regulamentar: 300 segundos. Meta: alcançar ou ultrapassar 25 pontos.
Posse: 24 segundos. Empate no fim: períodos adicionais de 60 segundos até desempatar.
A meta permanece válida na prorrogação. Todos os valores estão em `packages/shared/src/config.ts`.

Servidor decidirá posição de soltura, trajetória, cesta, posse, cronômetros e vencedor.
Acerto no medidor ajuda, mas não concede pontos sem passagem válida da bola pelo aro.
Roubo e rebote defensivo exigem sair do arco antes de pontuar. Cesta transfere posse.
Sem faltas/lances livres inicialmente.

## Decisões propostas para etapas 5 e 6
- Cesta, roubo, rebote defensivo e reposição: 24 segundos para o novo possuidor.
- Bloqueio sem mudança de posse: relógio continua.
- Soltura válida antes do fim: aguardar resolução da trajetória, sem conceder pontos pelo comando.
- Rebote ofensivo: proposta de reiniciar em 14 segundos após toque no aro; sem toque, continuar o restante.
- Bola fora: reposição pelo adversário do último toque em ponto fixo além do arco.
- Desconexão durante partida: proposta de pausar e reservar vaga temporariamente.

**São propostas, não regras definitivas. Solicitar validação antes de implementá-las.**
Etapa 1 é uma sessão de movimentação; não conta tempo, pontos, posse ou resultado.

