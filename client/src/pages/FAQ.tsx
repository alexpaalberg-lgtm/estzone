import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

export default function FAQ() {
  const { language } = useLanguage();

  const faqData = language === 'et' ? {
    title: 'Korduma Kippuvad Küsimused',
    subtitle: 'Leia vastused levinumatele küsimustele',
    sections: [
      {
        title: 'Tellimine ja maksmine',
        items: [
          {
            question: 'Millised makseviisid on saadaval?',
            answer: 'Aktsepteerime pangalinki (SEB, Swedbank, LHV, Luminor), krediit- ja deebetkaarte (Visa, Mastercard) ning PayPali.'
          },
          {
            question: 'Kas hinnad sisaldavad käibemaksu?',
            answer: 'Jah, kõik meie hinnad sisaldavad 24% Eesti käibemaksu.'
          },
          {
            question: 'Kas saan tellimust tühistada?',
            answer: 'Jah, tellimuse saab tühistada kuni see pole veel saadetud. Võta ühendust meie klienditoega.'
          }
        ]
      },
      {
        title: 'Tarne',
        items: [
          {
            question: 'Kui kiiresti tellimus kohale jõuab?',
            answer: 'Omniva pakiautomaadiga 2-3 tööpäeva, DPD pakiautomaadiga 1-2 tööpäeva, DPD kulleriga 1-2 tööpäeva.'
          },
          {
            question: 'Kui palju tarne maksab?',
            answer: 'Omniva pakiautomaat: €4.99, DPD pakiautomaat: €5.99, DPD kuller: €7.99.'
          },
          {
            question: 'Kas saan tellimust jälgida?',
            answer: 'Jah, saadame teile jälgimiskoodi kohe kui tellimus on saadetud.'
          }
        ]
      },
      {
        title: 'Tagastused ja garantii',
        items: [
          {
            question: 'Mis on tagastuspoliitika?',
            answer: 'Avamata tooted saab tagastada 14 päeva jooksul täieliku raha tagasisaamisega. Avatud tarkvara (mängud, koodid) ei saa tagastada, välja arvatud defekti korral.'
          },
          {
            question: 'Kuidas tagastust algatada?',
            answer: 'Saada e-kiri aadressile info@estzone.eu oma tellimuse numbri ja tagastuse põhjusega.'
          },
          {
            question: 'Mis garantii toodetele kehtib?',
            answer: 'Konsoolidel on 2-aastane garantii, kontrolleritel 1 aasta, kõrvaklappidel 1-2 aastat ja tarvikutel 6-12 kuud.'
          },
          {
            question: 'Mida teha kui toode on defektne?',
            answer: 'Võta kohe ühendust meie klienditoega. Pakume kohest asendust või täielikku raha tagastust.'
          }
        ]
      },
      {
        title: 'Tooted',
        items: [
          {
            question: 'Kas mängukoodid on Euroopa jaoks?',
            answer: 'Jah, kõik meie digitaalsed koodid on mõeldud Euroopa regioonile ja aktiveeruvad Eesti kontodel.'
          },
          {
            question: 'Kas tooted on originaalsed?',
            answer: 'Jah, müüme ainult 100% originaaltooteid ametlikelt edasimüüjatelt.'
          },
          {
            question: 'Mida teha kui toode on laost otsas?',
            answer: 'Kasuta meie AI chatti, et küsida, millal toode tagasi tuleb, või saada e-kiri ja teavitame sind.'
          }
        ]
      }
    ]
  } : {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions',
    sections: [
      {
        title: 'Ordering and Payment',
        items: [
          {
            question: 'What payment methods are available?',
            answer: 'We accept bank links (SEB, Swedbank, LHV, Luminor), credit and debit cards (Visa, Mastercard), and PayPal.'
          },
          {
            question: 'Do prices include VAT?',
            answer: 'Yes, all our prices include 24% Estonian VAT.'
          },
          {
            question: 'Can I cancel my order?',
            answer: 'Yes, you can cancel your order as long as it has not been shipped yet. Contact our customer support.'
          }
        ]
      },
      {
        title: 'Shipping',
        items: [
          {
            question: 'How fast will my order arrive?',
            answer: 'Omniva parcel locker: 2-3 business days, DPD parcel locker: 1-2 business days, DPD courier: 1-2 business days.'
          },
          {
            question: 'How much does shipping cost?',
            answer: 'Omniva parcel locker: €4.99, DPD parcel locker: €5.99, DPD courier: €7.99.'
          },
          {
            question: 'Can I track my order?',
            answer: 'Yes, we will send you a tracking code as soon as your order has been shipped.'
          }
        ]
      },
      {
        title: 'Returns and Warranty',
        items: [
          {
            question: 'What is your return policy?',
            answer: 'Unopened products can be returned within 14 days for a full refund. Opened software (games, codes) cannot be returned except in case of defects.'
          },
          {
            question: 'How do I initiate a return?',
            answer: 'Send an email to info@estzone.eu with your order number and reason for return.'
          },
          {
            question: 'What warranty applies to products?',
            answer: 'Consoles have a 2-year warranty, controllers 1 year, headsets 1-2 years, and accessories 6-12 months.'
          },
          {
            question: 'What if my product is defective?',
            answer: 'Contact our customer support immediately. We offer immediate replacement or full refund.'
          }
        ]
      },
      {
        title: 'Products',
        items: [
          {
            question: 'Are game codes for Europe?',
            answer: 'Yes, all our digital codes are intended for the European region and will activate on Estonian accounts.'
          },
          {
            question: 'Are products original?',
            answer: 'Yes, we only sell 100% original products from official distributors.'
          },
          {
            question: 'What if a product is out of stock?',
            answer: 'Use our AI chat to ask when the product will be back, or send us an email and we will notify you.'
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title={language === 'et' ? 'Korduma Kippuvad Küsimused' : 'Frequently Asked Questions'}
        description={language === 'et' 
          ? 'Leia vastused küsimustele tellimise, tarne, tagastuste ja garantii kohta EstZone mängupoes.'
          : 'Find answers about ordering, shipping, returns and warranty at EstZone gaming store.'}
        keywords={language === 'et'
          ? 'KKK, küsimused, vastused, tugi, klienditeenindus, EstZone'
          : 'FAQ, questions, answers, support, customer service, EstZone'}
      />
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-faq-title">{faqData.title}</h1>
            <p className="text-muted-foreground">{faqData.subtitle}</p>
          </div>

          <div className="space-y-6">
            {faqData.sections.map((section, sectionIndex) => (
              <Card key={sectionIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {section.items.map((item, itemIndex) => (
                      <AccordionItem 
                        key={itemIndex} 
                        value={`section-${sectionIndex}-item-${itemIndex}`}
                      >
                        <AccordionTrigger 
                          className="text-left"
                          data-testid={`button-faq-${sectionIndex}-${itemIndex}`}
                        >
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
