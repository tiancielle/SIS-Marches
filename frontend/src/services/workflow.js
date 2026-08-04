const API_BASE = "http://localhost:8000";

export async function changerStatutProjet(projetId, nouveauStatut) {
  const response = await fetch(`${API_BASE}/projets/${projetId}/changer-statut`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nouveau_statut: nouveauStatut }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erreur lors du changement de statut");
  }

  return response.json();
}

export async function getHistoriqueProjet(projetId) {
  const response = await fetch(`${API_BASE}/projets/${projetId}/historique`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération de l'historique");
  }
  return response.json();
}
