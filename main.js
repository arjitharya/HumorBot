const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are HumorBot, a companion to casually talk to - not an assistant that
fetches info or completes tasks. You're the friend who jokes around to lift someone's spirits:
here to chat, riff, and bring humor into whatever the user brings up, in one specific person's
sense of humor. Engage genuinely with what they said (react to it, build on it, ask about it)
rather than just performing a joke at them - the humor comes from actually being in the
conversation, not from treating it as a setup line.

Keep every reply short: max one paragraph, no multi-part rambles or long build-ups.

Their humor style:
- Warm and goofy, never mean-spirited: the "hype friend" energy, upbeat rather than sarcastic or
  cutting.
- The default toolkit is observational jabs, exaggeration,
  mock-seriousness, self-deprecating asides, and playful teasing. The only exception: if a pun
  is so perfectly relatable to what's being said that it would genuinely make someone burst out
  laughing - not just a groan-worthy wordplay reflex - and even then, use it rarely.
- Finds relatable, everyday-frustration humor funny - mundane annoyances and universal small-life
  gripes - and riffs on those rather than going abstract or dark.
- No pop culture/movie/meme references of any kind - jokes are original, built from the
  conversation itself rather than borrowed lines.
- Delivery is punchy, not a slow build - lands the joke quickly within that one short paragraph.

You may be given a few APPROVED EXAMPLES of past replies this person liked. Use them only as a
style reference for tone/timing/references - do not repeat them verbatim. Always write a new
reply to the current message.`;

const chatEl = document.getElementById("chat");

// Replaced with the real key at deploy time by .github/workflows/deploy.yml, straight from the
// GROQ_API_KEY repo secret.
const EMBEDDED_API_KEY = "__GROQ_API_KEY_PLACEHOLDER__";

function getApiKey() {
  // Real Groq keys never contain "__"; this check must not repeat the literal placeholder
  // string, since the deploy workflow's sed replaces every occurrence of it in this file.
  return EMBEDDED_API_KEY.includes("__") ? null : EMBEDDED_API_KEY;
}

function loadExamples() {
  try {
    return JSON.parse(localStorage.getItem("humorbot_examples") || "[]");
  } catch {
    return [];
  }
}

function saveExamples(examples) {
  localStorage.setItem("humorbot_examples", JSON.stringify(examples));
}

function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

function retrieveExamples(userInput, topK = 3) {
  const examples = loadExamples();
  const queryTokens = new Set(tokenize(userInput));
  if (queryTokens.size === 0 || examples.length === 0) return [];

  const scored = examples.map(ex => {
    const overlap = tokenize(ex.user).filter(t => queryTokens.has(t)).length;
    return { ...ex, score: overlap };
  });

  return scored
    .filter(ex => ex.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function buildUserContent(userInput) {
  const examples = retrieveExamples(userInput);
  if (examples.length === 0) return userInput;

  const exampleBlock = examples
    .map(ex => `You: ${ex.user}\nHumorBot: ${ex.reply}`)
    .join("\n\n");

  return `APPROVED EXAMPLES:\n${exampleBlock}\n\nCurrent message:\n${userInput}`;
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatEl.appendChild(div);
  div.scrollIntoView({ behavior: "smooth", block: "end" });
  return div;
}

function addFeedbackRow(botDiv, userInput, reply) {
  const row = document.createElement("div");
  row.className = "feedback";

  const approveBtn = document.createElement("button");
  approveBtn.className = "approve";
  approveBtn.textContent = "Approve";

  const disapproveBtn = document.createElement("button");
  disapproveBtn.className = "disapprove";
  disapproveBtn.textContent = "Disapprove";

  const status = document.createElement("span");
  status.className = "status";

  approveBtn.onclick = () => {
    const examples = loadExamples();
    examples.push({ user: userInput, reply });
    saveExamples(examples);
    status.textContent = "Saved as example.";
    approveBtn.disabled = true;
    disapproveBtn.disabled = true;
  };

  disapproveBtn.onclick = () => {
    status.textContent = "Skipped.";
    approveBtn.disabled = true;
    disapproveBtn.disabled = true;
  };

  row.append(approveBtn, disapproveBtn, status);
  botDiv.after(row);
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const userInput = input.value.trim();
  if (!userInput) return;

  const apiKey = getApiKey();
  if (!apiKey) {
    addMessage("system", "No Groq API key found. This only works on the deployed GitHub Pages site, or locally after temporarily pasting a key into EMBEDDED_API_KEY in main.js.");
    return;
  }

  input.value = "";
  addMessage("user", userInput);
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.disabled = true;

  const thinkingDiv = addMessage("bot", "…thinking…");

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserContent(userInput) },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq request failed with status ${res.status}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty response from model.");

    thinkingDiv.textContent = reply;
    addFeedbackRow(thinkingDiv, userInput, reply);
  } catch (err) {
    thinkingDiv.textContent = `Error: ${err.message}`;
  } finally {
    sendBtn.disabled = false;
  }
}

document.getElementById("sendBtn").onclick = sendMessage;
document.getElementById("userInput").addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});