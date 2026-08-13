# Diagnostic - Timeout/UX Frontend

## Date
2026-08-10

## Problème Observé

Le pipeline backend termine correctement (résultats sauvegardés en base), mais le frontend affiche une erreur de timeout. Un simple refresh permet de récupérer immédiatement les résultats.

---

## Réponses aux 8 Questions

### 1. Quelle requête frontend déclenche `analyse-dce` ?

**Réponse :** `traiterDce(appelOffresId)` → POST `/appels-offres/${id}/traiter-dce`

**Détails :**
- Frontend : `AnalyseDcePanel.jsx` ligne 191
- Service : `analyseDce.js` ligne 3
- Backend : `appel_offres.py` ligne 200

---

### 2. Combien de temps le frontend attend cette requête ?

**Réponse :** Le frontend attend très peu de temps (réponse immédiate)

**Détails :**
- Le backend utilise `BackgroundTasks` (FastAPI)
- Le pipeline est lancé en arrière-plan
- Le backend retourne immédiatement : `{"status": "demarree", "message": "Traitement du DCE lancé en arrière-plan"}`
- Le frontend commence ensuite à poller pour récupérer le résultat

---

### 3. S'il existe un timeout Axios/fetch/API gateway/proxy ?

**Réponse :** OUI, mais ce n'est pas le problème principal

**Détails :**
- `client.js` utilise `fetch` native (pas Axios)
- Pas de timeout explicite configuré dans `client.js`
- Le problème vient du **polling**, pas de la requête HTTP

---

### 4. Si le backend continue l'analyse après que le frontend considère la requête comme timeout ?

**Réponse :** OUI, le backend continue l'analyse en arrière-plan

**Détails :**
- Le backend utilise `BackgroundTasks.add_task(_run_pipeline_background)`
- Le pipeline s'exécute indépendamment de la réponse HTTP
- Le résultat est sauvegardé en base à la fin du pipeline
- Le frontend peut récupérer le résultat plus tard via polling

---

### 5. À quel moment exactement le résultat est sauvegardé en base ?

**Réponse :** À la fin du pipeline, dans `run_pipeline()`

**Détails :**
- Le pipeline inclut : ZIP → UNZIP → INDEX → CONTEXT → LLM → SAVE
- Le résultat est sauvegardé dans `AnalyseDce` à la fin
- Le statut passe de "en_cours" à "succes" ou "echec"

---

### 6. Pourquoi un simple refresh permet ensuite de récupérer immédiatement le résultat ?

**Réponse :** Le résultat est déjà en base, le frontend le récupère via `fetchAnalyseDce`

**Détails :**
- Le backend a terminé le pipeline et sauvegardé le résultat
- Le frontend appelle `fetchAnalyseDce` au refresh
- Le frontend récupère le résultat complet en base
- Le statut est "succes" ou "echec"

---

### 7. Quel est le statut de l'AO/document pendant ce laps de temps ?

**Réponse :** "en_cours" pendant le pipeline, puis "succes" ou "echec" à la fin

**Détails :**
- Le statut est mis à jour dans `AnalyseDce.statut`
- Le frontend peut suivre le statut via polling
- Les statuts possibles : "en_cours", "succes", "echec", "non_analyse"

---

### 8. Si l'architecture actuelle fait dépendre la réponse HTTP de la durée complète du pipeline OCR + LLM ?

**Réponse :** NON, l'architecture actuelle est déjà asynchrone

**Détails :**
- Le backend utilise `BackgroundTasks` pour le pipeline
- La réponse HTTP est immédiate (pas de dépendance à la durée du pipeline)
- Le frontend utilise un polling pour suivre le statut

---

## Problème Identifié

### Root Cause : Timeout du polling frontend

**Détails :**
- Le frontend poll avec `MAX_POLLS = 60` et `POLL_MS = 4000`
- Temps max de polling : 60 * 4s = 240 secondes (4 minutes)
- Le traitement actuel prend : 1533 secondes (25 minutes)
- Le frontend arrête le polling après 4 minutes et affiche une erreur
- Le backend continue le traitement et sauvegarde le résultat

**Code frontend (AnalyseDcePanel.jsx lignes 130-151) :**
```javascript
const MAX_POLLS = 60; // 60 polls * 4s = 4 minutes max

async function checkOnce() {
  // ...
  pollCountRef.current += 1;
  if (pollCountRef.current >= MAX_POLLS) {
    stopPolling();
    setError("L'analyse prend trop de temps. Veuillez réessayer plus tard.");
    setPhase("error");
  }
}
```

---

## Architecture Actuelle

### Flow Actuel
```
Frontend → POST /traiter-dce → BackgroundTasks → Pipeline (OCR + LLM) → Sauvegarde en base
         ↓                           ↓                    ↓
Réponse immédiate              Asynchrone          Résultat sauvegardé
         ↓                           ↓                    ↓
Frontend commence polling      Backend continue     Frontend refresh → Récupère résultat
```

### Avantages de l'architecture actuelle
- ✅ Déjà asynchrone (BackgroundTasks)
- ✅ Backend continue le traitement indépendamment
- ✅ Résultat sauvegardé en base
- ✅ Frontend peut récupérer le résultat via polling

### Inconvénients
- ❌ MAX_POLLS trop court (4 minutes)
- ❌ Pas de gestion d'erreur de polling
- ❌ UX confuse (erreur alors que le traitement continue)

---

## Solutions Possibles

### Solution 1 : Augmenter MAX_POLLS (simple)

**Modification :**
```javascript
// AnalyzeDcePanel.jsx ligne 130
const MAX_POLLS = 900; // 900 polls * 4s = 60 minutes max
```

**Avantages :**
- Modification minimale
- Simple à implémenter
- Pas de changement d'architecture

**Inconvénients :**
- Polling continue pendant 60 minutes
- Pas de feedback utilisateur pendant longtemps
- Consomme des ressources réseau

**Gain :** Résout le problème immédiatement

---

### Solution 2 : Passer à un polling WebSocket (idéal)

**Modification :**
- Implémenter un endpoint WebSocket pour le suivi en temps réel
- Le frontend reçoit les mises à jour via WebSocket
- Élimine le polling inefficace

**Avantages :**
- Communication bidirectionnelle en temps réel
- Feedback utilisateur instantané
- Plus économe en ressources

**Inconvénients :**
- Architecture plus complexe
- Nécessite des modifications backend et frontend
- Plus de temps d'implémentation

**Gain :** Solution idéale à long terme

---

### Solution 3 : Notification via Server-Sent Events (SSE)

**Modification :**
- Implémenter un endpoint SSE pour le suivi
- Le frontend reçoit les mises à jour via SSE
- Plus simple que WebSocket

**Avantages :**
- Plus simple que WebSocket
- Communication unidirectionnelle (suffisant pour ce cas)
- Feedback utilisateur en temps réel

**Inconvénients :**
- Architecture plus complexe que le polling
- Nécessite des modifications backend et frontend

**Gain :** Bon compromis

---

## Solution Recommandée

### Solution 1 : Augmenter MAX_POLLS (immédiat)

**Justification :**
- Résout le problème immédiatement
- Modification minimale (1 ligne)
- Architecture actuelle déjà asynchrone
- Peut être amélioré plus tard (WebSocket/SSE)

**Modification :**
```javascript
// AnalyzeDcePanel.jsx ligne 130
const MAX_POLLS = 900; // 900 polls * 4s = 60 minutes max
```

**Alternative :** Augmenter POLL_MS pour réduire la fréquence
```javascript
const POLL_MS = 10000; // 10 secondes au lieu de 4
const MAX_POLLS = 360; // 360 polls * 10s = 60 minutes max
```

---

## Conclusion

### Problème
- Le frontend arrête le polling après 4 minutes (MAX_POLLS = 60)
- Le traitement prend 25 minutes
- Le frontend affiche une erreur alors que le backend continue

### Architecture actuelle
- ✅ Déjà asynchrone (BackgroundTasks)
- ✅ Backend continue le traitement indépendamment
- ✅ Résultat sauvegardé en base
- ❌ MAX_POLLS trop court

### Solution recommandée
- **Immédiat :** Augmenter MAX_POLLS à 900 (60 minutes max)
- **À terme :** Passer à WebSocket ou SSE pour un meilleur UX

### Pourquoi pas changer l'architecture maintenant ?
- L'architecture actuelle est déjà asynchrone
- Le problème est uniquement le timeout du polling
- Augmenter MAX_POLLS résout le problème immédiatement
- WebSocket/SSE peut être implémenté plus tard pour améliorer l'UX
