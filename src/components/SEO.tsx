import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
}

const defaultTitle = 'ThinkBetAI - #1 AI Betting Platform | AI Sports Predictions';
const defaultDescription = 'Get AI-powered betting predictions with 67% accuracy. ThinkBetAI uses advanced machine learning to analyze sports data and provide winning picks for NFL, NBA, MLB, NHL & more.';
const defaultKeywords = 'AI betting, AI sports predictions, betting AI, AI picks, sports betting AI, machine learning betting, AI betting predictions, best AI betting site';
const defaultImage = 'https://thinkbetai.com/og-image.png';
const siteUrl = 'https://thinkbetai.com';

export const SEO = ({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  image = defaultImage,
  url,
  type = 'website',
  author,
  publishedTime,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ThinkBetAI` : defaultTitle;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
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
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};
