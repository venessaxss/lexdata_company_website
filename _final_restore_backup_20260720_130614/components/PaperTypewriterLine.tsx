"use client";

import { useEffect, useMemo, useState } from "react";

export default function PaperTypewriterLine({
  messages,
}: {
  messages: string[];
}) {
  const cleanMessages = useMemo(
    () => messages.filter((item) => item.trim().length > 0),
    [messages]
  );

  const [messageIndex, setMessageIndex] = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const currentMessage =
    cleanMessages[messageIndex] ||
    "LexData bridges language, AI, and data science.";

  const visibleText = currentMessage.slice(0, letterIndex);

  useEffect(() => {
    const fullLength = currentMessage.length;

    let delay = deleting ? 28 : 48;

    if (!deleting && letterIndex === fullLength) {
      delay = 1600;
    }

    if (deleting && letterIndex === 0) {
      delay = 350;
    }

    const timer = window.setTimeout(() => {
      if (!deleting && letterIndex < fullLength) {
        setLetterIndex((value) => value + 1);
        return;
      }

      if (!deleting && letterIndex === fullLength) {
        setDeleting(true);
        return;
      }

      if (deleting && letterIndex > 0) {
        setLetterIndex((value) => value - 1);
        return;
      }

      setDeleting(false);
      setMessageIndex((value) => (value + 1) % cleanMessages.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [cleanMessages.length, currentMessage, deleting, letterIndex]);

  return (
    <p className="paper-hero-sub paper-rev paper-typewriter-line">
      <span>{visibleText}</span>
      <b aria-hidden="true" />
    </p>
  );
}