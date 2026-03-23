# 06 -- GHN Webhook Tracking

> **FE Status: BE-ONLY (no frontend needed)**

## Summary

This is a **server-to-server webhook** endpoint that receives carrier status updates from GHN (Giao Hang Nhanh). GHN calls `POST /webhooks/ghn` whenever a shipment status changes (picked up, in transit, delivered, failed, etc.). The BE normalizes the GHN status, identifies the shipment by `ClientOrderCode` prefix (`INB-` or `OUT-`), and auto-advances the shipment state machine.

## Why No FE Is Needed

- The webhook is called by GHN's servers, not by any browser or user action
- The endpoint is anonymous (`AllowAnonymous`) and always returns `200 OK`
- Authentication is by matching `ShopId` in the payload against the configured credentials
- All state transitions happen automatically on the BE

## GHN Status -> Normalized Status Mapping

| GHN Status | Normalized |
|------------|-----------|
| `ready_to_pick` | `confirmed` |
| `picking` | `in_transit` |
| `picked` | `picked_up` |
| `storing`, `transporting`, `delivering` | `in_transit` |
| `delivered` | `delivered` |
| `delivery_fail`, `exception`, `damage`, `lost` | `failed` |
| `waiting_to_return`, `return` | `returning` |
| `returned` | `returned` |
| `cancel` | `cancelled` |

## FE Relevance

While the webhook itself needs no FE, the **tracking events it creates** should be displayed in shipment detail views (see 01-inbound-shipment.md and 05-outbound-shipment.md). Each webhook creates a `ShipmentTrackingEvent` record that can be queried to build a tracking timeline UI.
