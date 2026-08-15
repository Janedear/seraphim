import { create, list, update } from './store.js';

// Single local operator ("the owner of this install"). A desktop app has one
// local user and no login. The record is persisted so profile edits survive
// restarts, unlike the old hardcoded preview user.
export function getOperator() {
  const existing = list('Operator')[0];
  if (existing) return existing;
  return create('Operator', {
    email: 'operator@seraphim.local',
    full_name: 'Operator',
    name: 'Operator',
    role: 'admin',
    team: 'blue',
  });
}

export function updateOperator(patch = {}) {
  const op = getOperator();
  const safe = { ...patch };
  delete safe.id;
  delete safe.role; // role is fixed to admin for the local owner
  return update('Operator', op.id, safe);
}
