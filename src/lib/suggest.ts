import { jobs } from '@/api/endpoints';
import type { Suggestion } from '@/api/types';

/** Common role names, so a target role can be picked even before a job with that title is fetched. */
const ROLES = [
  'Java Developer', 'Java Backend Developer', 'Backend Developer', 'Backend Engineer', 'Software Engineer', 'Software Developer',
  'Senior Software Engineer', 'SDE', 'SDE 1', 'SDE 2', 'Spring Boot Developer', 'Microservices Developer', 'API Developer',
  'Full Stack Developer', 'Frontend Developer', 'React Developer', 'Node.js Developer', 'Python Developer', 'Golang Developer',
  '.NET Developer', 'Data Engineer', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'AI Engineer',
  'DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer', 'Integration Engineer',
  'Application Engineer', 'QA Engineer', 'Automation Test Engineer', 'Android Developer', 'iOS Developer', 'Mobile Developer',
  'Tech Lead', 'Engineering Manager', 'Product Manager', 'Business Analyst', 'UI/UX Designer',
];

/** True when a word of the label starts with what was typed: "dev" finds "Java Developer", not "Webdev". */
function startsAWord(label: string, typed: string): boolean {
  const lower = label.toLowerCase();
  const t = typed.trim().toLowerCase();
  let at = lower.indexOf(t);
  while (at >= 0) {
    if (at === 0 || !/[\p{L}\p{N}]/u.test(lower[at - 1])) {
      return true;
    }
    at = lower.indexOf(t, at + 1);
  }
  return false;
}

function unique(items: Suggestion[], max = 8): Suggestion[] {
  const seen = new Set<string>();
  return items.filter((s) => !seen.has(s.label.toLowerCase()) && seen.add(s.label.toLowerCase())).slice(0, max);
}

/** "Java Software Engineer (m/w/d)" -> "Java Software Engineer": gender and location tags aren't part of a role. */
function asRole(title: string): string {
  return title
    .replace(/\s*\((?:[mwfhdxn]\s*\/\s*)+[mwfhdxn]+\)|\s*\((?:all genders|f\/h\/nb|h\/f\/nb)\)/gi, '')
    .replace(/\s+[-–|]\s+.*$/, '')
    .trim();
}

/** Target roles: common role names first, then short English titles of real jobs. */
export async function suggestRoles(q: string): Promise<Suggestion[]> {
  const known = ROLES.filter((r) => startsAWord(r, q))
    .sort((a, b) => a.length - b.length)
    .map((label): Suggestion => ({ label, kind: 'title', count: null }));
  const titles = (await jobs.suggestKeywords(q))
    .filter((s) => s.kind === 'title')
    .map((s) => ({ ...s, label: asRole(s.label) }))
    // other-language titles (accents) and long ones make poor target roles
    .filter((s) => s.label.length > 2 && /^[\x20-\x7E]+$/.test(s.label) && s.label.split(/\s+/).length <= 5 && startsAWord(s.label, q));
  return unique([...known.slice(0, 5), ...titles]);
}

/** Skills to add to the profile. */
export async function suggestSkills(q: string): Promise<Suggestion[]> {
  return unique((await jobs.suggestKeywords(q)).filter((s) => s.kind === 'skill'));
}

/** Places active jobs are in, with India, Remote and Delhi NCR. */
export const suggestPlaces = (q: string) => jobs.suggestLocations(q);
