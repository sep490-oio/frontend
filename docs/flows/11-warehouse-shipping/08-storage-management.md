# 08 -- Storage Management

> **FE Status: NOT IMPLEMENTED**

## Summary

CRUD operations for warehouse storage locations (physical shelves/bins). Each location has four components: Zone, Aisle, Shelf, Bin, which form a composite label like `A-01-03-02`. Locations track occupancy -- cannot update or delete occupied locations.

## BE Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/warehouse/storage-locations` | List storage locations (permission: `warehouse:locations:manage`) |
| `POST` | `/api/warehouse/storage-locations` | Create storage location |
| `PUT` | `/api/warehouse/storage-locations/{locationId}` | Update storage location |
| `DELETE` | `/api/warehouse/storage-locations/{locationId}` | Delete storage location |

### List Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `VacantOnly` | `bool` | `false` | Filter to only vacant locations |
| `Zone` | `string?` | `null` | Filter by zone |
| `Search` | `string?` | `null` | Search by label (contains) |
| `Page` | `int` | `1` | Page number |
| `PageSize` | `int` | `50` | Items per page |

### Create/Update Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `Zone` | `string` | Yes | Normalized to uppercase |
| `Aisle` | `string` | Yes | Trimmed |
| `Shelf` | `string` | Yes | Trimmed |
| `Bin` | `string` | Yes | Trimmed |

Label is auto-generated: `{Zone}-{Aisle}-{Shelf}-{Bin}`. Must be unique.

### Business Rules

- Cannot update or delete an occupied location (`StorageLocation.Occupied`)
- Duplicate labels are rejected (`StorageLocation.LabelAlreadyExists`)
- Sorting: Zone -> Aisle -> Shelf -> Bin (all ascending)

## FE Requirements Checklist

- [ ] **Service**: `warehouseService.ts` -- `getStorageLocations()`, `createStorageLocation()`, `updateStorageLocation()`, `deleteStorageLocation()`
- [ ] **Types**: `StorageLocationDto`, `CreateStorageLocationRequest`, `UpdateStorageLocationRequest`
- [ ] **Admin page**: Table of storage locations with zone filter, search, occupancy indicator
- [ ] **Admin page**: Create form (zone, aisle, shelf, bin inputs)
- [ ] **Admin page**: Edit/delete actions (disabled for occupied locations)
- [ ] **Vacant filter**: Toggle to show only available locations
- [ ] **i18n**: All labels in Vietnamese (primary) and English
