type TeamMediaProps = {
  name: string;
  initials?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  videoUrl?: string | null;
  stylePreset?: string | null;
  large?: boolean;
};

function getPresetClass(stylePreset?: string | null) {
  switch (stylePreset) {
    case "royal":
      return "from-blue-950 via-blue-800 to-indigo-700";
    case "academic":
      return "from-slate-950 via-slate-800 to-blue-900";
    case "purple":
      return "from-violet-950 via-purple-800 to-indigo-800";
    case "emerald":
      return "from-emerald-950 via-teal-800 to-slate-900";
    case "gold":
      return "from-yellow-900 via-amber-700 to-slate-950";
    case "navy":
    default:
      return "from-slate-950 via-blue-950 to-blue-800";
  }
}

export default function TeamMedia({
  name,
  initials,
  mediaType,
  mediaUrl,
  videoUrl,
  stylePreset,
  large = false,
}: TeamMediaProps) {
  const heightClass = large ? "h-[420px]" : "h-72";
  const displayInitials =
    initials ||
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (mediaType === "video" && videoUrl) {
    return (
      <div className={`relative overflow-hidden rounded-t-2xl ${heightClass} bg-slate-950`}>
        <video
          src={videoUrl}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
      </div>
    );
  }

  if (mediaType === "image" && mediaUrl) {
    return (
      <div className={`overflow-hidden rounded-t-2xl ${heightClass} bg-slate-100`}>
        <img
          src={mediaUrl}
          alt={name}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${heightClass} items-center justify-center rounded-t-2xl bg-gradient-to-br ${getPresetClass(
        stylePreset
      )}`}
    >
      <div className="rounded-full border border-white/20 bg-white/10 px-8 py-6 text-5xl font-black tracking-tight text-white shadow-2xl backdrop-blur">
        {displayInitials}
      </div>
    </div>
  );
}