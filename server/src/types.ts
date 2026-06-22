export type RegistryType = 'npm' | 'pypi';

export type PackageSource = 'cache' | 'private' | 'upstream';

export type MatchType = 'exact' | 'prefix' | 'substring' | 'fuzzy' | 'alias' | 'suggestion';

export type MatchField = 'name' | 'alias' | 'description';

export interface MatchInfo {
  score: number;
  matchedBy: MatchType;
  matchedField?: MatchField;
  suggestion?: string;
}

export interface SearchMeta {
  originalQuery: string;
  correctedQuery?: string;
  suggestions?: string[];
  hasFuzzyMatches: boolean;
  hasSuggestions: boolean;
}

export interface PackageInfo {
  name: string;
  registry: RegistryType;
  source: PackageSource;
  versions: PackageVersion[];
  latestVersion: string;
  description?: string;
  author?: string;
  license?: string;
  scope?: string;
  createdAt: number;
  updatedAt: number;
  totalSize: number;
  downloadCount: number;
  matchInfo?: MatchInfo;
}

export interface PackageVersion {
  version: string;
  size: number;
  filePath: string;
  sha1?: string;
  publishedAt: number;
  downloadCount: number;
}

export interface CacheStats {
  totalPackages: number;
  totalVersions: number;
  totalSize: number;
  npmPackages: number;
  pypiPackages: number;
  privatePackages: number;
  cachePackages: number;
  maxSize: number;
  usagePercent: number;
}

export interface StorageTrend {
  date: string;
  size: number;
  packages: number;
}

export interface CachePolicy {
  maxSizeGB: number;
  maxAgeDays: number;
  autoClean: boolean;
}
