import Link from "next/link";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  group_name: string | null;
  affiliation: string | null;
  bio: string | null;
  image_url: string | null;
};

function getInitials(name: string) {
  return name
    .replace("Professor", "")
    .replace("Dr.", "")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function TeamShowcase({ members }: { members: TeamMember[] }) {
  if (!members.length) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-semibold text-blue-700">Leadership & Team</p>

            <h2 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">
              Meet the people behind LexData
            </h2>

            <p className="mt-4 max-w-2xl text-slate-600">
              A multidisciplinary team of researchers, educators, AI trainers,
              and technical coordinators.
            </p>
          </div>

          <Link
            href="/team"
            className="w-fit rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Full Team
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {members.slice(0, 8).map((member, index) => (
            <div
              key={member.id}
              className={`group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                index === 0 ? "lg:col-span-2 lg:row-span-2" : ""
              }`}
            >
              <div className={index === 0 ? "h-80" : "h-56"}>
                {member.image_url ? (
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 to-blue-900 text-4xl font-bold text-white">
                    {getInitials(member.name)}
                  </div>
                )}
              </div>

              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {member.group_name}
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  {member.name}
                </h3>

                <p className="mt-1 font-semibold text-slate-700">
                  {member.role}
                </p>

                {member.affiliation && (
                  <p className="mt-1 text-sm text-slate-500">
                    {member.affiliation}
                  </p>
                )}

                {member.bio && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {member.bio}
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