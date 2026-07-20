"use client";

import { useMemo, useState } from "react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  location?: string | null;
  initials: string;
  photo?: string | null;
};

export default function AboutTeamWall({ members }: { members: TeamMember[] }) {
  const safeMembers = useMemo(
    () => members.length > 0 ? members : [
      { id: "research", name: "Research", role: "Language science", location: "LexData", initials: "R", bio: "Research design, corpus work, and evidence-led inquiry.", photo: null },
      { id: "training", name: "Training", role: "Workshops and learning", location: "LexData", initials: "T", bio: "Hands-on learning experiences for researchers and professionals.", photo: null },
      { id: "technology", name: "Technology", role: "AI and data systems", location: "LexData", initials: "A", bio: "Practical tooling that keeps people in control of the workflow.", photo: null },
    ],
    [members]
  );

  const [active, setActive] = useState(0);
  const selected = safeMembers[Math.min(active, safeMembers.length - 1)];

  return (
    <div className="lx-team-board">
      <article className="lx-team-feature" aria-live="polite" key={selected.id}>
        <div className={`lx-team-portrait ${selected.photo ? "has-photo" : ""}`}>
          {selected.photo ? (
            <img src={selected.photo} alt={`${selected.name} portrait`} />
          ) : (
            <div className="lx-team-sketch-fallback" aria-hidden="true">
              <i className="lx-sketch-hair" />
              <i className="lx-sketch-face" />
              <i className="lx-sketch-glasses" />
              <strong>{selected.initials}</strong>
            </div>
          )}
        </div>
        <div className="lx-team-card-caption">
          <strong>{selected.name}</strong>
          <span>{selected.role}</span>
        </div>
      </article>

      <div className="lx-team-list" role="list">
        {safeMembers.map((member, index) => (
          <button
            type="button"
            key={member.id}
            className={`lx-team-row ${index === active ? "is-active" : ""}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
          >
            <span className="lx-team-name">{member.name}</span>
            <span className="lx-team-role">{member.role}</span>
            <span className="lx-team-place">{member.location || "LexData"} <b>o</b></span>
          </button>
        ))}
      </div>
    </div>
  );
}