/* ═══════════════════════════════════════════════════════════════════════
   Master Waiters Investor Hub — Investor Registry & Auth System v2
   ═══════════════════════════════════════════════════════════════════════

   SCHEMA:
   - name        Display name
   - tier        Access level: "intro" | "materials" | "dataroom"
                   intro     → Layer 1 (public hub) only
                   materials → Layer 1 + Layer 2 (financial models, simulator)
                   dataroom  → Layer 1 + 2 + 3 (full Data Room) [Phase 2]
   - audience    Profile category for tailored messaging:
                   "general" | "advisor" | "chain_owner" | "angel"
                   "family_office" | "vc" | "strategic"
   - personal    Path to personal proposal HTML, or null
   - ndaSigned   NDA acceptance status (used in Layer 3, Phase 2)
   - active      Toggle to deactivate access without deleting
   - expires     ISO date string (YYYY-MM-DD)

   HOW TO ADD A NEW INVESTOR:
   1. Add an entry to INVESTORS below with their password
   2. Choose appropriate tier: most start with "materials"; only fully-qualified
      DD-stage investors get "dataroom". General invitees get "intro".
   3. Set audience for tailored messaging
   4. If they have a personalized proposal, point `personal` to the HTML file
   5. Deploy — the new credential works immediately

   SECURITY NOTE:
   This is a light gate (frontend-only). Anyone with browser dev tools
   can read this file and see all passwords. For real security,
   migrate to Netlify Identity or Auth0 in Phase 2 (Series A timing).
   For now, this is "filter against casual curiosity" + trust in invitees.
   ═══════════════════════════════════════════════════════════════════════ */

const INVESTORS = {
  // ─── Layer 1 only: introductory access (curious investors, early conversations) ───
  "general2026": {
    name: "Invited Investor",
    tier: "intro",
    audience: "general",
    personal: null,
    ndaSigned: false,
    active: true,
    expires: "2026-12-31"
  },

  // ─── Layer 1 + 2: approved investors (qualified by Luis personally) ───
  "materials2026": {
    name: "Approved Investor",
    tier: "materials",
    audience: "general",
    personal: null,
    ndaSigned: false,
    active: true,
    expires: "2026-12-31"
  },

  // ─── Personalized proposals (Layer 4) ───
  "diego2026": {
    name: "Diego Parra",
    tier: "materials",
    audience: "advisor",
    personal: "para-diego.html",
    ndaSigned: false,
    active: true,
    expires: "2026-07-01"
  }

  // ─── To add a new investor, just append here: ───
  // "newinvestor2026": {
  //   name: "Their Name",
  //   tier: "materials",                   // or "intro" / "dataroom"
  //   audience: "vc",                      // or "family_office" / "angel" / etc.
  //   personal: "para-newinvestor.html",   // or null
  //   ndaSigned: false,
  //   active: true,
  //   expires: "2026-12-31"
  // }
};

/* ═══════════════════════════════════════════════════════════════════════
   TIER HIERARCHY
   ═══════════════════════════════════════════════════════════════════════ */

const TIER_LEVELS = {
  "intro": 1,
  "materials": 2,
  "dataroom": 3
};

/**
 * Check if a session's tier meets or exceeds a required tier.
 * @param {object} session - Session object from mwGetSession()
 * @param {string} requiredTier - "intro" | "materials" | "dataroom"
 * @returns {boolean}
 */
function mwHasTier(session, requiredTier) {
  if (!session || !session.tier) return false;
  const userLevel = TIER_LEVELS[session.tier] || 0;
  const requiredLevel = TIER_LEVELS[requiredTier] || 0;
  return userLevel >= requiredLevel;
}

/* ═══════════════════════════════════════════════════════════════════════
   AUTH API — used by all gated pages
   ═══════════════════════════════════════════════════════════════════════ */

const MW_SESSION_KEY = "mw_session";
const DEFAULT_SESSION_DAYS = 30;

/**
 * Validate a password against the registry.
 * @returns {object|null} Investor object if valid, null otherwise.
 */
function mwValidateCredential(password) {
  if (!password) return null;
  const pw = password.trim().toLowerCase();
  const inv = INVESTORS[pw];
  if (!inv) return null;
  if (inv.active === false) return null;
  if (inv.expires && new Date(inv.expires).getTime() < Date.now()) return null;
  return { ...inv, credential: pw };
}

/**
 * Create a session in localStorage.
 */
function mwCreateSession(investor, days) {
  if (!days) days = DEFAULT_SESSION_DAYS;
  const session = {
    credential: investor.credential,
    name: investor.name,
    tier: investor.tier || "intro",
    audience: investor.audience || "general",
    personal: investor.personal || null,
    ndaSigned: investor.ndaSigned || false,
    createdAt: Date.now(),
    expiry: Date.now() + days * 24 * 60 * 60 * 1000
  };
  try {
    localStorage.setItem(MW_SESSION_KEY, JSON.stringify(session));
  } catch (e) {}
  return session;
}

/**
 * Get the current session, or null if expired / invalid / not present.
 * Re-validates against registry in case the investor was deactivated.
 */
function mwGetSession() {
  try {
    const raw = localStorage.getItem(MW_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session.expiry || session.expiry < Date.now()) {
      mwClearSession();
      return null;
    }
    /* Re-validate against current registry state */
    const inv = INVESTORS[session.credential];
    if (!inv || inv.active === false) {
      mwClearSession();
      return null;
    }
    if (inv.expires && new Date(inv.expires).getTime() < Date.now()) {
      mwClearSession();
      return null;
    }
    /* Sync from registry in case it was updated */
    session.personal = inv.personal || null;
    session.name = inv.name;
    session.tier = inv.tier || "intro";
    session.audience = inv.audience || "general";
    return session;
  } catch (e) {
    mwClearSession();
    return null;
  }
}

/**
 * Clear the session.
 */
function mwClearSession() {
  try {
    localStorage.removeItem(MW_SESSION_KEY);
    /* Also clean up legacy keys from the previous gate system */
    localStorage.removeItem("mw_access");
    localStorage.removeItem("mw_seen_deck");
    localStorage.removeItem("mw_seen_expansion");
    localStorage.removeItem("mw_seen_tech");
    localStorage.removeItem("mw_seen_saaf");
    localStorage.removeItem("mw_diego_seen");
  } catch (e) {}
}

/**
 * Helper for gated pages. Options:
 *   requirePersonal: string  - require session.personal to match this exact path
 *   requireTier: string      - require session.tier >= this tier
 * Behavior:
 *   - No session: redirect to gate (financial-access.html)
 *   - Tier insufficient: redirect to Hub (index.html)
 *   - Personal mismatch: redirect to Hub (index.html)
 */
function mwRequireAuth(options) {
  options = options || {};
  const session = mwGetSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  if (options.requireTier && !mwHasTier(session, options.requireTier)) {
    window.location.href = "hub.html";
    return null;
  }
  if (options.requirePersonal && session.personal !== options.requirePersonal) {
    window.location.href = "hub.html";
    return null;
  }
  return session;
}
