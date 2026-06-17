import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEO } from '@/components/SEO';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Send, Loader2, MessageCircle, TrendingUp, HelpCircle, DollarSign, BarChart3, CheckCircle, ArrowRight, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatFaq {
  q: string;
  a: string;
}

interface ChatFaqSchema {
  '@context': string;
  '@type': string;
  mainEntity: {
    '@type': string;
    name: string;
    acceptedAnswer: { '@type': string; text: string };
  }[];
}

interface ChatSEOContentProps { }

const chatFaqs: ChatFaq[] = [
  { q: "What can I ask the AI betting chat?", a: "You can ask about today's games, odds comparisons, injury updates, betting terminology, parlay strategies, and specific matchup analysis across NFL, NBA, MLB, NHL, UFC, soccer, and tennis." },
  { q: "Is the AI chat free to use?", a: "The AI betting chat is available to all registered users. Free-tier users get a limited number of daily queries, while premium subscribers enjoy unlimited conversations." },
  { q: "How does the AI generate betting answers?", a: "Our AI processes real-time odds, injury reports, historical matchup data, and team performance metrics to provide data-backed responses. It's trained specifically for sports betting context." },
  { q: "Can the AI chat build parlays for me?", a: "Yes! Ask the AI to suggest parlay combinations and it will recommend correlated picks with probability breakdowns. You can also use our dedicated AI Parlay Builder for a visual experience." },
  { q: "Is the AI chat better than searching forums?", a: "The AI chat provides instant, data-driven answers without the noise of forums. It pulls from real-time data sources and statistical models rather than opinions, giving you faster and more reliable information." },
  { q: "Does the chat remember my previous questions?", a: "Yes, within a single session the AI maintains conversation context so you can ask follow-up questions naturally without repeating yourself." },
];

const chatFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: chatFaqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ChatSEOContent: React.FC<ChatSEOContentProps> = () => (
  <section className="container mx-auto px-4 py-12 max-w-4xl">
    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">AI Betting Chat — Ask Any Sports Betting Question</h1>
    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
      ThinkBetAI's <Link to="/chat" className="text-primary hover:underline font-medium">AI betting chat</Link> is your personal sports betting assistant. Whether you're a beginner learning how moneylines work or an experienced bettor looking for tonight's best value plays, our AI delivers instant, data-driven answers powered by real-time odds and statistical models.
    </p>

    <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 mb-12">
      <div>
        <h2 className="text-2xl font-semibold mb-3">How the AI Betting Chat Works</h2>
        <p className="text-muted-foreground leading-relaxed">
          Our conversational AI is purpose-built for sports betting. Unlike generic chatbots, ThinkBetAI's assistant has access to live odds feeds, injury reports, team statistics, and historical matchup data across all major sports.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-3">
          The chat maintains context throughout your session, so you can dig deeper with follow-up questions. Ask about a specific game, then refine your query to explore prop bets, totals, or alternative spreads without starting over.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">What You Can Ask</h2>
        <ul className="space-y-2 text-muted-foreground">
          {[
            "Today's game schedules, start times, and broadcast information for any sport",
            "Real-time injury updates and their impact on betting lines",
            "Odds comparisons and value identification across sportsbooks",
            "Betting terminology explanations — spreads, moneylines, totals, props, and more",
            "Parlay suggestions with correlation analysis and probability breakdowns",
            "Historical head-to-head records and trending performance data",
            "Bankroll management advice and responsible betting strategies",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">Why Use AI Instead of Traditional Research?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Traditional betting research means bouncing between injury reports, stats sites, odds aggregators, and forums. ThinkBetAI's chat consolidates all of that into a single conversation. Every response is backed by the same statistical models that power our{' '}
          <Link to="/picks" className="text-primary hover:underline font-medium">AI picks</Link> and{' '}
          <Link to="/ai-bet-analyzer" className="text-primary hover:underline font-medium">bet analyzer</Link>.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 not-prose">
        <Link to="/" className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors text-center">
          <span className="text-sm font-semibold">Home</span>
          <p className="text-xs text-muted-foreground mt-1">Explore ThinkBetAI</p>
        </Link>
        <Link to="/pricing" className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors text-center">
          <span className="text-sm font-semibold">Pricing</span>
          <p className="text-xs text-muted-foreground mt-1">See plans & features</p>
        </Link>
        <Link to="/blog" className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors text-center">
          <span className="text-sm font-semibold">Blog</span>
          <p className="text-xs text-muted-foreground mt-1">AI betting guides</p>
        </Link>
      </div>
    </div>

    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-6">FAQs About AI Betting Chat</h2>
      <Accordion type="single" collapsible className="w-full">
        {chatFaqs.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>

    <div className="text-center mb-8">
      <Button size="lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        Start Chatting with AI <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  </section>
);

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please log in to use the chat');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/betting-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleQuickQuestion = (question: string) => {
    if (isLoading) return;
    streamChat(question);
  };

  const quickQuestions = [
    { icon: HelpCircle, text: "Who's injured today in the NBA?", label: "Injuries" },
    { icon: TrendingUp, text: "What are the best value plays tonight?", label: "Best Plays" },
    { icon: BarChart3, text: "Any NFL games today?", label: "NFL Schedule" },
    { icon: DollarSign, text: "How do moneylines work?", label: "Learn Betting" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="AI Betting Chat — Ask Any Sports Question"
        description="Chat with ThinkBetAI's AI betting assistant. Get instant, data-driven answers about odds, injuries, game predictions, parlay strategies, and betting terminology across NFL, NBA, MLB, NHL & more."
        keywords="AI betting chat, sports betting assistant, AI sports chat, betting questions AI, AI odds chat, sports betting help"
        url="/chat"
        noIndex
        structuredData={chatFaqSchema as Record<string, unknown>}
      />
      <Header />
      
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4 sm:py-6">
        {/* Chat Container */}
        <div className="flex-1 flex flex-col min-h-[70vh] rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-lg">
          
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-card/80">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
              <Bot className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">ThinkBetAI</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Online · Powered by live data
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4 sm:px-5" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-8 py-12 sm:py-16">
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <MessageCircle className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">What can I help you with?</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Ask about odds, injuries, player props, parlays, or any sports betting question.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      className="group flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-card/60 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 p-3.5 text-left"
                      onClick={() => handleQuickQuestion(q.text)}
                      disabled={isLoading}
                    >
                      <q.icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground leading-snug">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1 py-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3 py-3",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-[80%] text-sm",
                        msg.role === 'user'
                          ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 shadow-sm'
                          : 'rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3'
                      )}
                    >
                      {msg.role === 'assistant' && msg.content === '' ? (
                        <div className="flex items-center gap-2 py-1">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Analyzing...</span>
                        </div>
                      ) : msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1.5 prose-hr:my-3 prose-strong:text-foreground prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground prose-blockquote:text-xs">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <span className="leading-relaxed">{msg.content}</span>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5 text-foreground/60" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="px-4 sm:px-5 py-4 border-t border-border/50 bg-card/80">
            <form onSubmit={handleSubmit} className="flex gap-2.5 items-center">
              <div className="relative flex-1 min-w-0">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about sports betting..."
                  className="h-11 sm:h-12 text-sm sm:text-base rounded-xl border-border/60 bg-background/60 focus:bg-background transition-colors pl-4 pr-4"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                size="icon"
                disabled={isLoading || !input.trim()} 
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl shrink-0 shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Send className="h-4.5 w-4.5" />
                )}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
              AI-powered analysis · Not financial advice · Always bet responsibly
            </p>
          </div>
        </div>
      </main>

      <ChatSEOContent />
      <Footer />
    </div>
  );
};

export default Chat;
