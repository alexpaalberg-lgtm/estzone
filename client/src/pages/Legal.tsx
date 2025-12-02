import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type LegalPageType = 'terms' | 'privacy' | 'returns' | 'shipping';

interface LegalPageProps {
  type: LegalPageType;
}

const legalContent = {
  en: {
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: November 30, 2025',
      sections: [
        {
          title: '1. General Information',
          content: `These Terms of Service ("Terms") govern your use of the EstZone OÜ website and services located at www.estzone.eu ("Service"). By accessing or using our Service, you agree to be bound by these Terms.

EstZone OÜ
Registry code: 16XXXXXX
Address: Tallinn, Estonia
Email: info@estzone.eu
Phone: +372 XXXX XXXX`
        },
        {
          title: '2. Products and Pricing',
          content: `All prices displayed on our website include 24% Estonian VAT (Value Added Tax) unless otherwise stated. Prices are shown in EUR and USD for convenience. The EUR price is the binding price for all transactions.

We reserve the right to modify prices at any time. The price applicable to your order is the price shown at the time of purchase.`
        },
        {
          title: '3. Orders and Payment',
          content: `By placing an order, you are making an offer to purchase products. We reserve the right to accept or reject any order. Payment must be completed at the time of order using one of our accepted payment methods: Stripe, PayPal, Montonio, or bank transfer.

An order confirmation email will be sent after successful payment. This confirmation constitutes acceptance of your order and forms a binding contract.`
        },
        {
          title: '4. Delivery',
          content: `We deliver to Estonia, Latvia, Lithuania, and other EU countries. Delivery is provided by Omniva and DPD. Delivery times are estimates and may vary. Typical delivery times:
- Estonia: 1-3 business days
- Latvia/Lithuania: 2-4 business days
- Other EU countries: 5-10 business days

Risk of loss passes to you upon delivery. Please inspect packages upon receipt and report any damage immediately.`
        },
        {
          title: '5. Right of Withdrawal',
          content: `Under EU Consumer Rights Directive, you have the right to withdraw from your purchase within 14 days of receiving the goods without giving any reason. To exercise this right, contact us at info@estzone.eu with your order number.

Products must be returned in original condition and packaging. Return shipping costs are the responsibility of the customer unless the product is defective.`
        },
        {
          title: '6. Warranty',
          content: `All products come with a 1-year warranty. This warranty covers manufacturing defects but does not cover damage caused by misuse, accidents, or normal wear and tear.

For warranty claims, contact our customer support with proof of purchase.`
        },
        {
          title: '7. Limitation of Liability',
          content: `EstZone OÜ shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service or products purchased through the Service.

Our maximum liability shall not exceed the purchase price of the product giving rise to the claim.`
        },
        {
          title: '8. Intellectual Property',
          content: `All content on this website, including text, graphics, logos, images, and software, is the property of EstZone OÜ or its content suppliers and is protected by copyright and trademark laws.`
        },
        {
          title: '9. Governing Law',
          content: `These Terms shall be governed by the laws of the Republic of Estonia. Any disputes shall be resolved in the courts of Estonia. EU consumers may also use the Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr/`
        },
        {
          title: '10. Contact',
          content: `For questions about these Terms, please contact us:
Email: info@estzone.eu
Phone: +372 XXXX XXXX
Address: Tallinn, Estonia`
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: November 30, 2025',
      sections: [
        {
          title: '1. Data Controller',
          content: `EstZone OÜ ("we", "us", "our") is the data controller responsible for your personal data.

EstZone OÜ
Registry code: 16XXXXXX
Address: Tallinn, Estonia
Email: privacy@estzone.eu`
        },
        {
          title: '2. Personal Data We Collect',
          content: `We collect and process the following personal data:
- Identity data: name
- Contact data: email address, phone number, delivery address
- Transaction data: order history, payment information (processed securely by payment providers)
- Technical data: IP address, browser type, device information
- Usage data: how you use our website
- Marketing data: your preferences for receiving marketing communications`
        },
        {
          title: '3. How We Use Your Data',
          content: `We use your personal data to:
- Process and deliver your orders
- Manage payments and prevent fraud
- Send order confirmations and shipping updates
- Respond to customer service inquiries
- Send marketing communications (with your consent)
- Improve our website and services
- Comply with legal obligations`
        },
        {
          title: '4. Legal Basis for Processing',
          content: `We process your data based on:
- Contract: necessary to fulfill orders
- Consent: for marketing communications and cookies
- Legal obligation: tax and accounting requirements
- Legitimate interests: fraud prevention, improving our services`
        },
        {
          title: '5. Data Sharing',
          content: `We share your data with:
- Payment processors (Stripe, PayPal, Montonio) for payment processing
- Delivery partners (Omniva, DPD) for order fulfillment
- Email service providers for transactional emails
- Analytics providers (with anonymized data)

We do not sell your personal data to third parties.`
        },
        {
          title: '6. Data Retention',
          content: `We retain your personal data for as long as necessary to fulfill the purposes for which it was collected:
- Order data: 7 years (legal requirement for accounting)
- Marketing consent: until withdrawn
- Customer support data: 3 years after last contact`
        },
        {
          title: '7. Your Rights (GDPR)',
          content: `Under GDPR, you have the right to:
- Access your personal data
- Rectify inaccurate data
- Erase your data ("right to be forgotten")
- Restrict processing
- Data portability
- Object to processing
- Withdraw consent

To exercise these rights, contact privacy@estzone.eu`
        },
        {
          title: '8. Cookies',
          content: `We use cookies for:
- Essential cookies: necessary for website functionality
- Analytics cookies: to understand how visitors use our site
- Marketing cookies: to personalize advertisements

You can manage cookie preferences through our cookie consent banner.`
        },
        {
          title: '9. Data Security',
          content: `We implement appropriate technical and organizational measures to protect your personal data, including encryption, secure servers, and access controls.`
        },
        {
          title: '10. Contact',
          content: `For privacy-related inquiries:
Email: privacy@estzone.eu

You may also lodge a complaint with the Estonian Data Protection Inspectorate (Andmekaitse Inspektsioon): www.aki.ee`
        }
      ]
    },
    returns: {
      title: 'Returns & Refunds Policy',
      lastUpdated: 'Last updated: November 30, 2025',
      sections: [
        {
          title: '1. 14-Day Right of Withdrawal',
          content: `Under EU Consumer Rights Directive 2011/83/EU, you have the right to withdraw from your purchase within 14 days of receiving the goods without giving any reason.

The withdrawal period expires 14 days from the day on which you, or a third party indicated by you (other than the carrier), acquires physical possession of the goods.`
        },
        {
          title: '2. How to Return',
          content: `To exercise your right of withdrawal:

1. Contact us at returns@estzone.eu or call +372 XXXX XXXX
2. Clearly state your decision to return (include order number)
3. We will provide return instructions and a return authorization
4. Ship the product back to us within 14 days of notification

You may use this model withdrawal form, but it is not obligatory.`
        },
        {
          title: '3. Return Conditions',
          content: `For a full refund, products must be:
- In original, unopened packaging (sealed products)
- Or in original condition with all accessories and manuals
- Not damaged beyond what is necessary to examine the product
- Returned with proof of purchase

Video games with opened seal cannot be returned unless defective.`
        },
        {
          title: '4. Return Shipping Costs',
          content: `- Standard returns: Customer pays return shipping
- Defective products: EstZone pays return shipping
- Wrong item received: EstZone pays return shipping

We recommend using tracked shipping for returns.`
        },
        {
          title: '5. Refund Process',
          content: `Once we receive and inspect the returned item:
- Refund processed within 14 days of receiving the return
- Refund issued to original payment method
- Shipping costs not refunded (unless product was defective)

You will receive email confirmation when refund is processed.`
        },
        {
          title: '6. Defective Products',
          content: `If you receive a defective product:
1. Contact us within 48 hours of delivery
2. Provide photos/description of the defect
3. We will arrange free return shipping
4. Choose: replacement or full refund

The 1-year warranty applies to all products.`
        },
        {
          title: '7. Non-Returnable Items',
          content: `The following cannot be returned under the right of withdrawal:
- Sealed video games if seal is broken
- Gift cards
- Personalized or customized items
- Items damaged by customer misuse`
        },
        {
          title: '8. Exchanges',
          content: `We do not offer direct exchanges. To exchange an item:
1. Return the original item for a refund
2. Place a new order for the desired item`
        },
        {
          title: '9. Contact for Returns',
          content: `For return inquiries:
Email: returns@estzone.eu
Phone: +372 XXXX XXXX

Business hours: Monday-Friday, 9:00-17:00 (EET)`
        }
      ]
    },
    shipping: {
      title: 'Shipping Policy',
      lastUpdated: 'Last updated: November 30, 2025',
      sections: [
        {
          title: '1. Delivery Areas',
          content: `We deliver to:
- Estonia (all areas including islands)
- Latvia
- Lithuania
- Finland
- Other EU countries

For deliveries outside the EU, please contact us for availability and rates.`
        },
        {
          title: '2. Shipping Partners',
          content: `We work with trusted delivery partners:

Omniva (Estonian Post)
- Parcel terminals across Estonia, Latvia, Lithuania
- Home/office delivery
- Tracking available

DPD
- Parcel terminals
- Home/office delivery
- International shipping
- Real-time tracking`
        },
        {
          title: '3. Delivery Times',
          content: `Estimated delivery times from order confirmation:

Estonia:
- Parcel terminal: 1-2 business days
- Home delivery: 1-3 business days

Latvia & Lithuania:
- Parcel terminal: 2-3 business days
- Home delivery: 2-4 business days

Finland:
- Home delivery: 3-5 business days

Other EU:
- 5-10 business days

Note: Delivery times may vary during peak seasons or due to circumstances beyond our control.`
        },
        {
          title: '4. Shipping Costs',
          content: `Shipping costs are calculated at checkout based on:
- Delivery method (parcel terminal or home delivery)
- Destination country
- Order weight and size

FREE SHIPPING on orders over €100 within Estonia!

Current rates (Estonia):
- Omniva parcel terminal: €2.99
- Omniva home delivery: €4.99
- DPD parcel terminal: €3.49
- DPD home delivery: €5.99`
        },
        {
          title: '5. Order Processing',
          content: `- Orders placed before 14:00 (EET) on business days are processed same day
- Orders after 14:00 or on weekends/holidays are processed next business day
- You will receive tracking information via email once shipped`
        },
        {
          title: '6. Parcel Terminal Pickup',
          content: `For parcel terminal deliveries:
- You will receive SMS/email when parcel arrives
- Pickup within 7 days (Omniva) or 5 days (DPD)
- After expiry, parcel returns to us
- Bring ID for pickup if required`
        },
        {
          title: '7. Home Delivery',
          content: `For home deliveries:
- Courier will contact you before delivery
- If not home, redelivery will be attempted
- Some couriers offer delivery to neighbor or safe place
- Check tracking for specific delivery instructions`
        },
        {
          title: '8. Damaged or Lost Packages',
          content: `If your package arrives damaged:
- Note damage when signing for delivery
- Take photos of damaged packaging and contents
- Contact us within 48 hours at support@estzone.eu

For lost packages, contact us after 7 days from estimated delivery. We will investigate with the carrier.`
        },
        {
          title: '9. Contact',
          content: `For shipping inquiries:
Email: support@estzone.eu
Phone: +372 XXXX XXXX

Include your order number for faster assistance.`
        }
      ]
    }
  },
  et: {
    terms: {
      title: 'Kasutustingimused',
      lastUpdated: 'Viimati uuendatud: 30. november 2025',
      sections: [
        {
          title: '1. Üldteave',
          content: `Need kasutustingimused ("Tingimused") reguleerivad EstZone OÜ veebisaidi ja teenuste kasutamist aadressil www.estzone.eu ("Teenus"). Teenust kasutades nõustute nende tingimustega.

EstZone OÜ
Registrikood: 16XXXXXX
Aadress: Tallinn, Eesti
E-post: info@estzone.eu
Telefon: +372 XXXX XXXX`
        },
        {
          title: '2. Tooted ja hinnad',
          content: `Kõik meie veebisaidil kuvatud hinnad sisaldavad 24% Eesti käibemaksu (KM), kui pole teisiti märgitud. Mugavuse huvides kuvatakse hindu nii eurodes kui USA dollarites. Euro hind on kõigi tehingute siduv hind.

Jätame endale õiguse hindu igal ajal muuta. Teie tellimusele kehtiv hind on ostmise hetkel kuvatud hind.`
        },
        {
          title: '3. Tellimused ja maksed',
          content: `Tellimust esitades teete pakkumise toodete ostmiseks. Jätame endale õiguse tellimust vastu võtta või tagasi lükata. Makse tuleb sooritada tellimuse esitamisel, kasutades ühte meie aktsepteeritud makseviisidest: Stripe, PayPal, Montonio või pangaülekanne.

Pärast edukat makset saadetakse tellimuse kinnituskiri. See kinnitus kujutab endast teie tellimuse vastuvõtmist ja moodustab siduva lepingu.`
        },
        {
          title: '4. Kohaletoimetamine',
          content: `Tarnime Eestisse, Lätti, Leetu ja teistesse EL riikidesse. Kohaletoimetamist teostavad Omniva ja DPD. Tarneajad on hinnangulised ja võivad varieeruda. Tüüpilised tarneajad:
- Eesti: 1-3 tööpäeva
- Läti/Leedu: 2-4 tööpäeva
- Teised EL riigid: 5-10 tööpäeva

Kahju risk läheb teile üle kättetoimetamisel. Palun kontrollige pakke kättesaamisel ja teatage kahjustustest viivitamatult.`
        },
        {
          title: '5. Taganemisõigus',
          content: `EL tarbijaõiguste direktiivi kohaselt on teil õigus 14 päeva jooksul alates kauba kättesaamisest ostust taganeda ilma põhjust esitamata. Selle õiguse kasutamiseks võtke meiega ühendust aadressil info@estzone.eu, märkides tellimuse numbri.

Tooted tuleb tagastada originaalseisundis ja -pakendis. Tagastamise saatmiskulud kannab klient, välja arvatud juhul, kui toode on defektne.`
        },
        {
          title: '6. Garantii',
          content: `Kõigil toodetel on 1-aastane garantii. See garantii katab tootmisvead, kuid ei kata kasutamisest, õnnetustest või tavapärasest kulumisest tingitud kahjustusi.

Garantiinõuete esitamiseks võtke ühendust meie klienditoega, esitades ostutõendi.`
        },
        {
          title: '7. Vastutuse piiramine',
          content: `EstZone OÜ ei vastuta kaudsete, juhuslike, eriliste, kaudsete ega karistuslike kahjude eest, mis tulenevad teenuse kasutamisest või teenuse kaudu ostetud toodetest.

Meie maksimaalne vastutus ei ületa nõude aluseks oleva toote ostuhinda.`
        },
        {
          title: '8. Intellektuaalomand',
          content: `Kogu selle veebisaidi sisu, sealhulgas tekst, graafika, logod, pildid ja tarkvara, on EstZone OÜ või selle sisu tarnijate omand ning on kaitstud autoriõiguse ja kaubamärgiseadustega.`
        },
        {
          title: '9. Kohaldatav õigus',
          content: `Neid tingimusi reguleerivad Eesti Vabariigi seadused. Vaidlused lahendatakse Eesti kohtutes. EL tarbijad võivad kasutada ka veebipõhist vaidluste lahendamise platvormi: https://ec.europa.eu/consumers/odr/`
        },
        {
          title: '10. Kontakt',
          content: `Nende tingimustega seotud küsimuste korral võtke meiega ühendust:
E-post: info@estzone.eu
Telefon: +372 XXXX XXXX
Aadress: Tallinn, Eesti`
        }
      ]
    },
    privacy: {
      title: 'Privaatsuspoliitika',
      lastUpdated: 'Viimati uuendatud: 30. november 2025',
      sections: [
        {
          title: '1. Vastutav töötleja',
          content: `EstZone OÜ ("meie", "meid") on teie isikuandmete eest vastutav andmetöötleja.

EstZone OÜ
Registrikood: 16XXXXXX
Aadress: Tallinn, Eesti
E-post: privacy@estzone.eu`
        },
        {
          title: '2. Kogutavad isikuandmed',
          content: `Kogume ja töötleme järgmisi isikuandmeid:
- Isikuandmed: nimi
- Kontaktandmed: e-posti aadress, telefoninumber, tarneaadress
- Tehinguandmed: tellimuste ajalugu, makseinfo (töödeldakse turvaliselt makseteenuse pakkujate poolt)
- Tehnilised andmed: IP-aadress, brauseri tüüp, seadme info
- Kasutusandmed: kuidas te meie veebisaiti kasutate
- Turundusandmed: teie eelistused turundusteadete saamiseks`
        },
        {
          title: '3. Kuidas me teie andmeid kasutame',
          content: `Kasutame teie isikuandmeid:
- Tellimuste töötlemiseks ja kohaletoimetamiseks
- Maksete haldamiseks ja pettuste ennetamiseks
- Tellimuse kinnituste ja tarneteadete saatmiseks
- Klienditeeninduse päringutele vastamiseks
- Turundusteadete saatmiseks (teie nõusolekul)
- Veebisaidi ja teenuste parandamiseks
- Seadusest tulenevate kohustuste täitmiseks`
        },
        {
          title: '4. Töötlemise õiguslik alus',
          content: `Töötleme teie andmeid järgmistel alustel:
- Leping: tellimuste täitmiseks vajalik
- Nõusolek: turundusteadete ja küpsiste jaoks
- Seadusest tulenev kohustus: maksu- ja raamatupidamisnõuded
- Õigustatud huvi: pettuste ennetamine, teenuste parandamine`
        },
        {
          title: '5. Andmete jagamine',
          content: `Jagame teie andmeid:
- Makseteenuse pakkujatega (Stripe, PayPal, Montonio) maksete töötlemiseks
- Tarnepartneritega (Omniva, DPD) tellimuste täitmiseks
- E-posti teenuse pakkujatega tehingumeilide jaoks
- Analüütika pakkujatega (anonüümitud andmetega)

Me ei müü teie isikuandmeid kolmandatele osapooltele.`
        },
        {
          title: '6. Andmete säilitamine',
          content: `Säilitame teie isikuandmeid nii kaua kui vajalik eesmärkide täitmiseks:
- Tellimusandmed: 7 aastat (raamatupidamise seadusest tulenev nõue)
- Turundusnõusolek: kuni tagasivõtmiseni
- Klienditoe andmed: 3 aastat pärast viimast kontakti`
        },
        {
          title: '7. Teie õigused (GDPR)',
          content: `GDPR alusel on teil õigus:
- Saada juurdepääs oma isikuandmetele
- Parandada ebatäpseid andmeid
- Kustutada oma andmed ("õigus olla unustatud")
- Piirata töötlemist
- Andmete ülekantavus
- Esitada vastuväiteid töötlemisele
- Võtta nõusolek tagasi

Nende õiguste kasutamiseks võtke ühendust: privacy@estzone.eu`
        },
        {
          title: '8. Küpsised',
          content: `Kasutame küpsiseid:
- Vajalikud küpsised: veebisaidi toimimiseks vajalikud
- Analüütika küpsised: et mõista, kuidas külastajad meie saiti kasutavad
- Turundusküpsised: reklaamide isikupärastamiseks

Küpsiste eelistusi saate hallata meie küpsiste nõusoleku bänneri kaudu.`
        },
        {
          title: '9. Andmeturve',
          content: `Rakendame asjakohaseid tehnilisi ja organisatsioonilisi meetmeid teie isikuandmete kaitsmiseks, sealhulgas krüpteerimist, turvalisi servereid ja juurdepääsu kontrolle.`
        },
        {
          title: '10. Kontakt',
          content: `Privaatsusega seotud küsimuste korral:
E-post: privacy@estzone.eu

Võite esitada kaebuse ka Andmekaitse Inspektsioonile: www.aki.ee`
        }
      ]
    },
    returns: {
      title: 'Tagastus- ja tagasimaksetingimused',
      lastUpdated: 'Viimati uuendatud: 30. november 2025',
      sections: [
        {
          title: '1. 14-päevane taganemisõigus',
          content: `EL tarbijaõiguste direktiivi 2011/83/EL kohaselt on teil õigus 14 päeva jooksul alates kauba kättesaamisest ostust taganeda ilma põhjust esitamata.

Taganemistähtaeg lõpeb 14 päeva möödumisel päevast, mil teie või teie poolt nimetatud kolmas isik (v.a vedaja) saab kauba füüsiliselt enda valdusesse.`
        },
        {
          title: '2. Kuidas tagastada',
          content: `Taganemisõiguse kasutamiseks:

1. Võtke meiega ühendust aadressil returns@estzone.eu või helistage +372 XXXX XXXX
2. Teatage selgelt oma otsusest tagastada (lisage tellimuse number)
3. Anname tagastamisjuhised ja tagastusloa
4. Saatke toode meile tagasi 14 päeva jooksul pärast teadet

Võite kasutada allolevat taganemisavalduse näidisvormi, kuid see ei ole kohustuslik.`
        },
        {
          title: '3. Tagastamistingimused',
          content: `Täieliku tagasimakse saamiseks peavad tooted olema:
- Originaalpakendis, avamata (suletud tooted)
- Või originaalseisundis koos kõigi tarvikute ja juhenditega
- Mitte kahjustatud rohkem, kui on vajalik toote ülevaatamiseks
- Tagastatud koos ostutõendiga

Avatud pitseriga videomänge ei saa tagastada, välja arvatud juhul, kui need on defektsed.`
        },
        {
          title: '4. Tagastamise saatmiskulud',
          content: `- Tavalised tagastused: klient maksab tagastamise saatmiskulud
- Defektsed tooted: EstZone maksab tagastamise saatmiskulud
- Vale toode saadetud: EstZone maksab tagastamise saatmiskulud

Soovitame tagastusteks kasutada jälgitavat saatmist.`
        },
        {
          title: '5. Tagasimakse protsess',
          content: `Pärast tagastatud toote kättesaamist ja kontrollimist:
- Tagasimakse töödeldakse 14 päeva jooksul pärast tagastuse saamist
- Tagasimakse tehakse algsele makseviisile
- Saatmiskulusid ei tagastata (välja arvatud juhul, kui toode oli defektne)

Saate e-kirja kinnituse, kui tagasimakse on töödeldud.`
        },
        {
          title: '6. Defektsed tooted',
          content: `Kui saate defektse toote:
1. Võtke meiega ühendust 48 tunni jooksul pärast kohaletoimetamist
2. Esitage fotod/kirjeldus defektist
3. Korraldame tasuta tagastussaatmise
4. Valige: asendus või täielik tagasimakse

Kõigile toodetele kehtib 1-aastane garantii.`
        },
        {
          title: '7. Mittetagastatavad tooted',
          content: `Taganemisõiguse alusel ei saa tagastada:
- Suletud videomänge, kui pitser on avatud
- Kinkekaarte
- Isikupärastatud või kohandatud tooteid
- Kliendi väärkasutusest kahjustatud tooteid`
        },
        {
          title: '8. Vahetused',
          content: `Me ei paku otseseid vahetusi. Toote vahetamiseks:
1. Tagastage algne toode tagasimakse saamiseks
2. Esitage uus tellimus soovitud tootele`
        },
        {
          title: '9. Tagastuste kontakt',
          content: `Tagastuspäringute korral:
E-post: returns@estzone.eu
Telefon: +372 XXXX XXXX

Tööaeg: esmaspäev-reede, 9:00-17:00 (EET)`
        }
      ]
    },
    shipping: {
      title: 'Tarnetingimused',
      lastUpdated: 'Viimati uuendatud: 30. november 2025',
      sections: [
        {
          title: '1. Tarnepiirkonnad',
          content: `Tarnime:
- Eesti (kõik piirkonnad, sealhulgas saared)
- Läti
- Leedu
- Soome
- Teised EL riigid

Väljaspool EL-i asuvate tarnete kohta võtke meiega ühendust kättesaadavuse ja hindade osas.`
        },
        {
          title: '2. Tarnepartnerid',
          content: `Teeme koostööd usaldusväärsete tarnepartneritega:

Omniva (Eesti Post)
- Pakiautomaadid üle Eesti, Läti, Leedu
- Kodu-/kontorikullerteenus
- Jälgimine saadaval

DPD
- Pakiautomaadid
- Kodu-/kontorikullerteenus
- Rahvusvaheline saatmine
- Reaalajas jälgimine`
        },
        {
          title: '3. Tarneajad',
          content: `Eeldatavad tarneajad alates tellimuse kinnitamisest:

Eesti:
- Pakiautomaat: 1-2 tööpäeva
- Kullerteenusega koju: 1-3 tööpäeva

Läti ja Leedu:
- Pakiautomaat: 2-3 tööpäeva
- Kullerteenusega koju: 2-4 tööpäeva

Soome:
- Kullerteenusega koju: 3-5 tööpäeva

Teised EL riigid:
- 5-10 tööpäeva

Märkus: Tarneajad võivad varieeruda tipphooaegadel või meie kontrolli alt väljas olevatel asjaoludel.`
        },
        {
          title: '4. Tarnekulud',
          content: `Tarnekulud arvutatakse kassas järgmiste kriteeriumide alusel:
- Tarneviis (pakiautomaat või kullerteenusega koju)
- Sihtriik
- Tellimuse kaal ja suurus

TASUTA TARNE tellimustel üle 100€ Eestis!

Praegused hinnad (Eesti):
- Omniva pakiautomaat: 2,99€
- Omniva kullerteenusega koju: 4,99€
- DPD pakiautomaat: 3,49€
- DPD kullerteenusega koju: 5,99€`
        },
        {
          title: '5. Tellimuste töötlemine',
          content: `- Tööpäevadel enne kella 14:00 (EET) esitatud tellimused töödeldakse samal päeval
- Pärast kella 14:00 või nädalavahetustel/pühadel esitatud tellimused töödeldakse järgmisel tööpäeval
- Saate jälgimisinfo e-postiga pärast saatmist`
        },
        {
          title: '6. Pakiautomaadist kättesaamine',
          content: `Pakiautomaadi tarnete puhul:
- Saate SMS-i/e-kirja, kui pakk saabub
- Kättesaamine 7 päeva jooksul (Omniva) või 5 päeva jooksul (DPD)
- Pärast tähtaja möödumist tagastatakse pakk meile
- Võtke vajadusel kättesaamisel kaasa isikut tõendav dokument`
        },
        {
          title: '7. Kullerteenusega koju',
          content: `Kullerteenusega koju tarnete puhul:
- Kuller võtab teiega enne kohaletoimetamist ühendust
- Kui te pole kodus, proovitakse uuesti kohale toimetada
- Mõned kullerid pakuvad kohaletoimetamist naabrile või turvalisse kohta
- Kontrollige jälgimisinfost konkreetseid kohaletoimetamise juhiseid`
        },
        {
          title: '8. Kahjustatud või kadunud pakid',
          content: `Kui teie pakk saabub kahjustatuna:
- Märkige kahjustus kohaletoimetamise vastuvõtmisel
- Tehke fotod kahjustatud pakendist ja sisust
- Võtke meiega ühendust 48 tunni jooksul aadressil support@estzone.eu

Kadunud pakkide korral võtke meiega ühendust 7 päeva pärast eeldatavat kohaletoimetamist. Uurime vedajaga.`
        },
        {
          title: '9. Kontakt',
          content: `Tarnepäringute korral:
E-post: support@estzone.eu
Telefon: +372 XXXX XXXX

Kiirema abi saamiseks lisage oma tellimuse number.`
        }
      ]
    }
  }
};

export default function Legal({ type }: LegalPageProps) {
  const { language } = useLanguage();
  const content = legalContent[language][type];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-6 md:p-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid={`heading-${type}`}>
                {content.title}
              </h1>
              <p className="text-muted-foreground mb-8" data-testid={`text-last-updated-${type}`}>
                {content.lastUpdated}
              </p>
              
              <Separator className="mb-8" />
              
              <div className="space-y-8">
                {content.sections.map((section, index) => (
                  <section key={index} data-testid={`section-${type}-${index}`}>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      {section.title}
                    </h2>
                    <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </div>
                  </section>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
