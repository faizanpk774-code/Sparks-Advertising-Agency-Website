# Sparks Advertising Agency

A server-rendered website and lightweight client/admin portal built with the Node.js standard library, HTML, CSS, vanilla JavaScript, SVG, and local JSON files. There are no runtime dependencies or build step.

The visual system is based on the supplied Sparks logo: orange lettering, a charcoal/white counterpart, and the lightning mark. Service coverage and the four published portfolio projects are informed by the public Sparks website. Client testimonials are not seeded.

## Requirements

- Node.js 18 or newer. Node.js 20 or 22 LTS is recommended for a new cPanel application.
- A writable application directory.
- HTTPS configured for production so session cookies can use the `Secure` attribute.

Check the version with `node --version`. No `npm install` command is needed.

## Run locally

```text
npm start
```

Open `http://localhost:3000`. If `PORT` is set by the hosting environment, the app uses that port. The `/health` endpoint returns a small JSON health response.

On first startup, the terminal prints a one-time administrator setup URL containing a random secret token. Open that URL on the application host, create the first administrator, and keep the setup URL private. Setup closes after that first account is saved. The token is not a password and is never hardcoded. If the app is restarted before setup is completed, use the new token printed for that startup.

## cPanel deployment

1. In cPanel, open **Setup Node.js App** / **Node.js Application Manager** and choose Node.js 20 or 22 if available (minimum supported: 18).
2. Set the application root to this project directory, the application URL to the intended domain/path, and the startup file to `server.js`.
3. Set `NODE_ENV=production`. cPanel supplies `PORT`; do not hardcode a port in the hosting configuration.
4. Ensure the application user can write to `data/` and `storage/private/`. No root access, database, build tool, or package installation is required.
5. Create or start the application from cPanel. Read the application startup log for the one-time setup URL. Replace the logged `localhost` hostname with the configured HTTPS host while preserving the token and `/admin/setup` path.
6. Complete administrator setup once, then remove or securely retain the setup log according to your hosting policy. Restart the application from cPanel after code/configuration changes.
7. Confirm `https://your-domain.example/health` returns `{"status":"ok"}` and test the public site, contact form, and portal.

The logo artwork supplied with the project is copied into `public/assets/logo-light.png` and `public/assets/logo-dark.png`. Keep those files with the website when deploying.

## Admin and client portal

- Admin sign-in: `/admin/login`
- Client registration/sign-in: `/client/register` and `/client/login`
- To reset an administrator password locally, run `node server.js --reset-admin-password admin@sparksadvert.com` in a terminal attached to the application directory, then enter and confirm the new password at the hidden prompts. The reset requires 14+ characters with letters and numbers; passwords are not echoed or placed in shell history.
- Admin routes check the server-side session role. Public registration always creates a client role.
- Passwords use salted Node.js `crypto.scrypt` hashes. Sessions use random opaque tokens in HTTP-only, SameSite=Lax cookies, expire after eight hours, and rotate after login. Production cookies are marked Secure when `NODE_ENV=production`.
- State-changing forms require a session CSRF token. Login attempts are rate-limited per remote address and role.
- Admin can edit homepage, About, and Contact copy through **Website content**, and manage services, portfolio records, journal posts, contact enquiries, service orders/status history, client profiles, and contact settings. The portfolio starts with four projects listed on the public Sparks website; their descriptions are paraphrased from the published project pages. Dashboard counts read the persisted JSON records.
- Admins can choose **Edit Website** in the dashboard or public-site navigation, then click headings, text, images, or sections directly on public pages. The visual editor can change safe text formatting, replace or upload images, apply colour/size/spacing/width/font/corner presets, alignment, and section order. Changes are saved to `data/site-edits.json`; use **Save changes** in the editor toolbar to publish.
- **Website settings** controls the company contact details, primary/accent/background colours, and light/dark logos. These saved brand settings are used by the public website.
- Portfolio project forms support a featured image and up to 12 gallery images. Admin uploads accept PNG, JPEG, and WebP files up to 10 MB each; images are signature-checked and stored under `public/assets/uploads/`.
- The journal includes 50 original published articles with individual locally generated cover illustrations. Admins can add, edit and publish journal posts, including uploading or replacing a cover image.
- The homepage hero rotates through 15 service-focused, three-word headlines with a short explanation for each. The hero headlines are maintained in `server.js`; service descriptions remain editable under **Services**.
- The visual editor uses preset appearance controls and safe text formatting; it does not permit arbitrary HTML, arbitrary CSS, route changes, or code editing. Uploaded images are served only from the public assets directory. The traditional **Website content** screen remains available for supported text fields.
- The contact form stores validated enquiries. It does **not** send email; no delivery claim is made.
- Client portal file attachments are not implemented. `storage/private/` remains reserved for future private files and must never be served as a static path.

## Local records, backups, and limitations

Small structured records are created in `data/` on first startup: services, projects, posts, enquiries, users, orders, website edits, content, and settings. Uploaded images are stored in `public/assets/uploads/`; the journal cover illustrations are in `public/assets/journal/`. Writes are serialized within the process, guarded by an exclusive lock file, and committed through temporary files plus rename. Invalid JSON is moved aside with an `.invalid-<timestamp>` suffix and the app continues using safe defaults.

This JSON storage is basic local persistence, **not** equivalent to a production database. It is intended for a small, single-instance deployment. It does not provide database-grade multi-process transactions, high-volume concurrency, replication, or managed backups. Back up `data/`, `public/assets/uploads/`, and `storage/private/` regularly using your host’s backup facility, protect access to those files, and test restore procedures. Avoid running multiple app instances against the same data directory.

The privacy and terms pages are starter website copy, not legal advice. Review them for the actual business, jurisdictions, retention practices, and applicable law before launch.

## Routes

Public: `/`, `/about`, `/services`, `/services/:slug`, `/work`, `/work/:slug`, `/blog`, `/blog/:slug`, `/contact`, `/privacy`, `/terms`.

Client: `/client/register`, `/client/login`, `/client/dashboard`, `/client/new-request`, `/client/orders/:id`.

Admin: `/admin/login`, `/admin/dashboard`, `/admin/site-editor`, `/admin/content`, `/admin/services`, `/admin/projects`, `/admin/posts`, `/admin/enquiries`, `/admin/orders`, `/admin/clients`, `/admin/settings`.