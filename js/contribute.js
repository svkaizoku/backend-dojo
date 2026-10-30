// Contribute page: fills the topic id table from content/index.json so it never drifts from the data.
const body = document.querySelector("#topicTable tbody");

function row(...cells) {
  const tr = document.createElement("tr");
  cells.forEach((text, i) => {
    const td = document.createElement("td");
    if (i === 0) { const code = document.createElement("code"); code.textContent = text; td.append(code); }
    else td.textContent = text;
    tr.append(td);
  });
  return tr;
}

fetch("content/index.json")
  .then(res => res.json())
  .then(index => body.replaceChildren(...index.topics.map(t => row(t.id, t.name, t.description || ""))))
  .catch(() => body.replaceChildren(row("—", "Couldn't load topics", "See content/index.json")));
