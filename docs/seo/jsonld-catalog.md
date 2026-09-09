# JSON-LD catalogue

Structured data is rendered server-side by `components/seo/jsonld.tsx`. Each renderer emits a
`<script type="application/ld+json">` block. The `jsonld` array in `meta-matrix.json` declares
which types each page emits; this catalogue documents the shape and source of each.

| Type                                    | Rendered on                      | Key fields                                                     | Source                                             |
| --------------------------------------- | -------------------------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| `Organization`                          | home, about, contact             | `name`, `url`, `logo`, `contactPoint`, `sameAs`                | `lib/config.ts` (`siteConfig`), `CONTACT_CHANNELS` |
| `WebSite`                               | home                             | `url`, `potentialAction` (SearchAction, when search ships)     | `siteConfig.url`                                   |
| `Product`                               | pricing, product pages           | `name`, `description`, `brand`, `offers`                       | `CATALOG`, `messages`                              |
| `Offer`                                 | product pages, pricing           | `price`, `priceCurrency: EUR`, `availability`                  | `TIERS` (net EUR; VAT shown separately)            |
| `OfferCatalog`                          | pricing                          | list of tier offers                                            | `TIERS`, `ADDONS`                                  |
| `FAQPage`                               | product pages                    | `mainEntity` Q&A                                               | MDX/`messages` FAQ blocks                          |
| `CollectionPage` / `Blog`               | resources hubs, blog index       | `name`, `hasPart`                                              | `content-loader.ts`                                |
| `ItemList`                              | integrations, guides, onboarding | ordered `itemListElement`                                      | `lib/navigation.ts`, content                       |
| `Article`                               | blog post                        | `headline`, `author`, `datePublished`, `dateModified`, `image` | MDX front-matter                                   |
| `BreadcrumbList`                        | all pages via `breadcrumbs.tsx`  | `itemListElement` trail                                        | route segments                                     |
| `AboutPage` / `ContactPage` / `WebPage` | various                          | `name`, `description`, `inLanguage`                            | `meta-matrix.json`                                 |

## Rules

1. **Prices are EUR, net of VAT.** `Offer.price` uses the net figure from `TIERS`; the VAT
   (PVM 21%) is displayed in UI copy, not baked into the structured `price`, to avoid
   misleading rich results.
2. **`inLanguage`** is set from the active locale on every type that supports it, matching the
   hreflang map.
3. **No fabricated identifiers.** `Organization.sameAs`, logos and contact points come from
   verified config/legal sources; empty values are omitted rather than invented.
4. **Validation.** `tests/unit/jsonld.test.ts` asserts each renderer produces schema-valid
   JSON-LD with the required fields present.
