/**
 * Regenerates src/engines/knowledge/data/districts.ts from scripts/sanjay.json
 * Source dataset: https://github.com/sanjaynishad/Indian-States-And-Districts
 * (igod.gov.in). Run: node scripts/generate-districts.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sanjay = JSON.parse(fs.readFileSync(path.join(root, 'scripts/sanjay.json'), 'utf8'))

const REGION_CODES = [
  'AP', 'AS', 'BR', 'CT', 'DL', 'GA', 'GJ', 'HR', 'HP', 'JH', 'KA', 'KL',
  'MP', 'MH', 'OD', 'PB', 'RJ', 'TN', 'TS', 'UP', 'UK', 'WB',
]

const SOURCE_CODE_MAP = {
  AP: 'AP', AS: 'AS', BR: 'BR', CG: 'CT', DL: 'DL', GA: 'GA', GJ: 'GJ',
  HR: 'HR', HP: 'HP', JH: 'JH', KA: 'KA', KL: 'KL', MP: 'MP', MH: 'MH',
  OD: 'OD', PB: 'PB', RJ: 'RJ', TN: 'TN', TS: 'TS', UP: 'UP', UK: 'UK', WB: 'WB',
}

const LEGACY_IDS = {
  'MH:Mumbai': 'mh-mumbai',
  'MH:Pune': 'mh-pune',
  'MH:Nagpur': 'mh-nagpur',
  'KA:Bengaluru Urban': 'ka-bengaluru',
  'KA:Mysuru': 'ka-mysuru',
  'TN:Chennai': 'tn-chennai',
  'TN:Coimbatore': 'tn-coimbatore',
  'KL:Ernakulam': 'kl-ernakulam',
  'KL:Thiruvananthapuram': 'kl-thiruvananthapuram',
  'GJ:Ahmedabad': 'gj-ahmedabad',
  'GJ:Surat': 'gj-surat',
  'RJ:Jaipur': 'rj-jaipur',
  'UP:Lucknow': 'up-lucknow',
  'UP:Varanasi': 'up-varanasi',
  'WB:Kolkata': 'wb-kolkata',
  'PB:Ludhiana': 'pb-ludhiana',
  'DL:New Delhi': 'dl-new-delhi',
  'TS:Hyderabad': 'ts-hyderabad',
  'AP:Visakhapatnam': 'ap-visakhapatnam',
  'MP:Bhopal': 'mp-bhopal',
  'HR:Gurugram': 'hr-gurugram',
  'BR:Patna': 'br-patna',
  'OD:Khordha': 'od-khordha',
  'AS:Kamrup Metro': 'as-kamrup-metro',
}

const MIN = {
  MH: 36, UP: 75, TN: 38, KA: 31, KL: 14, WB: 23, TS: 33, AP: 26, GJ: 33,
  RJ: 33, MP: 50, BR: 38, PB: 23, HR: 22, AS: 31, OD: 30, CT: 33, UK: 13,
  JH: 24, HP: 12, GA: 2, DL: 11,
}

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

const districts = []
const usedIds = new Set()
const counts = {}

for (const [sourceCode, appCode] of Object.entries(SOURCE_CODE_MAP)) {
  const list = sanjay[sourceCode]
  if (!list) throw new Error(`Missing source districts for ${sourceCode}`)
  const sorted = [...list].sort((a, b) => a.localeCompare(b, 'en'))
  counts[appCode] = sorted.length
  for (const name of sorted) {
    const legacy = LEGACY_IDS[`${appCode}:${name}`]
    let id = legacy || `${appCode.toLowerCase()}-${slugify(name)}`
    if (usedIds.has(id)) id = `${id}-2`
    usedIds.add(id)
    districts.push({ id, stateCode: appCode, name })
  }
}

for (const [code, min] of Object.entries(MIN)) {
  const got = counts[code] || 0
  if (got < min) throw new Error(`VALIDATION FAIL ${code} got ${got} expected >= ${min}`)
}
for (const code of REGION_CODES) {
  if (!counts[code]) throw new Error(`No districts for region ${code}`)
}

const lines = [
  "import type { District } from '@/types/domain'",
  '',
  '/**',
  ' * Full district catalog for states available in AAHAAR.',
  ' * Source: igod.gov.in via sanjaynishad/Indian-States-And-Districts (validated counts).',
  ' * IDs are stable slugs; legacy IDs preserved where foods already reference them.',
  ' */',
  'export const DISTRICT_CATALOG_VERSION = 1',
  'export const DISTRICT_RECORDS: District[] = [',
  ...districts.map(
    (d) =>
      `  { id: ${JSON.stringify(d.id)}, stateCode: ${JSON.stringify(d.stateCode)}, name: ${JSON.stringify(d.name)} },`,
  ),
  ']',
  '',
]

fs.writeFileSync(path.join(root, 'src/engines/knowledge/data/districts.ts'), lines.join('\n'))
console.log(`Wrote ${districts.length} districts`)
console.log(counts)
