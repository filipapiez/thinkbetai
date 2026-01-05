import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="container max-w-md text-center">
          <div className="text-8xl font-bold text-primary mb-6">404</div>
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="glass" asChild>
              <Link to="/games">
                <Search className="h-4 w-4 mr-2" />
                Search Games
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
