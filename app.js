const $ = (s) => document.querySelector(s);
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, RM ? 20 : ms));
let C, ac, on = false, tm, mx = 0, my = 0;

/* ---------- audio: synthesised pad + soft blips, starts only on click ---------- */
const CH = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
let ci = 0;
function tone(f, t, d, v, att) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + att);
  g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + d + 0.1);
}
const pad = () => CH[ci++ % 4].forEach((f) => tone(f, ac.currentTime, 5, 0.04, 2));
const blip = (f) => { if (on) tone(f, ac.currentTime, 0.4, 0.05, 0.02); };
$("#music").onclick = (e) => {
  on = !on;
  if (on) { ac = ac || new AudioContext(); ac.resume(); pad(); tm = setInterval(pad, 4000); blip(660); }
  else clearInterval(tm);
  e.currentTarget.setAttribute("aria-pressed", on);
  e.currentTarget.textContent = on ? "♪ Music on" : "♪ Music off";
};

/* ---------- particles, stars and depth hearts ---------- */
const cv = $("#fx"), g = cv.getContext("2d");
let W, H;
const P = [];
const rs = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
addEventListener("resize", rs); rs();
for (let i = 0; i < (innerWidth < 700 ? 40 : 80); i++)
  P.push({ x: Math.random() * W, y: Math.random() * H, z: 0.15 + Math.random() * 0.85, h: i % 8 === 0, p: Math.random() * 6 });
function burst(n) {
  if (RM) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, s = 2 + Math.random() * 7;
    P.push({ x: W / 2, y: H / 2, z: 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 70, b: 1, p: 0 });
  }
}
function frame(t) {
  g.clearRect(0, 0, W, H);
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    if (p.b) {
      p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97;
      if (--p.life <= 0) { P.splice(i, 1); continue; }
    } else if (!RM) {
      p.y -= p.z * (p.h ? 0.45 : 0.2);
      if (p.y < -40) { p.y = H + 40; p.x = Math.random() * W; }
    }
    const x = p.x + mx * p.z * 40, y = p.y + my * p.z * 40;
    const a = p.b ? p.life / 70 : 0.25 + 0.5 * Math.abs(Math.sin(t / 1500 + p.p)) * p.z;
    g.shadowBlur = 8 + p.z * 14;
    if (p.h) {
      g.shadowColor = "#ff8fbe";
      g.fillStyle = `rgba(255,143,190,${0.12 + p.z * 0.4})`;
      g.font = `${12 + p.z * 40}px serif`;
      g.fillText("♥", x, y);
    } else {
      g.shadowColor = p.b ? "#f6c177" : "#c9b3ff";
      g.fillStyle = p.b ? `rgba(246,193,119,${a})` : `rgba(220,205,255,${a})`;
      g.beginPath(); g.arc(x, y, 0.6 + p.z * 1.8, 0, 6.28); g.fill();
    }
  }
  if (!RM) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener("pointermove", (e) => {
  mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
  const s = document.documentElement.style;
  s.setProperty("--mx", mx); s.setProperty("--my", my);
  document.body.classList.add("m");
  const c = $("#cur"); c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px";
});

/* ---------- helpers ---------- */
async function go(id) {
  document.querySelector(".scene.on")?.classList.remove("on");
  await wait(750);
  $("#" + id).classList.add("on");
}
async function type(el, s, step = 1, ms = 40) {
  if (RM) { el.textContent = s; return; }
  el.textContent = "";
  for (let i = 0; i < s.length; i += step) {
    el.textContent = s.slice(0, i + step);
    el.parentElement.scrollTop = 1e5;
    await wait(ms);
  }
}

/* ---------- password gate (verified by the Netlify function) ---------- */
$("#eye").onclick = (e) => {
  const i = $("#pw"), show = i.type === "password";
  i.type = show ? "text" : "password";
  e.currentTarget.setAttribute("aria-label", show ? "Hide password" : "Show password");
};
function wrong() {
  const c = $("#card");
  c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
  $("#msg").textContent = "Hmm... that’s not quite right. Try again ❤️";
  blip(180);
}
$("#card").onsubmit = async (e) => {
  e.preventDefault();
  const b = $("#go"), m = $("#msg");
  m.textContent = ""; b.disabled = true;
  try {
    const r = await fetch("/.netlify/functions/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: $("#pw").value }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.ok) { C = d.content; $("#pw").value = ""; await unlock(); }
    else if (r.status === 401) wrong();
    else m.textContent = "The unlock service isn’t available right now. Please try again later.";
  } catch (_) {
    m.textContent = "Couldn’t reach the server. Please check your connection.";
  }
  b.disabled = false;
};

/* ---------- experience ---------- */
const IC = [
  '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  '<path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/>',
  '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="14.500" cy="12" r="1"/>',
  '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
];
function setup() {
  $("#ct").textContent = C.title;
  $("#grid").innerHTML = C.cards
    .map((t, i) => `<div class="glass" style="--i:${i}"><svg viewBox="0 0 24 24" aria-hidden="true">${IC[i]}</svg><p>${t}</p></div>`)
    .join("");
  $("#fh").textContent = C.final[0];
  $("#fp").textContent = C.final[1];
  $("#fs").textContent = C.final[2];
}
async function unlock() {
  $("#gate").classList.add("unlocked");
  burst(140);
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f), i * 140));
  await wait(1500);
  setup();
  await go("intro");
  intro();
}
async function intro() {
  $("#open").hidden = true;
  await wait(600);
  await type($("#t1"), C.intro[0], 1, 50);
  await wait(900);
  await type($("#t2"), C.intro[1], 1, 60);
  await wait(500);
  $("#open").hidden = false;
  $("#open").focus();
}
$("#open").onclick = async () => { blip(440); await go("env"); $("#envbtn").focus(); };
$("#envbtn").onclick = async (e) => {
  const b = e.currentTarget;
  if (b.classList.contains("open")) return;
  b.classList.add("open"); blip(392); $("#hint").hidden = true;
  await wait(1900);
  burst(50);
  b.classList.add("gone");
  await wait(700);
  b.hidden = true;
  $("#letter").classList.add("show"); blip(523);
  await type($("#lt"), C.letter, 2, 26);
  $("#n1").hidden = false;
  $("#n1").focus();
};
$("#n1").onclick = () => { blip(494); go("cards"); };
$("#n2").onclick = async () => {
  blip(587);
  await go("final");
  await wait(10000);
  $("#final").classList.add("out"); // smooth fade-out
  await wait(3500);
  $("#again").hidden = false;
  $("#again").focus();
};
$("#again").onclick = async () => {
  $("#final").classList.remove("out");
  $("#again").hidden = true;
  $("#envbtn").classList.remove("open", "gone");
  $("#envbtn").hidden = false;
  $("#hint").hidden = false;
  $("#letter").classList.remove("show");
  $("#n1").hidden = true;
  $("#t1").textContent = $("#t2").textContent = "";
  await go("intro");
  intro();
};
