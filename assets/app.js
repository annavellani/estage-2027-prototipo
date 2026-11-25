// eStage 2027 — prototipo non ufficiale
const SECONDI_CONSIGLIO = 10; // ogni quanti secondi cambia il consiglio

const D = window.DATI;
const nomeComp = Object.fromEntries(D.competenze.map(c => [c.id, c.nome]));
const $ = s => document.querySelector(s);
const FRECCIA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const breve = n => n.replace(/\s*[–(].*$/, "");

// Consiglio a rotazione
function consigli() {
  const p = $(".consiglio p");
  if (!p) return;
  let i = Math.floor(Math.random() * D.consigli.length);
  p.textContent = D.consigli[i];
  setInterval(() => {
    p.classList.add("nascosto");
    setTimeout(() => { i = (i + 1) % D.consigli.length; p.textContent = D.consigli[i]; p.classList.remove("nascosto"); }, 500);
  }, SECONDI_CONSIGLIO * 1000);
}

// Home
function home() {
  const lista = $("#posizioni");
  if (!lista) return;
  const cerca = $("#cerca"), studi = $("#studi"), chips = $("#chips"), esito = $("#esito"), partner = $("#partner");
  const scelte = new Set();

  studi.innerHTML += D.studi.map((s, i) => `<option value="${i}">${s.nome}</option>`).join("");
  chips.innerHTML = D.competenze.map(c => `<button class="chip" type="button" aria-pressed="false" data-comp="${c.id}">${c.nome}</button>`).join("");

  studi.addEventListener("change", () => {
    scelte.clear();
    if (studi.value !== "") D.studi[studi.value].competenze.forEach(c => scelte.add(c));
    aggiorna();
  });
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    const id = b.dataset.comp;
    scelte.has(id) ? scelte.delete(id) : scelte.add(id);
    studi.value = "";
    aggiorna();
  });
  cerca.addEventListener("input", aggiorna);

  const passa = (testo, comp) => {
    const q = cerca.value.trim().toLowerCase();
    return (!q || testo.toLowerCase().includes(q)) && (!scelte.size || comp.some(c => scelte.has(c)));
  };

  function aggiorna() {
    chips.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", scelte.has(b.dataset.comp)));

    const pos = D.posizioni.filter(p => passa(`${p.titolo} ${p.ente} ${p.luogo}`, p.competenze));
    lista.innerHTML = pos.length ? pos.map(p => `
      <a class="voce" href="${p.link}" target="_blank" rel="noopener">
        <div class="logo">${p.logo ? `<img src="${p.logo}" alt="${p.ente}" loading="lazy">` : `<span class="sigla">${breve(p.ente)}</span>`}</div>
        <div><h3>${p.titolo}</h3><div class="chi">${breve(p.ente)} · ${p.luogo}</div></div>
        <div class="cosa">${p.competenze.map(c => `<span class="${scelte.has(c) ? "si" : ""}">${nomeComp[c]}</span>`).join(" · ")}</div>
        <span class="freccia">${FRECCIA}</span>
      </a>`).join("") : `<p class="vuoto">Nessuna posizione con questi filtri.</p>`;

    const en = D.enti.filter(e => passa(`${e.nome} ${e.settore}`, e.competenze));
    partner.innerHTML = en.map(e => `
      <a href="${e.link}" target="_blank" rel="noopener" title="${e.nome}">
        ${e.logo ? `<img src="${e.logo}" alt="${e.nome}" loading="lazy">` : `<span class="nome">${breve(e.nome)}</span>`}
      </a>`).join("");
    $("#conta-partner").textContent = `${en.length} aziende e servizi dell'edizione 2026.`;

    const quante = `<strong>${pos.length} ${pos.length === 1 ? "posizione" : "posizioni"}</strong>`;
    esito.innerHTML = studi.value !== ""
      ? `Studi ${D.studi[studi.value].nome.toLowerCase()}? ${quante} cercano quello che sai fare.`
      : scelte.size ? `${quante} cercano quello che sai fare.`
      : `${quante} aperte adesso.`;
  }
  aggiorna();
}

// Storie
function storie() {
  const box = $("#storie");
  if (!box) return;
  box.innerHTML = D.storie.map(s => `
    <article class="storia">
      <div class="foto"><img src="${s.foto}" alt="${s.nome}" loading="lazy"></div>
      <div>
        <div class="chi">${s.nome} · ${s.ruolo}</div>
        <h2>${s.titolo}</h2>
        <p class="testo">${s.testo}</p>
        <blockquote>«${s.citazione}»</blockquote>
        <a class="link" href="${s.link}" target="_blank" rel="noopener">Leggi l'intervista <span class="freccia">${FRECCIA}</span></a>
      </div>
    </article>`).join("") + `<p class="credito">Interviste e foto: OltreconfiniTi, www.ti.ch/oltreconfiniti</p>`;
}

// Modulo aziende (prototipo: nessun invio reale)
function moduloAziende() {
  const f = $("#form-azienda");
  if (!f) return;
  const nota = $("#nota-invio");
  f.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true;
    f.querySelectorAll("[required]").forEach(el => {
      const vuoto = !el.value.trim() || (el.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
      el.classList.toggle("errore", vuoto);
      if (vuoto) ok = false;
    });
    const comp = f.querySelectorAll('input[name="competenze"]:checked').length;
    if (!ok || !comp) {
      nota.className = "nota-invio";
      nota.textContent = !ok ? "Completa i campi evidenziati." : "Scegli almeno una competenza.";
      return;
    }
    nota.className = "nota-invio ok";
    nota.textContent = "Grazie! La tua offerta è in attesa di approvazione da parte del team Estage. (Prototipo: nessun dato è stato inviato.)";
    f.querySelector("button").disabled = true;
  });
}

// Conferma requisito prima di aprire l'annuncio (e conta i clic: il dato che oggi manca)
function conferma() {
  const box = $("#conferma"), lista = $("#posizioni");
  if (!box || !lista) return;
  const check = $("#conferma-check"), vai = $("#conferma-vai");
  const chiudi = () => { box.classList.remove("aperta"); document.body.style.overflow = ""; };
  lista.addEventListener("click", e => {
    const a = e.target.closest("a.voce"); if (!a) return;
    e.preventDefault();
    vai.href = a.href; check.checked = false; vai.setAttribute("aria-disabled", "true");
    box.classList.add("aperta"); document.body.style.overflow = "hidden"; check.focus();
  });
  check.addEventListener("change", () => vai.setAttribute("aria-disabled", String(!check.checked)));
  vai.addEventListener("click", () => setTimeout(chiudi, 100));
  $("#conferma-annulla").addEventListener("click", chiudi);
  box.addEventListener("click", e => { if (e.target === box) chiudi(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") chiudi(); });
}

// Menu telefono
function tendina() {
  const t = $("#tendina"), apri = $(".apri-menu");
  if (!t || !apri) return;
  const set = v => { t.classList.toggle("aperta", v); apri.setAttribute("aria-expanded", v); document.body.style.overflow = v ? "hidden" : ""; };
  apri.addEventListener("click", () => set(true));
  t.querySelector(".chiudi").addEventListener("click", () => set(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
}

document.querySelectorAll("[data-aggiornato]").forEach(el => el.textContent = D.aggiornato);
consigli(); home(); storie(); moduloAziende(); conferma(); tendina();
