import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight, Download, EyeOff, RotateCcw, AlertCircle,
  Calendar, Building2, FileText, Wallet, Hash, ExternalLink, X,
} from "lucide-react";
import {
  fetchAppelOffre, telechargerDCE, ignorerAppelOffre, reactiverAppelOffre, resolveFileUrl,
} from "../../../services/appelsOffres";
import AnalyseDcePanel from "./AnalyseDcePanel";
import Skeleton from "../../../components/ui/Skeleton";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";

const STATUT_LABELS = { nouveau: "Nouveau", analyse: "Analysé", interesse: "Intéressé", ignore: "Ignoré" };
const STATUT_COLORS = {
  nouveau: { bg: C.accentLt, text: C.accent },
  analyse: { bg: "#EAF2E7", text: C.success },
  interesse: { bg: "#F3E8D0", text: "#8A6A1F" },
  ignore: { bg: "#F1EFEA", text: C.faint },
};

function fmtDate(d) {
  if (!d) return "Non communiqué";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtMontant(m) {
  if (m === null || m === undefined) return "Non communiqué";
  return new Intl.NumberFormat("fr-FR").format(m) + " DH";
}

export default function MarcheDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appel, setAppel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [toast, setToast] = useState(null);
  function showSoonToast() {
    setToast("Bientôt disponible — la conversion en Projet n'est pas encore branchée côté backend.");
    clearTimeout(showSoonToast._t);
    showSoonToast._t = setTimeout(() => setToast(null), 3200);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAppelOffre(id);
      setAppel(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await telechargerDCE(id);
      setAppel((prev) => ({ ...prev, url_cps: res.url_cps }));
    } catch (e) {
      setDownloadError(e.message);
    } finally {
      setDownloading(false);
    }
  }

  async function handleIgnorer() {
    setUpdating(true);
    try {
      const updated = await ignorerAppelOffre(id);
      setAppel(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleReactiver() {
    setUpdating(true);
    try {
      const updated = await reactiverAppelOffre(id);
      setAppel(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "28px clamp(20px, 4vw, 48px)", maxWidth: 900, margin: "0 auto" }}>
        <Skeleton width={180} height={13} style={{ marginBottom: 20 }} />
        <Skeleton width="60%" height={26} style={{ marginBottom: 10 }} />
        <Skeleton width="30%" height={14} style={{ marginBottom: 30 }} />
        <Skeleton width="100%" height={160} />
      </div>
    );
  }

  if (error || !appel) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", fontFamily: FONT, color: C.danger }}>
        <AlertCircle size={22} style={{ marginBottom: 8 }} />
        <p>{error || "Appel d'offres introuvable."}</p>
        <button onClick={() => navigate("/marches")} style={{ ...linkBtn, marginTop: 10 }}>← Retour à la liste</button>
      </div>
    );
  }

  const st = STATUT_COLORS[appel.statut] || STATUT_COLORS.nouveau;

  return (
    <div style={{ padding: "28px clamp(20px, 4vw, 48px)", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, color: C.mute, marginBottom: 18 }}>
        <Link to="/marches" style={{ color: C.mute, textDecoration: "none" }}>Marchés publics</Link>
        <ChevronRight size={13} />
        <span style={{ color: C.ink }}>{appel.reference}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: st.text, background: st.bg, padding: "4px 10px", borderRadius: 20 }}>
            {STATUT_LABELS[appel.statut] || appel.statut}
          </span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, color: C.ink, margin: "10px 0 0", lineHeight: 1.3 }}>
            {appel.objet || "Objet non communiqué"}
          </h1>
          {appel.url_avis && (
            <a href={resolveFileUrl(appel.url_avis)} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, marginTop: 12 }}>
              <ExternalLink size={14} /> Voir sur Marchés Publics
            </a>
          )}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 22, marginBottom: 16 }}>
        <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 16px" }}>
          Informations officielles
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          <Field icon={Hash} label="Référence" value={appel.reference} />
          <Field icon={Building2} label="Organisme" value={appel.organisme} />
          <Field icon={Wallet} label="Montant estimatif" value={fmtMontant(appel.montant_estimatif)} />
          <Field icon={Calendar} label="Date limite" value={fmtDate(appel.date_limite_remise)} />
          <Field icon={FileText} label="Type de procédure" value={appel.type_procedure} />
          <Field icon={Hash} label="Référence consultation" value={appel.ref_consultation} />
        </div>

        {appel.url_avis && (
          <a href={resolveFileUrl(appel.url_avis)} target="_blank" rel="noreferrer" style={{ ...linkBtn, marginTop: 18, display: "inline-block" }}>
            Voir l'avis sur le portail →
          </a>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 22, marginBottom: 16 }}>
        <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 14px" }}>
          Dossier de consultation
        </p>
        {appel.url_cps ? (
          <a href={resolveFileUrl(appel.url_cps)} target="_blank" rel="noreferrer" style={primaryBtn}>
            <Download size={14} /> Télécharger le dossier
          </a>
        ) : (
          <>
            <button onClick={handleDownload} disabled={downloading} style={{ ...primaryBtn, background: downloading ? C.faint : C.accent, cursor: downloading ? "default" : "pointer" }}>
              <Download size={14} /> {downloading ? "Récupération en cours…" : "Récupérer le dossier"}
            </button>
            {downloading && (
              <p style={{ fontFamily: FONT, fontSize: 12, color: C.mute, marginTop: 8 }}>
                Le portail peut être lent — ça peut prendre jusqu'à une minute.
              </p>
            )}
            {downloadError && (
              <p style={{ fontFamily: FONT, fontSize: 12, color: C.danger, marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <AlertCircle size={13} /> {downloadError}
              </p>
            )}
          </>
        )}
      </div>

      <AnalyseDcePanel appelOffresId={appel.id} urlCps={appel.url_cps} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {appel.statut === "ignore" ? (
          <button onClick={handleReactiver} disabled={updating} style={secondaryBtn}>
            <RotateCcw size={14} /> Réactiver
          </button>
        ) : (
          <button onClick={handleIgnorer} disabled={updating} style={secondaryBtn}>
            <EyeOff size={14} /> Ignorer
          </button>
        )}
        <button onClick={showSoonToast} style={primaryBtn}>
          Je suis intéressé
        </button>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: C.ink, color: "#fff", fontFamily: FONT, fontSize: 13, fontWeight: 500,
          padding: "12px 20px", borderRadius: 8, boxShadow: C.shadow,
          display: "flex", alignItems: "center", gap: 10, zIndex: 9999,
          animation: "fadeIn 0.2s ease",
        }}>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex" }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div>
      <p style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: FONT, fontSize: 11, color: C.faint, margin: "0 0 4px" }}>
        <Icon size={12} /> {label}
      </p>
      <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: value ? C.ink : C.faint, margin: 0 }}>
        {value || "Non communiqué"}
      </p>
    </div>
  );
}

const linkBtn = {
  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.accent, textDecoration: "none",
  background: "none", border: "none", cursor: "pointer", padding: 0,
};
const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
  color: "#fff", background: C.accent, border: "none", borderRadius: C.radius, padding: "10px 18px",
  cursor: "pointer", textDecoration: "none", boxShadow: C.shadow,
};
const secondaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
  color: C.ink, background: "transparent", border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "10px 18px",
  cursor: "pointer",
};