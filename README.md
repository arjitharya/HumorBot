# HumorBot
A companion that uses humor to keep your spirits high — trained over time to joke around in your
own sense of humor rather than answer questions or fetch info.

## Tech stack

A single static page — no build step, no server, no framework:

- `index.html` — markup
- `main.js` — chat logic (calls Groq's OpenAI-compatible API directly from the browser)
- `styles.css` — all styling
- `config.js` — your Groq API key (gitignored, see setup below); `config.js.example` shows the
  format
- `.github/workflows/deploy.yml` — deploys to GitHub Pages on every push to `main`

## Usage

Open `index.html` directly in a browser.

### 1. Set up your Groq API key

Get a free key at [console.groq.com/keys](https://console.groq.com/keys), then copy
`config.js.example` to `config.js` and set:

```js
window.GROQ_API_KEY = "gsk_...";
```

`config.js` is gitignored, so your real key is never committed — `index.html` loads it
automatically on open.

### 2. Chat

Talk to HumorBot like you would a friend. After each reply, click **Approve** to save that
exchange as a style example (pulled back in as a style reference for future similar messages) or
**Disapprove** to skip it. Approved examples are stored in your browser's `localStorage` only.

**Note:** since this is a static page with no backend, the API key lives in `config.js` and is
sent directly from your browser to Groq's API. This repo is public, so `config.js` stays
gitignored specifically to keep your real key out of source — don't remove it from `.gitignore`
or hardcode a real key into `index.html` or `config.js.example`.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` substitutes the `GROQ_API_KEY` repo secret directly into
`main.js` (replacing an `__GROQ_API_KEY_PLACEHOLDER__` marker) and deploys the whole site on
every push to `main` — no `config.js` involved on the deployed site at all. One-time setup:

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
