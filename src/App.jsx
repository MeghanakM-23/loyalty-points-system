import { useState, useEffect, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const TIERS = [
  { name: "Bronze",   min: 0,    max: 999,   color: "#CD7F32", bg: "#FDF3E7", emoji: "🥉" },
  { name: "Silver",   min: 1000, max: 4999,  color: "#A8A9AD", bg: "#F5F5F5", emoji: "🥈" },
  { name: "Gold",     min: 5000, max: 14999, color: "#D4A853", bg: "#FDF8EC", emoji: "🥇" },
  { name: "Platinum", min: 15000, max: Infinity, color: "#6366F1", bg: "#EEF2FF", emoji: "💎" },
];

const BONUS_TYPES = [
  { id: "birthday",  label: "Birthday Bonus",    multiplier: 3,   icon: "🎂" },
  { id: "referral",  label: "Referral Reward",   flat: 500,       icon: "👥" },
  { id: "milestone", label: "Milestone Bonus",   flat: 1000,      icon: "🏆" },
  { id: "double",    label: "Double Points Day",  multiplier: 2,  icon: "⚡" },
  { id: "welcome",   label: "Welcome Bonus",     flat: 250,       icon: "🎉" },
];

const SPEND_RATE = 10; // 10 points per $1 spend

const SAMPLE_CUSTOMERS = [
  { id: 1, name: "Priya Sharma",    points: 12450, transactions: [] },
  { id: 2, name: "James Okonkwo",   points: 3200,  transactions: [] },
  { id: 3, name: "Elena Vasquez",   points: 890,   transactions: [] },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getTier(points) {
  return TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0];
}

function getNextTier(points) {
  const idx = TIERS.findIndex(t => points >= t.min && points <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

function tierProgress(points) {
  const tier = getTier(points);
  if (tier.max === Infinity) return 100;
  return Math.round(((points - tier.min) / (tier.max - tier.min + 1)) * 100);
}

function fmt(n) { return n.toLocaleString(); }
function fmtCurrency(n) { return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

const initialCustomers = () => {
  try {
    const saved = localStorage.getItem("loyaltyCustomers");
    if (saved) return JSON.parse(saved);
  } catch {}
  return SAMPLE_CUSTOMERS.map(c => ({ ...c, transactions: [] }));
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function TierRing({ points }) {
  const progress = tierProgress(points);
  const tier = getTier(points);
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;

  return (
    <div style={{ position: "relative", width: 128, height: 128 }}>
      <svg width={128} height={128} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8E0D0" strokeWidth={10} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={tier.color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>{tier.emoji}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: tier.color, marginTop: 2, letterSpacing: "0.05em" }}>
          {tier.name.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 999,
      background: type === "error" ? "#FEE2E2" : "#D1FAE5",
      border: `1px solid ${type === "error" ? "#FCA5A5" : "#6EE7B7"}`,
      color: type === "error" ? "#991B1B" : "#065F46",
      padding: "12px 20px", borderRadius: 10,
      fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      animation: "slideUp 0.25s ease"
    }}>
      {message}
    </div>
  );
}

function CustomerCard({ customer, selected, onClick }) {
  const tier = getTier(customer.points);
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left",
      background: selected ? "#FDF8EC" : "white",
      border: `2px solid ${selected ? "#D4A853" : "#EDE8E0"}`,
      borderRadius: 12, padding: "14px 16px",
      cursor: "pointer", transition: "all 0.18s ease",
      fontFamily: "Inter, sans-serif",
      boxShadow: selected ? "0 2px 12px rgba(212,168,83,0.18)" : "0 1px 3px rgba(0,0,0,0.06)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#0F1B2D" }}>{customer.name}</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            {fmt(customer.points)} pts · {tier.emoji} {tier.name}
          </div>
        </div>
        <div style={{
          background: tier.bg, color: tier.color,
          fontSize: 11, fontWeight: 700, padding: "3px 8px",
          borderRadius: 20, letterSpacing: "0.05em"
        }}>{tier.name.toUpperCase()}</div>
      </div>
    </button>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function LoyaltyApp() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedId, setSelectedId] = useState(1);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Add Customer form
  const [newName, setNewName] = useState("");
  const [newNameErr, setNewNameErr] = useState("");

  // Spend form
  const [spendAmt, setSpendAmt] = useState("");
  const [spendDesc, setSpendDesc] = useState("");
  const [spendErr, setSpendErr] = useState("");

  // Bonus form
  const [bonusType, setBonusType] = useState(BONUS_TYPES[0].id);

  // Toast
  const [toast, setToast] = useState(null);

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem("loyaltyCustomers", JSON.stringify(customers)); } catch {}
  }, [customers]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const customer = customers.find(c => c.id === selectedId);

  function addCustomer() {
    const name = newName.trim();
    if (!name) { setNewNameErr("Customer name is required."); return; }
    if (name.length < 2) { setNewNameErr("Name must be at least 2 characters."); return; }
    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setNewNameErr("A customer with this name already exists."); return;
    }
    const id = Math.max(...customers.map(c => c.id), 0) + 1;
    const nc = { id, name, points: 0, transactions: [] };
    setCustomers(prev => [...prev, nc]);
    setSelectedId(id);
    setNewName("");
    setNewNameErr("");
    showToast(`${name} added successfully!`);
  }

  function recordSpend() {
    const val = parseFloat(spendAmt);
    if (!spendAmt || isNaN(val) || val <= 0) { setSpendErr("Enter a valid spend amount greater than $0."); return; }
    if (val > 100000) { setSpendErr("Spend amount cannot exceed $100,000 per transaction."); return; }
    const earned = Math.round(val * SPEND_RATE);
    const desc = spendDesc.trim() || "Purchase";
    const tx = { id: Date.now(), type: "spend", label: desc, amount: val, points: earned, date: new Date().toISOString() };
    setCustomers(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, points: c.points + earned, transactions: [tx, ...c.transactions].slice(0, 50) }
        : c
    ));
    setSpendAmt("");
    setSpendDesc("");
    setSpendErr("");
    showToast(`+${fmt(earned)} points earned from ${fmtCurrency(val)} spend!`);
  }

  function applyBonus() {
    const bonus = BONUS_TYPES.find(b => b.id === bonusType);
    let earned;
    let label;
    if (bonus.flat) {
      earned = bonus.flat;
      label = bonus.label;
    } else {
      // multiplier applies to last spend, or a base of 100 if no history
      const lastSpend = customer.transactions.find(t => t.type === "spend");
      const base = lastSpend ? lastSpend.points : 100;
      earned = Math.round(base * (bonus.multiplier - 1)); // add the extra
      label = `${bonus.label} (${bonus.multiplier}x on last purchase)`;
    }
    const tx = { id: Date.now(), type: "bonus", label, points: earned, date: new Date().toISOString() };
    setCustomers(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, points: c.points + earned, transactions: [tx, ...c.transactions].slice(0, 50) }
        : c
    ));
    showToast(`${bonus.icon} ${bonus.label}: +${fmt(earned)} bonus points!`);
  }

  function redeemPoints() {
    if (!customer || customer.points < 100) {
      showToast("Minimum 100 points required to redeem.", "error"); return;
    }
    const redeem = Math.min(customer.points, Math.floor(customer.points / 100) * 100);
    const cashValue = redeem / 100;
    const tx = { id: Date.now(), type: "redeem", label: `Redeemed for ${fmtCurrency(cashValue)} credit`, points: -redeem, date: new Date().toISOString() };
    setCustomers(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, points: c.points - redeem, transactions: [tx, ...c.transactions].slice(0, 50) }
        : c
    ));
    showToast(`Redeemed ${fmt(redeem)} pts for ${fmtCurrency(cashValue)} credit!`);
  }

  function resetCustomer() {
    if (!window.confirm(`Reset all points and history for ${customer.name}?`)) return;
    setCustomers(prev => prev.map(c =>
      c.id === selectedId ? { ...c, points: 0, transactions: [] } : c
    ));
    showToast(`${customer.name}'s account reset.`);
  }

  const tier = customer ? getTier(customer.points) : TIERS[0];
  const nextTier = customer ? getNextTier(customer.points) : null;
  const progress = customer ? tierProgress(customer.points) : 0;
  const ptsToNext = nextTier ? nextTier.min - (customer?.points || 0) : 0;

  const totalEarned = customer?.transactions.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0) || 0;
  const totalRedeemed = customer?.transactions.filter(t => t.points < 0).reduce((s, t) => s + Math.abs(t.points), 0) || 0;
  const cashValue = Math.floor((customer?.points || 0) / 100);

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "earn",      label: "Earn Points" },
    { id: "history",   label: "History" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F1B2D 0%, #1A2E4A 60%, #0F1B2D 100%)",
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      color: "#0F1B2D",
      padding: "24px 16px",
      boxSizing: "border-box"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, button:focus-visible {
          outline: 2px solid #D4A853; outline-offset: 2px;
        }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .tx-row { animation: fadeIn 0.25s ease; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 920, margin: "0 auto 28px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900,
            color: "#F5F0E8", margin: 0, letterSpacing: "-0.02em"
          }}>Loyalty<span style={{ color: "#D4A853" }}>+</span></h1>
          <span style={{ fontSize: 13, color: "#94A3B8", letterSpacing: "0.12em", fontWeight: 500 }}>
            REWARDS PLATFORM
          </span>
        </div>
        <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0", letterSpacing: "0.02em" }}>
          {SPEND_RATE} points per $1 spent · 100 pts = $1 credit
        </p>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", gap: 20, flexWrap: "wrap" }}>

        {/* LEFT: Customer List */}
        <div style={{ flex: "0 0 240px", minWidth: 220 }}>
          <div style={{
            background: "white", borderRadius: 16, padding: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 14 }}>
              CUSTOMERS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {customers.map(c => (
                <CustomerCard
                  key={c.id} customer={c}
                  selected={c.id === selectedId}
                  onClick={() => setSelectedId(c.id)}
                />
              ))}
            </div>

            {/* Add customer */}
            <div style={{ borderTop: "1px solid #EDE8E0", paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 10 }}>
                ADD CUSTOMER
              </div>
              <input
                value={newName}
                onChange={e => { setNewName(e.target.value); setNewNameErr(""); }}
                onKeyDown={e => e.key === "Enter" && addCustomer()}
                placeholder="Full name"
                style={{
                  width: "100%", padding: "9px 12px",
                  border: `1.5px solid ${newNameErr ? "#FCA5A5" : "#EDE8E0"}`,
                  borderRadius: 8, fontSize: 13, marginBottom: 6,
                  outline: "none", transition: "border-color 0.15s"
                }}
              />
              {newNameErr && <div style={{ color: "#DC2626", fontSize: 11, marginBottom: 6 }}>{newNameErr}</div>}
              <button
                onClick={addCustomer}
                style={{
                  width: "100%", background: "#0F1B2D", color: "white",
                  border: "none", borderRadius: 8, padding: "9px",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "background 0.15s"
                }}
                onMouseEnter={e => e.target.style.background = "#1E3A5F"}
                onMouseLeave={e => e.target.style.background = "#0F1B2D"}
              >
                + Add Customer
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Main Panel */}
        {customer && (
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: 4, width: "fit-content" }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: "7px 16px", borderRadius: 7, border: "none",
                  background: activeTab === tab.id ? "white" : "transparent",
                  color: activeTab === tab.id ? "#0F1B2D" : "#94A3B8",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "Inter, sans-serif"
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                {/* Hero points card */}
                <div style={{
                  background: `linear-gradient(135deg, #0F1B2D, #1E3A5F)`,
                  borderRadius: 20, padding: "28px 28px 24px",
                  marginBottom: 16, position: "relative", overflow: "hidden",
                  boxShadow: "0 12px 40px rgba(15,27,45,0.5)"
                }}>
                  {/* Gold shimmer accent */}
                  <div style={{
                    position: "absolute", top: -40, right: -40,
                    width: 200, height: 200,
                    background: "radial-gradient(circle, rgba(212,168,83,0.15) 0%, transparent 70%)",
                    borderRadius: "50%", pointerEvents: "none"
                  }}/>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6 }}>
                        REWARDS BALANCE · {customer.name.toUpperCase()}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "clamp(40px, 7vw, 64px)", fontWeight: 900,
                          color: "#D4A853", lineHeight: 1
                        }}>
                          {fmt(customer.points)}
                        </span>
                        <span style={{ color: "#64748B", fontSize: 16, fontWeight: 500 }}>pts</span>
                      </div>
                      <div style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>
                        ≈ <strong style={{ color: "#F5F0E8" }}>${fmt(cashValue)}</strong> redeemable credit
                      </div>
                    </div>
                    <TierRing points={customer.points} />
                  </div>

                  {/* Tier progress bar */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600 }}>
                        {tier.emoji} {tier.name} Tier
                      </span>
                      {nextTier ? (
                        <span style={{ color: "#64748B", fontSize: 11 }}>
                          {fmt(ptsToNext)} pts to {nextTier.emoji} {nextTier.name}
                        </span>
                      ) : (
                        <span style={{ color: "#D4A853", fontSize: 11, fontWeight: 600 }}>✦ Max Tier Reached</span>
                      )}
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${progress}%`,
                        background: `linear-gradient(90deg, ${tier.color}, ${tier.color}CC)`,
                        borderRadius: 3, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)"
                      }}/>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Total Earned",    value: fmt(totalEarned),   suffix: "pts", color: "#059669" },
                    { label: "Total Redeemed",  value: fmt(totalRedeemed), suffix: "pts", color: "#DC2626" },
                    { label: "Transactions",    value: customer.transactions.length, suffix: "",   color: "#6366F1" },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: "white", borderRadius: 12, padding: "14px 16px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>
                        {stat.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>
                        {stat.value}<span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", marginLeft: 3 }}>{stat.suffix}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tier guide */}
                <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 14 }}>
                    TIER OVERVIEW
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {TIERS.map(t => {
                      const isActive = t.name === tier.name;
                      return (
                        <div key={t.name} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 14px", borderRadius: 9,
                          background: isActive ? t.bg : "#FAFAF8",
                          border: `1.5px solid ${isActive ? t.color + "60" : "#EDE8E0"}`
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{t.emoji}</span>
                            <span style={{ fontWeight: isActive ? 700 : 500, fontSize: 14, color: isActive ? t.color : "#4B5563" }}>
                              {t.name}
                            </span>
                            {isActive && <span style={{ fontSize: 10, background: t.color, color: "white", padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>CURRENT</span>}
                          </div>
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                            {t.max === Infinity ? `${fmt(t.min)}+` : `${fmt(t.min)} – ${fmt(t.max)}`} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Redeem + Reset */}
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button
                    onClick={redeemPoints}
                    disabled={!customer || customer.points < 100}
                    style={{
                      flex: 1, padding: "11px",
                      background: customer.points >= 100 ? "linear-gradient(135deg, #D4A853, #E8C470)" : "#EDE8E0",
                      color: customer.points >= 100 ? "white" : "#9CA3AF",
                      border: "none", borderRadius: 10, fontWeight: 700,
                      fontSize: 13, cursor: customer.points >= 100 ? "pointer" : "not-allowed",
                      fontFamily: "Inter, sans-serif", transition: "opacity 0.15s"
                    }}
                  >
                    Redeem Points (${fmt(cashValue)} value)
                  </button>
                  <button
                    onClick={resetCustomer}
                    style={{
                      padding: "11px 16px",
                      background: "white", color: "#DC2626",
                      border: "1.5px solid #FCA5A5", borderRadius: 10,
                      fontWeight: 600, fontSize: 13, cursor: "pointer",
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* EARN TAB */}
            {activeTab === "earn" && (
              <div style={{ animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Spend card */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 16 }}>
                    RECORD PURCHASE
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 120px" }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 5 }}>
                        Spend Amount ($)
                      </label>
                      <input
                        type="number" min="0.01" step="0.01"
                        value={spendAmt}
                        onChange={e => { setSpendAmt(e.target.value); setSpendErr(""); }}
                        onKeyDown={e => e.key === "Enter" && recordSpend()}
                        placeholder="0.00"
                        style={{
                          width: "100%", padding: "10px 12px",
                          border: `1.5px solid ${spendErr ? "#FCA5A5" : "#EDE8E0"}`,
                          borderRadius: 8, fontSize: 14, outline: "none"
                        }}
                      />
                    </div>
                    <div style={{ flex: "2 1 160px" }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 5 }}>
                        Description (optional)
                      </label>
                      <input
                        value={spendDesc}
                        onChange={e => setSpendDesc(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && recordSpend()}
                        placeholder="e.g. Dining, Shopping"
                        style={{
                          width: "100%", padding: "10px 12px",
                          border: "1.5px solid #EDE8E0",
                          borderRadius: 8, fontSize: 14, outline: "none"
                        }}
                      />
                    </div>
                  </div>
                  {spendErr && <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 8 }}>{spendErr}</div>}
                  {spendAmt && !isNaN(parseFloat(spendAmt)) && parseFloat(spendAmt) > 0 && (
                    <div style={{
                      background: "#F0FDF4", border: "1px solid #6EE7B7",
                      borderRadius: 8, padding: "8px 12px", fontSize: 13,
                      color: "#065F46", marginBottom: 10, fontWeight: 500
                    }}>
                      Earns <strong>{fmt(Math.round(parseFloat(spendAmt) * SPEND_RATE))} points</strong> for {fmtCurrency(parseFloat(spendAmt))} spend
                    </div>
                  )}
                  <button
                    onClick={recordSpend}
                    style={{
                      width: "100%", padding: "11px",
                      background: "linear-gradient(135deg, #0F1B2D, #1E3A5F)",
                      color: "white", border: "none", borderRadius: 10,
                      fontWeight: 700, fontSize: 14, cursor: "pointer",
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    Record Purchase →
                  </button>
                </div>

                {/* Bonus card */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 16 }}>
                    APPLY BONUS
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {BONUS_TYPES.map(b => (
                      <label key={b.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                        background: bonusType === b.id ? "#FDF8EC" : "#FAFAF8",
                        border: `1.5px solid ${bonusType === b.id ? "#D4A853" : "#EDE8E0"}`,
                        transition: "all 0.15s"
                      }}>
                        <input
                          type="radio" name="bonusType" value={b.id}
                          checked={bonusType === b.id}
                          onChange={() => setBonusType(b.id)}
                          style={{ accentColor: "#D4A853" }}
                        />
                        <span style={{ fontSize: 20 }}>{b.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#0F1B2D" }}>{b.label}</div>
                          <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                            {b.flat ? `+${fmt(b.flat)} flat bonus` : `${b.multiplier}× multiplier on last purchase`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={applyBonus}
                    style={{
                      width: "100%", padding: "11px",
                      background: "linear-gradient(135deg, #D4A853, #E8C470)",
                      color: "white", border: "none", borderRadius: 10,
                      fontWeight: 700, fontSize: 14, cursor: "pointer",
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    Apply Bonus ✦
                  </button>
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 16 }}>
                    TRANSACTION HISTORY · {customer.transactions.length} records
                  </div>
                  {customer.transactions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>No transactions yet</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Record a purchase or apply a bonus to get started.</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {customer.transactions.map(tx => {
                        const isRedeem = tx.points < 0;
                        const isBonus  = tx.type === "bonus";
                        const color = isRedeem ? "#DC2626" : isBonus ? "#6366F1" : "#059669";
                        const bgColor = isRedeem ? "#FEF2F2" : isBonus ? "#EEF2FF" : "#F0FDF4";
                        const icon = isRedeem ? "💳" : isBonus ? "⭐" : "🛍";
                        return (
                          <div key={tx.id} className="tx-row" style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 14px", borderRadius: 10, background: bgColor,
                            marginBottom: 4
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 20 }}>{icon}</span>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#0F1B2D" }}>{tx.label}</div>
                                <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                  {new Date(tx.date).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric",
                                    hour: "2-digit", minute: "2-digit"
                                  })}
                                  {tx.amount && ` · ${fmtCurrency(tx.amount)}`}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color }}>
                              {tx.points > 0 ? "+" : ""}{fmt(tx.points)} pts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
