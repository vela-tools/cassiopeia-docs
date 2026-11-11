// GitHub alerts (`> [!WARNING]` and the blockquote under it) render only on
// GitHub; Docusaurus shows them as a plain quote with a literal `[!WARNING]`.
// They become `:::warning` admonitions. Lines inside code fences are left alone.
const ADMONITION = { NOTE: 'note', TIP: 'tip', IMPORTANT: 'info', WARNING: 'warning', CAUTION: 'danger' };

export function admonitions(page) {
  const lines = page.split('\n');
  const out = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker && (!fence || marker[1].startsWith(fence))) fence = fence ? null : marker[1];
    const alert = !fence && line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/);
    if (!alert) {
      out.push(line);
      continue;
    }
    const body = [];
    while (i + 1 < lines.length && lines[i + 1].startsWith('>')) body.push(lines[++i].replace(/^> ?/, ''));
    out.push(`:::${ADMONITION[alert[1]]}`, '', ...body, '', ':::');
  }
  return out.join('\n');
}
