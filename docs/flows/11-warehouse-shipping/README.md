# Flow 11 -- Warehouse & Shipping

> **FE Status: NOT IMPLEMENTED**

## Overview

This module covers the full warehouse and shipping lifecycle on the BE:

- **Inbound shipments** -- seller ships item to OIO warehouse via GHN carrier
- **Warehouse inspection** -- inspector examines arrived items, admin reviews
- **Storage management** -- assign inspected items to physical shelf locations (Zone-Aisle-Shelf-Bin)
- **Outbound shipments** -- warehouse ships item to buyer after order payment
- **GHN webhook tracking** -- server-to-server carrier status updates (auto-advances shipment state)
- **Cancellation** -- cancel inbound/outbound shipments with GHN API rollback
- **Shipping provider config** -- manage carrier credentials and warehouse pickup address

## BE Endpoints (18 + 1 webhook)

### Inbound Shipments

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | `POST` | `/api/warehouse/inbound-shipments` | Book inbound shipment (seller to warehouse) |
| 2 | `GET` | `/api/warehouse/inbound-shipments` | List inbound shipments (paginated) |
| 3 | `GET` | `/api/warehouse/inbound-shipments/{shipmentId}` | Get inbound shipment details |
| 4 | `POST` | `/api/warehouse/inbound-shipments/{shipmentId}/cancel` | Cancel inbound shipment |
| 5 | `GET` | `/api/warehouse/inbound-shipments/inspection-queue` | Get inspection queue |
| 6 | `POST` | `/api/warehouse/inbound-shipments/{shipmentId}/inspect` | Submit inspection results |
| 7 | `POST` | `/api/warehouse/inbound-shipments/{shipmentId}/review` | Admin review inspection |

### Outbound Shipments

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 8 | `POST` | `/api/warehouse/outbound-shipments` | Book outbound shipment (warehouse to buyer) |
| 9 | `GET` | `/api/warehouse/outbound-shipments` | List outbound shipments |
| 10 | `GET` | `/api/warehouse/outbound-shipments/{shipmentId}` | Get outbound shipment details |
| 11 | `POST` | `/api/warehouse/outbound-shipments/{shipmentId}/cancel` | Cancel outbound shipment |

### Warehouse Items & Storage

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 12 | `GET` | `/api/warehouse/warehouse-items` | List warehouse items |
| 13 | `POST` | `/api/warehouse/warehouse-items/{warehouseItemId}/store` | Assign storage location |
| 14 | `GET` | `/api/warehouse/storage-locations` | List storage locations |
| 15 | `POST` | `/api/warehouse/storage-locations` | Create storage location |
| 16 | `PUT` | `/api/warehouse/storage-locations/{locationId}` | Update storage location |
| 17 | `DELETE` | `/api/warehouse/storage-locations/{locationId}` | Delete storage location |

### Config & Webhooks

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 18 | `PUT` | `/api/warehouse/shipping-provider-configs/{configId}` | Update shipping provider config |
| W1 | `POST` | `/webhooks/ghn` | GHN carrier webhook (server-to-server, anonymous) |

## FE Implementation Status

No frontend pages, services, components, or types exist for this module. The entire module needs to be built from scratch when prioritized.

## Subflow Index

| # | File | Status | Description |
|---|------|--------|-------------|
| 01 | [01-inbound-shipment.md](01-inbound-shipment.md) | Not implemented | Book inbound shipment |
| 02 | [02-inspector-queue.md](02-inspector-queue.md) | Not implemented | Inspection queue UI |
| 03 | [03-inspection-review.md](03-inspection-review.md) | Not implemented | Admin inspection review |
| 04 | [04-store-warehouse-item.md](04-store-warehouse-item.md) | Not implemented | Assign storage location |
| 05 | [05-outbound-shipment.md](05-outbound-shipment.md) | Not implemented | Book outbound shipment |
| 06 | [06-ghn-webhook-tracking.md](06-ghn-webhook-tracking.md) | BE-only | GHN webhook (no FE needed) |
| 07 | [07-cancel-shipment.md](07-cancel-shipment.md) | Not implemented | Cancel shipments |
| 08 | [08-storage-management.md](08-storage-management.md) | Not implemented | CRUD storage locations |
| 09 | [09-shipping-provider-config.md](09-shipping-provider-config.md) | Not implemented | Shipping provider settings |
