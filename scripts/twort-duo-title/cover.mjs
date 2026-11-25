const copy = {
  ko: {
    notes: "메모", menu: ["파일", "편집", "보기"],
    title: "해안 답사", body: "썰물 때 드러난 바위와 물빛.", palette: "현장에서 모은 색",
  },
  en: {
    notes: "Notes", menu: ["File", "Edit", "View"],
    title: "Coast study", body: "Rock pools at low tide.", palette: "Field palette",
  },
};

const glyphs = {
  windows: '<rect x="3" y="3" width="13.5" height="13.5" rx="3"/><path d="M9 19v.5a1.5 1.5 0 0 0 1.5 1.5H18a3 3 0 0 0 3-3v-7.5A1.5 1.5 0 0 0 19.5 9H19"/>',
  commands: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.7"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.7"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.7"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.7"/>',
  more: '<g fill="currentColor" stroke="none"><circle cx="4.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19.5" cy="12" r="1.6"/></g>',
  keyboard: '<rect x="1.5" y="5" width="21" height="14" rx="2.5"/><path d="M5 9h.5m2.5 0h.5m3 0h.5m2.5 0h.5m3 0h.5M5 12h.5m3 0H9m3 0h.5m2.5 0h.5M7.5 15.5h9"/>',
};

function tool(name) {
  return `<span class="tool"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${glyphs[name]}</svg></span>`;
}

export function coverPage(lang, dark) {
  const t = copy[lang];
  return `<!doctype html>
<html lang="${lang}">
<meta charset="utf-8">
<style>
  :root { color-scheme: ${dark ? "dark" : "light"}; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  }
  .desktop {
    position: relative;
    left: -84px;
    width: 1456px;
    height: 100vh;
    background: url("/twort/coast-study.webp") 52% 52% / cover no-repeat;
  }
  .menu {
    display: flex;
    align-items: center;
    gap: 22px;
    height: 28px;
    padding: 0 28px;
    color: white;
    background: light-dark(#0b272c66, #101619ad);
    backdrop-filter: blur(16px);
    font-size: 13px;
    font-weight: 500;
  }
  .menu time { margin-left: auto; }
  .note {
    position: absolute;
    top: 23%;
    left: 9%;
    width: 38%;
    overflow: hidden;
    border: 1px solid light-dark(#e1e1cb99, #777d746b);
    border-radius: 13px;
    background: light-dark(#faf8ee, #282c29);
    box-shadow: 0 12px 40px light-dark(#0c262c4d, #060f1480);
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    padding: 0 14px;
    border-bottom: 1px solid light-dark(#d8d5c699, #585d5488);
    background: light-dark(#f2f0e7, #343834);
    color: light-dark(#757870, #d4d8d1);
    font-size: 12px;
  }
  .lights, .swatches { display: flex; gap: 6px; }
  .lights i { width: 9px; height: 9px; border-radius: 50%; background: #ea8076; }
  .lights i:nth-child(2) { background: #e8bd62; }
  .lights i:nth-child(3) { background: #81b08e; }
  .content { padding: 24px 22px; }
  h1 {
    margin: 0 0 5px;
    color: light-dark(#2a3839, #f2f4ec);
    font-size: 28px;
    letter-spacing: -.045em;
    font-weight: 680;
  }
  p { margin: 0 0 22px; color: light-dark(#636b64, #ccd1c8); font-size: 14px; }
  .swatches i { width: 4.6vw; height: 4.6vw; border-radius: 4px; background: #175f66; }
  .swatches i:nth-child(2) { background: #80a99a; }
  .swatches i:nth-child(3) { background: #dfb889; }
  .swatches i:nth-child(4) { background: #ad7852; }
  small { display: block; margin-top: 9px; font-size: 12px; color: light-dark(#70756c, #b1bbaf); }
  .tools { position: absolute; right: 26px; display: grid; gap: 13px; }
  .tools-top { top: 23%; }
  .tools-bottom { bottom: 24px; }
  .tool {
    display: grid;
    place-items: center;
    /* Match the rendered diameter of the 52px buttons on the landscape capture. */
    width: 68px;
    height: 68px;
    border: 1.35px solid light-dark(#fff9, #d4dedb40);
    border-radius: 50%;
    background: light-dark(rgb(242 245 238 / .83), rgb(44 49 48 / .86));
    color: light-dark(#273132, #edefea);
    box-shadow: 0 2.7px 10.8px #15272b25;
    backdrop-filter: blur(19px);
  }
  .tool svg { width: 30px; height: 30px; }
</style>
<div class="desktop">
  <div class="menu"><b>${t.notes}</b>${t.menu.map(label => `<span>${label}</span>`).join("")}<time>9:41</time></div>
  <div class="note">
    <div class="toolbar"><span class="lights"><i></i><i></i><i></i></span><span>${t.notes}</span></div>
    <div class="content">
      <h1>${t.title}</h1>
      <p>${t.body}</p>
      <span class="swatches"><i></i><i></i><i></i><i></i></span>
      <small>${t.palette}</small>
    </div>
  </div>
</div>
<div class="tools tools-top">${tool("windows")}${tool("commands")}</div>
<div class="tools tools-bottom">${tool("more")}${tool("keyboard")}</div>
</html>`;
}
