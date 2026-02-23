import { useState } from 'react';
import { Send, Sparkles, Loader2, Info, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GameFacts } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AIQueryBarProps {
  facts: GameFacts;
}

export const AIQueryBar = ({ facts }: AIQueryBarProps) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const { user } = useAuth();

  // Guard against undefined facts
  if (!facts || !facts.game) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Unable to load game data. Please try refreshing the page.
      </div>
    );
  }

  const { game, odds } = facts;

  const streamChat = async (userMessage: string) => {
    const messages = [{ role: 'user' as const, content: userMessage }];
    
    // Build game context for the AI
    const gameContext = {
      sport: game.sport,
      homeTeam: game.homeTeam.name,
      awayTeam: game.awayTeam.name,
      venue: game.venue || '',
      startTime: game.startTime,
      odds: odds ? {
        moneyline: odds.moneyline,
        spread: odds.spread,
        total: odds.total,
        impliedProb: odds.impliedProb,
      } : null,
    };

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error('Please log in to use AI chat');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/betting-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages, gameContext }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please log in to use AI chat');
      }
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment.');
      }
      throw new Error('Failed to get AI response');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
            setResponse(fullResponse);
          }
        } catch {
          // Incomplete JSON, put it back
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    return fullResponse;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!user) {
      toast.error('Please log in to use AI chat');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      await streamChat(query);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get AI response');
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (!user) {
      toast.error('Please log in to use AI chat');
      return;
    }

    setQuery(question);
    setIsLoading(true);
    setResponse(null);

    try {
      await streamChat(question);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get AI response');
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Context Info Banner */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">
          <span className="text-foreground font-medium">Sport:</span> {game.sport} | 
          <span className="text-foreground font-medium ml-1">Match:</span> {game.homeTeam.name} vs {game.awayTeam.name}
        </span>
      </div>

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask anything about ${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation}...`}
              className="pl-10 bg-card/50 border-border/50 focus:border-primary"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" variant="hero" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Quick Questions */}
      {!response && !isLoading && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Quick questions:</span>
          {[
            `Who should I bet on?`,
            `Is the spread a good bet?`,
            `What's the best parlay here?`,
            `Any injury concerns?`,
            `Over or under?`
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && !response && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">AI is analyzing the game...</span>
          </div>
        </div>
      )}

      {/* AI Response Display */}
      {response && (
        <div className="space-y-4">
          {/* Response Header with Sync Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Bot className="h-4 w-4" />
              <span className="font-medium">ThinkBetAI</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Data as of {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-medium">✅ Synced</span>
            </div>
          </div>

          {/* Markdown Response */}
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-muted-foreground mb-3 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-3">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-muted-foreground mb-3">{children}</ol>,
                li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold text-foreground mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold text-foreground mb-1">{children}</h3>,
                code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
                a: ({ href, children }) => <a href={href || '#'} className="text-primary hover:underline">{children}</a>,
                input: ({ checked, ...props }) => (
                  <input type="checkbox" checked={checked} readOnly className="mr-1.5 accent-primary" {...props} />
                ),
              }}
            >
              {response}
            </ReactMarkdown>
          </div>

          {/* Disclaimer */}
          <div className="bg-muted/30 border border-border rounded-lg p-3 text-xs text-muted-foreground">
            ⚠️ This is AI-generated analysis for informational purposes only, not betting advice. Always gamble responsibly.
          </div>
          
          {/* Clear button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setResponse(null); setQuery(''); }}
            className="text-xs text-muted-foreground"
          >
            Ask another question
          </Button>
        </div>
      )}
    </div>
  );
};
