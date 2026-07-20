export type EditorialVideoItem = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  poster?: string;
  src?: string;
  kind?: "file" | "youtube";
};

/*
HOW TO ADD A VIDEO

1. Put a local MP4 in public/videos and a poster image in public/video-posters.
2. Add another object to this array.

Local MP4 example:
{
  id: "workshop-01",
  eyebrow: "Workshop highlight",
  title: "Corpus research in motion",
  description: "A short introduction to the workshop.",
  poster: "/video-posters/workshop-01.jpg",
  src: "/videos/workshop-01.mp4",
  kind: "file",
}

YouTube example:
{
  id: "youtube-01",
  eyebrow: "Watch now",
  title: "LexData research session",
  poster: "/video-posters/youtube-01.jpg",
  src: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  kind: "youtube",
}
*/
export const editorialVideos: EditorialVideoItem[] = [
  {
    id: "lexdata-intro",
    eyebrow: "Introducing LexData",
    title: "So... what's this all about?",
    description: "Add your first video URL in content/editorialVideos.ts. The card below will become a playable editorial video feature.",
    poster: "",
    src: "",
    kind: "file",
  },
];