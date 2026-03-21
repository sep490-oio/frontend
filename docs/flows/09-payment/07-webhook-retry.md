# 07 -- Webhook Retry (Frontend)

> **Status**: BE-only
> **FE involvement**: None -- this is a BE background job
> **BE docs**: `backend/docs/flows/09-payment/07-webhook-retry.md`

## Why This Is BE-Only

`ProcessGatewayWebhooksJob` is a BE background job that runs every 10 seconds. It polls for pending `GatewayWebhookEvent` records (VNPay IPN callbacks that were persisted but not yet processed) and dispatches them for processing. Failed webhooks are retried with exponential backoff. The FE has no involvement in this process.

## BE Reference Summary

| Setting | Value |
|---------|-------|
| Poll interval | Every 10 seconds |
| Batch size | 50 webhooks per run |
| Max retries | 3 attempts |
| Backoff schedule | 1 min, 5 min, 15 min |
| Total retry window | ~21 minutes |

### Retry Backoff

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 15 minutes |
| After 3rd failure | Permanently marked as failed |

## FE Implications

- The FE does not need to handle webhook retries
- If a payment takes time to process (due to retries), the FE will eventually see the updated status on data refetch
- The admin can monitor webhook processing status via the Transactions tab in `AdminPaymentsPage` -- failed webhooks result in transactions that remain in `pending` status

See `backend/docs/flows/09-payment/07-webhook-retry.md` for the full retry flow, state transitions, and processing logic.
