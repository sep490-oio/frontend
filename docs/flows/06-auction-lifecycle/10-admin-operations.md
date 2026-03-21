# 10 - Admin Operations (Frontend)

## Status: Not Implemented

Admin auction operations have service functions defined in `adminService.ts` but no dedicated admin UI pages for curation, emergencies, or sealed bid reveal.

---

## BE Summary

Admins have four specialized operations on auctions:

1. **Set Curation** — assign admin, adjust priority score, toggle featured status
2. **Trigger Emergency** — terminate auction, refund escrow, suspend seller, cancel shipments, create risk flag
3. **Resolve Emergency** — update emergency record status (investigating, mitigated, resolved, dismissed)
4. **Reveal Sealed Bid** — decrypt and reveal an individual sealed bid after auction ends

---

## Service Functions (adminService.ts)

All functions are defined and call the correct BE endpoints:

```typescript
// Set curation (admin, priority, featured)
export async function setAuctionCuration(
  auctionId: string,
  data: SetAuctionCurationRequest
): Promise<void>

// Trigger emergency (terminates auction)
export async function triggerAuctionEmergency(
  auctionId: string,
  data: TriggerAuctionEmergencyRequest
): Promise<void>

// Resolve emergency
export async function resolveAuctionEmergency(
  auctionId: string,
  emergencyId: string,
  data: ResolveAuctionEmergencyRequest
): Promise<void>

// Reveal sealed bid
export async function revealSealedBid(
  auctionId: string,
  sealedBidId: string
): Promise<void>
```

### Request Types

```typescript
interface SetAuctionCurationRequest {
  assignedAdminId?: string | null;
  clearAssignedAdmin?: boolean;
  priority?: string | null;
  priorityReason?: string | null;
  isFeatured?: boolean;
}

interface TriggerAuctionEmergencyRequest {
  triggerSource?: string | null;
  reason?: string | null;
  payload?: unknown;
}

interface ResolveAuctionEmergencyRequest {
  status?: string | null;  // triggered | investigating | mitigated | resolved | dismissed
  payload?: unknown;
}
```

---

## BE Endpoints

| Method | Endpoint | Permission | Purpose |
|--------|----------|------------|---------|
| PUT | `/api/admin/auctions/{id}/curation` | `Catalogs.Admin.ManageItems` | Set curation |
| POST | `/api/admin/auctions/{id}/emergencies` | `Catalogs.Admin.ManageItems` | Trigger emergency |
| POST | `/api/admin/auctions/{id}/emergencies/{eid}/resolve` | `Catalogs.Admin.ManageItems` | Resolve emergency |
| POST | `/api/admin/auctions/{id}/sealed-bids/{sid}/reveal` | `Catalogs.Admin.ManageItems` | Reveal sealed bid |

---

## What Needs to Be Built

| Feature | Priority | Description |
|---------|----------|-------------|
| Admin auction list page | Medium | List all auctions with admin actions |
| Curation panel | Medium | Assign admin, set priority, toggle featured |
| Emergency trigger modal | High | Trigger emergency with reason, auto-terminates auction |
| Emergency resolution UI | Medium | Track and resolve emergency status |
| Sealed bid reveal page | Low | View decrypted sealed bids after auction ends |

---

## Emergency Flow Side Effects (BE)

When an emergency is triggered, the BE performs cascading actions:
1. Auction terminated (Status -> `Terminated`, all bids cancelled)
2. Related order cancelled or buyer refunded
3. Pending/booked shipments cancelled
4. Seller risk flag created (severity: High)
5. Seller auto-suspended (if `AutoSuspendOnEmergency` is enabled)
6. All held deposits returned

These happen server-side. The FE would need to display the results.

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/10-admin-operations.md` for the full emergency flow, curation domain logic, sealed bid reveal handler, and all error codes.
