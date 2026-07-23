import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, RefreshCw, Download, EyeOff, RotateCcw, Sparkles,
  Calendar, Building2, FileText, AlertCircle, CheckCircle2, Inbox, ChevronDown, X,
} from "lucide-react";
import {
  fetchAppelsOffres, synchroniserAppelsOffres, telechargerDCE, ignorerAppelOffre, reactiverAppelOffre,
  resolveFileUrl,
} from "../../../services/appelsOffres";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import Skeleton from "../../../components/ui/Skeleton";
import InteresseModal from "./InteresseModal";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";

const STATUT_LABELS = {
  nouveau: "Nouveau",
  analyse: "Analysé",
  interesse: "Intéressé",
  ignore: "Ignoré",
};
const STATUT_COLORS = {
  nouveau: { bg: C.accentLt, text: C.accent },
  analyse: { bg: "#EAF2E7", text: C.success },
  interesse: { bg: "#F3E8D0", text: "#8A6A1F" },
  ignore: { bg: "#F1EFEA", text: C.faint },
};

function fmtDate(d) {
  if (!d) return "Non communiqué";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function joursRestants(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function MarchesView() {
  const navigate = useNavigate();
  const [appels, setAppels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [downloadErrors, setDownloadErrors] = useState({});

  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("tous");
  const [procedureFilter, setProcedureFilter] = useState("tous");
  const [organismeFilter, setOrganismeFilter] = useState("tous");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [confirmIgnorerId, setConfirmIgnorerId] = useState(null);
  const [interesseAppel, setInteresseAppel] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAppelsOffres();
      setAppels(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await synchroniserAppelsOffres();
      setSyncResult(res);
      await load();
    } catch (e) {
      setSyncError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleIgnorer(id) {
    setConfirmIgnorerId(null);
    setAppels((prev) => prev.map((a) => (a.id === id ? { ...a, statut: "ignore" } : a)));
    try {
      await ignorerAppelOffre(id);
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  async function handleReactiver(id) {
    setAppels((prev) => prev.map((a) => (a.id === id ? { ...a, statut: "nouveau" } : a)));
    try {
      await reactiverAppelOffre(id);
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  async function handleDownload(id) {
    setDownloadingIds((prev) => new Set(prev).add(id));
    setDownloadErrors((prev) => ({ ...prev, [id]: null }));
    try {
      const res = await telechargerDCE(id);
      setAppels((prev) => prev.map((a) => (a.id === id ? { ...a, url_cps: res.url_cps } : a)));
    } catch (e) {
      setDownloadErrors((prev) => ({ ...prev, [id]: e.message }));
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const procedures = useMemo(
    () => [...new Set(appels.map((a) => a.type_procedure).filter(Boolean))],
    [appels]
  );
  const organismes = useMemo(
    () => [...new Set(appels.map((a) => a.organisme).filter(Boolean))],
    [appels]
  );

  const filtered = useMemo(() => {
    return appels
      .filter((a) => statutFilter === "tous" || a.statut === statutFilter)
      .filter((a) => procedureFilter === "tous" || a.type_procedure === procedureFilter)
      .filter((a) => organismeFilter === "tous" || a.organisme === organismeFilter)
      .filter((a) => {
        if (!dateFrom && !dateTo) return true;
        if (!a.date_limite_remise) return false;
        const d = a.date_limite_remise.slice(0, 10);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      })
      .filter((a) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          a.objet?.toLowerCase().includes(q) ||
          a.organisme?.toLowerCase().includes(q) ||
          a.reference?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (!a.date_limite_remise) return 1;
        if (!b.date_limite_remise) return -1;
        return new Date(a.date_limite_remise) - new Date(b.date_limite_remise);
      });
  }, [appels, statutFilter, procedureFilter, organismeFilter, dateFrom, dateTo, search]);

  const kpis = useMemo(() => {
    const c = { nouveau: 0, analyse: 0, interesse: 0, ignore: 0 };
    appels.forEach((a) => { c[a.statut] = (c[a.statut] || 0) + 1; });
    return c;
  }, [appels]);

  return (
    <div style={{ padding: "28px clamp(20px, 4vw, 48px)", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 26, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: C.ink, margin: 0 }}>
            Marchés publics
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.mute, margin: "4px 0 0" }}>
            Veille intelligente des appels d'offres.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
              color: "#fff", background: syncing ? C.faint : C.accent, border: "none", borderRadius: C.radius,
              padding: "10px 16px", cursor: syncing ? "default" : "pointer", boxShadow: C.shadow,
              transition: "background 200ms ease",
            }}
          >
            <RefreshCw size={15} style={{ animation: syncing ? "sis-spin 900ms linear infinite" : "none" }} />
            {syncing ? "Synchronisation en cours…" : "Synchroniser"}
          </button>
          <style>{`@keyframes sis-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

          {syncResult && (
            <span style={{ fontFamily: FONT, fontSize: 12, color: C.success, display: "flex", alignItems: "center", gap: 5 }}>
              <CheckCircle2 size={13} />
              {syncResult.nb_nouveaux} nouveau{syncResult.nb_nouveaux > 1 ? "x" : ""} sur {syncResult.nb_trouves} trouvé{syncResult.nb_trouves > 1 ? "s" : ""}
            </span>
          )}
          {syncError && (
            <span style={{ fontFamily: FONT, fontSize: 12, color: C.danger, display: "flex", alignItems: "center", gap: 5 }}>
              <AlertCircle size={13} /> {syncError}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { label: "Nouveaux", value: kpis.nouveau },
          { label: "Analysés", value: kpis.analyse },
          { label: "Retenus", value: kpis.interesse },
          { label: "Ignorés", value: kpis.ignore },
        ].map((k) => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "14px 16px" }}>
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.4 }}>{k.label}</p>
            {loading ? <Skeleton width={36} height={22} /> : (
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: C.ink, margin: 0 }}>{k.value}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 0 }}>
          <Search size={15} color={C.faint} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un appel d'offres…"
            style={{
              width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "10px 14px 10px 38px",
              borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <FilterPill label="Statut" value={statutFilter} onChange={setStatutFilter}
          options={[["tous", "Tous"], ...Object.entries(STATUT_LABELS)]} />
        <FilterPill label="Procédure" value={procedureFilter} onChange={setProcedureFilter}
          options={[["tous", "Toutes"], ...procedures.map((p) => [p, p])]} />
        <FilterPill label="Organisme" value={organismeFilter} onChange={setOrganismeFilter}
          options={[["tous", "Tous"], ...organismes.map((o) => [o, o])]} />
        <DateFilter dateFrom={dateFrom} dateTo={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
        <div title="Bientôt disponible" style={{ ...pillStyle, opacity: 0.45, cursor: "default" }}>Pertinence IA</div>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 18 }}>
              <Skeleton width="40%" height={11} style={{ marginBottom: 12 }} />
              <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="70%" height={16} style={{ marginBottom: 16 }} />
              <Skeleton width="60%" height={12} style={{ marginBottom: 6 }} />
              <Skeleton width="50%" height={12} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.danger, fontFamily: FONT, fontSize: 13.5 }}>
          <AlertCircle size={22} style={{ marginBottom: 8 }} />
          <p>{error}</p>
          <button onClick={load} style={{ ...pillStyle, marginTop: 10, cursor: "pointer" }}>Réessayer</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "70px 20px", color: C.faint, fontFamily: FONT }}>
          <Inbox size={26} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0 }}>Aucun appel d'offres ne correspond à ces critères.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {filtered.map((a) => {
            const jours = joursRestants(a.date_limite_remise);
            const urgent = jours !== null && jours <= 5 && jours >= 0;
            const st = STATUT_COLORS[a.statut] || STATUT_COLORS.nouveau;
            const isDownloading = downloadingIds.has(a.id);

            return (
              <div
                key={a.id}
                style={{
                  background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 18,
                  display: "flex", flexDirection: "column", gap: 10, transition: "box-shadow 200ms ease, transform 200ms ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                onClick={() => navigate(`/marches/${a.id}`)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: FONT, fontSize: 11, color: C.faint, fontWeight: 500 }}>{a.reference}</span>
                  <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: st.text, background: st.bg, padding: "3px 9px", borderRadius: 20 }}>
                    {STATUT_LABELS[a.statut] || a.statut}
                  </span>
                </div>

                <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {a.objet || "Objet non communiqué"}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, color: C.mute }}>
                  <Building2 size={13} /> {a.organisme || "Organisme non communiqué"}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: FONT, fontSize: 12.5, color: urgent ? C.danger : C.mute, fontWeight: urgent ? 600 : 400 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={13} /> {fmtDate(a.date_limite_remise)}{jours !== null && jours >= 0 ? ` (J-${jours})` : ""}
                  </span>
                  <span style={{ fontSize: 11.5, color: C.faint }}>{a.type_procedure || "—"}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 11.5, color: C.faint, background: C.paper, borderRadius: 8, padding: "7px 10px" }}>
                  <Sparkles size={13} /> Analyse IA bientôt disponible
                </div>

                {downloadErrors[a.id] && (
                  <span style={{ fontFamily: FONT, fontSize: 11, color: C.danger }}>{downloadErrors[a.id]}</span>
                )}

                <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                  <CardAction icon={FileText} label="Voir" onClick={() => navigate(`/marches/${a.id}`)} />
                  {a.url_cps ? (
                    <a href={resolveFileUrl(a.url_cps)} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                      <CardAction icon={Download} label="Dossier" />
                    </a>
                  ) : (
                    <CardAction icon={Download} label={isDownloading ? "…" : "Récupérer"} disabled={isDownloading} onClick={() => handleDownload(a.id)} />
                  )}
                  {a.statut === "ignore" ? (
                    <CardAction icon={RotateCcw} label="Réactiver" onClick={() => handleReactiver(a.id)} />
                  ) : (
                    <CardAction icon={EyeOff} label="Ignorer" onClick={() => setConfirmIgnorerId(a.id)} />
                  )}
                  <CardAction primary label="Je suis intéressé" onClick={() => setInteresseAppel(a)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmIgnorerId !== null && (
        <ConfirmModal
          title="Ignorer cet appel d'offres ?"
          message="Il sortira de la liste principale mais restera consultable via le filtre « Ignorés », réversible à tout moment."
          confirmLabel="Ignorer"
          onCancel={() => setConfirmIgnorerId(null)}
          onConfirm={() => handleIgnorer(confirmIgnorerId)}
        />
      )}

      {interesseAppel && (
        <InteresseModal
          appel={interesseAppel}
          onClose={() => setInteresseAppel(null)}
          onSuccess={(projet) => navigate(`/projects/${projet.id}`)}
        />
      )}
    </div>
  );
}

function DateFilter({ dateFrom, dateTo, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const hasValue = dateFrom || dateTo;
  const label = hasValue
    ? `${dateFrom ? fmtDate(dateFrom) : "…"} → ${dateTo ? fmtDate(dateTo) : "…"}`
    : "Date limite";

  function preset(days) {
    const today = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    onChange(isoDate(today), isoDate(end));
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ ...pillStyle, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: hasValue ? C.accent : C.ink, borderColor: hasValue ? C.accent : C.line }}
      >
        <Calendar size={13} /> {label} <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
          background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, boxShadow: C.shadow,
          padding: 16, width: 260, animation: "sis-pop-in 160ms ease",
        }}>
          <style>{`@keyframes sis-pop-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 10px" }}>
            Raccourcis
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            <PresetBtn label="7 prochains jours" onClick={() => preset(7)} />
            <PresetBtn label="Ce mois-ci" onClick={() => preset(30)} />
            <PresetBtn label="Urgent (≤ 5j)" onClick={() => preset(5)} />
          </div>

          <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 10px" }}>
            Plage personnalisée
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontFamily: FONT, fontSize: 12, color: C.mute }}>
              Du
              <input type="date" value={dateFrom} onChange={(e) => onChange(e.target.value, dateTo)}
                style={dateInputStyle} />
            </label>
            <label style={{ fontFamily: FONT, fontSize: 12, color: C.mute }}>
              Au
              <input type="date" value={dateTo} onChange={(e) => onChange(dateFrom, e.target.value)}
                style={dateInputStyle} />
            </label>
          </div>

          {hasValue && (
            <button onClick={() => { onChange("", ""); setOpen(false); }} style={{ ...linkBtnStyle, marginTop: 12 }}>
              Réinitialiser
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PresetBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: FONT, fontSize: 12, fontWeight: 500, color: C.ink,
      background: C.paper, border: `1px solid ${C.line}`, borderRadius: 20, padding: "6px 11px", cursor: "pointer",
    }}>
      {label}
    </button>
  );
}

const dateInputStyle = {
  display: "block", width: "100%", marginTop: 4, fontFamily: FONT, fontSize: 13, color: C.ink,
  padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.paper,
  outline: "none", boxSizing: "border-box",
};
const linkBtnStyle = {
  fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.danger, background: "none",
  border: "none", cursor: "pointer", padding: 0,
};

function FilterPill({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...pillStyle, cursor: "pointer", appearance: "none" }}
    >
      {options.map(([val, lbl]) => (
        <option key={val} value={val}>{label} — {lbl}</option>
      ))}
    </select>
  );
}

const pillStyle = {
  fontFamily: FONT, fontSize: 12.5, fontWeight: 500, color: C.ink,
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 999,
  padding: "9px 14px",
};

function CardAction({ icon: Icon, label, onClick, disabled, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 5, fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
        color: primary ? "#fff" : disabled ? C.faint : C.mute,
        background: primary ? C.accent : "transparent",
        border: primary ? "none" : `1px solid ${C.line}`,
        borderRadius: 7, padding: "6px 10px", cursor: disabled ? "default" : "pointer",
      }}
    >
      {Icon && <Icon size={12.5} />} {label}
    </button>
  );
}