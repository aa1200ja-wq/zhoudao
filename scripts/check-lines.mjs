import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const LIMIT = 250
const ROOTS = ['src']
const EXTENSIONS = new Set(['.js', '.jsx', '.css'])
const failures = []

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      await walk(path)
      continue
    }

    if (!EXTENSIONS.has(extname(entry.name))) continue

    const content = await readFile(path, 'utf8')
    const lineCount = content.split(/\r?\n/).length

    if (lineCount > LIMIT) {
      failures.push({ path, lineCount })
    }
  }
}

for (const root of ROOTS) {
  await walk(root)
}

if (failures.length) {
  console.error('Single-file line limit exceeded:')
  for (const item of failures) {
    console.error(`- ${item.path}: ${item.lineCount} lines (limit ${LIMIT})`)
  }
  process.exit(1)
}

console.log(`Line check passed: all source files are <= ${LIMIT} lines.`)
