import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type PublicReview = {
  id: string;
  name: string;
  role: string | null;
  rating: number;
  quote: string;
  is_verified: boolean;
};

export const PublicReviewsSection = () => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_reviews")
        .select("id, name, role, rating, quote, is_verified")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return (data ?? []) as PublicReview[];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading || reviews.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-col gap-2 text-center">
        <Badge variant="outline" className="mx-auto border-primary/40 text-primary">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Verified user reviews
        </Badge>
        <h2 className="text-2xl font-bold">What Members Say</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-5">
              <div className="mb-3 flex gap-1 text-primary">
                {Array.from({ length: review.rating }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">"{review.quote}"</p>
              <div className="mt-4">
                <div className="font-semibold">{review.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{review.role || "ThinkBetAI member"}</span>
                  {review.is_verified && <span className="text-primary">Verified</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
