# 03 - Address Management

> **Status**: Implemented | **Component**: `AddressesTab`

## Overview

The AddressesTab provides full CRUD for shipping/billing addresses. Users can have up to 10 addresses (enforced by BE). The UI displays addresses in a responsive grid (2 columns desktop, 1 column mobile) using `AddressCard` components, with an `AddressFormModal` for add/edit operations.

---

## User Flow

```
AddressesTab loads → GET /api/me/addresses
       |
       v
┌──────────────────────────────────────────────┐
│  Saved Addresses               [+ Add Address]│
│                                               │
│  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Nguyễn Văn A    │  │ Trần Thị B      │    │
│  │ [Home] [Default]│  │ [Work]           │    │
│  │ 123 Nguyễn Huệ  │  │ 456 Lê Lợi      │    │
│  │ P. Bến Nghé...  │  │ P. Bến Thành...  │    │
│  │ 📱 +849123...   │  │ 📱 +849876...    │    │
│  │ [Edit][Delete]  │  │ [Edit][Delete]   │    │
│  │                 │  │ [Set Default]    │    │
│  └─────────────────┘  └─────────────────┘    │
└──────────────────────────────────────────────┘

Actions:
  [+ Add Address]  → opens AddressFormModal (add mode)
  [Edit]           → opens AddressFormModal (edit mode, pre-filled)
  [Delete]         → Popconfirm → DELETE /api/me/addresses/{id}
  [Set Default]    → PATCH /api/me/addresses/{id}/default
```

---

## API Calls

### List Addresses

| Hook | Endpoint | Params | Response |
|------|----------|--------|----------|
| `useAddresses()` | `GET /api/me/addresses` | `PageNumber=1, PageSize=50` | `UserAddress[]` |

The service fetches with a large page size (50) since users can have at most 10 addresses. It handles both paginated (`{ items: [...] }`) and flat array response shapes.

### Add Address

| Hook | Endpoint | Request Body | Response |
|------|----------|-------------|----------|
| `useAddAddress()` | `POST /api/me/addresses` | `AddAddressRequest` | `UserAddress` (201) |

### Update Address

| Hook | Endpoint | Request Body | Response |
|------|----------|-------------|----------|
| `useUpdateAddress()` | `PUT /api/me/addresses/{id}` | `Partial<AddAddressRequest>` | `UserAddress` (200) |

### Delete Address

| Hook | Endpoint | Response |
|------|----------|----------|
| `useDeleteAddress()` | `DELETE /api/me/addresses/{id}` | `204 No Content` |

### Set Default

| Hook | Endpoint | Response |
|------|----------|----------|
| `useSetDefaultAddress()` | `PATCH /api/me/addresses/{id}/default` | `204 No Content` |

All mutations invalidate the `['user', 'addresses']` query on success.

---

## AddressFormModal

The modal serves both add and edit modes, determined by whether `editingAddress` is passed.

### Form Fields

| Field | Type | Control | Validation | Required |
|-------|------|---------|-----------|----------|
| `type` | `'home' \| 'work' \| 'other'` | `Select` | Zod `z.enum(...)` | Yes |
| `recipientName` | `string` | `Input` | `z.string().min(1)` | Yes |
| `street` | `string` | `Input` | `z.string().min(1)` | Yes |
| `ward` | `string?` | `Input` | Optional | No |
| `district` | `string?` | `Input` | Optional | No |
| `city` | `string` | `Input` | `z.string().min(1)` | Yes |
| `postalCode` | `string?` | `Input` | Optional | No |
| `phoneNumber` | `string` | `Input` | `z.string().min(1)` | Yes |
| `isDefault` | `boolean` | `Checkbox` | Optional, default `false` | No |

**Layout**: Ward/District side-by-side, City/PostalCode side-by-side on desktop; stacked on mobile.

### Add vs Edit Behavior

| Aspect | Add Mode | Edit Mode |
|--------|----------|-----------|
| Modal title | i18n `profile.addAddress` | i18n `profile.editAddress` |
| Form defaults | Empty fields, type = `home` | Pre-filled from `editingAddress` |
| Submit button | i18n `profile.addAddress` | i18n `profile.updateAddress` |
| API call | `POST /api/me/addresses` | `PUT /api/me/addresses/{id}` |
| Empty optional fields | Sent as `undefined` | Sent as `undefined` (BE merges with existing) |

### Component Props

```typescript
interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  editingAddress?: UserAddress | null;
}
```

---

## AddressCard

Displays a single address with action buttons.

### Display Elements

| Element | Source | Notes |
|---------|--------|-------|
| Recipient name | `address.recipientName` | Bold text |
| Type badge | `t('profile.addressType_${address.type}')` | Tag component |
| Default badge | Shown when `address.isDefault` | Star icon + "Default" Tag |
| Full address | `street, ward, district, city` joined | With location icon |
| Postal code | `address.postalCode` | Shown only when present |
| Phone | `address.phoneNumber` | With phone icon |

### Actions

| Button | Condition | Handler |
|--------|-----------|---------|
| Edit | Always shown | Opens `AddressFormModal` in edit mode |
| Delete | Always shown | `Popconfirm` -> calls `handleDelete(address.id)` |
| Set Default | Hidden when `address.isDefault` | Calls `handleSetDefault(address.id)` |

### Component Props

```typescript
interface AddressCardProps {
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
}
```

---

## Responsive Behavior

| Breakpoint | Address Grid | Modal Width |
|-----------|-------------|-------------|
| Mobile (`xs`) | 1 column (`Col xs={24}`) | `100%` with `top: 20` |
| Desktop (`lg+`) | 2 columns (`Col lg={12}`) | `520px` |

---

## BE Business Rules

| Rule | Detail |
|------|--------|
| Max addresses | 10 per user (`UserMaxAddress` error if exceeded) |
| First address | Automatically set as default regardless of `isDefault` flag |
| Default on add | If `isDefault=true`, all existing defaults are cleared first |
| Default on delete | If deleted address was default, first remaining is promoted |
| Set default | Clears ALL existing defaults, then sets the target |
| Phone validation | Recipient phone validated via `libphonenumber` (E.164 format) |
| Update merge | Omitted fields retain their current values on BE |
| Address types | `home`, `work`, `other` |

**FE divergence from BE:** The FE marks `ward` and `district` as optional in the Zod schema, but the BE requires them (`Not whitespace` validation). This means the BE will reject submissions with empty ward/district.

---

## Error Codes from BE

| Code | HTTP | Condition |
|------|------|-----------|
| `User.NotFound` | 404 | User does not exist |
| `User.Address.NotFound` | 404 | Address ID not found for this user |
| `UserMaxAddress` | 422 | Already at 10 addresses |
| `RecipientInfo.NameEmpty` | 422 | Recipient name is empty |
| Format error | 422 | Phone fails libphonenumber validation |
| Address validation | 422 | Street/ward/district/city fails validation |

---

## Types

### AddAddressRequest (from userService.ts)

```typescript
interface AddAddressRequest {
  type: AddressType;        // 'home' | 'work' | 'other'
  recipientName: string;
  street: string;
  ward?: string;
  district?: string;
  city: string;
  postalCode?: string;
  phoneNumber: string;
  countryCode?: string;     // defaults to 'VN' on BE
  isDefault?: boolean;
}
```

### UserAddress (from types/user.ts)

```typescript
interface UserAddress {
  id: string;
  type: AddressType;
  recipientName: string | null;
  street: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  phoneNumber: string | null;
  isDefault: boolean;
}
```

---

## Source Files

| Layer | File |
|-------|------|
| Component | `components/profile/AddressesTab.tsx` |
| Component | `components/profile/AddressCard.tsx` |
| Component | `components/profile/AddressFormModal.tsx` |
| Service | `services/userService.ts` -- `getAddresses()`, `addAddress()`, `updateAddress()`, `deleteAddress()`, `setDefaultAddress()` |
| Hooks | `hooks/useUser.ts` -- `useAddresses()`, `useAddAddress()`, `useUpdateAddress()`, `useDeleteAddress()`, `useSetDefaultAddress()` |
| Types | `types/user.ts` -- `UserAddress` |
| Types | `types/enums.ts` -- `AddressType` |
