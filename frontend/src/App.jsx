import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { DataProvider } from "./context/DataContext";
import ProjectsView from "./pages/Projects/ProjectsView";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import SubsView from "./pages/SousTraitants/SubsView";
import SubDetail from "./pages/SousTraitants/SubDetail";

function Placeholder({ label }) {
  return <div style={{ padding: 32, color: "#6B7280", fontSize: 14 }}>{label} — à venir</div>;
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Placeholder label="Tableau de bord" />} />
            <Route path="/projects" element={<ProjectsView />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/sous-traitants" element={<SubsView />} />
            <Route path="/sous-traitants/:id" element={<SubDetail />} />
            <Route path="/contrats" element={<Placeholder label="Contrats" />} />
            <Route path="/factures" element={<Placeholder label="Factures" />} />
            <Route path="/paiements" element={<Placeholder label="Paiements" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}