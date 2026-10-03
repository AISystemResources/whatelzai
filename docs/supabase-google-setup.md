# Whatelz Google sign-in setup

The feature branch replaces Clerk with Supabase Auth. Production still uses Clerk until the identity migration, Google configuration and cutover are completed. Do not disable or delete the Clerk account before cutover is verified.

## 1. Create the Google client

Open [Google Auth Platform](https://console.cloud.google.com/auth/overview) and select or create a Whatelz project.

- Branding: use Whatelz, your support email, and your public homepage/privacy/terms URLs where Google requests them.
- Audience: External, because members use personal Google accounts. While the client is in Testing, add your Google account and the members who will test it. Publish the audience when ready for wider onboarding.
- Data Access: request only `openid`, email and profile.
- Clients: create an OAuth client ID with application type **Web application**.

Authorized JavaScript origins:

```text
https://whatelz.ai
https://www.whatelz.ai
https://app.whatelz.ai
https://admin.whatelz.ai
```

Authorized redirect URI (this is the Google-to-Supabase callback):

```text
https://tnjujbkpepchhgyqwmtb.supabase.co/auth/v1/callback
```

Save the client ID and secret privately. Do not paste the secret into chat or commit it.

## 2. Configure Supabase

Open the [Whatelz Google provider settings](https://supabase.com/dashboard/project/tnjujbkpepchhgyqwmtb/auth/providers). Enable Google and enter the client ID and secret. Keep nonce checks enabled. Save.

Open [Auth URL Configuration](https://supabase.com/dashboard/project/tnjujbkpepchhgyqwmtb/auth/url-configuration):

- Site URL: `https://app.whatelz.ai`
- Redirect URLs (these are Supabase-to-Whatelz callbacks; the suffix allows the return-path query):

```text
https://app.whatelz.ai/auth/callback**
https://admin.whatelz.ai/auth/callback**
https://whatelz.ai/auth/callback**
https://www.whatelz.ai/auth/callback**
```

For local verification add `http://localhost:3100/auth/callback**`. For the PR preview add its exact hostname with `/auth/callback**`; avoid a wildcard that authorizes other people's Vercel deployments.

## 3. Coordinated cutover

The independent team contact-details migration is already applied. The auth identity migration is still pending production approval. It adds internal ownership columns, preserves old columns for rollback/payment reconciliation, and makes billing/quiz tables server-only.

1. Approve and apply the reviewed auth migration through Supabase MCP.
2. Run `npm run migrate:auth` using the existing local Clerk verification key and Supabase service key. This one-time script verifies legacy primary emails, pre-provisions Supabase identities, and explicitly maps them to the existing internal user IDs. It preserves roles; normal sign-in never claims a legacy account by email.
3. Verify Google sign-in on the PR preview using the migrated owner's existing email and an ordinary member account. Verify role enforcement, logout, purchases, callbacks and the member's limited team view.
4. Merge the PR for Vercel production deployment and repeat those checks on the production hosts. Keep a rollback to the previous Clerk deployment available. The old SDK/credentials are no longer needed by the new app, but retain the old service configuration until the cutover has been verified.

Existing sessions will require sign-in again. Assigned contact emails and ABO numbers never grant team access: an admin must separately verify and link a login account to a person.

Reference: [Supabase's Google OAuth guide](https://supabase.com/docs/guides/auth/social-login/auth-google).
