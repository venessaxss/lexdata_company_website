export type InternHiringSlide = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  footer: string;
  poster?: string;
};

export const internHiringSlides: InternHiringSlide[] = [
  {
    id: "open-call",
    eyebrow: "CISMA x LexData",
    title: "Interns wanted",
    poster: "/posters/cisma-lexdata-intern-poster.png",
    summary:
      "Join an interdisciplinary team working across academic research, language data, AI, education, and digital communication.",
    bullets: [
      "Flexible internship format",
      "Project-based experience",
      "Mentoring and portfolio support",
    ],
    footer: "Applications are reviewed on a rolling basis.",
  },
  {
    id: "tracks",
    eyebrow: "Choose a track",
    title: "Research, content, or technology",
    summary:
      "Contribute according to your interests, skills, and academic background.",
    bullets: [
      "Research and data support",
      "Content and communications",
      "Web and workshop support",
    ],
    footer: "Select one primary track and one secondary interest.",
  },
  {
    id: "projects",
    eyebrow: "Real project experience",
    title: "Build useful work, not busywork",
    summary:
      "Projects connect directly to LexData and CISMA research, learning, and public engagement.",
    bullets: [
      "Literature and corpus preparation",
      "Workshop materials and participant support",
      "Website, media, and visual communication",
    ],
    footer: "Tasks are assigned according to experience and availability.",
  },
  {
    id: "profile",
    eyebrow: "Who should apply",
    title: "Curious, reliable, and ready to learn",
    summary:
      "University students and recent graduates from diverse academic and technical backgrounds are welcome.",
    bullets: [
      "Strong communication and responsibility",
      "English working ability",
      "Chinese or Mongolian is an advantage",
    ],
    footer: "A portfolio or GitHub profile is useful but not required.",
  },
  {
    id: "application",
    eyebrow: "Application details",
    title: "Tell us what you want to build",
    summary:
      "Prepare a short application explaining your interests and availability.",
    bullets: [
      "CV or one-page resume",
      "Short introduction and preferred track",
      "Availability and portfolio link",
    ],
    footer: "Open the details page to apply.",
  },
];