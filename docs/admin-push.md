# Admin Push notifications

Settings → Push notifications enables only the current browser/install. There is no permission prompt on load. iPhone/iPad users must open the home-screen app (iOS/iPadOS16.4+), tap Enable, and allow the native prompt. Denied permission requires OS/browser settings; the site cannot override it. Test sends a real Web Push to that registered device; acceptance by the push service is not confirmation the handset displayed it. Focus mode, OS permissions and offline delivery can delay/prevent display. Disable revokes server registration before browser unsubscribe.

## Ready alerts

Production Vercel cron `/api/cron/admin-push` runs every five minutes, protected with the existing CRON_SECRET and a Production environment gate; HEAD cannot run it. It independently verifies the immutable owner and privileged stored role, then skips EMDEE entirely if no devices are enabled. It does not generate briefs or alter the existing ChatGPT schedules.

Only today's canonical Morning/Evening and previous complete Singapore week's summary paths are read. Full Notes must contain a substantial H3-formatted record and have a valid saved timestamp at/after the device's opt-in. Existing older entries do not flood a new device. This signals a saved record, including a provisional evening record; it does not assert user approval, completion of proposed work or scheduler provenance.

A unique per-device/document delivery row reserves work atomically. Successful sends are not repeated on source edits. Failed/abandoned sends have a ten-minute lease and at most three attempts. Transport acceptance followed by a process/database failure can be ambiguous; stable notification tags replace duplicate visible notifications where supported. This is bounded at-least-once retry behavior, not an exactly-once delivery promise. Notifications expire after one hour at the push service. Entries unavailable before their date rolls over may require manual reading.

## Security and configuration

- Subscription endpoints and encryption keys are encrypted with DAILY_INTEGRATION_KEY. Store tables are RLS-enabled and revoked from PUBLIC/anon/authenticated; only service_role can use them and the claim function. Access uses immutable owner ID plus stored role, never an email.
- Owner session and same-origin JSON requests are required for registration/status/test/disable, only on the Admin host in production. Test uses a durable one-minute throttle. Maximum ten active devices.
- Sender endpoints are HTTPS with no credentials/custom ports/fragments, restricted to the supported Apple/Google/Mozilla/Windows push-service hosts. Decrypted records are revalidated before outbound network requests. Redirects are not followed by the transport.
- ADMIN_PUSH_PUBLIC_KEY and ADMIN_PUSH_PRIVATE_KEY are independent VAPID keys. Private key is a Vercel Production Secret. Separate local keys are gitignored. Preserve signing keys; rotation requires subscriptions to be refreshed.
- CRON_SECRET already protects scheduled jobs. No OpenAI inference/provider usage. The legacy weekly API-generation cron stays gated off as before.
- Push payloads contain generic routine titles and Admin route targets, never Markdown/private task content. Worker click URLs are restricted to same-origin Today, weekly reflection or Settings. All destination pages still require owner sign-in.
- No offline private cache, background sync or queued writes. No change to fcOS.

## Operations

Settings shows current device state and warns when the saved-routine monitor reports an EMDEE connection/check failure. An expired EMDEE credential needs reauthorization through Today → Connections. Browser-expired endpoints (404/410) are disabled; enabling again replaces the browser subscription. Per-device endpoint capability URLs must never be logged or committed.

Migration:20261024072128_admin_push_subscriptions.sql. Revoke/drop only these new tables/function for a rollback, without modifying existing daily/member data; dropping subscription records requires device re-enrollment. Disable the new cron before rollback. Verify migration history, RLS/grants, policy/model/worker/SQL tests, production build/typecheck and live unauthorized routes. Actual phone delivery requires the owner to opt in and use Send test notification on that phone.

References: [WebKit home-screen push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [Next PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps), [web-push transport](https://github.com/web-push-libs/web-push).
