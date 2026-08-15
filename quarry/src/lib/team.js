const KEY = 'seraphimTeam';
const LEGACY = 'secureGuardTeam';

export function readTeam() {
  try {
    const value = localStorage.getItem(KEY) || localStorage.getItem(LEGACY);
    return value === 'red' ? 'red' : 'blue';
  } catch {
    return 'blue';
  }
}

export function writeTeam(team) {
  const next = team === 'red' ? 'red' : 'blue';
  try {
    localStorage.setItem(KEY, next);
    localStorage.setItem(LEGACY, next);
  } catch {
    /* private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('seraphim-team', { detail: next }));
  }
  return next;
}

export function dashboardFor(team) {
  return team === 'red' ? 'RedDashboard' : 'BlueDashboard';
}
