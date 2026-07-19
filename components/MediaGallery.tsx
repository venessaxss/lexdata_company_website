type MediaItem = {
  id: string;
  title: string;
  media_type: "image" | "video";
  url: string;
  alt: string | null;
  caption: string | null;
};

export default function MediaGallery({ items }: { items: MediaItem[] }) {
  if (!items.length) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <p className="font-semibold text-blue-700">LexData in Action</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            Pictures, workshops, videos, and research activities
          </h2>
          <p className="mt-4 max-w-2xl text-slate-600">
            Showcase training moments, student activities, course previews,
            research support, and promotional content.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-56 bg-slate-200">
                {item.media_type === "video" ? (
                  <video
                    src={item.url}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt || item.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="p-5">
                <h3 className="font-bold text-slate-950">{item.title}</h3>

                {item.caption && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}