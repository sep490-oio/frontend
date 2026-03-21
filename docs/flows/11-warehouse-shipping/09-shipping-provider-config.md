# 09 -- Shipping Provider Config

> **FE Status: NOT IMPLEMENTED**

## Summary

Admin manages carrier integration settings: API credentials, warehouse pickup address, and environment (sandbox/production). Currently supports GHN and GHTK provider codes. Credentials are encrypted at rest on the BE.

## BE Endpoint

| Method | Route | Description |
|--------|-------|-------------|
| `PUT` | `/api/warehouse/shipping-provider-configs/{configId}` | Update shipping provider config (permission: `warehouse:locations:manage`) |

### Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `DisplayName` | `string` | Yes | Human-readable provider name |
| `ApiBaseUrl` | `string` | Yes | GHN sandbox/production URL |
| `PickName` | `string` | Yes | Warehouse pickup contact name |
| `PickPhone` | `string` | Yes | Warehouse pickup phone |
| `PickAddress` | `string` | Yes | Warehouse pickup street address |
| `PickWard` | `string` | Yes | Warehouse pickup ward |
| `PickDistrict` | `string` | Yes | Warehouse pickup district |
| `PickProvince` | `string` | Yes | Warehouse pickup province |
| `PickCarrierAddressDataJson` | `string?` | No | GHN address IDs JSON |
| `WebhookSecret` | `string?` | No | GHTK webhook hash |
| `CredentialsJson` | `string?` | No | Null = don't update credentials |

### Provider Codes

| Code | Description |
|------|-------------|
| `ghn` | Giao Hang Nhanh |
| `ghtk` | Giao Hang Tiet Kiem |
| `external` | External/manual provider |

### Config Properties (read-only via list)

`ProviderCode`, `DisplayName`, `Environment` (sandbox/production), `ApiBaseUrl`, `IsActive`, `IsDefault`, `PickName/Phone/Address/Ward/District/Province`

## FE Requirements Checklist

- [ ] **Service**: `warehouseService.ts` -- `updateShippingProviderConfig()` (and a GET endpoint if/when BE adds listing)
- [ ] **Types**: `ShippingProviderConfigDto`, `UpdateShippingProviderConfigRequest`
- [ ] **Admin page**: Settings form for each provider (display name, API URL, pickup address, credentials)
- [ ] **Security**: Credentials input as password field, show "configured" indicator without revealing values
- [ ] **Environment indicator**: Badge showing sandbox vs. production
- [ ] **i18n**: All labels in Vietnamese (primary) and English
