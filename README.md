Sovr1n (Static Site)

This is a static site (plain HTML/CSS/JS). It's ready to deploy on Vercel directly from this GitHub repository.

Quick notes for Vercel:

- Repository: https://github.com/jasonmanuel-cmd/sovr1n
- Build settings: None required for a static site. Vercel will detect and deploy `index.html` from the repository root.
- Output Directory: Leave empty (root) or `/`.
- Framework Preset: Select "Other" or "Static Site" if prompted.
- `vercel.json` is included to provide headers and URL behavior.

Steps to deploy from Vercel (GUI):
1. Go to https://vercel.com/new
2. Choose "Import Git Repository" and select `jasonmanuel-cmd/sovr1n` (authorize GitHub if necessary).
3. Branch: `main` (default)
4. Framework Preset: "Other" or leave blank
5. Build Command: leave empty
6. Output Directory: leave empty
7. Click "Deploy"

Advanced: If you prefer CLI deployment, install the Vercel CLI and run:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Contact: If you want any server-side features or environment variables configured, tell me what they are and I can add guidance or a sample `.env` config.
