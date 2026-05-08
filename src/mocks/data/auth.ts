import { UserStatus } from '@/types/enums'
import type { UserDto } from '@/types'

export const mockCurrentUser: UserDto = {
  id: '019e0171-3636-7297-ab3c-a94fe3b754b6',
  userName: 'coreflow.admin',
  email: 'admin@oio.com',
  emailConfirmed: true,
  phoneNumberConfirmed: false,
  twoFactorEnabled: false,
  status: UserStatus.Active,
  createdAt: new Date().toISOString(),
  profile: {
    firstName: 'System',
    lastName: 'Admin',
    displayName: 'Super Admin',
  },
  roles: ['admin', 'buyer', 'seller'],
}
