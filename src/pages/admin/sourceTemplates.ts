import type { JobSourceInput } from '@/api/types';

/** Jobs are either in India or international. Codes are what the backend stores. */
export const REGIONS: { code: string; label: string }[] = [
  { code: 'IN', label: 'India' },
  { code: 'GLOBAL', label: 'International' },
];

export const regionOf = (code: string) => REGIONS.find((r) => r.code === code) ?? { code, label: code };

/** Adzuna country codes and the region each belongs to. */
export const ADZUNA_COUNTRIES: { code: string; label: string; region: string; currency: string }[] = [
  { code: 'in', label: 'India', region: 'IN', currency: 'INR' },
  { code: 'gb', label: 'United Kingdom', region: 'GLOBAL', currency: 'GBP' },
  { code: 'us', label: 'United States', region: 'GLOBAL', currency: 'USD' },
  { code: 'de', label: 'Germany', region: 'GLOBAL', currency: 'EUR' },
  { code: 'fr', label: 'France', region: 'GLOBAL', currency: 'EUR' },
  { code: 'nl', label: 'Netherlands', region: 'GLOBAL', currency: 'EUR' },
  { code: 'sg', label: 'Singapore', region: 'GLOBAL', currency: 'SGD' },
  { code: 'au', label: 'Australia', region: 'GLOBAL', currency: 'AUD' },
  { code: 'ca', label: 'Canada', region: 'GLOBAL', currency: 'CAD' },
];

export type TemplateKind = 'greenhouse' | 'lever' | 'ashby' | 'adzuna' | 'scrape' | 'custom';

export const TEMPLATES: { kind: TemplateKind; name: string; blurb: string; how: string }[] = [
  {
    kind: 'greenhouse',
    name: 'Greenhouse',
    blurb: 'A company whose careers page runs on Greenhouse.',
    how: 'Public API, no key. Slug is the part after boards.greenhouse.io/ (e.g. groww).',
  },
  {
    kind: 'lever',
    name: 'Lever',
    blurb: 'A company whose careers page runs on Lever.',
    how: 'Public API, no key. Slug is the part after jobs.lever.co/ (e.g. cred).',
  },
  {
    kind: 'ashby',
    name: 'Ashby',
    blurb: 'A company whose careers page runs on Ashby.',
    how: 'Public API, no key. Slug is the part after jobs.ashbyhq.com/ (e.g. sarvam).',
  },
  {
    kind: 'adzuna',
    name: 'Adzuna',
    blurb: 'Jobs from many boards in one country, India included.',
    how: 'Needs a free app id and key from developer.adzuna.com, kept in config/job-sources-secrets.properties.',
  },
  {
    kind: 'scrape',
    name: 'Career page (scrape)',
    blurb: 'An HTML careers page with no API, read with CSS selectors.',
    how: 'Only pages the site’s robots.txt allows are read. Not for LinkedIn, Naukri or Indeed.',
  },
  {
    kind: 'custom',
    name: 'Custom JSON API',
    blurb: 'Any board that answers JSON, mapped field by field.',
    how: 'You fill in the URL, where the list is and a JSONPath per field.',
  },
];

const COMMON = {
  method: 'GET' as const,
  bodyTemplate: null,
  headers: {},
  enabled: true,
  priority: 5,
  timeoutSeconds: 20,
};

const slugCode = (prefix: string, slug: string) => `${prefix}-${slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}`.slice(0, 40);

export interface TemplateAnswers {
  slug: string;
  company: string;
  region: string;
  country: string;
  keywords: string;
  pageUrl: string;
}

export function buildFromTemplate(kind: TemplateKind, a: TemplateAnswers): JobSourceInput {
  const company = a.company.trim() || a.slug;
  switch (kind) {
    case 'greenhouse':
      return {
        ...COMMON,
        code: slugCode('gh', a.slug),
        name: `${company} (Greenhouse)`,
        type: 'REST_JSON',
        region: a.region,
        baseUrl: 'https://boards-api.greenhouse.io',
        searchPath: `/v1/boards/${a.slug}/jobs`,
        queryParams: { content: 'true' },
        resultsPath: '$.jobs',
        fieldMappings: {
          externalId: '$.id', title: '$.title', company: '$.company_name', location: '$.location.name',
          applyUrl: '$.absolute_url', description: '$.content', postedAt: '$.first_published',
        },
        maxPages: 1,
      };
    case 'lever':
      return {
        ...COMMON,
        code: slugCode('lever', a.slug),
        name: `${company} (Lever)`,
        type: 'REST_JSON',
        region: a.region,
        baseUrl: 'https://api.lever.co',
        searchPath: `/v0/postings/${a.slug}`,
        queryParams: { mode: 'json' },
        resultsPath: '$',
        fieldMappings: {
          externalId: '$.id', title: '$.text', company: `=${company}`, location: '$.categories.location',
          remote: '$.workplaceType', applyUrl: '$.applyUrl', description: '$.description', postedAt: '$.createdAt',
        },
        maxPages: 1,
      };
    case 'ashby':
      return {
        ...COMMON,
        code: slugCode('ashby', a.slug),
        name: `${company} (Ashby)`,
        type: 'REST_JSON',
        region: a.region,
        baseUrl: 'https://api.ashbyhq.com',
        searchPath: `/posting-api/job-board/${a.slug}`,
        queryParams: {},
        resultsPath: '$.jobs',
        fieldMappings: {
          externalId: '$.id', title: '$.title', company: `=${company}`, location: '$.location',
          remote: '$.isRemote', applyUrl: '$.applyUrl', description: '$.descriptionHtml', postedAt: '$.publishedAt',
        },
        maxPages: 1,
      };
    case 'adzuna': {
      const country = ADZUNA_COUNTRIES.find((c) => c.code === a.country) ?? ADZUNA_COUNTRIES[0];
      const keywords = a.keywords.trim();
      return {
        ...COMMON,
        code: slugCode('adzuna', `${country.code}${keywords ? `-${keywords}` : ''}`),
        name: `Adzuna ${country.label}${keywords ? `: ${keywords}` : ''}`,
        type: 'REST_JSON',
        region: country.region,
        baseUrl: 'https://api.adzuna.com',
        searchPath: `/v1/api/jobs/${country.code}/search/{page}`,
        queryParams: {
          app_id: '${setting:adzuna-app-id}',
          app_key: '${setting:adzuna-app-key}',
          results_per_page: '50',
          ...(keywords ? { what: keywords } : {}),
        },
        resultsPath: '$.results',
        fieldMappings: {
          externalId: '$.id', title: '$.title', company: '$.company.display_name', location: '$.location.display_name',
          applyUrl: '$.redirect_url', description: '$.description', postedAt: '$.created',
          salaryMin: '$.salary_min', salaryMax: '$.salary_max', currency: `=${country.currency}`,
        },
        maxPages: 3,
      };
    }
    case 'scrape': {
      let base = 'https://';
      let path = '';
      try {
        const url = new URL(a.pageUrl.trim());
        base = url.origin;
        path = url.pathname + url.search;
      } catch {
        // left for the admin to fill in
      }
      return {
        ...COMMON,
        code: slugCode('page', a.slug || company || 'careers'),
        name: `${company} careers page`,
        type: 'HTML_SCRAPE',
        region: a.region,
        baseUrl: base,
        searchPath: path,
        queryParams: {},
        resultsPath: '.job',
        fieldMappings: { externalId: 'a@href', title: 'h3', company: `=${company}`, applyUrl: 'a@href', location: '.location' },
        maxPages: 1,
      };
    }
    default:
      return {
        ...COMMON,
        code: '',
        name: '',
        type: 'REST_JSON',
        region: a.region,
        baseUrl: 'https://',
        searchPath: '',
        queryParams: { page: '{page}' },
        resultsPath: '$.data',
        fieldMappings: { externalId: '$.id', title: '$.title', company: '$.company', applyUrl: '$.url' },
        maxPages: 2,
      };
  }
}
