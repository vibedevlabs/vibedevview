import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

class EB extends React.Component<{ children: React.ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { err: e.stack ?? e.message };
  }
  render() {
    if (this.state.err) return <pre style={{ color: "#fb7185", padding: 16, whiteSpace: "pre-wrap" }}>{this.state.err}</pre>;
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EB>
      <App />
    </EB>
  </React.StrictMode>,
);
