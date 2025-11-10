import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Clock, ArrowLeft, ChevronRight } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { format } from "date-fns";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const { language } = useLanguage();
  
  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ['/api/blog', params?.slug],
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="aspect-video w-full mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'et' ? 'Postitust ei leitud' : 'Post not found'}
          </h1>
          <Link href="/blog">
            <Button>
              {language === 'et' ? 'Tagasi blogisse' : 'Back to blog'}
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }
  
  const title = language === 'et' ? post.titleEt : post.titleEn;
  const content = language === 'et' ? post.contentEt : post.contentEn;
  const excerpt = language === 'et' ? post.excerptEt : post.excerptEn;
  const category = post.categoryTag;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title={title}
        description={excerpt || ''}
        keywords={`${category}, gaming, blog, ${language === 'et' ? 'mänguuudised' : 'gaming news'}`}
        ogType="article"
        ogImage={post.featuredImage || '/og-default.jpg'}
        article={{
          publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
          author: 'EstZone',
        }}
      />
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8" data-testid="breadcrumb">
            <Link href="/" className="hover:text-foreground">
              {language === 'et' ? 'Avaleht' : 'Home'}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/blog" className="hover:text-foreground">
              {language === 'et' ? 'Blogi' : 'Blog'}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{title}</span>
          </div>
          
          <article className="max-w-4xl mx-auto">
            {/* Cover Image */}
            {post.featuredImage && (
              <div className="aspect-video rounded-md overflow-hidden mb-8 border border-border">
                <img
                  src={post.featuredImage}
                  alt={title}
                  className="w-full h-full object-cover"
                  data-testid="img-cover"
                />
              </div>
            )}
            
            {/* Post Header */}
            <div className="mb-8">
              {category && (
                <Badge variant="secondary" className="mb-4" data-testid="badge-category">
                  {category}
                </Badge>
              )}
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-title">
                {title}
              </h1>
              
              {post.publishedAt && (
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span data-testid="text-date">
                      {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Post Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: content }}
              data-testid="text-content"
            />
            
            <Separator className="my-8" />
            
            {/* Back to Blog */}
            <Link href="/blog">
              <Button variant="outline" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {language === 'et' ? 'Tagasi blogisse' : 'Back to blog'}
              </Button>
            </Link>
          </article>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
