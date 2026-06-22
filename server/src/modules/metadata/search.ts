export interface SearchMatchResult {
  score: number;
  matchedBy: 'exact' | 'prefix' | 'substring' | 'fuzzy' | 'alias' | 'suggestion';
  matchedField?: 'name' | 'alias' | 'description';
  suggestion?: string;
}

interface AliasEntry {
  alias: string;
  canonical: string;
}

const BUILTIN_ALIASES: AliasEntry[] = [
  { alias: 'js', canonical: 'javascript' },
  { alias: 'ts', canonical: 'typescript' },
  { alias: 'py', canonical: 'python' },
  { alias: 'reactjs', canonical: 'react' },
  { alias: 'vuejs', canonical: 'vue' },
  { alias: 'angularjs', canonical: 'angular' },
  { alias: 'expressjs', canonical: 'express' },
  { alias: 'nodejs', canonical: 'node' },
  { alias: 'lodash-debunce', canonical: 'lodash-debounce' },
  { alias: 'lodash-unbounce', canonical: 'lodash-debounce' },
  { alias: 'lodash-throttle', canonical: 'lodash.throttle' },
  { alias: 'react-dom', canonical: 'react-dom' },
  { alias: 'reactrouter', canonical: 'react-router' },
  { alias: 'reactrouterdom', canonical: 'react-router-dom' },
  { alias: 'axios', canonical: 'axios' },
  { alias: 'ajx', canonical: 'axios' },
  { alias: 'ajv', canonical: 'ajv' },
  { alias: 'webpck', canonical: 'webpack' },
  { alias: 'vitejs', canonical: 'vite' },
  { alias: 'babeljs', canonical: 'babel' },
  { alias: 'eslintrc', canonical: 'eslint' },
  { alias: 'prettierrc', canonical: 'prettier' },
  { alias: 'jestjs', canonical: 'jest' },
  { alias: 'mochajs', canonical: 'mocha' },
  { alias: 'cypressio', canonical: 'cypress' },
  { alias: 'pytest', canonical: 'pytest' },
  { alias: 'pipreq', canonical: 'pip' },
  { alias: 'numpi', canonical: 'numpy' },
  { alias: 'panda', canonical: 'pandas' },
  { alias: 'scikit', canonical: 'scikit-learn' },
  { alias: 'sklearn', canonical: 'scikit-learn' },
  { alias: 'tensorflow', canonical: 'tensorflow' },
  { alias: 'tf', canonical: 'tensorflow' },
  { alias: 'torch', canonical: 'pytorch' },
  { alias: 'pytorch', canonical: 'pytorch' },
  { alias: 'django', canonical: 'django' },
  { alias: 'flask', canonical: 'flask' },
  { alias: 'fastapi', canonical: 'fastapi' },
  { alias: 'requests', canonical: 'requests' },
  { alias: 'beautifulsoup', canonical: 'beautifulsoup4' },
  { alias: 'bs4', canonical: 'beautifulsoup4' },
  { alias: 'sqlalchemy', canonical: 'sqlalchemy' },
  { alias: 'alembic', canonical: 'alembic' },
  { alias: 'celery', canonical: 'celery' },
  { alias: 'redis', canonical: 'redis' },
  { alias: 'psycopg2', canonical: 'psycopg2' },
  { alias: 'pg', canonical: 'pg' },
  { alias: 'postgres', canonical: 'pg' },
  { alias: 'mongodb', canonical: 'mongodb' },
  { alias: 'mongoose', canonical: 'mongoose' },
];

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

function isSubsequence(needle: string, haystack: string): boolean {
  if (needle.length > haystack.length) return false;
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (needle[i] === haystack[j]) i++;
  }
  return i === needle.length;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[._@/-]+/g, ' ')
    .trim()
    .split(/\s+/);
}

export function matchPackageName(
  query: string,
  packageName: string,
  description?: string,
  customAliases: Record<string, string> = {}
): SearchMatchResult | null {
  const q = query.toLowerCase().trim();
  const name = packageName.toLowerCase();
  const desc = description?.toLowerCase() || '';

  if (!q) return null;

  if (q === name) {
    return { score: 100, matchedBy: 'exact', matchedField: 'name' };
  }

  const aliasMap: Record<string, string> = {};
  for (const entry of BUILTIN_ALIASES) {
    aliasMap[entry.alias.toLowerCase()] = entry.canonical.toLowerCase();
  }
  for (const [k, v] of Object.entries(customAliases)) {
    aliasMap[k.toLowerCase()] = v.toLowerCase();
  }

  if (aliasMap[q] === name) {
    return { score: 95, matchedBy: 'alias', matchedField: 'alias', suggestion: aliasMap[q] };
  }

  for (const [alias, canonical] of Object.entries(aliasMap)) {
    if (alias === name || canonical === name) {
      if (alias.includes(q) || canonical.includes(q)) {
        return { score: 85, matchedBy: 'alias', matchedField: 'alias', suggestion: canonical };
      }
    }
  }

  if (name.startsWith(q)) {
    const score = 90 - (name.length - q.length) * 0.5;
    return { score: Math.max(70, score), matchedBy: 'prefix', matchedField: 'name' };
  }

  if (name.includes(q)) {
    const idx = name.indexOf(q);
    const score = 80 - idx * 0.3;
    return { score: Math.max(60, score), matchedBy: 'substring', matchedField: 'name' };
  }

  if (desc.includes(q)) {
    const idx = desc.indexOf(q);
    const score = 55 - Math.min(idx, 20) * 0.3;
    return { score: Math.max(40, score), matchedBy: 'substring', matchedField: 'description' };
  }

  const qTokens = tokenize(q);
  const nameTokens = tokenize(name);
  const descTokens = tokenize(desc);

  let allTokenHit = qTokens.length > 0;
  let tokenScore = 0;
  for (const qt of qTokens) {
    let hit = false;
    for (const nt of [...nameTokens, ...descTokens]) {
      if (nt.startsWith(qt)) {
        hit = true;
        tokenScore += 10;
        break;
      }
      if (nt.includes(qt)) {
        hit = true;
        tokenScore += 6;
        break;
      }
    }
    if (!hit) allTokenHit = false;
  }
  if (allTokenHit && qTokens.length >= 2) {
    return { score: Math.min(75, 40 + tokenScore), matchedBy: 'substring', matchedField: 'name' };
  }

  if (isSubsequence(q, name)) {
    const gaps = name.length - q.length;
    const score = 65 - gaps * 0.4;
    return { score: Math.max(45, score), matchedBy: 'fuzzy', matchedField: 'name' };
  }

  const maxLen = Math.max(q.length, name.length);
  const dist = levenshteinDistance(q, name);
  const similarity = 1 - dist / maxLen;

  const distThreshold = maxLen <= 4 ? 1 : maxLen <= 8 ? 2 : maxLen <= 15 ? 3 : 4;
  if (dist <= distThreshold && similarity >= 0.5) {
    const score = 50 + similarity * 30;
    return { score: Math.max(35, score), matchedBy: 'suggestion', matchedField: 'name', suggestion: packageName };
  }

  for (const alias of Object.keys(aliasMap)) {
    const aliasDist = levenshteinDistance(q, alias);
    const aliasMaxLen = Math.max(q.length, alias.length);
    const aliasSimilarity = 1 - aliasDist / aliasMaxLen;
    const aliasThreshold = aliasMaxLen <= 6 ? 1 : aliasMaxLen <= 12 ? 2 : 3;
    if (aliasDist <= aliasThreshold && aliasSimilarity >= 0.55) {
      const canonical = aliasMap[alias];
      if (canonical === name) {
        const score = 48 + aliasSimilarity * 28;
        return { score: Math.max(33, score), matchedBy: 'suggestion', matchedField: 'alias', suggestion: packageName };
      }
    }
  }

  return null;
}

export function findBestSuggestion(
  query: string,
  allPackageNames: string[],
  customAliases: Record<string, string> = {}
): string | null {
  const q = query.toLowerCase().trim();
  if (!q || allPackageNames.length === 0) return null;

  const aliasMap: Record<string, string> = {};
  for (const entry of BUILTIN_ALIASES) {
    aliasMap[entry.alias.toLowerCase()] = entry.canonical.toLowerCase();
  }
  for (const [k, v] of Object.entries(customAliases)) {
    aliasMap[k.toLowerCase()] = v.toLowerCase();
  }

  if (aliasMap[q]) {
    const suggested = allPackageNames.find((n) => n.toLowerCase() === aliasMap[q]);
    if (suggested) return suggested;
  }

  let best: { name: string; score: number } | null = null;
  for (const name of allPackageNames) {
    const nl = name.toLowerCase();
    const maxLen = Math.max(q.length, nl.length);
    const dist = levenshteinDistance(q, nl);
    const similarity = 1 - dist / maxLen;
    const threshold = maxLen <= 4 ? 1 : maxLen <= 8 ? 2 : maxLen <= 15 ? 3 : 4;

    if (dist <= threshold && similarity >= 0.5) {
      const score = similarity * 100 - (nl.startsWith(q) ? 0 : 5);
      if (!best || score > best.score) {
        best = { name, score };
      }
    }
  }

  return best?.name || null;
}

export { BUILTIN_ALIASES };
