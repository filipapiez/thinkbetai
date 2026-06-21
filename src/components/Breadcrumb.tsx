import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className = '' }: BreadcrumbProps) => {
  // Generate structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://thinkbetai.com'
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        ...(item.href && { item: `https://thinkbetai.com${item.href}` })
      }))
    ]
  };

  const structuredDataJson = JSON.stringify(structuredData);

  useEffect(() => {
    const id = 'thinkbetai-breadcrumb-schema';
    const existing = document.head.querySelector<HTMLScriptElement>(`#${id}`);
    const script = existing ?? document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = structuredDataJson;
    if (!existing) document.head.appendChild(script);

    return () => script.remove();
  }, [structuredDataJson]);

  return (
    <>
      <nav 
        aria-label="Breadcrumb" 
        className={`flex items-center gap-1 text-sm ${className}`}
      >
        <Link 
          to="/" 
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="sr-only">Home</span>
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {item.href ? (
              <Link 
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    </>
  );
};
