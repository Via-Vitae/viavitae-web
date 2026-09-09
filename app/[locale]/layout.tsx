import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/routing";
import type { Locale } from "@/lib/routing";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer";
import { SkipLink } from "@/components/layout/skip-link";
import { CookieConsent } from "@/components/ui/cookie-consent";

// Self-hosted variable fonts (EEA-compliant: no third-party font CDN at runtime).
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@/styles/globals.css";

// Root locale layout: <html lang>, fonts, Header, Footer, skip-link and the
// granular cookie-consent banner. Every route is /[locale]/... (localePrefix: always).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col bg-surface-page text-text-primary">
        <NextIntlClientProvider messages={messages}>
          <SkipLink />
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
