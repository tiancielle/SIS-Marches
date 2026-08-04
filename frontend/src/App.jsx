import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { DataProvider } from "./store/DataContext";
import DashboardPage from "./modules/accueil/pages/DashboardPage";
import MarchesView from "./modules/veille/pages/MarchesView";
import MarcheDetail from "./modules/veille/pages/MarcheDetail";
import OpportunitesView from "./modules/projets/pages/OpportunitesView";
import OpportunitesArchivesView from "./modules/projets/pages/OpportunitesArchivesView";
import ProjetsRejetesView from "./modules/projets/pages/ProjetsRejetesView";
import SuiviProjetView from "./modules/projets/pages/SuiviProjetView";
import ProjetDetailView from "./modules/projets/pages/ProjetDetailView";
import EntiteForm from "./modules/projets/pages/EntiteForm";
import ContratsView from "./modules/projets/pages/ContratsView";
import ContratDetail from "./modules/projets/pages/ContratDetail";
import ContratForm from "./modules/projets/pages/ContratForm";
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
            
            {/* Veille */}
            <Route path="/marches" element={<MarchesView />} />
            <Route path="/marches/:id" element={<MarcheDetail />} />
            
            {/* Opportunités */}
            <Route path="/opportunites" element={<OpportunitesView />} />
            <Route path="/opportunites/archives" element={<OpportunitesArchivesView />} />
            <Route path="/opportunites/rejetes" element={<ProjetsRejetesView />} />
            <Route path="/opportunites/:id" element={<ProjetDetailView />} />
            
            {/* Suivi */}
            <Route path="/projets" element={<SuiviProjetView />} />
            <Route path="/projets/:id" element={<ProjetDetailView />} />
            <Route path="/projets/nouveau" element={<EntiteForm />} />
            
            {/* Contrats */}
            <Route path="/contrats" element={<ContratsView />} />
            <Route path="/contrats/:id" element={<ContratDetail />} />
            <Route path="/contrats/nouveau" element={<ContratForm />} />
            
            {/* Ressources */}
            <Route path="/sous-traitants" element={<SubsView />} />
            <Route path="/sous-traitants/:id" element={<SubDetail />} />
            <Route path="/equipe" element={<EquipeView />} />
            <Route path="/equipe/:id" element={<EquipeDetail />} />
            
            {/* Finances */}
            <Route path="/factures" element={<FacturesPage />} />
            <Route path="/paiements" element={<PaiementsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
