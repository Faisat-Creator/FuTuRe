# Backend Configuration

The backend reads configuration from:

1. Runtime environment variables (`process.env`)
2. `.env*` files in `backend/` (fallbacks)

## Environments

Set `APP_ENV` to enable environment-specific defaults and validation:

- `development` (default)
- `test`
- `production`

## `.env` file loading

Files are loaded in this precedence order (later wins):

1. `.env`
2. `.env.<APP_ENV>`
3. `.env.local` (skipped when `APP_ENV=test`)
4. `.env.<APP_ENV>.local` (skipped when `APP_ENV=test`)

`process.env` always overrides values from files.

## Required variables (production)

When `APP_ENV=production`:

- `ALLOWED_ORIGINS` (comma-separated)
- `JWT_SECRET` (must not be `secret`)

## Hot-reloading

Set `CONFIG_WATCH=true` to reload config when `.env*` files change.

- Changes apply to consumers that call `getConfig()` at runtime (e.g. CORS origin checks).
- Some values (like `PORT`) are still read once at startup.

## Encrypted secrets (optional)

You can store encrypted values using `ENC(<base64>)` or `enc:<base64>`, and provide a key via:

- `CONFIG_ENCRYPTION_KEY` (preferred)
- `CONFIG_SECRET_KEY` (alias)

The code uses AES-256-GCM with a SHA-256 derived key. See `backend/src/config/secrets.js`.

## Webhook Signature Verification

All outbound webhook requests include HMAC-SHA256 signatures for verification.

### Signature Header

Webhooks are sent with the `X-FuTuRe-Signature` header containing the signature:

```
X-FuTuRe-Signature: sha256=<hex-encoded-signature>
```

### Verification Algorithm

To verify a webhook signature:

1. Extract the signature from the `X-FuTuRe-Signature` header
2. Extract the `sha256=` prefix to get the hex-encoded signature
3. Compute HMAC-SHA256 of the raw request body using your webhook secret
4. Compare the computed signature with the received signature (constant-time comparison)

### Example Verification (Node.js)

```javascript
import { createHmac } from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const computed = createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return computed === signature;
}

// In your webhook handler:
const signature = req.headers['x-future-signature']?.replace('sha256=', '');
const isValid = verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Secret Rotation

Webhook secrets can be rotated via the `/api/webhooks/{id}/rotate-secret` endpoint. During rotation:

- The new secret becomes active immediately
- Previous secrets remain valid for a grace period (typically 24 hours)
- This allows consumers time to update their verification logic

### Headers Included

Each webhook request includes:

- `X-FuTuRe-Signature`: HMAC-SHA256 signature
- `X-Webhook-Id`: Unique webhook identifier
- `Content-Type`: `application/json`


