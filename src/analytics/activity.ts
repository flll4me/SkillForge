// Only visible, focused time within two minutes of an interaction is measured.
// Cumulative samples make retries safe: the server never adds the same time twice.
export function startActivityTracking(token: string) {
  let sessionId = crypto.randomUUID();
  let seconds = 0;
  let registered = false;
  let lastSample = Date.now();
  let lastInteraction = lastSample;
  let sessionStarted = lastSample;
  let visible = document.visibilityState === 'visible' && document.hasFocus();
  let stopped = false;

  const send = () => {
    void fetch('/api/users/me/activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId, activeSeconds: Math.floor(seconds) }),
      keepalive: true,
    }).then((response) => { if (response.status === 401 || response.status === 403) stopped = true; }).catch(() => {});
  };

  const sample = () => {
    const now = Date.now();
    const elapsed = now - lastSample;
    const active = visible && elapsed <= 20000 && lastSample < lastInteraction + 120000;
    if (!stopped && active) {
      if (!registered) {
        registered = true;
        send();
      } else {
        seconds += Math.max(0, Math.min(now, lastInteraction + 120000) - lastSample) / 1000;
        send();
      }
    }
    lastSample = now;
  };

  const interact = () => {
    const now = Date.now();
    if (now - lastInteraction > 30 * 60 * 1000 || now - sessionStarted > 24 * 60 * 60 * 1000) {
      sessionId = crypto.randomUUID();
      seconds = 0;
      registered = false;
      sessionStarted = now;
    }
    // Account for the idle interval before starting a new active interval.
    if (now - lastInteraction > 120000) lastSample = now;
    lastInteraction = now;
  };
  const visibility = () => {
    sample();
    visible = document.visibilityState === 'visible' && document.hasFocus();
    if (visible) interact();
  };
  const timer = window.setInterval(sample, 15000);
  const interactions = ['pointerdown', 'pointermove', 'keydown', 'scroll'] as const;
  interactions.forEach((event) => window.addEventListener(event, interact, { passive: true }));
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('focus', visibility);
  window.addEventListener('blur', visibility);
  window.addEventListener('pagehide', sample);

  return () => {
    window.clearInterval(timer);
    if (registered) sample();
    interactions.forEach((event) => window.removeEventListener(event, interact));
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('focus', visibility);
    window.removeEventListener('blur', visibility);
    window.removeEventListener('pagehide', sample);
  };
}
