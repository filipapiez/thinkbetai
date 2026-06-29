/**
 * Generates visible first-paint responses for the blog index and every
 * article listed in the sitemap. React still owns #root after it loads, but
 * the initial HTML now carries meaningful article copy for mobile LCP.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { blogPosts, type BlogPost } from "../src/lib/blogData";

const BASE = "https://thinkbetai.com";
const DIST = resolve("dist");
const indexPath = join(DIST, "index.html");

if (!existsSync(indexPath)) {
  console.warn("[prerender-blog] dist/index.html missing — skipping.");
  process.exit(0);
}

const baseHtml = readFileSync(indexPath, "utf8");
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const inlineMarkup = (value: string) =>
  escapeHtml(value)
    .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

const seoTitle = (title: string) => {
  const suffix = " | ThinkBetAI";
  if (title.length + suffix.length <= 60) return `${title}${suffix}`;
  if (title.length <= 60) return title;
  const shortened = title.slice(0, 57).replace(/\s+\S*$/, "").trim();
  return `${shortened}…`;
};

const seoDescription = (excerpt: string) => {
  let description = excerpt.trim();
  if (description.length < 110) {
    description += " Learn the methodology, limitations and responsible-use considerations.";
  }
  if (description.length <= 160) return description;
  return `${description.slice(0, 157).replace(/\s+\S*$/, "").trim()}…`;
};

function articleHtml(content: string) {
  return content
    .trim()
    .split(/\n+/)
    .map((raw) => {
      const line = raw.trim();
      if (!line) return "";
      if (line.startsWith("### ")) return `<h3>${inlineMarkup(line.slice(4))}</h3>`;
      if (line.startsWith("## ")) return `<h2>${inlineMarkup(line.slice(3))}</h2>`;
      if (/^\d+\.\s/.test(line)) {
        return `<p>${inlineMarkup(line)}</p>`;
      }
      if (line.startsWith("- ")) return `<p>&bull; ${inlineMarkup(line.slice(2))}</p>`;
      return `<p>${inlineMarkup(line)}</p>`;
    })
    .join("\n");
}

function patchCommon(html: string, options: {
  title: string;
  description: string;
  url: string;
  image: string;
  schema: Record<string, unknown>;
  fallback: string;
}) {
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(options.title)}</title>`);
  html = html.replace(
    /<meta\s+name="title"[^>]*>/,
    `<meta name="title" content="${escapeHtml(options.title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(options.description)}" />`,
  );
  html = html.replace(
    /<meta\s+name="robots"[^>]*>/,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
  );
  for (const [property, value] of [
    ["og:url", options.url],
    ["og:title", options.title],
    ["og:description", options.description],
    ["og:image", options.image],
  ]) {
    html = html.replace(
      new RegExp(`<meta\\s+property="${property}"[^>]*>`),
      `<meta property="${property}" content="${escapeHtml(value)}" />`,
    );
  }
  for (const [name, value] of [
    ["twitter:url", options.url],
    ["twitter:title", options.title],
    ["twitter:description", options.description],
    ["twitter:image", options.image],
  ]) {
    html = html.replace(
      new RegExp(`<meta\\s+name="${name}"[^>]*>`),
      `<meta name="${name}" content="${escapeHtml(value)}" />`,
    );
  }

  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${escapeHtml(options.url)}" />\n<script id="thinkbetai-page-schema" type="application/ld+json">${JSON.stringify(options.schema)}</script>\n</head>`,
  );
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><div id="seo-prerender">${options.fallback}</div></div>`,
  );
  return html;
}

function articleSchema(post: BlogPost, url: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: post.title,
        description,
        image: [post.image],
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: { "@type": "Organization", name: "ThinkBetAI Editorial Team", url: `${BASE}/about` },
        publisher: {
          "@type": "Organization",
          name: "ThinkBetAI",
          logo: { "@type": "ImageObject", url: `${BASE}/thinkbetai-logo-v2.png` },
        },
        mainEntityOfPage: { "@id": url },
        articleSection: post.category,
        keywords: post.tags.join(", "),
        wordCount: post.content.trim().split(/\s+/).length,
      },
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: post.title,
        description,
        isPartOf: { "@id": `${BASE}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}

function renderArticle(post: BlogPost) {
  const url = `${BASE}/blog/${post.slug}`;
  const title = seoTitle(post.title);
  const description = seoDescription(post.excerpt);
  const related = blogPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .slice(0, 3)
    .map((candidate) => `<li><a href="/blog/${escapeHtml(candidate.slug)}">${escapeHtml(candidate.title)}</a></li>`)
    .join("");
  const fallback = `<main style="max-width:64rem;margin:0 auto;padding:2rem 1rem;">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/blog">Blog</a> &rsaquo; <span>${escapeHtml(post.title)}</span></nav>
    <article>
      <header><p>${escapeHtml(post.category)} · ${escapeHtml(post.publishedAt)} · ${escapeHtml(post.readTime)}</p><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(description)}</p></header>
      <aside><strong>Editorial note:</strong> This article is educational, not a promise of results. Verify dated performance references, current odds, and local laws independently. Never wager more than you can afford to lose.</aside>
      ${articleHtml(post.content)}
    </article>
    <aside><h2>Related analysis</h2><ul>${related}</ul><p><a href="/ai-sports-picks">AI sports picks</a> · <a href="/responsible-gambling">Responsible gambling</a></p></aside>
  </main>`;
  return patchCommon(baseHtml, {
    title,
    description,
    url,
    image: post.image,
    schema: articleSchema(post, url, description),
    fallback,
  });
}

function renderBlogIndex() {
  const url = `${BASE}/blog`;
  const title = "AI Sports Betting Blog & Guides | ThinkBetAI";
  const description =
    "Read practical guides about AI sports betting models, probability, odds, parlays, player props, bankroll risk and responsible analysis.";
  const list = blogPosts
    .map(
      (post) =>
        `<li><a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a><p>${escapeHtml(post.excerpt)}</p></li>`,
    )
    .join("");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": url, url, name: title, description },
      {
        "@type": "ItemList",
        itemListElement: blogPosts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${BASE}/blog/${post.slug}`,
          name: post.title,
        })),
      },
    ],
  };
  const fallback = `<main style="max-width:64rem;margin:0 auto;padding:2rem 1rem;"><h1>AI Sports Betting Blog</h1><p>${escapeHtml(description)}</p><ul>${list}</ul></main>`;
  return patchCommon(baseHtml, {
    title,
    description,
    url,
    image: `${BASE}/og-image.png`,
    schema,
    fallback,
  });
}

const blogIndexHtml = renderBlogIndex();
writeFileSync(join(DIST, "blog.html"), blogIndexHtml);
mkdirSync(join(DIST, "blog"), { recursive: true });
writeFileSync(join(DIST, "blog", "index.html"), blogIndexHtml);

for (const post of blogPosts) {
  const html = renderArticle(post);
  const flat = join(DIST, "blog", `${post.slug}.html`);
  const nested = join(DIST, "blog", post.slug, "index.html");
  mkdirSync(dirname(nested), { recursive: true });
  writeFileSync(flat, html);
  writeFileSync(nested, html);
}

console.log(`✓ prerendered blog index + ${blogPosts.length} articles`);
