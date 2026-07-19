import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const navGroups = [
  {
    label: "Features",
    href: "/features",
    items: [
      {
        label: "AI research workflows",
        href: "/features",
        icon: "AI",
        text: "Corpus, annotation, NLP, and model evaluation.",
      },
      {
        label: "Previous cases",
        href: "/cases",
        icon: "CS",
        text: "See how LexData supports real projects.",
      },
    ],
  },
  {
    label: "Library",
    href: "/library",
    items: [
      {
        label: "Blog",
        href: "/blog",
        icon: "BL",
        text: "Research notes, tutorials, and updates.",
      },
      {
        label: "Help center",
        href: "/help",
        icon: "HP",
        text: "Guides for courses, workshops, and dashboards.",
      },
      {
        label: "Resources",
        href: "/resources",
        icon: "RS",
        text: "Templates, corpora notes, and learning materials.",
      },
    ],
  },
  {
    label: "About",
    href: "/about",
    items: [
      {
        label: "Who we are",
        href: "/about",
        icon: "LX",
        text: "A language-data studio for humanists.",
      },
      {
        label: "Our stance on AI",
        href: "/about/ai-stance",
        icon: "ST",
        text: "Human-centered AI, transparent methods.",
      },
    ],
  },
];

export default async function LexPaperNavbar() {
  let isLoggedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    isLoggedIn = Boolean(user);
  } catch {
    isLoggedIn = false;
  }

  return (
    <header className="lex-paper-nav">
      <Link href="/" className="lex-paper-wordmark" aria-label="LexData home">
        LexData
      </Link>

      <nav className="lex-paper-menu" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div key={group.label} className="lex-paper-menu-group">
            <Link href={group.href} className="lex-paper-menu-trigger">
              <span>{group.label}</span>
              <b aria-hidden="true">⌄</b>
            </Link>

            <div className="lex-paper-dropdown">
              {group.items.map((item) => (
                <Link key={item.href + item.label} href={item.href} className="lex-paper-dropdown-item">
                  <span className="lex-paper-dropdown-icon">{item.icon}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.text}</small>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <Link href="/plus" className="lex-paper-menu-trigger lex-paper-plus">
          Plus+
        </Link>
      </nav>

      <div className="lex-paper-auth">
        {isLoggedIn ? (
          <Link href="/dashboard" className="lex-paper-login">
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="lex-paper-login">
              Log in
            </Link>
            <Link href="/signup" className="lex-paper-signup">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}