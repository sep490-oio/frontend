# 02 -- IPN & Return Callback (Frontend)

> **Status**: BE-only
> **FE involvement**: None -- these are server-to-server and BE-handled browser redirects
> **BE docs**: `backend/docs/flows/09-payment/02-ipn-return-callback.md`

## Why This Is BE-Only

VNPay sends payment results through two parallel channels, neither of which involves FE code:

1. **IPN (Instant Payment Notification)**: A server-to-server GET request from VNPay to `GET /api/payments/vnpay/ipn`. The FE never sees this. The BE validates the HMAC-SHA512 signature, persists the webhook as a `GatewayWebhookEvent`, and returns `{ RspCode: "00" }` to VNPay.

2. **Return URL**: After the user completes payment on VNPay, their browser is redirected to `GET /api/payments/vnpay/return`. This is a BE endpoint (not a FE route). The BE processes the callback synchronously and returns a `ProcessVnPayCallbackResponse` to the browser.

## What Happens After VNPay Return

The user's browser hits the BE return endpoint, which processes the payment. The BE then needs to redirect the user back to the FE. The exact mechanism depends on BE configuration:

- The BE `VnPayConfig.ReturnPath` determines where VNPay redirects
- The return URL is constructed as `{AppInfo.BeUrl}{VnPayConfig.ReturnPath}`
- After BE processing, the user lands back on the auction/wallet page

**Current FE behavior**: When the user returns to the auction page (via browser back or the return redirect), TanStack Query refetches the auction data on component mount. This reveals the deposit/qualification status without any special return-handling code.

## FE Implications

- No FE code is needed for IPN or return callback handling
- The FE relies on data refetch (TanStack Query `refetchOnMount`) to pick up the deposit status after the user returns from VNPay
- If the IPN processes before the user returns (typical), the auction data will already reflect the deposit
- If the return processes first (user returns quickly), the synchronous processing ensures the data is ready

## BE Reference

### Dual Callback Sequence

Both paths ultimately execute `ProcessVnPayCallbackCommand`. The handler has built-in idempotency: if a Transaction is already `Completed` or `Failed`, the second path returns the cached result without re-processing.

### Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/payments/vnpay/ipn` | AllowAnonymous | VNPay server-to-server callback |
| `GET /api/payments/vnpay/return` | AllowAnonymous | User browser redirect from VNPay |

See `backend/docs/flows/09-payment/02-ipn-return-callback.md` for full details.
