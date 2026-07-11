/**
 * Search aliases that should remain permanent redirects.
 *
 * High-volume exact-match terms now have their own blueprint-backed landing
 * pages, so this map intentionally stays empty unless a future slug truly needs
 * consolidation instead of an indexable page.
 */
export const SEO_ALIAS_REDIRECTS: Record<string, string> = {
};

export const isSeoAlias = (slug: string) => Boolean(SEO_ALIAS_REDIRECTS[slug]);
