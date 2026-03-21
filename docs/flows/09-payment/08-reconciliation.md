# 08 -- Reconciliation (Frontend)

> **Status**: BE-only
> **FE involvement**: None -- this is a BE background job
> **BE docs**: `backend/docs/flows/09-payment/08-reconciliation.md`

## Why This Is BE-Only

`GatewayReconciliationJob` is a BE background job that runs every 15 minutes. It detects stale `Pending` transactions that never received a VNPay callback (e.g., user abandoned payment, network issues) and queries VNPay's `querydr` API to determine the actual transaction status. The FE has no involvement in this process.

## BE Reference Summary

| Setting | Value |
|---------|-------|
| Poll interval | Every 15 minutes |
| Batch size | 100 transactions per run |
| Threshold | Only transactions older than 15 minutes |
| VNPay API | `querydr` command to check transaction status |

### VNPay Response Handling

| Response Code | Transaction Status | Action |
|--------------|-------------------|--------|
| `00` | `00` (completed) | Mark transaction as completed |
| any | `01` (unpaid) | Skip -- check again next cycle |
| any | `02` (processing) | Skip -- check again next cycle |
| other | other | Mark transaction as failed |

## FE Implications

- If a user abandons VNPay payment, the transaction stays `pending` for up to 15 minutes before reconciliation picks it up
- The user can retry by clicking the deposit/payment button again -- the BE has idempotency checks that reuse the existing pending transaction
- The admin can see stale pending transactions in the Transactions tab of `AdminPaymentsPage` -- these will eventually be resolved by the reconciliation job

## Design Note

The reconciliation job only updates transaction status. It does NOT trigger downstream side-effects (wallet credit, escrow creation) for reconciled transactions. This means a payment that was only discovered via reconciliation may need manual intervention for the business logic to complete. See the BE docs for details on this limitation.

See `backend/docs/flows/09-payment/08-reconciliation.md` for the full reconciliation flow and VNPay querydr API details.
