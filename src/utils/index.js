import { ROLE_ADMIN } from '../config';

export * from './logger';

export function isAdmin(user = { roles: [] }) {
  return user.roles.includes(ROLE_ADMIN);
}
