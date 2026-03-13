const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { vaultPath } = require('../config');

/**
 * Read and parse a vault .md file.
 * Returns { data: frontmatter, content: body, raw: string }.
 */
function readVaultFile(relPath) {
  const fullPath = path.join(vaultPath, relPath);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content, raw };
}

/**
 * Recursively list all .md files under a vault subdirectory.
 * Returns an array of relative paths.
 */
function listVaultFiles(subdir) {
  const dir = path.join(vaultPath, subdir);
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(path.relative(vaultPath, full));
      }
    }
  };
  walk(dir);
  return results;
}

/**
 * Read all .md files in a subdirectory and return parsed objects.
 */
function readVaultDir(subdir) {
  return listVaultFiles(subdir).map((relPath) => {
    const parsed = readVaultFile(relPath);
    return parsed ? { relPath, ...parsed } : null;
  }).filter(Boolean);
}

module.exports = { readVaultFile, listVaultFiles, readVaultDir };
