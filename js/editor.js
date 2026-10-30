// Lightweight code editor: a transparent textarea over a highlighted copy of the same text.
// Both sit in one grid cell sized by the highlighted text, so they always line up.
import { highlight } from "./highlight.js";

const INDENT = "    ";

export function createEditor(host, { onChange, label = "Code editor" } = {}) {
  host.classList.add("editor");
  host.innerHTML = `<div class="ed-scroll"><pre class="ed-gutter" aria-hidden="true"></pre><div class="ed-stack"><pre class="ed-hl" aria-hidden="true"></pre><textarea class="ed-input" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea></div></div>`;
  const gutter = host.querySelector(".ed-gutter");
  const hl = host.querySelector(".ed-hl");
  const input = host.querySelector(".ed-input");
  input.setAttribute("aria-label", label);
  let escaped = false; // Escape then Tab moves focus out, so keyboard users aren't trapped.

  function paint() {
    const lines = input.value.split("\n");
    hl.innerHTML = lines.map(highlight).join("\n") + "\n";
    gutter.textContent = lines.map((_, i) => i + 1).join("\n");
  }

  function insert(text) {
    input.focus();
    // execCommand keeps the browser's undo history; setRangeText is the fallback.
    if (!document.execCommand("insertText", false, text)) {
      input.setRangeText(text, input.selectionStart, input.selectionEnd, "end");
      input.dispatchEvent(new Event("input"));
    }
  }

  input.addEventListener("input", () => { paint(); onChange?.(input.value); });
  input.addEventListener("keydown", e => {
    if (e.key === "Escape") { escaped = true; return; }
    if (e.key === "Tab" && !escaped && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      insert(INDENT);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const before = input.value.slice(0, input.selectionStart);
      const line = before.slice(before.lastIndexOf("\n") + 1);
      let indent = line.match(/^\s*/)[0];
      if (/[{(\[]\s*$/.test(line)) indent += INDENT;
      e.preventDefault();
      insert("\n" + indent);
      return;
    }
    escaped = false;
  });

  return {
    getValue: () => input.value,
    setValue(code) { input.value = code; paint(); },
    focus: () => input.focus(),
  };
}
