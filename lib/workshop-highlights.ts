import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

const workshopsDirectory = path.join(process.cwd(), 'content/workshop-highlights');

export interface WorkshopMaterial {
  image: string;
  lecturer: string;
  topic: string;
}

export interface WorkshopMeta {
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  tags?: string[];
  featured?: boolean;
}

function readWorkshopMeta(fileName: string): WorkshopMeta {
  const slug = fileName.replace(/\.md$/, '');
  const fullPath = path.join(workshopsDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data } = matter(fileContents);

  return {
    slug,
    title: data.title,
    excerpt: data.excerpt || '',
    cover: data.coverImage || data.cover || undefined,
    tags: data.tags || [],
    featured: Boolean(data.featured),
  };
}

// List of all workshop highlights (for the listing page)
export function getAllWorkshops(): WorkshopMeta[] {
  const fileNames = fs.readdirSync(workshopsDirectory).filter((f) => f.endsWith('.md'));
  const workshops = fileNames.map(readWorkshopMeta);

  // Alphabetical by title (no dates on workshop highlights)
  return workshops.sort((a, b) => a.title.localeCompare(b.title));
}

// Full content of a single workshop highlight (for the detail page)
export async function getWorkshopBySlug(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Invalid workshop slug');
  }

  const fullPath = path.join(workshopsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(remarkGfm).use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title,
    excerpt: data.excerpt || '',
    cover: data.coverImage || data.cover || undefined,
    tags: (data.tags || []) as string[],
    materials: (data.materials || []) as WorkshopMaterial[],
    featured: Boolean(data.featured),
    contentHtml,
  };
}

/* ------------------------------------------------------------------ */
/* Year-first browsing (used by components/WorkshopHighlightsYears)    */
/* Needs a `date:` line in each workshop's frontmatter, e.g.           */
/*   date: 2025-12-05                                                  */
/* Workshops without a date are grouped under "Other".                 */
/* ------------------------------------------------------------------ */

export interface YearWorkshop {
  slug: string;
  title: string;
  dateLabel: string;
  cover: string;
  lectures: number;
  tags: string[];
}

export interface YearGroup {
  year: string;
  workshops: YearWorkshop[];
}

interface YearEntry extends YearWorkshop {
  time: number;
  year: string;
}

function parseWorkshopDate(value: unknown): { year: string; time: number; label: string } {
  // gray-matter turns an unquoted `date: 2025-12-05` into a Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return {
      year: String(value.getUTCFullYear()),
      time: value.getTime(),
      label: value.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    };
  }

  if (typeof value === 'string' && value.trim()) {
    const text = value.trim();
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const parsed = new Date(text);
    const valid = !isNaN(parsed.getTime());
    const isIso = /^\d{4}-\d{2}(-\d{2})?/.test(text);

    return {
      year: yearMatch ? yearMatch[0] : 'Other',
      time: valid ? parsed.getTime() : 0,
      label:
        valid && isIso
          ? parsed.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC',
            })
          : text,
    };
  }

  return { year: 'Other', time: 0, label: '' };
}

function resolveCoverPath(slug: string, raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return `/workshop-highlights/${slug}/cover.jpg`;
  if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) return value;
  return `/workshop-highlights/${slug}/${value.replace(/^\.?\//, '')}`;
}

function readYearEntries(): YearEntry[] {
  if (!fs.existsSync(workshopsDirectory)) return [];

  return fs
    .readdirSync(workshopsDirectory)
    .filter((f) => f.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(workshopsDirectory, fileName), 'utf8');
      const { data } = matter(raw);
      const date = parseWorkshopDate(data.date ?? data.workshopDate);

      return {
        slug,
        title: String(data.title || slug),
        dateLabel: date.label,
        cover: resolveCoverPath(slug, data.coverImage || data.cover),
        lectures: Array.isArray(data.materials) ? data.materials.length : 0,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        time: date.time,
        year: date.year,
      };
    });
}

// Newest year first ("Other" always last); inside a year, oldest workshop first
// so the dropdown reads Workshop 1, Workshop 2, Workshop 3...
export function getWorkshopYearGroups(): YearGroup[] {
  const byYear = new Map<string, YearEntry[]>();

  for (const entry of readYearEntries()) {
    const list = byYear.get(entry.year) ?? [];
    list.push(entry);
    byYear.set(entry.year, list);
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return Number(b) - Number(a);
    })
    .map(([year, items]) => ({
      year,
      workshops: items
        .sort((a, b) => a.time - b.time || a.title.localeCompare(b.title))
        .map((w) => ({
          slug: w.slug,
          title: w.title,
          dateLabel: w.dateLabel,
          cover: w.cover,
          lectures: w.lectures,
          tags: w.tags,
        })),
    }));
}

// Numbers for the hero stats (workshops + lecture sessions)
export function getWorkshopStats() {
  const entries = readYearEntries();
  return {
    workshops: entries.length,
    lectures: entries.reduce((sum, w) => sum + w.lectures, 0),
  };
}