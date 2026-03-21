# 04 -- Store Warehouse Item

> **FE Status: NOT IMPLEMENTED**

## Summary

After inspection review is approved, warehouse staff assigns the item to a physical storage location (Zone-Aisle-Shelf-Bin). This completes the inbound shipment lifecycle.

## BE Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/warehouse/warehouse-items/{warehouseItemId}/store` | Assign storage location (permission: `warehouse:item:store`) |
| `GET` | `/api/warehouse/warehouse-items` | List warehouse items (permission: `warehouse:shipments:read`) |

### Store Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `StorageLocationId` | `Guid` | Yes | Target storage location (must be vacant) |

### State Transitions on Store

- `WarehouseItem`: `Inspected` -> `Stored`
- `StorageLocation`: `IsOccupied` = `false` -> `true`
- `InboundShipment`: `Inspected` -> `Completed`

### Storage Location Label Format

Labels follow: `{Zone}-{Aisle}-{Shelf}-{Bin}` (e.g., `A-01-03-02`)

## FE Requirements Checklist

- [ ] **Service**: `warehouseService.ts` -- `storeWarehouseItem()`, `getWarehouseItems()`
- [ ] **Types**: `WarehouseItemDto`, `StoreWarehouseItemRequest`, `WarehouseItemStatus` enum
- [ ] **Admin page**: List of warehouse items with status filter
- [ ] **Admin page**: Store action -- select vacant storage location from dropdown/picker
- [ ] **Storage location picker**: Show only vacant locations, searchable by label
- [ ] **i18n**: All labels in Vietnamese (primary) and English
