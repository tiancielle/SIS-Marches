# Correction UX Timeout - Implémentation

## Date
2026-08-10

## Modifications Effectuées

### Fichier : `AnalyseDcePanel.jsx`

#### Modification 1 : Augmentation de MAX_POLLS (ligne 130)

**Changement :**
```javascript
// Avant
const MAX_POLLS = 60; // 60 polls * 4s = 4 minutes max

// Après
const MAX_POLLS = 900; // 900 polls * 4s = 60 minutes max
```

**Justification :** Permettre au polling de continuer pendant 60 minutes au lieu de 4 minutes.

---

#### Modification 2 : Changement de comportement quand MAX_POLLS atteint (lignes 132-158)

**Changement :**
```javascript
// Avant
if (pollCountRef.current >= MAX_POLLS) {
  stopPolling();
  setError("L'analyse prend trop de temps. Veuillez réessayer plus tard.");
  setPhase("error");
}

// Après
if (pollCountRef.current >= MAX_POLLS) {
  stopPolling();
  // Ne pas afficher d'erreur, car le backend continue le traitement
  setPhase("polling_stopped");
}
```

**Justification :** Ne pas afficher d'erreur quand le polling s'arrête, car le backend continue le traitement.

---

#### Modification 3 : Ajout de l'état "polling_stopped" (lignes 290-302)

**Ajouté :**
```javascript
{/* polling arrêté mais backend continue */}
{phase === "polling_stopped" && (
  <div style={{ background: "#EFF6FF", border: `1px solid #BFDBFE`, borderRadius: 8, padding: 16 }}>
    <p style={{ fontFamily: FONT, fontSize: 13.5, color: "#1E40AF", display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px" }}>
      <Clock size={16} /> Analyse toujours en cours… Le traitement de documents volumineux peut prendre plusieurs minutes. Vous pouvez revenir plus tard ; le résultat sera disponible une fois l'analyse terminée.
    </p>
    <button onClick={checkOnce} style={secondaryBtnSm}>
      <RotateCcw size={14} /> Rafraîchir
    </button>
  </div>
)}
```

**Justification :** Afficher un message informatif au lieu d'une erreur, avec un bouton pour rafraîchir.

---

## Nouveau Comportement

### Après 4 minutes (avant : erreur)
- **Ancien comportement :** Affichage d'une erreur "L'analyse prend trop de temps. Veuillez réessayer plus tard."
- **Nouveau comportement :** Rien ne change (polling continue jusqu'à 60 minutes)

### Après 60 minutes (nouveau : polling_stopped)
- **Nouveau comportement :** Affichage du message "Analyse toujours en cours… Le traitement de documents volumineux peut prendre plusieurs minutes. Vous pouvez revenir plus tard ; le résultat sera disponible une fois l'analyse terminée."
- **Action utilisateur :** Peut cliquer sur "Rafraîchir" pour relancer le polling

### Refresh pendant `en_cours`
- **Comportement :** Le frontend appelle `checkOnce()` au refresh
- **Résultat :** Le statut `en_cours` est détecté
- **Polling :** Le polling relance automatiquement (phase passe à "polling")
- **Comportement UX :** Affichage "Analyse en cours, cela peut prendre une minute…"

### Quand le traitement termine normalement
- **Statut backend :** Passe de "en_cours" à "succes" ou "echec"
- **Statut frontend :** Phase passe à "done"
- **Résultat :** L'UI récupère normalement le résultat final
- **Affichage :** Affichage complet de l'analyse avec badge de statut

---

## Flow Complet

### 1. Lancement de l'analyse
```
Utilisateur clique → POST /traiter-dce → BackgroundTasks → Pipeline
                ↓
Réponse immédiate → Frontend commence polling
```

### 2. Polling normal (0-60 minutes)
```
Frontend poll → GET /analyse-dce → Statut "en_cours" → Affichage "Analyse en cours"
```

### 3. Polling arrêté (après 60 minutes)
```
Frontend arrête polling → Affichage "Analyse toujours en cours…"
```

### 4. Refresh pendant `en_cours`
```
Utilisateur refresh → GET /analyse-dce → Statut "en_cours" → Polling relance
```

### 5. Traitement terminé
```
Backend termine → Statut "succes" → Frontend poll → Phase "done" → Affichage résultat
```

---

## Fichiers/Lignes Modifiés

| Fichier | Lignes | Modification |
|---------|--------|---------------|
| `AnalyseDcePanel.jsx` | 130 | MAX_POLLS = 900 |
| `AnalyseDcePanel.jsx` | 147-151 | setPhase("polling_stopped") au lieu de "error" |
| `AnalyseDcePanel.jsx` | 290-302 | Ajout état "polling_stopped" avec message informatif |

---

## Test de Validation

### Test 1 : Timeout après 60 minutes
- **Action :** Laisser le polling atteindre 60 minutes
- **Résultat attendu :** Affichage "Analyse toujours en cours…" au lieu d'une erreur
- **Backend :** Continue le traitement

### Test 2 : Refresh pendant `en_cours`
- **Action :** Refresh la page pendant que le statut est "en_cours"
- **Résultat attendu :** Polling relance automatiquement, affichage "Analyse en cours"
- **Backend :** Continue le traitement

### Test 3 : Traitement termine après refresh
- **Action :** Attendre que le backend passe à "succes"
- **Résultat attendu :** Frontend détecte "succes", phase passe à "done", affichage du résultat
- **Backend :** Résultat sauvegardé en base

---

## Conclusion

L'UX a été corrigée pour être cohérente avec l'architecture asynchrone :

- ✅ MAX_POLLS augmenté à 900 (60 minutes max)
- ✅ Pas d'erreur quand le polling s'arrête
- ✅ Message informatif "Analyse toujours en cours…"
- ✅ Bouton "Rafraîchir" pour relancer le polling
- ✅ Refresh pendant `en_cours` relance automatiquement le polling
- ✅ Résultat récupéré normalement quand le traitement termine

**Prêt pour le test de validation.**
