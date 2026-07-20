"use client";

import { useEffect, useMemo, useState } from "react";

export default function PaperTypewriterLine({
  phrases,
  prefix = "",
}: {
  phrases: string[];
  prefix?: string;
}) {
  const safePhrases = useMemo(
    () => phrases.filter((item) => item.trim().length > 0),
    [phrases]
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (safePhrases.length === 0) return;

    const current = safePhrases[phraseIndex] || "";
    const isDoneTyping = !deleting && charIndex >= current.length;
    const isDoneDeleting = deleting && charIndex <= 0;

    const timeout = window.setTimeout(
      () => {
        if (isDoneTyping) {
          setDeleting(true);
          return;
        }

        if (isDoneDeleting) {
          setDeleting(false);
          setPhraseIndex((value) => (value + 1) % safePhrases.length);
          return;
        }

        setCharIndex((value) => value + (deleting ? -1 : 1));
      },
      isDoneTyping ? 1500 : deleting ? 32 : 58
    );

    return () => window.clearTimeout(timeout);
  }, [charIndex, deleting, phraseIndex, safePhrases]);

  const current = safePhrases[phraseIndex] || "";
  const visible = current.slice(0, charIndex);

  return (
    <span className="ell-typewriter" aria-label={`${prefix}${visible}`}>
      {prefix ? <span className="ell-typewriter-prefix">{prefix}</span> : null}
      <span>{visible}</span>
      <span className="ell-typewriter-cursor" aria-hidden="true">|</span>
    </span>
  );
}
