import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  canonical?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  structuredData?: Record<string, unknown>;
  noIndex?: boolean;
}

const defaultTitle = 'ThinkBetAI — AI Sports Betting Analytics & Predictions';
const defaultDescription = 'AI-powered sports betting analytics with a transparent track record. Model-driven picks and matchup context for NFL, NBA, MLB, NHL, UFC and soccer. Not financial advice.';
const defaultKeywords = 'AI sports betting, AI betting analytics, AI sports predictions, sports betting model, AI picks';
const defaultImage = 'https://thinkbetai.com/og-image.png';
const siteUrl = 'https://thinkbetai.com';

export const SEO = ({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  image = defaultImage,
  url,
  canonical,
  type = 'website',
  author,
  publishedTime,
  structuredData,
  noIndex,
}: SEOProps) => {
  const fullTitle = title ? (title.includes('ThinkBetAI') ? title : `${title} | ThinkBetAI`) : defaultTitle;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const canonicalUrl = canonical || fullUrl;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noIndex && <meta name="robots" content="noindex, follow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="ThinkBetAI" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Article specific */}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
