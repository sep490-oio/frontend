/**
 * SecurityTab — composes ChangePassword + PhoneNumber + TwoFactor sections.
 *
 * Sections are separated by dividers for visual clarity.
 */
import { Divider } from 'antd';
import { ChangePasswordSection } from './ChangePasswordSection';
import { PhoneNumberSection } from './PhoneNumberSection';
import { TwoFactorSection } from './TwoFactorSection';
import type { ApiUserDto } from '@/types';

interface SecurityTabProps {
  currentUser: ApiUserDto | undefined;
}

export function SecurityTab({ currentUser }: SecurityTabProps) {
  return (
    <div>
      <ChangePasswordSection />
      <Divider />
      <PhoneNumberSection
        currentPhone={currentUser?.phoneNumber}
        phoneConfirmed={currentUser?.phoneNumberConfirmed ?? false}
      />
      <Divider />
      <TwoFactorSection
        twoFactorEnabled={currentUser?.twoFactorEnabled ?? false}
        twoFactorProvider={currentUser?.twoFactorProvider ?? ''}
      />
    </div>
  );
}
