# Kairos

Public informational website for Kairos, a company-intelligence and conversation-preparation project by Agentic Realities. This static site does not expose the application backend, private company records, credentials, or real leads. The research illustration is fictional.

GitHub Pages publishes `docs` from `main` in `ansahmad-builds/kairos`, with the custom domain `kairos.agenticrealities.com`.

Source is maintained in the `kairos` subdirectory of the AgenticRealities repository. Publish committed updates with:

```powershell
git subtree push --prefix=kairos https://github.com/ansahmad-builds/kairos.git main
```

Serve `docs` with a static HTTP server for preview. No dependencies or build step are needed. In Namecheap, the `kairos` CNAME points to `ansahmad-builds.github.io`. GitHub Pages manages the TLS certificate; enforce HTTPS after issuance.
