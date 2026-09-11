"use client";

import { useState } from "react";

type ShareButtonsProps = {
  url: string;
  title: string;
};

type ShareLink = {
  name: string;
  href: string | null;
  color: string;
  icon: React.ReactNode;
};

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodedUrl;

  const shareLinks: ShareLink[] = [
    {
      name: "Facebook",
      href: "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl,
      color: "#1877F2",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      href: "https://api.whatsapp.com/send?text=" + encodedTitle + "%20" + encodedUrl,
      color: "#25D366",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.64-.6-2.9-1.25-4.79-4.16-4.93-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.28.58-.35.78-.35.19 0 .39 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.16-.29.36-.42.49-.14.13-.28.28-.12.55.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.8.87-1.07.18-.28.36-.23.6-.14.24.09 1.57.74 1.84.87.27.14.44.2.51.32.07.12.07.66-.17 1.34Z" />
        </svg>
      ),
    },
    {
      name: "Twitter",
      href: "https://twitter.com/intent/tweet?url=" + encodedUrl + "&text=" + encodedTitle,
      color: "#1DA1F2",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-7.6 8.68L23.3 22h-7.2l-5.6-7.3L4 22H1l8.1-9.26L1 2h7.4l5.1 6.7L18.9 2Zm-1.26 18h1.98L7.5 4h-2.1l12.24 16Z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl,
      color: "#0A66C2",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.45 2H3.55A1.55 1.55 0 0 0 2 3.55v16.9A1.55 1.55 0 0 0 3.55 22h16.9A1.55 1.55 0 0 0 22 20.45V3.55A1.55 1.55 0 0 0 20.45 2ZM8.34 18.34H5.67V9.75h2.67v8.59ZM7 8.6a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1Zm11.34 9.74h-2.67v-4.18c0-1-.02-2.28-1.39-2.28-1.4 0-1.61 1.09-1.61 2.21v4.25H10v-8.6h2.56v1.17h.04c.36-.68 1.24-1.4 2.55-1.4 2.72 0 3.22 1.79 3.22 4.12v4.71Z" />
        </svg>
      ),
    },
    {
      name: "WeChat",
      href: null,
      color: "#07C160",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8.5 3.5C4.36 3.5 1 6.24 1 9.62c0 1.9 1.06 3.6 2.72 4.73l-.68 2.05 2.38-1.19c.66.18 1.36.28 2.08.31a5.6 5.6 0 0 1-.15-1.28c0-3.36 3.36-6.09 7.5-6.09.24 0 .48.01.71.03C14.77 5.4 11.96 3.5 8.5 3.5Zm-2.2 3.9a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76Zm4.4 0a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76Zm4.8 2.7c-3.52 0-6.38 2.3-6.38 5.14 0 2.84 2.86 5.14 6.38 5.14.6 0 1.18-.07 1.73-.19l2.04 1.02-.56-1.7C20.15 18.4 21 16.94 21 15.24c0-2.84-2.86-5.14-6.38-5.14Zm-1.98 3.34a.73.73 0 1 1 0 1.46.73.73 0 0 1 0-1.46Zm3.96 0a.73.73 0 1 1 0 1.46.73.73 0 0 1 0-1.46Z" />
        </svg>
      ),
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(function () {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const directLinks = shareLinks.filter(function (link) {
    return link.href !== null;
  });

  const qrOnlyLinks = shareLinks.filter(function (link) {
    return link.href === null;
  });

  return (
    <div className="blog-share-buttons" aria-label="Share this article">
      <span className="blog-share-label">Share</span>

      {directLinks.map(function (link) {
        return (
          <a
            key={link.name}
            className="blog-share-icon"
            href={link.href as string}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={"Share on " + link.name}
            style={{ backgroundColor: link.color, color: "#ffffff" }}
          >
            {link.icon}
          </a>
        );
      })}

      {qrOnlyLinks.map(function (link) {
        return (
          <button
            key={link.name}
            type="button"
            className="blog-share-icon"
            onClick={function () {
              setShowQr(true);
            }}
            aria-label={"Show QR code to share on " + link.name}
            style={{ backgroundColor: link.color, color: "#ffffff" }}
          >
            {link.icon}
          </button>
        );
      })}

      <button
        type="button"
        className="blog-share-copy"
        onClick={handleCopy}
        aria-label="Copy article link"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>

      {showQr && (
        <div
          className="blog-share-qr-backdrop"
          onClick={function () {
            setShowQr(false);
          }}
        >
          <div
            className="blog-share-qr-modal"
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className="blog-share-qr-close"
              onClick={function () {
                setShowQr(false);
              }}
              aria-label="Close QR code"
            >
              ×
            </button>
            <p className="blog-share-qr-title">Scan with WeChat</p>
            <img
              src={qrImageUrl}
              alt="QR code to open this article in WeChat"
              width={220}
              height={220}
            />
            <p className="blog-share-qr-hint">
              Open WeChat &rarr; Discover &rarr; Scan, then share from there.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
