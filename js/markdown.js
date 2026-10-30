// Tiny markdown subset for model answers: paragraphs, "-" lists, ``` code fences, `code` and **bold**.
// Builds DOM nodes (never HTML strings), so answer text can't inject markup.
function inline(text) {
  const out = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const node = document.createElement(m[1] != null ? "code" : "strong");
    node.textContent = m[1] ?? m[2];
    out.push(node);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(src) {
  const root = document.createElement("div");
  root.className = "md";
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let para = [], list = null;
  const flushPara = () => {
    if (!para.length) return;
    const p = document.createElement("p");
    p.append(...inline(para.join(" ")));
    root.append(p);
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      flushPara(); list = null;
      const code = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) code.push(lines[i]);
      const pre = document.createElement("pre");
      const c = document.createElement("code");
      c.textContent = code.join("\n");
      pre.append(c);
      root.append(pre);
    } else if (/^\s*[-*] /.test(line)) {
      flushPara();
      if (!list) { list = document.createElement("ul"); root.append(list); }
      const li = document.createElement("li");
      li.append(...inline(line.replace(/^\s*[-*] /, "")));
      list.append(li);
    } else if (!line.trim()) {
      flushPara(); list = null;
    } else {
      list = null;
      para.push(line.trim());
    }
  }
  flushPara();
  return root;
}
