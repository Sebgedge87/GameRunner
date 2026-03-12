const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { vaultPath } = require('../config');

/**
 * Write (create or overwrite) a vault .md file with YAML frontmatter.
 * @param {string} relPath - path relative to vault root
 * @param {object} frontmatter - YAML front matter data object
 * @param {string} body - markdown body content
 */
function writeVaultFile(relPath, frontmatter, body = '') {
  const fullPath = path.join(vaultPath, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  // Stamp updated_at
  frontmatter.updated_at = new Date().toISOString();
  if (!frontmatter.created_at) {
    frontmatter.created_at = frontmatter.updated_at;
  }

  const fileContent = matter.stringify(body, frontmatter);
  fs.writeFileSync(fullPath, fileContent, 'utf8');
}

/**
 * Soft-delete: add `deleted: true` to frontmatter without removing the file.
 */
function softDeleteVaultFile(relPath) {
  const fullPath = path.join(vaultPath, relPath);
  if (!fs.existsSync(fullPath)) return false;
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(raw);
  data.deleted = true;
  data.deleted_at = new Date().toISOString();
  data.updated_at = data.deleted_at;
  fs.writeFileSync(fullPath, matter.stringify(content, data), 'utf8');
  return true;
}

module.exports = { writeVaultFile, softDeleteVaultFile };
