import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];

export default function Profile({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [name, setName] = useState("User");
  const [nameInput, setNameInput] = useState("");
  const [editingName, setEditingName] = useState(false);

  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);

  const [dob, setDob] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [editingDob, setEditingDob] = useState(false);

  const [gender, setGender] = useState(null);
  const [diet, setDiet] = useState(null);
  const [state, setState] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const dobRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetch("http://localhost:5000/profile", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.name) setName(d.name);
          if (d.email) setEmail(d.email);
          if (d.phone) setPhone(d.phone);
          if (d.dob) setDob(d.dob);
          if (d.gender) setGender(d.gender);
          if (d.diet_preference) setDiet(d.diet_preference);
          if (d.state) setState(d.state);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => { if (editingName && nameRef.current) nameRef.current.focus(); }, [editingName]);
  useEffect(() => { if (editingEmail && emailRef.current) emailRef.current.focus(); }, [editingEmail]);
  useEffect(() => { if (editingPhone && phoneRef.current) phoneRef.current.focus(); }, [editingPhone]);
  useEffect(() => { if (editingDob && dobRef.current) dobRef.current.focus(); }, [editingDob]);

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

  const handleEmailSave = async () => {
    if (!emailInput.trim()) { setEditingEmail(false); return; }
    await saveField({ email: emailInput.trim() }, "Email updated!");
    setEmail(emailInput.trim());
    setEditingEmail(false);
  };

  const handlePhoneSave = async () => {
    if (!phoneInput.trim()) { setEditingPhone(false); return; }
    await saveField({ phone: phoneInput.trim() }, "Phone number updated!");
    setPhone(phoneInput.trim());
    setEditingPhone(false);
  };

  const handleDobSave = async () => {
    if (!dobInput.trim()) { setEditingDob(false); return; }
    await saveField({ dob: dobInput.trim() }, "Date of birth updated!");
    setDob(dobInput.trim());
    setEditingDob(false);
  };

  const handleGenderSave = async (val) => {
    setGender(val);
    await saveField({ gender: val }, "Gender saved!");
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

  const formatDob = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  if (!isOpen) return null;

  return (
    <div className="pf-backdrop" onClick={onClose}>
      <div className="pf-panel" onClick={(e) => e.stopPropagation()}>

        <div className="pf-header">
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
              {diet === "Veg" ? "🥦 Vegetarian" : diet === "Non-Veg" ? "🍗 Non-veg" : "View profile"}
            </span>
          </div>
          <button className="pf-x" onClick={onClose} aria-label="close">✕</button>
        </div>

        <div className="pf-body">
          {saveMsg && <div className="pf-toast">{saveMsg}</div>}

          <div className="pf-avatar-section">
            <svg viewBox="0 0 80 80" className="pf-avatar-lg-svg">
              <circle cx="40" cy="40" r="40" fill="#2c5f63" />
              <circle cx="40" cy="30" r="13" fill="rgba(255,255,255,0.85)" />
              <ellipse cx="40" cy="65" rx="23" ry="16" fill="rgba(255,255,255,0.85)" />
            </svg>
          </div>

          <div className="pf-field">
            <label className="pf-label">Name</label>
            {editingName ? (
              <div className="pf-edit-row">
                <input
                  ref={nameRef}
                  className="pf-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  placeholder={name}
                />
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

          <div className="pf-field">
            <label className="pf-label">Gmail</label>
            {editingEmail ? (
              <div className="pf-edit-row">
                <input
                  ref={emailRef}
                  className="pf-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSave()}
                  placeholder="you@gmail.com"
                />
                <button className="pf-btn-save" onClick={handleEmailSave} disabled={saving}>Save</button>
                <button className="pf-btn-cancel" onClick={() => setEditingEmail(false)}>✕</button>
              </div>
            ) : (
              <div className="pf-field-row">
                <span className={`pf-field-value ${!email ? "pf-empty" : ""}`}>{email || "Add email"}</span>
                <button className="pf-btn-edit" onClick={() => { setEmailInput(email); setEditingEmail(true); }}>Edit</button>
              </div>
            )}
          </div>

          <div className="pf-field">
            <label className="pf-label">Phone No.</label>
            {editingPhone ? (
              <div className="pf-edit-row">
                <input
                  ref={phoneRef}
                  className="pf-input"
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePhoneSave()}
                  placeholder="+91 XXXXX XXXXX"
                />
                <button className="pf-btn-save" onClick={handlePhoneSave} disabled={saving}>Save</button>
                <button className="pf-btn-cancel" onClick={() => setEditingPhone(false)}>✕</button>
              </div>
            ) : (
              <div className="pf-field-row">
                <span className={`pf-field-value ${!phone ? "pf-empty" : ""}`}>{phone || "Add phone number"}</span>
                <button className="pf-btn-edit" onClick={() => { setPhoneInput(phone); setEditingPhone(true); }}>Edit</button>
              </div>
            )}
          </div>

          <div className="pf-field">
            <label className="pf-label">Date of Birth</label>
            {editingDob ? (
              <div className="pf-edit-row">
                <input
                  ref={dobRef}
                  className="pf-input"
                  type="date"
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDobSave()}
                />
                <button className="pf-btn-save" onClick={handleDobSave} disabled={saving}>Save</button>
                <button className="pf-btn-cancel" onClick={() => setEditingDob(false)}>✕</button>
              </div>
            ) : (
              <div className="pf-field-row">
                <span className={`pf-field-value ${!dob ? "pf-empty" : ""}`}>{dob ? formatDob(dob) : "Add date of birth"}</span>
                <button className="pf-btn-edit" onClick={() => { setDobInput(dob); setEditingDob(true); }}>Edit</button>
              </div>
            )}
          </div>

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

          <div className="pf-field">
            <label className="pf-label">Gender</label>
            <div className="pf-gender-toggle">
              <button
                className={`pf-gender-btn ${gender === "Male" ? "active-male" : ""}`}
                onClick={() => handleGenderSave("Male")}
              >
                ♂ Male
              </button>
              <button
                className={`pf-gender-btn ${gender === "Female" ? "active-female" : ""}`}
                onClick={() => handleGenderSave("Female")}
              >
                ♀ Female
              </button>
            </div>
          </div>

          <div className="pf-field">
            <label className="pf-label">Diet Preference</label>
            <div className="pf-diet-toggle">
              <button
                className={`pf-diet-btn ${diet === "Veg" ? "active-veg" : ""}`}
                onClick={() => handleDietSave("Veg")}
              >
                🥦 Veg
              </button>
              <button
                className={`pf-diet-btn ${diet === "Non-Veg" ? "active-nonveg" : ""}`}
                onClick={() => handleDietSave("Non-Veg")}
              >
                🍗 Non-Veg
              </button>
            </div>
          </div>

          <button className="pf-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}