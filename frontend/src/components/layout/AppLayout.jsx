import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { C } from "../../styles/theme";

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