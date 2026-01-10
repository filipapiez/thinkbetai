import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Calendar, Clock, ArrowLeft, ArrowRight, User, Share2 } from 'lucide-react';
import { getBlogPostBySlug, getRelatedPosts } from '@/lib/blogData';

// FAQ data for specific blog posts
const blogFAQs: Record<string, { question: string; answer: string }[]> = {
  'is-there-an-ai-betting-platform': [
    {
      question: 'Is there any AI betting platform?',
      answer: 'Yes, there are AI betting platforms that help analyze sports data, odds, and trends to support betting decisions. These platforms use machine learning algorithms to process vast amounts of historical data, player statistics, and real-time information to generate predictions. ThinkBetAI is a leading example, offering AI-powered analysis for NFL, NBA, MLB, NHL, UFC, and more.'
    },
    {
      question: 'How accurate are AI betting predictions?',
      answer: 'Top AI betting platforms achieve 60-75% accuracy on certain bet types. While no system can guarantee wins, AI significantly outperforms random chance by analyzing millions of data points including team statistics, player performance, injuries, weather conditions, and historical betting patterns.'
    },
    {
      question: 'Is using AI for betting legal?',
      answer: 'Yes, using AI analysis tools for betting decisions is completely legal. AI betting platforms provide information, analysis, and predictions to help users make informed decisions. They are analytical tools, not gambling services themselves.'
    },
    {
      question: 'What sports do AI betting platforms cover?',
      answer: 'Most comprehensive AI betting platforms cover major sports including NFL football, NBA basketball, MLB baseball, NHL hockey, UFC/MMA, soccer, tennis, and golf. The best platforms provide real-time analysis and predictions across multiple leagues and sports.'
    },
    {
      question: 'Do I need technical knowledge to use AI betting platforms?',
      answer: 'No technical knowledge is required. Modern AI betting platforms present complex analysis in user-friendly formats with clear predictions, confidence ratings, and explanations. Users simply review the AI recommendations and make their own betting decisions.'
    }
  ]
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;
  const relatedPosts = slug ? getRelatedPosts(slug, 3) : [];
  const faqs = slug ? blogFAQs[slug] : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Generate FAQ structured data
  const faqStructuredData = faqs ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={post.title}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        url={`/blog/${post.slug}`}
        type="article"
        author={post.author}
        publishedTime={post.publishedAt}
        image={post.image}
      />
      {faqStructuredData && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(faqStructuredData)}
          </script>
        </Helmet>
      )}
      <Header />
      
      <main className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground truncate">{post.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_300px] gap-12">
          {/* Main Content */}
          <article>
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge>{post.category}</Badge>
                {post.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>

              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Article
              </Button>
            </header>

            {/* Featured Image */}
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {post.content.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-semibold mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
                }
                if (paragraph.startsWith('- **')) {
                  const match = paragraph.match(/- \*\*(.+?)\*\* (.+)/);
                  if (match) {
                    return (
                      <li key={index} className="mb-2">
                        <strong>{match[1]}</strong> {match[2]}
                      </li>
                    );
                  }
                }
                if (paragraph.startsWith('- ')) {
                  return <li key={index} className="mb-2">{paragraph.replace('- ', '')}</li>;
                }
                if (paragraph.match(/^\d+\. \*\*/)) {
                  const match = paragraph.match(/^(\d+)\. \*\*(.+?)\*\*(.*)$/);
                  if (match) {
                    return (
                      <li key={index} className="mb-2 list-decimal ml-4">
                        <strong>{match[2]}</strong>{match[3]}
                      </li>
                    );
                  }
                }
                if (paragraph.trim() === '') return null;
                return <p key={index} className="mb-4 text-muted-foreground">{paragraph}</p>;
              })}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
              <span className="text-sm text-muted-foreground">Tags:</span>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t">
              <Button variant="ghost" asChild>
                <Link to="/blog">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog
                </Link>
              </Button>
              <Button asChild>
                <Link to="/games">
                  Try AI Predictions
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Try AI Betting Today</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get access to professional-grade AI predictions for all major sports.
                </p>
                <Button asChild className="w-full">
                  <Link to="/games">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Related Articles</h3>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <Card key={relatedPost.id} className="overflow-hidden">
                      <div className="aspect-video">
                        <img 
                          src={relatedPost.image} 
                          alt={relatedPost.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader className="p-4">
                        <h4 className="text-sm font-medium line-clamp-2">
                          <Link 
                            to={`/blog/${relatedPost.slug}`}
                            className="hover:text-primary transition-colors"
                          >
                            {relatedPost.title}
                          </Link>
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {relatedPost.readTime}
                        </span>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
