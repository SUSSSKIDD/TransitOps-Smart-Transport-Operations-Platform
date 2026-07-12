import { Role } from '../types/enums'

type Resource = 'vehicle' | 'driver' | 'trip' | 'maintenance' | 'expense' | 'report'
type Action   = 'create' | 'read' | 'update' | 'delete'

export const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  FLEET_MANAGER: {
    vehicle:     ['create', 'read', 'update', 'delete'],
    driver:      ['create', 'read', 'update', 'delete'],
    trip:        ['create', 'read', 'update', 'delete'],
    maintenance: ['create', 'read', 'update', 'delete'],
    expense:     ['create', 'read', 'update'],
    report:      ['read'],
  },
  DRIVER: {
    vehicle:     ['read'],
    driver:      ['read'],
    trip:        ['create', 'read', 'update'],
    maintenance: [],
    expense:     ['create', 'read'],
    report:      ['read'],
  },
  SAFETY_OFFICER: {
    vehicle:     ['read'],
    driver:      ['read', 'update'],
    trip:        ['read'],
    maintenance: ['read'],
    expense:     [],
    report:      ['read'],
  },
  FINANCIAL_ANALYST: {
    vehicle:     ['read'],
    driver:      ['read'],
    trip:        ['read'],
    maintenance: ['read'],
    expense:     ['read'],
    report:      ['read'],
  },
}

export function can(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false
}
