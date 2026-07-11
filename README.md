# HumorBot
A companion that uses humor to keep your spirits high — trained over time to joke around in your
own sense of humor rather than answer questions or fetch info.

## Tech stack

A single static page — no build step, no server, no framework:

- `index.html` — markup
- `main.js` — chat logic (calls Groq's OpenAI-compatible API directly from the browser). Has a
  placeholder, `__GROQ_API_KEY_PLACEHOLDER__`, substituted with the real key at deploy time.
- `styles.css` — all styling
- `.github/workflows/deploy.yml` — deploys to GitHub Pages on every push to `main`

## Local development

There's no key baked in locally, since the real key only gets substituted in during deploy. To
test locally with a real key, temporarily replace `__GROQ_API_KEY_PLACEHOLDER__` in `main.js`
with your key, use the page, then revert the edit before committing (never commit a real key).

Talk to HumorBot like you would a friend. After each reply, click **Approve** to save that
exchange as a style example (pulled back in as a style reference for future similar messages) or
**Disapprove** to skip it. Approved examples are stored in your browser's `localStorage` only.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` substitutes the `GROQ_API_KEY` repo secret directly into
`main.js` (replacing `__GROQ_API_KEY_PLACEHOLDER__`) and deploys the whole site on every push to
`main`. One-time setup:

1. **Add the secret:** repo Settings → Secrets and variables → Actions → New repository secret,
   named `GROQ_API_KEY`, value = your Groq key.
2. **Point Pages at Actions:** repo Settings → Pages → Build and deployment → Source →
   **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the Actions tab). The site publishes to
   `https://<username>.github.io/HumorBot/`.

**Important:** because there's no backend, the deployed page still ships the API key inside its
client-side JavaScript — anyone who visits the live site can view-source and read it out. Keep
this to a free-tier Groq key you're fine sharing the quota on, never a paid/production key
(same tradeoff as the SimpleSpeech project).

## Acknowledgements

Claude was used to debug the GitHub Actions deploy workflow's handling of the `GROQ_API_KEY`
secret (hence its appearance as a contributor on this repo).
