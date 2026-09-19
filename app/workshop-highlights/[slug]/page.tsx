import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getWorkshopBySlug, getAllWorkshops } from "@/lib/workshop-highlights";
import { notFound } from "next/navigation";
import ShareButtons from "@/components/ShareButtons";

type WorkshopArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const workshops = getAllWorkshops();
  return workshops.map((workshop) => ({ slug: workshop.slug }));
}

export async function generateMetadata({
  params,
}: WorkshopArticlePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const workshop = await getWorkshopBySlug(slug);

    return {
      title: `${workshop.title} | LexData Workshops`,
      description: workshop.excerpt,
      openGraph: {
        title: workshop.title,
        description: workshop.excerpt,
        type: "article",
        images: workshop.cover ? [{ url: workshop.cover }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function WorkshopArticlePage({ params }: WorkshopArticlePageProps) {
  const { slug } = await params;

  let workshop;
  try {
    workshop = await getWorkshopBySlug(slug);
  } catch {
    return notFound();
  }

  // Optional fields — only render if lib/workshop-highlights.ts parses them
  // from frontmatter (e.g. `lecturer`, `lecturerTitle`).
  const lecturer = (workshop as any).lecturer as string | undefined;
  const lecturerTitle = (workshop as any).lecturerTitle as string | undefined;

  return (
    <main className="wh-page wh-article-page">
      <article>
        <header className="wh-article-hero">
          <div className="wh-article-hero-inner">
            <Link className="wh-back-link" href="/workshop-highlights">
              <span aria-hidden="true">←</span> All workshops
            </Link>
            <p className="wh-eyebrow">Workshop</p>
            <h1 className="wh-article-title">{workshop.title}</h1>
            {workshop.excerpt && <p className="wh-article-dek">{workshop.excerpt}</p>}
            {workshop.tags && workshop.tags.length > 0 && (
              <div className="wh-tags" aria-label="Workshop topics">
                {workshop.tags.map((tag) => (
                  <span key={tag} className="wh-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="wh-share-row">
              <ShareButtons
                url={`https://lexdataai.com/workshop-highlights/${slug}`}
                title={workshop.title}
              />
            </div>
          </div>
        </header>

          {workshop.cover && (
            <div className="wh-article-cover">
              <figure className="wh-article-cover-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={workshop.cover}
                  alt={workshop.title}
                  className="wh-article-cover-img"
                />
              </figure>
            </div>
          )}

        <div className="wh-article-layout">
          <aside className="wh-article-rail" aria-label="Workshop details">
            <span className="wh-article-rail-label">In this workshop</span>
            <p>
              {workshop.materials.length} session{workshop.materials.length === 1 ? "" : "s"} of
              lecture material and photos from the workshop.
            </p>

            {lecturer && (
              <>
                <div className="wh-rail-divider" />
                <div className="wh-lecturer-block">
                  <b>{lecturer}</b>
                  {lecturerTitle && <span>{lecturerTitle}</span>}
                </div>
              </>
            )}
          </aside>
          <div className="wh-article-body" dangerouslySetInnerHTML={{ __html: workshop.contentHtml }} />
        </div>

        {workshop.materials.length > 0 && (
          <section className="wh-materials" aria-labelledby="workshop-materials-heading">
            <div className="wh-materials-head">
              <p className="wh-section-label">Workshop material</p>
              <h2 id="workshop-materials-heading">Lectures &amp; speakers</h2>
            </div>
            <div className="wh-materials-grid">
              {workshop.materials.map((item, index) => (
                <figure className="wh-material-card" key={item.image ?? index}>
                  <div className="wh-material-image">
                    <Image
                      src={item.image}
                      alt={`${item.lecturer} — ${item.topic}`}
                      fill
                      sizes="(max-width: 820px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <figcaption>
                    <span className="wh-material-topic">{item.topic}</span>
                    <span className="wh-material-lecturer">{item.lecturer}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="wh-article-next">
          <p className="wh-section-label" style={{ justifyContent: "center" }}>
            Keep exploring
          </p>
          <h2>More workshops and training sessions from LexData.</h2>
          <Link className="wh-cta" href="/workshop-highlights">
            Browse all workshops <span aria-hidden="true">→</span>
          </Link>
        </section>
      </article>
    </main>
  );
}