
const teamGroups = [
  {
    title: "Executive Leadership",
    subtitle:
      "Strategic leadership guiding LexData’s academic vision, partnerships, and long-term development.",
    members: [
      {
        name: "Dr. Muhammad Afzaal",
        role: "Founder & CEO",
        description:
          "Leads LexData’s mission to connect language, education, research, and data science.",
      },
      {
        name: "Dr. Ali Asiri",
        role: "Co-Founder",
        description:
          "Supports institutional strategy, academic collaboration, and research-driven growth.",
      },
    ],
  },
  {
    title: "Advisory Board",
    subtitle:
      "Scholars and specialists supporting LexData’s scientific, educational, AI, and curriculum direction.",
    members: [
      {
        name: "Dr. Muhammad Imran",
        role: "Scientific Advisor",
        description:
          "Provides scientific guidance for research quality and academic development.",
      },
      {
        name: "Professor Dr. Mamoona Khan",
        role: "Scientific Advisor",
        description:
          "Advises on research standards, academic innovation, and scholarly direction.",
      },
      {
        name: "Dr. Muhammad Younis",
        role: "Education & Curriculum Advisor",
        description:
          "Supports course design, curriculum planning, and training quality.",
      },
      {
        name: "Dr. Rafi Ullah Khan",
        role: "AI & Python Trainer and Advisor",
        affiliation: "University of Liverpool",
        description:
          "Advises and trains on AI, Python, digital research methods, and applied data workflows.",
      },
      {
        name: "Dr. Muhammad Faseeh",
        role: "Advisor & Python Trainer",
        affiliation: "Jeju National University, South Korea",
        description:
          "Supports Python training, research computing, and practical data science learning.",
      },
    ],
  },
  {
    title: "Core Team",
    subtitle:
      "The coordination team supporting daily operations, technical workflows, and learning delivery.",
    members: [
      {
        name: "Syedah Nobia Zehra",
        role: "Coordinator",
        description:
          "Coordinates communication, training activities, and program organization.",
      },
      {
        name: "Xiao Shanshan",
        role: "Lead Technical Coordinator",
        description:
          "Supports platform operations, technical coordination, and digital learning workflows.",
      },
    ],
  },
];

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

export default function TeamPage() {
  return (
    <main className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.25),_transparent_35%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            LexData People
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            Leadership & Team
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            LexData is led by a multidisciplinary team of researchers,
            educators, AI trainers, and technical coordinators working at the
            intersection of language, education, data science, and digital
            research.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-3xl font-bold">3</p>
              <p className="mt-1 text-sm text-slate-300">Leadership Areas</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-3xl font-bold">5+</p>
              <p className="mt-1 text-sm text-slate-300">Advisory Experts</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-3xl font-bold">AI</p>
              <p className="mt-1 text-sm text-slate-300">
                Research & Training Focus
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="space-y-16">
          {teamGroups.map((group) => (
            <div key={group.title}>
              <div className="mb-8">
                <p className="font-semibold text-blue-700">LexData Team</p>

                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {group.title}
                </h2>

                <p className="mt-3 max-w-3xl text-slate-600">
                  {group.subtitle}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.members.map((member) => (
                  <div
                    key={member.name}
                    className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-md transition group-hover:bg-blue-700">
                        {getInitials(member.name)}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-slate-950">
                          {member.name}
                        </h3>

                        <p className="mt-1 font-semibold text-blue-700">
                          {member.role}
                        </p>

                        {"affiliation" in member && member.affiliation && (
                          <p className="mt-1 text-sm text-slate-500">
                            {member.affiliation}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="mt-5 leading-7 text-slate-600">
                      {member.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-slate-950 p-10 text-white md:p-14">
            <p className="font-semibold text-blue-300">Work with LexData</p>

            <h2 className="mt-3 text-3xl font-bold">
              A research-driven team for training, consulting, and digital
              learning.
            </h2>

            <p className="mt-4 max-w-2xl text-slate-300">
              Our team supports courses, workshops, research data projects,
              AI-powered workflows, Python training, and academic development
              programs.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/courses"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-950"
              >
                Explore Courses
              </a>

              <a
                href="/contact"
                className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white"
              >
                Contact the Team
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}