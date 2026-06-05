// ─── KPI Dashboard — Supabase Data Access Layer ─────────────────
//
// Drop-in replacement for localStorage in kpi-dashboard.html.
//
// Load order in kpi-dashboard.html (before closing </body>):
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
//   <script src="kpi-config.js"></script>      <!-- your credentials, gitignored -->
//   <script src="supabase/kpi-data.js"></script>
//
// Graceful fallback: if kpi-config.js is missing or contains placeholder values,
// all functions transparently fall back to localStorage — the dashboard works
// without any Supabase configuration.

(function (global) {
  'use strict';

  // ─── DETECT WHETHER SUPABASE IS CONFIGURED ─────────────────────
  const PLACEHOLDER = 'YOUR_PROJECT_ID';

  function isConfigured() {
    return (
      typeof SUPABASE_URL !== 'undefined' &&
      typeof SUPABASE_ANON_KEY !== 'undefined' &&
      !SUPABASE_URL.includes(PLACEHOLDER) &&
      SUPABASE_URL.startsWith('https://')
    );
  }

  // ─── SUPABASE CLIENT (lazy init) ───────────────────────────────
  let _client = null;

  function getClient() {
    if (_client) return _client;
    if (!isConfigured()) return null;
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.warn('[kpi-data] supabase-js not loaded — using localStorage fallback');
      return null;
    }
    _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _client;
  }

  // ─── LOCALSTORAGE FALLBACK ──────────────────────────────────────
  const LS_KEY = 'kpi-partners';

  function lsLoad() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || { partners: [] }; }
    catch { return { partners: [] }; }
  }

  function lsSave(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  // Map camelCase ↔ snake_case for the entries table
  function entryToRow(entry, partnerId) {
    return {
      partner_id:   partnerId,
      period:       entry.period,
      period_type:  entry.periodType,
      reach:        entry.reach        || 0,
      clicks:       entry.clicks       || 0,
      leads:        entry.leads        || 0,
      calls_booked: entry.callsBooked  || 0,
      calls_shown:  entry.callsShown   || 0,
      closes:       entry.closes       || 0,
      revenue:      entry.revenue      || 0,
      ad_spend:     entry.adSpend      || 0,
      commission:   entry.commission   || 0,
    };
  }

  function rowToEntry(row) {
    return {
      id:           row.id,
      period:       row.period,
      periodType:   row.period_type,
      reach:        row.reach,
      clicks:       row.clicks,
      leads:        row.leads,
      callsBooked:  row.calls_booked,
      callsShown:   row.calls_shown,
      closes:       row.closes,
      revenue:      parseFloat(row.revenue),
      adSpend:      parseFloat(row.ad_spend),
      commission:   parseFloat(row.commission),
      created_at:   row.created_at,
    };
  }

  function rowToPartner(row, entries) {
    return {
      id:         row.id,
      name:       row.name,
      type:       row.type,
      email:      row.email || '',
      note:       row.note  || '',
      created_by: row.created_by,
      created_at: row.created_at,
      entries:    (entries || []).map(rowToEntry),
    };
  }

  // ─── loadPartners() ────────────────────────────────────────────
  // Returns { partners: [...] } — same shape as localStorage data.
  // Each partner object includes an `entries` array (sorted oldest-first).

  async function loadPartners() {
    const db = getClient();

    if (!db) {
      // localStorage fallback
      return lsLoad();
    }

    try {
      const { data: partnerRows, error: pErr } = await db
        .from('partners')
        .select('*')
        .order('created_at', { ascending: true });

      if (pErr) throw pErr;

      const { data: entryRows, error: eErr } = await db
        .from('entries')
        .select('*')
        .order('created_at', { ascending: true });

      if (eErr) throw eErr;

      const partners = partnerRows.map(p => {
        const pEntries = (entryRows || []).filter(e => e.partner_id === p.id);
        return rowToPartner(p, pEntries);
      });

      return { partners };

    } catch (err) {
      console.error('[kpi-data] loadPartners error — falling back to localStorage:', err);
      return lsLoad();
    }
  }

  // ─── savePartner(partner) ──────────────────────────────────────
  // Upserts a partner record. Pass the full partner object from the UI.
  // Returns the saved partner (with server-generated id if new).

  async function savePartner(partner) {
    const db = getClient();

    if (!db) {
      // localStorage fallback
      const data = lsLoad();
      const idx = data.partners.findIndex(p => p.id === partner.id);
      if (idx >= 0) {
        data.partners[idx] = { ...data.partners[idx], ...partner };
      } else {
        data.partners.push({ ...partner, entries: partner.entries || [] });
      }
      lsSave(data);
      return partner;
    }

    try {
      // Get current user so we can set created_by
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const row = {
        name:       partner.name,
        type:       partner.type,
        email:      partner.email || null,
        note:       partner.note  || null,
        created_by: user.id,
      };

      // If partner already has a Supabase UUID, include it for upsert
      if (partner.id && !partner.id.startsWith('p-')) {
        row.id = partner.id;
      }

      const { data, error } = await db
        .from('partners')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return rowToPartner(data, partner.entries || []);

    } catch (err) {
      console.error('[kpi-data] savePartner error — falling back to localStorage:', err);
      const data = lsLoad();
      const idx = data.partners.findIndex(p => p.id === partner.id);
      if (idx >= 0) {
        data.partners[idx] = { ...data.partners[idx], ...partner };
      } else {
        data.partners.push({ ...partner, entries: partner.entries || [] });
      }
      lsSave(data);
      return partner;
    }
  }

  // ─── saveEntry(partnerId, entry) ───────────────────────────────
  // Inserts a new entry row for the given partner.
  // Returns the saved entry with its server-generated id.

  async function saveEntry(partnerId, entry) {
    const db = getClient();

    if (!db) {
      // localStorage fallback — entries are stored inside the partner object
      const data = lsLoad();
      const partner = data.partners.find(p => p.id === partnerId);
      if (partner) {
        if (!partner.entries) partner.entries = [];
        partner.entries.push(entry);
        lsSave(data);
      }
      return entry;
    }

    try {
      const row = entryToRow(entry, partnerId);

      const { data, error } = await db
        .from('entries')
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return rowToEntry(data);

    } catch (err) {
      console.error('[kpi-data] saveEntry error — falling back to localStorage:', err);
      const data = lsLoad();
      const partner = data.partners.find(p => p.id === partnerId);
      if (partner) {
        if (!partner.entries) partner.entries = [];
        partner.entries.push(entry);
        lsSave(data);
      }
      return entry;
    }
  }

  // ─── deletePartner(id) ─────────────────────────────────────────
  // Deletes a partner and all associated entries (CASCADE on the DB side).

  async function deletePartner(id) {
    const db = getClient();

    if (!db) {
      const data = lsLoad();
      data.partners = data.partners.filter(p => p.id !== id);
      lsSave(data);
      return;
    }

    try {
      const { error } = await db.from('partners').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[kpi-data] deletePartner error — falling back to localStorage:', err);
      const data = lsLoad();
      data.partners = data.partners.filter(p => p.id !== id);
      lsSave(data);
    }
  }

  // ─── deleteEntry(id) ───────────────────────────────────────────
  // Deletes a single entry by its UUID.

  async function deleteEntry(id) {
    const db = getClient();

    if (!db) {
      // localStorage fallback: id might be an array index — handled in dashboard
      const data = lsLoad();
      data.partners.forEach(p => {
        if (p.entries) {
          p.entries = p.entries.filter(e => e.id !== id);
        }
      });
      lsSave(data);
      return;
    }

    try {
      const { error } = await db.from('entries').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[kpi-data] deleteEntry error — falling back to localStorage:', err);
      const data = lsLoad();
      data.partners.forEach(p => {
        if (p.entries) p.entries = p.entries.filter(e => e.id !== id);
      });
      lsSave(data);
    }
  }

  // ─── subscribeToChanges(callback) ─────────────────────────────
  // Sets up Supabase Realtime subscriptions for partners + entries.
  // callback(eventType, table, payload) is called on any INSERT/UPDATE/DELETE.
  // Returns an object with an unsubscribe() method.
  // No-ops gracefully when Supabase is not configured.

  function subscribeToChanges(callback) {
    const db = getClient();

    if (!db) {
      console.info('[kpi-data] Realtime not available — Supabase not configured');
      return { unsubscribe: () => {} };
    }

    const channel = db
      .channel('kpi-dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partners' },
        payload => callback(payload.eventType, 'partners', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        payload => callback(payload.eventType, 'entries', payload)
      )
      .subscribe(status => {
        console.info('[kpi-data] Realtime status:', status);
      });

    return {
      unsubscribe: () => {
        db.removeChannel(channel);
      }
    };
  }

  // ─── STATUS CHECK ──────────────────────────────────────────────
  // Returns 'supabase' | 'localStorage' so the dashboard can show an indicator.

  function getStorageMode() {
    return isConfigured() && typeof supabase !== 'undefined' ? 'supabase' : 'localStorage';
  }

  // ─── PUBLIC API ────────────────────────────────────────────────
  global.KpiData = {
    loadPartners,
    savePartner,
    saveEntry,
    deletePartner,
    deleteEntry,
    subscribeToChanges,
    getStorageMode,
  };

})(window);
