// @ts-check
import fs from 'fs/promises';
import path from 'path';

forEachEntryIn('node_modules', (moduleName, modulePath) => {
  if (!moduleName.startsWith('prosemirror')) return;

  replaceInEveryDtsFile(modulePath);
});

/** @param {string} directory  */
function replaceInEveryDtsFile(directory) {
  return forEachEntryIn(directory, async (entry, fullpath) => {
    if (!entry.endsWith('.d.ts')) {
      try {
        await replaceInEveryDtsFile(fullpath);
      } finally {
        return;
      }
    }

    try {
      const content = await fs.readFile(fullpath, 'utf-8');
      const newContent = content
        .split('\n')
        .map(line => {
          if (!line.startsWith('export')) return line;

          // export { DOMEventMap, type NodeView, type NodeViewConstructor }; // Makes error
          // export { DOMEventMap, NodeView, NodeViewConstructor }; // No error
          return line.replace(/(?:,\s)?type\s/g, '');
        })
        .join('\n');

      if (newContent !== content) {
        console.log('Patched', fullpath);
        fs.writeFile(fullpath, newContent);
      } else {
      }
    } catch (e) {
      if (e instanceof Error && 'code' in e && e.code === 'ENOTFILE') {
        replaceInEveryDtsFile(fullpath);
      }
    }
  });
}

/** @param {string} directory
 * @param {(entry: string, fullpath: string) => void} callback
 */
async function forEachEntryIn(directory, callback) {
  const entries = await fs.readdir(directory);
  for (const entry of entries) {
    callback(entry, path.join(directory, entry));
  }
}
