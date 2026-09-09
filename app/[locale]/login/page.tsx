import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/components/seo/metadata-builder";
import type { Locale } from "@/lib/routing";

// Redirect-only client-portal entry. Builds the Keycloak OIDC authorization URL from
// server-only env and redirects. It renders no portal UI and holds no credentials.
// If Keycloak is not configured (launch gate), it renders an explanatory notice
// instead of redirecting to a malformed URL.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: "/login", locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const base = process.env.KEYCLOAK_URL?.replace(/\/$/, "");
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const redirectUri = process.env.KEYCLOAK_REDIRECT_URI;

  if (base && realm && clientId && redirectUri) {
    const url = new URL(`${base}/realms/${realm}/protocol/openid-connect/auth`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid profile email");
    redirect(url.toString());
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-24 text-center">
      <h1 className="text-heading-2 text-text-primary">{t("login.title")}</h1>
      <p className="text-body-md text-text-secondary">{t("login.notConfigured")}</p>
    </div>
  );
}
