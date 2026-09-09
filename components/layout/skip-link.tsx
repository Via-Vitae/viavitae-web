import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n";

// Skip link: the first focusable element on the page, visually hidden until it
// receives keyboard focus, jumping to the main content (WCAG 2.4.1 Bypass Blocks).
// Uses Tailwind's built-in sr-only/not-sr-only pair so the focus reveal works.
export async function SkipLink() {
  const t = await getTranslations("a11y");
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-ivory-100"
    >
      {t("skipToContent")}
    </Link>
  );
}
