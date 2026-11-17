const crypto = require("crypto");

// The message lives here (server side), so it is only sent after the password is verified.
const CONTENT = {
  intro: ["Something I’ve been meaning to tell you...", "This one’s for you, Hidayah."],
  letter:
    "Dear Hidayah,\n\n" +
    "I don’t really know where to begin, but I genuinely want to say that I’m sorry.\n\n" +
    "I know that something I did or said may have hurt you, and I truly regret that. I’m not here to make excuses or justify my actions. I just want you to know that I never wanted to make you feel bad.\n\n" +
    "Maybe I didn’t realise the impact of my actions at the time, but that doesn’t mean your feelings don’t matter.\n\n" +
    "I understand that saying sorry doesn’t automatically make everything okay. I don’t expect you to forget anything or accept my apology immediately.\n\n" +
    "I just wanted to make an effort and let you know that I’m genuinely sorry.\n\n" +
    "Take your time. I respect your feelings and your decision.\n\n" +
    "Once again, I’m sorry, Hidayah.",
  title: "Some Things I Want You to Know",
  cards: [
    "I genuinely mean this apology.",
    "Your feelings matter.",
    "I respect your space and your decision.",
    "I hope things can become better with time.",
  ],
  final: [
    "I’m genuinely sorry, Hidayah.",
    "No pressure. No expectations. Just a sincere apology.",
    "Made with sincerity, just for you. ❤️",
  ],
};

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();
const reply = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return reply(405, { ok: false });
  const secret = process.env.APOLOGY_PASSWORD;
  if (!secret) return reply(500, { ok: false, error: "APOLOGY_PASSWORD is not set" });

  let attempt = "";
  try {
    attempt = JSON.parse(event.body || "{}").password || "";
  } catch (_) {}

  if (crypto.timingSafeEqual(digest(attempt), digest(secret))) {
    return reply(200, { ok: true, content: CONTENT });
  }
  await new Promise((r) => setTimeout(r, 600)); // slows down guessing
  return reply(401, { ok: false });
};
