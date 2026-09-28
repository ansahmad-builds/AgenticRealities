# Agentic Realities

The landing page for [agenticrealities.com](https://agenticrealities.com).

## Local preview

Serve the `dist` directory with any static file server. For example:

```powershell
npx serve dist
```

## Deployment

Pushes to `main` deploy the contents of `dist` through GitHub Pages. The custom domain is declared in `dist/CNAME`.

## Project websites

The main site links to three independently hosted public information pages:

- [Sitoa](https://sitoa.agenticrealities.com/) — project memory, decisions, and follow-ups.
- [Kairos](https://kairos.agenticrealities.com/) — company signals, buyer matching, and conversation preparation.
- [Bongaus](https://bongaus.agenticrealities.com/) — creator discovery, research, and outreach preparation.

Each source lives in its named subdirectory. Each separate GitHub repository publishes `docs` from `main`, with a project-specific `CNAME`. See those READMEs for the subtree publishing commands. These are static project-information sites, not public deployments of the underlying applications or their databases.
