"use client";

import Link from "next/link";
import { useRef } from "react";
import type { V2TeamMember } from "@/components/HomeV2TeamSlider";

export default function HomeV2TeamSliderClient({
  members,
}: {
  members: V2TeamMember[];
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scrollByCard(direction: "left" | "right") {
    const track = trackRef.current;
    if (!track) return;

    const amount = direction === "left" ? -380 : 380;
    track.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="v2-section">
      <div className="v2-container">
        <div className="v2-section-head">
          <div>
            <p className="v2-label">LexData team</p>
            <h2>Meet the researchers, trainers, and collaborators.</h2>
            <p>
              A dynamic team presentation with profile links and sliding cards.
            </p>
          </div>

          <div className="v2-slider-buttons">
            <button type="button" onClick={() => scrollByCard("left")}>
              Previous
            </button>
            <button type="button" onClick={() => scrollByCard("right")}>
              Next
            </button>
          </div>
        </div>

        <div ref={trackRef} className="v2-team-track">
          {members.map((member) => (
            <Link
              key={member.id}
              href={member.profileUrl}
              className="v2-team-card"
            >
              <div className="v2-team-image">
                {member.image ? (
                  <img src={member.image} alt={member.name} />
                ) : (
                  <span>{member.name.slice(0, 1)}</span>
                )}
              </div>

              <div className="v2-team-body">
                <p className="v2-label">Team member</p>
                <h3>{member.name}</h3>
                <b>{member.role}</b>
                {member.bio ? <p>{member.bio}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}