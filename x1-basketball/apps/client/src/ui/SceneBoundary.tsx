import { Component, type ReactNode } from 'react';
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-fallback"><h2>Não foi possível abrir a quadra 3D.</h2><p>Use um navegador desktop atualizado com aceleração gráfica habilitada.</p><button onClick={() => location.reload()}>Tentar novamente</button></div> : this.props.children;
  }
}

