import { Component, type ReactNode } from "react";

/**
 * Red de seguridad: si una sección revienta por datos inesperados de la BD,
 * esta se oculta en lugar de tumbar toda la página (consistente con el
 * principio del sitio: sin contenido válido, la sección no aparece).
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Sección ocultada por error de render:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
