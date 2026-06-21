import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Calendar, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { blogPosts } from '@/lib/blogData';

const Blog = () => {
  const featuredPost = blogPosts[0];
  const otherPosts = blogPosts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="AI Sports Betting Blog & Guides"
        description="Read practical guides about AI sports betting models, probability, odds, parlays, player props, bankroll risk and responsible analysis."
        keywords="AI betting blog, sports betting strategies, betting tips, AI predictions guide, machine learning betting"
        url="/blog"
      />
      <Header />
      
      <main className="container py-12">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Blog' }]} className="mb-8" />
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <TrendingUp className="h-3 w-3 mr-1" />
            AI Betting Insights
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            AI Betting Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert insights, strategies, and guides on using artificial intelligence for smarter sports betting decisions.
          </p>
          <p className="mt-4 text-muted-foreground">
            Popular: <Link to="/blog/is-there-an-ai-betting-platform" className="text-primary hover:underline font-medium">Is there an AI betting platform?</Link>
            {' • '}
            <Link to="/ai-sports-picks" className="text-primary hover:underline font-medium">AI Sports Picks</Link>
          </p>
        </div>

        {/* Featured Post */}
        <Card className="mb-12 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-video md:aspect-auto">
              <img 
                src={featuredPost.image} 
                alt={featuredPost.title}
                width={800}
                height={450}
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <Badge className="w-fit mb-4">{featuredPost.category}</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                <Link 
                  to={`/blog/${featuredPost.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {featuredPost.title}
                </Link>
              </h2>
              <p className="text-muted-foreground mb-6">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {featuredPost.readTime}
                </span>
              </div>
              <Button asChild className="w-fit">
                <Link to={`/blog/${featuredPost.slug}`}>
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Post Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  width={480}
                  height={270}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>
                <h3 className="text-lg font-semibold line-clamp-2">
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    Read more
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Try AI Betting?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Put these strategies into practice with ThinkBetAI's advanced prediction engine.
          </p>
          <Button asChild size="lg">
            <Link to="/games">
              Explore AI Predictions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
