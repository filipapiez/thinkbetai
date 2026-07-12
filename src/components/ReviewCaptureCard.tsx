import { useState } from "react";
import { CheckCircle, Loader2, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ReviewCaptureCardProps = {
  userId: string;
  defaultName?: string | null;
};

export const ReviewCaptureCard = ({ userId, defaultName }: ReviewCaptureCardProps) => {
  const [name, setName] = useState(defaultName || "");
  const [role, setRole] = useState("ThinkBetAI member");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuote = quote.trim();
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Add the name you want shown with the review.");
      return;
    }

    if (trimmedQuote.length < 20) {
      toast.error("Add a little more detail before submitting.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await (supabase as any).from("public_reviews").insert({
      user_id: userId,
      name: trimmedName,
      role: role.trim() || "ThinkBetAI member",
      rating,
      quote: trimmedQuote,
      source: "in_app",
    });
    setIsSubmitting(false);

    if (error) {
      toast.error("Review could not be submitted. Please try again.");
      return;
    }

    setSubmitted(true);
    toast.success("Review submitted for verification.");
  };

  if (submitted) {
    return (
      <Card variant="glass" className="border-emerald-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
            Review Submitted
          </CardTitle>
          <CardDescription>
            Thanks. It will stay unpublished until it is verified and approved.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Share a Verified Review
        </CardTitle>
        <CardDescription>
          Submitted reviews go into moderation before they appear publicly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="review-name">Display name</Label>
              <Input
                id="review-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-role">Label</Label>
              <Input
                id="review-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="ThinkBetAI member"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("h-9 w-9", value <= rating ? "text-primary" : "text-muted-foreground")}
                  onClick={() => setRating(value)}
                  disabled={isSubmitting}
                  aria-label={`${value} star rating`}
                >
                  <Star className={cn("h-5 w-5", value <= rating && "fill-current")} />
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-quote">Review</Label>
            <Textarea
              id="review-quote"
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              placeholder="What changed in your research workflow?"
              className="min-h-28 resize-none"
              maxLength={600}
              disabled={isSubmitting}
            />
            <div className="text-right text-xs text-muted-foreground">{quote.length}/600</div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
