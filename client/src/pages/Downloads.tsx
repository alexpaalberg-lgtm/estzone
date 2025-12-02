import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import estonianPoster from "@assets/generated_images/estonian_poster_with_more_text.png";
import englishPoster from "@assets/generated_images/english_poster_with_more_text.png";

export default function Downloads() {
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">EstZone Plakatid / Posters</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Eestikeelne plakat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <img 
                src={estonianPoster} 
                alt="Estonian Poster" 
                className="w-full rounded-lg border"
              />
              <Button 
                className="w-full" 
                onClick={() => handleDownload(estonianPoster, 'estzone_plakat_eesti.png')}
                data-testid="button-download-estonian"
              >
                <Download className="mr-2 h-4 w-4" />
                Lae alla
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>English Poster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <img 
                src={englishPoster} 
                alt="English Poster" 
                className="w-full rounded-lg border"
              />
              <Button 
                className="w-full" 
                onClick={() => handleDownload(englishPoster, 'estzone_poster_english.png')}
                data-testid="button-download-english"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
