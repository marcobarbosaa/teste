# Controles

Teclas centralizadas em `packages/shared/src/config.ts`; parâmetros físicos em `packages/shared/src/gameplay/config.ts`.

| Tecla / ação | Treino padrão | Online opcional |
|---|---|---|
| WASD | Movimento relativo à câmera | Movimento original em X/Z |
| Shift | Correr | Sem ação |
| Espaço | Segurar, acompanhar medidor e soltar para arremessar | Sem ação |
| R | Recuperar bola sem apagar estatísticas | Sem ação |
| Reiniciar treino | Limpar placar e reposicionar | Não disponível |
| Tela cheia / Esc | Fullscreen API / sair | Não disponível |
| J / K | Reservadas, sem ação | Reservadas, sem ação |

Câmera automática sem mouse. No treino, corpo acompanha a direção da cesta suavemente; velocidade acompanha aceleração e frenagem. Bola dribla durante o movimento. Preparar arremesso reduz a velocidade. Campos de texto não capturam comandos de jogo; botões podem ser ativados por Tab/Enter/Espaço. Perder foco ou ocultar a página zera movimento e cancela carga, sem lançar nem contar tentativa.

