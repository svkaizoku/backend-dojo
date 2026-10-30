// Small Java/Kotlin highlighter: returns escaped HTML for one line of code.
export const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const KEYWORDS = new Set((
  "public private protected final static class interface return new if else for while try catch throw throws void " +
  "int long double boolean char byte short float this null true false synchronized extends implements record enum switch case " +
  "break continue default instanceof import package fun val var when object companion data sealed override open lateinit " +
  "suspend is as in out internal by init it super do repeat"
).split(" "));

export function highlight(line) {
  const re = /("(?:[^"\\]|\\.)*")|(\/\/.*$|\/\*.*?\*\/|^\s*\*.*$|^\s*\/\*\*?.*$)|(@[A-Za-z]+)|\b(\d[\d_]*(?:\.\d+)?L?)\b|\b([A-Za-z_]\w*)\b/g;
  let out = "", last = 0, m;
  while ((m = re.exec(line))) {
    out += esc(line.slice(last, m.index));
    const t = esc(m[0]);
    if (m[1]) out += `<span class="s">${t}</span>`;
    else if (m[2]) out += `<span class="c">${t}</span>`;
    else if (m[3]) out += `<span class="a">${t}</span>`;
    else if (m[4]) out += `<span class="n">${t}</span>`;
    else if (KEYWORDS.has(m[5])) out += `<span class="k">${t}</span>`;
    else if (/^[A-Z]/.test(m[5])) out += `<span class="ty">${t}</span>`;
    else out += t;
    last = re.lastIndex;
  }
  return out + esc(line.slice(last));
}

// Read-only code block with line numbers. pins: { lineNumber: [labels] } marks lines.
export function codeHtml(lines, pins = {}) {
  return lines.map((line, i) => {
    const no = i + 1;
    const p = pins[no];
    const pinHtml = p ? p.map(n => `<span class="pin">#${n}</span>`).join("") : "";
    return `<div class="ln${p ? " mark" : ""}"><span class="no">${no}</span><span class="src">${highlight(line) || " "}${pinHtml}</span></div>`;
  }).join("");
}
