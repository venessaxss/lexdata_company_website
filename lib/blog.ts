import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

const blogsDirectory = path.join(process.cwd(), 'content/blogs');

export interface BlogMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  aiModels?: string[];
  coverImage?: string;
  category?: string;
  publisher?: string;
  readTime?: string;
  featured?: boolean;
}

function readBlogMeta(fileName: string): BlogMeta {
  const slug = fileName.replace(/\.md$/, '');
  const fullPath = path.join(blogsDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data } = matter(fileContents);

  return {
    slug,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt || '',
    aiModels: data.aiModels || [],
    coverImage: data.coverImage || undefined,
    category: data.category || 'Insights',
    publisher: data.publisher || 'LexData',
    readTime: data.readTime || undefined,
    featured: Boolean(data.featured),
  };
}

export function formatBlogDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

// List of all blogs (for the listing page)
export function getAllBlogs(): BlogMeta[] {
  const fileNames = fs.readdirSync(blogsDirectory).filter(f => f.endsWith('.md'));
  const blogs = fileNames.map(readBlogMeta);

  // Newest first
  return blogs.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Full content of a single blog (for the detail page)
export async function getBlogBySlug(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Invalid blog slug');
  }

  const fullPath = path.join(blogsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(remarkGfm).use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt || '',
    aiModels: data.aiModels || [],
    coverImage: data.coverImage || undefined,
    category: data.category || 'Insights',
    publisher: data.publisher || 'LexData',
    readTime: data.readTime || undefined,
    featured: Boolean(data.featured),
    contentHtml,
  };
}
