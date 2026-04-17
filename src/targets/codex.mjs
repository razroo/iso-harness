import path from 'node:path';
import { writeFile } from '../fs-utils.mjs';
import { resolveMcpServer } from '../source.mjs';

function tomlString(v) {
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function tomlArray(arr) {
  return `[${arr.map(tomlString).join(', ')}]`;
}

function tomlInlineTable(obj) {
  const parts = Object.entries(obj).map(([k, v]) => `${k} = ${tomlString(v)}`);
  return `{ ${parts.join(', ')} }`;
}

function renderMcpToml(servers) {
  const lines = [];
  for (const [name, def] of Object.entries(servers)) {
    lines.push(`[mcp_servers.${name}]`);
    lines.push(`command = ${tomlString(def.command)}`);
    if (def.args?.length) lines.push(`args = ${tomlArray(def.args)}`);
    if (def.env && Object.keys(def.env).length) {
      lines.push(`env = ${tomlInlineTable(def.env)}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export async function emitCodex(src, outDir) {
  const written = [];

  if (src.instructions) {
    const p = path.join(outDir, 'AGENTS.md');
    await writeFile(p, src.instructions.endsWith('\n') ? src.instructions : src.instructions + '\n');
    written.push(p);
  }

  if (Object.keys(src.mcp.servers).length > 0) {
    const resolved = {};
    for (const [name, rawDef] of Object.entries(src.mcp.servers)) {
      resolved[name] = resolveMcpServer(rawDef, 'codex');
    }
    const body = renderMcpToml(resolved);
    const p = path.join(outDir, '.codex', 'config.toml');
    await writeFile(p, body);
    written.push(p);
  }

  return written;
}
