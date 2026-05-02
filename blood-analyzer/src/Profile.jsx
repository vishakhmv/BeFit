import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh","Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function Profile({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("User");
  const [nameInput, setNameInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [diet, setDiet] = useState(null);
  const [state, setState] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const nameRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setExpanded(false);
      fetch("http://localhost:5000/profile", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.name) setName(d.name);
          if (d.diet_preference) setDiet(d.diet_preference);
          if (d.state) setState(d.state);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.focus();
  }, [editingName]);

  const saveField = async (payload, successMsg) => {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) flash(successMsg);
    } catch {}
    setSaving(false);
  };

  const handleNameSave = async () => {
    if (!nameInput.trim()) { setEditingName(false); return; }
    await saveField({ name: nameInput.trim() }, "Name updated!");
    setName(nameInput.trim());
    setEditingName(false);
  };

  const handleDietSave = async (val) => {
    setDiet(val);
    await saveField({ diet_preference: val }, "Diet preference saved!");
  };

  const handleStateSave = async (val) => {
    setState(val);
    await saveField({ state: val }, "State saved!");
  };

  const handleLogout = async () => {
    await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" });
    navigate("/login");
  };

  const flash = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="pf-backdrop" onClick={onClose}>
      <div
        className={`pf-panel ${expanded ? "pf-expanded" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Compact header ── */}
        <div className="pf-header">
          <div className="pf-header-left" onClick={() => setExpanded((p) => !p)}>
            <div className="pf-avatar-wrap">
              <svg viewBox="0 0 44 44" className="pf-avatar-svg">
                <circle cx="22" cy="22" r="22" fill="#2c5f63" />
                <circle cx="22" cy="17" r="7" fill="rgba(255,255,255,0.85)" />
                <ellipse cx="22" cy="36" rx="13" ry="9" fill="rgba(255,255,255,0.85)" />
              </svg>
            </div>
            <div className="pf-header-text">
              <span className="pf-name">{name}</span>
              <span className="pf-subtitle">
                {diet === "veg" ? "🥦 Vegetarian" : diet === "nonveg" ? "🍗 Non-veg" : "View profile"}
              </span>
            </div>
            <span className="pf-chevron">{expanded ? "▲" : "▼"}</span>
          </div>
          <button className="pf-x" onClick={onClose} aria-label="close">✕</button>
        </div>

        {/* ── Expanded body ── */}
        {expanded && (
          <div className="pf-body">
            {saveMsg && <div className="pf-toast">{saveMsg}</div>}

            <div className="pf-avatar-section">
              <svg viewBox="0 0 80 80" className="pf-avatar-lg-svg">
                <circle cx="40" cy="40" r="40" fill="#2c5f63" />
                <circle cx="40" cy="30" r="13" fill="rgba(255,255,255,0.85)" />
                <ellipse cx="40" cy="65" rx="23" ry="16" fill="rgba(255,255,255,0.85)" />
              </svg>
            </div>

            {/* Name */}
            <div className="pf-field">
              <label className="pf-label">Name</label>
              {editingName ? (
                <div className="pf-edit-row">
                  <input ref={nameRef} className="pf-input" value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                    placeholder={name} />
                  <button className="pf-btn-save" onClick={handleNameSave} disabled={saving}>Save</button>
                  <button className="pf-btn-cancel" onClick={() => setEditingName(false)}>✕</button>
                </div>
              ) : (
                <div className="pf-field-row">
                  <span className="pf-field-value">{name}</span>
                  <button className="pf-btn-edit" onClick={() => { setNameInput(name); setEditingName(true); }}>Edit</button>
                </div>
              )}
            </div>

            {/* State */}
            <div className="pf-field">
              <label className="pf-label">State</label>
              <select
                className="pf-select"
                value={state}
                onChange={(e) => handleStateSave(e.target.value)}
              >
                <option value="">Select your state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Diet */}
            <div className="pf-field">
              <label className="pf-label">Diet Preference</label>
              <div className="pf-diet-toggle">
                <button className={`pf-diet-btn ${diet === "veg" ? "active-veg" : ""}`}
                  onClick={() => handleDietSave("veg")}>🥦 Veg</button>
                <button className={`pf-diet-btn ${diet === "nonveg" ? "active-nonveg" : ""}`}
                  onClick={() => handleDietSave("nonveg")}>🍗 Non-Veg</button>
              </div>
            </div>

            <button className="pf-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}