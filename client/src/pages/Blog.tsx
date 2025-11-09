import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { format } from "date-fns";

export default function Blog() {
  const { language } = useLanguage();
  
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
  });
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Blog Hero */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-blog-title">
              {language === 'et' ? 'Blogi' : 'Blog'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              {language === 'et' 
                ? 'Uudised, arvustused ja nipid mängumaailmast' 
                : 'News, reviews and tips from the gaming world'}
            </p>
          </div>
        </div>
        
        {/* Blog Posts */}
        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-video w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const title = language === 'et' ? post.titleEt : post.titleEn;
                const excerpt = language === 'et' ? post.excerptEt : post.excerptEn;
                const category = post.categoryTag;
                
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 h-full flex flex-col" data-testid={`card-post-${post.id}`}>
                      {post.featuredImage && (
                        <div className="aspect-video relative overflow-hidden bg-muted">
                          <img
                            src={post.featuredImage}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            data-testid={`img-post-${post.id}`}
                          />
                        </div>
                      )}
                      
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          {category && (
                            <Badge variant="secondary" data-testid={`badge-category-${post.id}`}>
                              {category}
                            </Badge>
                          )}
                          {post.publishedAt && (
                            <div className="flex items-center text-sm text-muted-foreground gap-1">
                              <Calendar className="h-4 w-4" />
                              <span data-testid={`text-date-${post.id}`}>
                                {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <h2 className="text-xl font-bold mb-3 line-clamp-2 flex-1" data-testid={`text-title-${post.id}`}>
                          {title}
                        </h2>
                        
                        {excerpt && (
                          <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`text-excerpt-${post.id}`}>
                            {excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-end text-sm">
                          <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                            {language === 'et' ? 'Loe edasi' : 'Read more'}
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg" data-testid="text-no-posts">
                {language === 'et' ? 'Postitusi ei leitud' : 'No posts found'}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
