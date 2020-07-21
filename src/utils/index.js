import { ROLE_ADMIN, ROLE_SUPERVISOR } from '../config'
import { BAD_REQUEST } from '../constants'

export * from './logger'

export function isAdmin(user = { roles: [] }) {
  return user.roles.includes(ROLE_ADMIN)
}

export function isSupervisor(user = { roles: [] }) {
  return user.roles.includes(ROLE_SUPERVISOR)
}

export function getSchemaError(e) {
  return (e.details && e.details[0] && e.details[0].message) || BAD_REQUEST
}
