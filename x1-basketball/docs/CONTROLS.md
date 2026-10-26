# Controles

Teclas centralizadas em `packages/shared/src/config.ts`; parâmetros físicos em `packages/shared/src/gameplay/config.ts`.

| Tecla / ação | Treino padrão | Online opcional |
|---|---|---|
| WASD | Movimento relativo à câmera | Movimento original em X/Z |
| Shift | Correr | Sem ação |
| Espaço | Segurar, acompanhar medidor e soltar para arremessar | Sem ação |
| E | Finalização contextual: curta, bandeja ou enterrada | Sem ação |
| F | Finta de arremesso com pequena hesitação corporal | Sem ação |
| R | Recuperar bola sem apagar estatísticas | Sem ação |
| Reiniciar treino | Limpar placar e reposicionar | Não disponível |
| Tela cheia / Esc | Fullscreen API / sair | Não disponível |
| J / K | Reservadas, sem ação | Reservadas, sem ação |

Câmera automática sem mouse. No treino, corpo acompanha a direção da cesta suavemente; velocidade acompanha aceleração e frenagem. Bola dribla durante o movimento. Preparar arremesso reduz a velocidade. Campos de texto não capturam comandos de jogo; botões podem ser ativados por Tab/Enter/Espaço. Perder foco ou ocultar a página zera movimento e cancela carga, sem lançar nem contar tentativa.

Uma finalização já iniciada conclui sua soltura/aterrissagem mesmo após perder foco. E/F não interrompem carga de Espaço nem outra ação. F tem duração de 0,64 s e intervalo adicional de 0,24 s. R durante uma ação agenda recuperação para seu término. Reiniciar cancela ação, salto, comandos, carga e recuperação agendada.

