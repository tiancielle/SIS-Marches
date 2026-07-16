import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { DataProvider } from "./store/DataContext";
import DashboardPage from "./modules/accueil/pages/DashboardPage";
import MarchesView from "./modules/veille/pages/MarchesView";
import MarcheDetail from "./modules/veille/pages/MarcheDetail";
import ProjectsView from "./modules/projets/pages/ProjectsView";
import ProjectDetail from "./modules/projets/pages/ProjectDetail";
import ContratsView from "./modules/projets/pages/ContratsView";
import ContratDetail from "./modules/projets/pages/ContratDetail";
import SubsView from "./modules/ressources/pages/SubsView";
import SubDetail from "./modules/ressources/pages/SubDetail";
import EquipeView from "./modules/ressources/pages/EquipeView";
import EquipeDetail from "./modules/ressources/pages/EquipeDetail";
import FacturesPage from "./modules/finances/pages/FacturesPage";
import PaiementsPage from "./modules/finances/pages/PaiementsPage";

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/marches" element={<MarchesView />} />
            <Route path="/marches/:id" element={<MarcheDetail />} />
            <Route path="/projects" element={<ProjectsView />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/sous-traitants" element={<SubsView />} />
            <Route path="/sous-traitants/:id" element={<SubDetail />} />
            <Route path="/contrats" element={<ContratsView />} />
            <Route path="/contrats/:id" element={<ContratDetail />} />
            <Route path="/factures" element={<FacturesPage />} />
            <Route path="/paiements" element={<PaiementsPage />} />
            <Route path="/equipe" element={<EquipeView />} />
            <Route path="/equipe/:id" element={<EquipeDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}