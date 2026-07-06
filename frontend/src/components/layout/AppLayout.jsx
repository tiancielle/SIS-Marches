import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { C } from "../../styles/theme";

// Coquille commune à toutes les pages authentifiées.
// Chaque page (Projects, SousTraitants, ...) rend son propre <Header /> + contenu via <Outlet />.
export default function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.paper }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
