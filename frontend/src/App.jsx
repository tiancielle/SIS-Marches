import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { DataProvider } from "./context/DataContext";
import ProjectsView from "./pages/Projects/ProjectsView";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import SubsView from "./pages/SousTraitants/SubsView";
import SubDetail from "./pages/SousTraitants/SubDetail";
import ContratsView from "./pages/Contrats/ContratsView";
import ContratDetail from "./pages/Contrats/ContratDetail";
import EquipeView from "./pages/Equipe/EquipeView";
import EquipeDetail from "./pages/Equipe/EquipeDetail";
import MarchesView from "./pages/Marches/MarchesView";
import MarcheDetail from "./pages/Marches/MarcheDetail";


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

            <Route path="/marches" element={<MarchesView />} />
            <Route path="/marches/:id" element={<MarcheDetail />} />


            <Route path="/projects" element={<ProjectsView />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />

            <Route path="/sous-traitants" element={<SubsView />} />
            <Route path="/sous-traitants/:id" element={<SubDetail />} />

            <Route path="/contrats" element={<ContratsView />} />
            <Route path="/contrats/:id" element={<ContratDetail />} />

            <Route path="/factures" element={<Placeholder label="Factures" />} />
            <Route path="/paiements" element={<Placeholder label="Paiements" />} />

            <Route path="/equipe" element={<EquipeView />} />
            <Route path="/equipe/:id" element={<EquipeDetail />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}