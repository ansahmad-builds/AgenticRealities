# Sitoa

The public project-information website for Sitoa, an evidence-backed project memory prototype by Agentic Realities.

This is a static informational site. It contains no private project records, credentials, application backend, upload endpoint, or live customer data. The answer illustration is entirely fictional.

## Hosting

GitHub Pages publishes the `docs` directory from `main` in `ansahmad-builds/sitoa`. The custom domain is `sitoa.agenticrealities.com`.

The source is maintained in the `sitoa` subdirectory of the AgenticRealities repository. Publish committed updates to the separate repository with:

```powershell
git subtree push --prefix=sitoa https://github.com/ansahmad-builds/sitoa.git main
```

## DNS

In Namecheap Advanced DNS, add a CNAME record with host `sitoa` and target `ansahmad-builds.github.io` (automatic TTL). Do not change the existing apex or `www` records. Configure the custom domain in GitHub Pages before adding DNS, and enable Enforce HTTPS once the certificate is issued.

## Preview

Serve `docs` with a static HTTP server. No package installation or build step is required.

## Content boundaries

Describe current prototype capabilities honestly. External connectors are planned, not connected. Do not publish private records, screenshots of real answers, or generated content derived from them. Do not imply production readiness, guaranteed accuracy, or legal certification.
