import { describe, expect, it } from 'vitest';
import { dashboardFor, readTeam, writeTeam } from './team.js';

describe('team', () => {
  it('round-trips blue and red and keeps a legacy key', () => {
    writeTeam('red');
    expect(readTeam()).toBe('red');
    expect(localStorage.getItem('secureGuardTeam')).toBe('red');
    writeTeam('blue');
    expect(readTeam()).toBe('blue');
    expect(dashboardFor('red')).toBe('RedDashboard');
    expect(dashboardFor('blue')).toBe('BlueDashboard');
  });
});
