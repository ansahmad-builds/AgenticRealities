# Bongaus

Public informational website for Bongaus, a creator-discovery, research, and outreach-preparation project by Agentic Realities. This static site contains no application backend, private creator records, analytics, credentials, or real campaigns. The research illustration is fictional.

GitHub Pages publishes `docs` from `main` in `ansahmad-builds/bongaus`, with the custom domain `bongaus.agenticrealities.com`.

Source is maintained in the `bongaus` subdirectory of the AgenticRealities repository. Publish committed updates with:

```powershell
git subtree push --prefix=bongaus https://github.com/ansahmad-builds/bongaus.git main
```

Serve `docs` with a static HTTP server for preview. No dependencies or build step are needed. In Namecheap, the `bongaus` CNAME points to `ansahmad-builds.github.io`. GitHub Pages manages the TLS certificate; enforce HTTPS after issuance.
