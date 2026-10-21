import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
interface State { error: Error | null; attempt: number }
export class SceneBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, attempt: 0 };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[X1: cena 3D]', error, { componentStack: info.componentStack });
  }
  render() {
    const { error, attempt } = this.state;
    if (!error) return <Fragment key={attempt}>{this.props.children}</Fragment>;
    const lost = error.message.includes('WEBGL_CONTEXT_LOST');
    const webgl = /webgl|creating.*context/i.test(error.message);
    return <div className="scene-fallback" role="alert">
      <h2>Não foi possível abrir a quadra 3D.</h2>
      <p>{lost ? 'O contexto gráfico foi interrompido. Reabra a quadra para continuar.' : webgl ? 'O navegador não conseguiu criar um contexto WebGL. Tente reabrir a quadra ou verificar o suporte gráfico.' : 'Ocorreu uma falha ao montar a cena. Tente reabri-la; se persistir, consulte o diagnóstico de desenvolvimento.'}</p>
      {import.meta.env.DEV && <details><summary>Detalhes do erro</summary><pre>{error.message}</pre></details>}
      <button onClick={() => this.setState({ error: null, attempt: attempt + 1 })}>Reabrir a quadra</button>
    </div>;
  }
}
