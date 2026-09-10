import Image from "next/image";
import Link from "next/link";
import { formatBlogDate, getAllBlogs } from "@/lib/blog";

export default function BlogPage() {
  const blogs = getAllBlogs();
  const featured = blogs.find((blog) => blog.featured) ?? blogs[0];
  const remainingBlogs = blogs.filter((blog) => blog.slug !== featured?.slug);

  return (
    <main className="blog-index">
      <section className="blog-index-hero">
        <p className="blog-kicker">The LexData journal</p>
        <h1>Writing, research, and practical AI workflows.</h1>
        <p className="blog-index-dek">
          Field notes and considered guides for people working across language,
          education, data, and intelligent tools.
        </p>
      </section>

      {featured && (
        <section className="blog-featured-wrap" aria-labelledby="featured-story">
          <p className="blog-section-label">Featured story</p>
          <Link className="blog-featured-card" href={`/blog/${featured.slug}`}>
            <div className="blog-featured-copy">
              <p className="blog-card-meta">
                {featured.category} <span aria-hidden="true">·</span>{" "}
                {formatBlogDate(featured.date)}
              </p>
              <h2 id="featured-story">{featured.title}</h2>
              <p className="blog-card-excerpt">{featured.excerpt}</p>
              <div className="blog-card-footer">
                <span>Published by {featured.publisher}</span>
                {featured.readTime && <span>{featured.readTime}</span>}
                <b>Read the story <span aria-hidden="true">→</span></b>
              </div>
            </div>
            <div className="blog-featured-image">
              {featured.coverImage ? (
                <Image
                  src={featured.coverImage}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 820px) 100vw, 48vw"
                />
              ) : (
                <span aria-hidden="true">LexData</span>
              )}
            </div>
          </Link>
        </section>
      )}

      {remainingBlogs.length > 0 && (
        <section className="blog-latest" aria-labelledby="latest-stories">
          <div className="blog-section-heading">
            <p className="blog-section-label">From the journal</p>
            <h2 id="latest-stories">More to explore</h2>
          </div>
          <div className="blog-card-grid">
            {remainingBlogs.map((blog) => (
              <Link className="blog-story-card" href={`/blog/${blog.slug}`} key={blog.slug}>
                <p className="blog-card-meta">
                  {blog.category} <span aria-hidden="true">·</span>{" "}
                  {formatBlogDate(blog.date)}
                </p>
                <h3>{blog.title}</h3>
                <p className="blog-card-excerpt">{blog.excerpt}</p>
                <div className="blog-card-footer">
                  <span>Published by {blog.publisher}</span>
                  <b>Read more <span aria-hidden="true">→</span></b>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
