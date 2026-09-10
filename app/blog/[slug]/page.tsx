import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatBlogDate, getBlogBySlug, getAllBlogs } from "@/lib/blog";
import { notFound } from "next/navigation";

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const blogs = getAllBlogs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const blog = await getBlogBySlug(slug);

    return {
      title: `${blog.title} | LexData`,
      description: blog.excerpt,
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        type: "article",
        publishedTime: blog.date,
        images: blog.coverImage ? [{ url: blog.coverImage }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;

  let blog;
  try {
    blog = await getBlogBySlug(slug);
  } catch {
    return notFound();
  }

  return (
    <main className="blog-article-page">
      <article className="blog-article">
        <header className="blog-article-hero">
          <Link className="blog-back-link" href="/blog">
            <span aria-hidden="true">←</span> All stories
          </Link>
          <p className="blog-kicker">{blog.category}</p>
          <h1 className="blog-article-title">{blog.title}</h1>
          {blog.excerpt && <p className="blog-article-dek">{blog.excerpt}</p>}
          <div className="blog-article-byline">
            <span><b>Published by</b> {blog.publisher}</span>
            <span><b>Publish date</b> {formatBlogDate(blog.date)}</span>
            {blog.readTime && <span><b>Reading time</b> {blog.readTime}</span>}
          </div>
          {blog.aiModels && blog.aiModels.length > 0 && (
            <div className="blog-article-tags" aria-label="Article topics">
              {blog.aiModels.map((model: string) => (
                <span key={model} className="blog-article-tag">
                  {model}
                </span>
              ))}
            </div>
          )}
        </header>

        {blog.coverImage && (
          <figure className="blog-article-cover">
            <Image
              src={blog.coverImage}
              alt="Overview of the textbook-writing workflow"
              width={1602}
              height={540}
              priority
              sizes="(max-width: 1200px) 100vw, 1160px"
            />
          </figure>
        )}

        <div className="blog-article-layout">
          <aside className="blog-article-rail" aria-label="Article details">
            <span>In this guide</span>
            <p>Installation, two approval gates, chapter generation, verification, and recovery after an interruption.</p>
          </aside>
          <div
            className="blog-article-body"
            dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
          />
        </div>
      </article>

      <section className="blog-article-next">
        <p className="blog-kicker">Keep exploring</p>
        <h2>More research notes and practical guides from LexData.</h2>
        <Link href="/blog">Browse the journal <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
