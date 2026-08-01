import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";

export const metadata: Metadata = {
  title: "Blog — Guma One",
  description: "Tips, guides, and stories for Philippine social sellers.",
};

const posts = [
  {
    title: "How to turn Instagram reels into orders (without Messenger chaos)",
    excerpt:
      "A step-by-step guide for food and fashion sellers in Metro Manila — with real conversion tips.",
    category: "Guides",
    date: "Jun 28, 2026",
  },
  {
    title: "GCash vs Maya vs COD: which payment methods convert best?",
    excerpt: "We analyzed 1,000+ checkout sessions to find what Filipino buyers prefer.",
    category: "Insights",
    date: "Jun 15, 2026",
  },
  {
    title: "5 TikTok hooks that made halo-halo sellers go viral",
    excerpt: "AI-generated scripts that actually worked — steal these templates for your shop.",
    category: "AI Studio",
    date: "Jun 1, 2026",
  },
];

export default function BlogPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Blog" }]} />
      <PageHeader
        eyebrow="Blog"
        title="Tips for social sellers"
        description="Guides, data, and stories from the Guma One team and community."
      />

      <ContentSection>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.title} className="border-border/60">
              <CardContent className="pt-6">
                <Badge variant="secondary">{post.category}</Badge>
                <h2 className="mt-3 font-display text-lg font-semibold text-foreground">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm">{post.excerpt}</p>
                <p className="mt-4 text-xs text-muted-foreground">{post.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Full articles publishing at launch. Questions?{" "}
          <a href="/contact" className="font-medium text-primary hover:underline">
            Contact us
          </a>
          .
        </p>
      </ContentSection>
    </MarketingShell>
  );
}
