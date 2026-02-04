import React, { useEffect, useState, useCallback } from 'react';
import { OpenFeature, ProviderEvents } from '@openfeature/web-sdk';
import { initOpenFeature } from './openfeature';

export default function App() {
  const [ofClient, setOfClient] = useState(null);
  const [userId, setUserId] = useState('anonymous');
  const [flags, setFlags] = useState({ newBadge: false, ctaColor: 'blue' });
  const apiBase = 'http://localhost:8000';

  const refreshFE = useCallback(async () => {
    // evaluate using the current global context
    const newBadge = await ofClient.getBooleanValue('new-badge', false);
    const ctaColor = await ofClient.getStringValue('cta-color', 'blue');
    setFlags({ newBadge, ctaColor });
  }, [ofClient]);

  const refreshBE = useCallback(async (uid) => {
    const r = await fetch(`${apiBase}/api/flags?userId=${encodeURIComponent(uid)}`);
    // (optional: display somewhere if you want BE flags)
    await r.json();
  }, []);

  const setUserAndRefresh = useCallback(async () => {
    await OpenFeature.setContext({ userId });   // <-- set context globally
    await refreshFE();
    await refreshBE(userId);
  }, [userId, refreshFE, refreshBE]);

  useEffect(() => {
    (async () => {
      const client = await initOpenFeature();
      setOfClient(client);

      // initial context & load
      await OpenFeature.setContext({ userId: 'anonymous' });
      await refreshFE();
      await refreshBE('anonymous');

      // auto-refresh when provider is ready / config changes
      const onReady = () => refreshFE();
      const onChanged = () => refreshFE();
      OpenFeature.addHandler(ProviderEvents.Ready, onReady);
      OpenFeature.addHandler(ProviderEvents.ConfigurationChanged, onChanged);

      return () => {
        OpenFeature.removeHandler?.(ProviderEvents.Ready, onReady);
        OpenFeature.removeHandler?.(ProviderEvents.ConfigurationChanged, onChanged);
      };
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, Arial, sans-serif' }}>
      <h1>OpenFeature + flagd (Frontend + Backend)</h1>

      <div style={{ margin: '12px 0' }}>
        <label>
          userId:{' '}
          <input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </label>
        <button onClick={setUserAndRefresh} style={{ marginLeft: 8 }}>
          Refresh (FE + BE)
        </button>
      </div>

      <h2>Frontend‑evaluated flags</h2>
      <div style={{ margin: '8px 0' }}>
        <span>Product Title</span>
        {flags.newBadge && (
          <span style={{
            padding: '2px 8px', borderRadius: 999, background: '#eee', marginLeft: 8
          }}>NEW</span>
        )}
      </div>
      <div>
        <button
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            background: flags.ctaColor === 'green' ? '#10b981' : '#3b82f6'
          }}
        >
          CTA Button ({flags.ctaColor})
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Backend‑gated endpoints</h2>
      <div>
        <button onClick={async () => {
          const r = await fetch(`${apiBase}/api/hello?userId=${encodeURIComponent(userId)}`);
          alert(JSON.stringify(await r.json(), null, 2));
        }}>Call /api/hello</button>

        <button style={{ marginLeft: 8 }} onClick={async () => {
          const r = await fetch(`${apiBase}/api/secret?userId=${encodeURIComponent(userId)}`);
          const body = r.ok ? await r.json() : { error: `HTTP ${r.status}`, ...(await r.json().catch(() => ({}))) };
          alert(JSON.stringify(body, null, 2));
        }}>Call /api/secret</button>
      </div>
    </div>
  );
}