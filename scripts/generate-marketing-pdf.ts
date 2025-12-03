import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'EstZone Turundus- ja Reklaamtekstid',
    Author: 'AVERING GRUPP OÜ',
    Subject: 'Marketing Materials',
  }
});

const outputPath = path.join(process.cwd(), 'EstZone_Reklaamtekstid.pdf');
doc.pipe(fs.createWriteStream(outputPath));

const GOLD = '#D4AF37';
const DARK = '#1a1a1a';

function addTitle(text: string) {
  doc.moveDown(1);
  doc.fontSize(24).fillColor(GOLD).text(text, { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(GOLD).stroke();
  doc.moveDown(1);
}

function addSectionTitle(text: string) {
  doc.moveDown(0.8);
  doc.fontSize(16).fillColor(GOLD).text(text);
  doc.moveDown(0.3);
}

function addSubTitle(text: string) {
  doc.fontSize(12).fillColor('#888888').text(text);
  doc.moveDown(0.3);
}

function addText(text: string) {
  doc.fontSize(10).fillColor('#333333').text(text);
}

function addCodeBlock(text: string) {
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#222222').font('Courier').text(text);
  doc.font('Helvetica');
  doc.moveDown(0.5);
}

function checkPageBreak(minSpace: number = 150) {
  if (doc.y > 700) {
    doc.addPage();
  }
}

doc.fontSize(32).fillColor(GOLD).text('ESTZONE', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(14).fillColor('#666666').text('Turundus- ja Reklaamtekstid', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(10).fillColor('#888888').text('Marketing & Advertising Texts', { align: 'center' });
doc.moveDown(2);

doc.fontSize(10).fillColor('#555555').text('AVERING GRUPP OÜ', { align: 'center' });
doc.text('Reg: 16236733', { align: 'center' });
doc.text('Pärnu mnt 31, Tallinn', { align: 'center' });
doc.text('www.estzone.eu', { align: 'center' });

doc.addPage();

addTitle('FACEBOOK / INSTAGRAM');

addSectionTitle('Feed Post (Tavaline postitus) - EESTI');
addCodeBlock(`PS5, Xbox ja VR prillid nüüd Eestis!

Unista uuest mängukonsoolist? EstZone toob sulle parimad gaming tooted otse koju! PlayStation 5, Xbox Series X, Meta Quest 3 ja palju muud. Kiire tarne Omniva ja DPD-ga. 1-aastane garantii kõigile toodetele. Kasuta koodi GAMER10 ja saa -10% esimeselt ostult!

#EstZone #Gaming #PS5 #Xbox #VR #Eesti #Mängud`);

checkPageBreak();
addSectionTitle('Feed Post - ENGLISH');
addCodeBlock(`PS5, Xbox & VR Headsets - Now in Estonia!

Dreaming of a new gaming console? EstZone brings you the best gaming products delivered to your door! PlayStation 5, Xbox Series X, Meta Quest 3 and much more. Fast delivery with Omniva & DPD. 1-year warranty on all products. Use code GAMER10 for 10% off your first order!

#EstZone #Gaming #PS5 #Xbox #VR #Estonia #Gamers`);

checkPageBreak();
addSectionTitle('Stories / Reels - EESTI');
addCodeBlock(`FLASH SALE!

Kuni -30% gaming toodetelt! PS5, Xbox, VR prillid. Kiire tarne üle Eesti. Ära jää maha!

Nupp: Vaata pakkumisi

#FlashSale #Gaming #EstZone`);

checkPageBreak();
addSectionTitle('Stories / Reels - ENGLISH');
addCodeBlock(`FLASH SALE!

Up to -30% on gaming products! PS5, Xbox, VR headsets. Fast delivery across Estonia. Don't miss out!

Button: See Deals

#FlashSale #Gaming #EstZone`);

checkPageBreak();
addSectionTitle('Carousel (Mitu pilti) - EESTI');
addCodeBlock(`Eesti #1 Gaming Pood

800+ toodet laos:
- Konsoolid
- VR prillid
- Kontrollerid
- Gaming toolid
- Peakomplektid

Tasuta tarne üle 100€. VIP programm - kogu punkte ja saa allahindlusi!

Nupp: Avasta valikut

#EstZone #GamingEesti #PlayStation #Xbox #Nintendo`);

checkPageBreak();
addSectionTitle('Carousel - ENGLISH');
addCodeBlock(`Estonia's #1 Gaming Store

800+ products in stock:
- Consoles
- VR Headsets
- Controllers
- Gaming Chairs
- Headsets

Free shipping over €100. VIP program - earn points and get discounts!

Button: Explore Now

#EstZone #GamingEstonia #PlayStation #Xbox #Nintendo`);

doc.addPage();

addTitle('TIKTOK');

addSectionTitle('Video 1: Hook/POV - EESTI');
addCodeBlock(`Hook (algus): "POV: Sa leiad Eesti parima gaming poe..."

Tekst: EstZone - 800+ toodet, kiire tarne, 1-aastane garantii. PS5 laos! Link bios!

#EstZone #GamingEesti #PS5 #Xbox #fyp #eesti`);

checkPageBreak();
addSectionTitle('Video 1: Hook/POV - ENGLISH');
addCodeBlock(`Hook (start): "POV: You just found Estonia's best gaming store..."

Text: EstZone - 800+ products, fast delivery, 1-year warranty. PS5 in stock! Link in bio!

#EstZone #GamingEstonia #PS5 #Xbox #fyp #gaming`);

checkPageBreak();
addSectionTitle('Video 2: Unboxing - EESTI');
addCodeBlock(`Hook (algus): "See tuli täna postiga..."

Tekst: Uus PS5 EstZone'ist! Tellisin eile, täna juba käes. Uskumatu!

#unboxing #PS5 #EstZone #gaming #eesti #fyp`);

checkPageBreak();
addSectionTitle('Video 2: Unboxing - ENGLISH');
addCodeBlock(`Hook (start): "This just arrived in the mail..."

Text: New PS5 from EstZone! Ordered yesterday, already here. Insane!

#unboxing #PS5 #EstZone #gaming #estonia #fyp`);

checkPageBreak();
addSectionTitle('Video 3: Deal Alert - EESTI');
addCodeBlock(`Hook (algus): "JOOKSE! Kuni -30% gaming tooted!"

Tekst: EstZone flash sale on käimas. VR prillid, kontrollerid, konsoolid. Link bios enne kui lõppeb!

#sale #gaming #EstZone #deals #eesti #fyp`);

checkPageBreak();
addSectionTitle('Video 3: Deal Alert - ENGLISH');
addCodeBlock(`Hook (start): "RUN! Up to -30% gaming products!"

Text: EstZone flash sale is live. VR headsets, controllers, consoles. Link in bio before it ends!

#sale #gaming #EstZone #deals #estonia #fyp`);

doc.addPage();

addTitle('DISCORD');

addSectionTitle('Eesti Gaming Serveritesse');
addCodeBlock(`Tere, mängurid!

Tahtsime tutvustada EstZone'i - Eesti oma gaming e-poodi!

Mida pakume:
- 800+ gaming toodet (konsoolid, VR, kontrollerid, tarvikud)
- PS5, Xbox Series X, Nintendo Switch, Meta Quest laos
- Kiire tarne üle Eesti (1-3 päeva)
- 1-aastane garantii KÕIGELE
- VIP programm - teenite punkte iga ostuga

Serveri liikmetele: Kasutage koodi DISCORD10 ja saate -10% esimeselt ostult!

Link: https://www.estzone.eu

GG ja head mängimist!`);

doc.addPage();

addTitle('REDDIT');

addSectionTitle('r/Eesti');
addSubTitle('Pealkiri: [Eesti] Uus gaming e-pood - EstZone.eu');
addCodeBlock(`Tere r/Eesti!

Avasime hiljuti EstZone.eu - gaming e-poe, mis keskendub Eesti turule.

Mida leiab:
- Mängukonsoolid (PS5, Xbox, Switch)
- VR headsetid (Quest 3, PSVR2)
- Kontrollerid ja tarvikud
- Gaming toolid

Meie plussid:
- Kõik hinnad sisaldavad käibemaksu
- Tarne Omniva/DPD-ga 1-3 päevaga
- 1-aastane garantii
- Eestikeelne tugi

Kui kellelgi küsimusi, vastan hea meelega!

PS: Redditi kasutajatele kood REDDIT10 = -10% esimene ost`);

checkPageBreak();
addSectionTitle('r/gaming (English)');
addSubTitle('Title: [Estonia] New gaming store - EstZone.eu');
addCodeBlock(`Hey r/gaming!

Just wanted to share a new gaming store serving the Baltic region - EstZone.eu

What we have:
- Gaming consoles (PS5, Xbox Series X, Switch)
- VR headsets (Quest 3, PSVR2)
- Controllers and accessories
- Gaming chairs and desks

Why choose us:
- Fast delivery in Estonia/Baltics
- 1-year warranty on everything
- Prices include VAT
- English support available

For Redditors: Use code REDDIT10 for 10% off first order!

Happy to answer any questions.`);

doc.addPage();

addTitle('HINNAVAATLUS / KUULUTUSED');

addSectionTitle('Kuulutus 1: Üldine poe reklaam');
addSubTitle('Pealkiri: EstZone - Premium Gaming Pood | PS5, Xbox, VR, Kontrollerid');
addSubTitle('Kategooria: Arvutid ja IT > Mängud');
addCodeBlock(`EstZone - Eesti usaldusväärne gaming e-pood!

800+ toodet laos:
- Mängukonsoolid (PS5, Xbox Series X/S, Nintendo Switch)
- VR prillid (Meta Quest 3, PSVR2)
- Kontrollerid (DualSense, Xbox, Pro kontrollerid)
- Gaming toolid ja lauad
- Peakomplektid (Razer, SteelSeries, Logitech)
- Tarvikud ja lisaseadmed

Miks valida EstZone?
- 1-aastane garantii kõigile toodetele
- Kiire tarne Omniva ja DPD-ga (1-3 tööpäeva)
- Tasuta tarne üle 100€
- Turvalised maksed (kaart, järelmaks, pangalink)
- VIP kliendiprogramm - kogu punkte ja saa allahindlusi

Veebipood: www.estzone.eu
AVERING GRUPP OÜ | Reg: 16236733 | Pärnu mnt 31, Tallinn`);

checkPageBreak();
addSectionTitle('Kuulutus 2: PlayStation fookus');
addSubTitle('Pealkiri: PlayStation 5 (PS5) Konsoolid ja Tarvikud | EstZone');
addSubTitle('Kategooria: Arvutid ja IT > Mängukonsoolid');
addCodeBlock(`PlayStation 5 konsoolid ja originaaltarvikud EstZone'ist!

Laos:
- PS5 Digital Edition
- PS5 Disc Edition
- PS5 Slim versioonid
- DualSense kontrollerid (erinevad värvid)
- PlayStation VR2
- Laadimisalused ja peakomplektid

Kõik tooted 1-aastase garantiiga!
Tarne 1-3 tööpäeva Omniva/DPD-ga.

www.estzone.eu`);

doc.addPage();

addTitle('GOOGLE ADS');

addSectionTitle('Reklaam 1 - EESTI');
addCodeBlock(`Pealkiri 1: EstZone - Mängurid
Pealkiri 2: PS5, Xbox, VR Prillid
Pealkiri 3: Kiire Tarne Eestis
Kirjeldus 1: Osta mängukonsoolid, VR-prillid ja kontrollerid. 800+ toodet, 1-aastane garantii. Tasuta tarne üle 100€!
Kirjeldus 2: Premium gaming pood Eestis. PlayStation 5, Xbox Series X, Nintendo Switch, Meta Quest. Turvalised maksed.`);

checkPageBreak();
addSectionTitle('Reklaam 2 - EESTI');
addCodeBlock(`Pealkiri 1: PS5 & Xbox Eestis
Pealkiri 2: VR Prillid Laos
Pealkiri 3: -30% Allahindlus
Kirjeldus 1: PlayStation 5, Xbox Series X laos! Kiire tarne Omniva ja DPD-ga. Maksa järelmaksuga või kaardiga.
Kirjeldus 2: Meta Quest 3, PSVR2 ja rohkem. Eesti usaldusväärne gaming pood. Registrikood: 16236733.`);

checkPageBreak();
addSectionTitle('Reklaam 3 - EESTI');
addCodeBlock(`Pealkiri 1: Gaming Tarvikud
Pealkiri 2: Kontrollerid, Toolid
Pealkiri 3: Soodne Hind
Kirjeldus 1: Razer, SteelSeries, Logitech kontrollerid ja peakomplektid. Gaming toolid profidele. Osta kohe!
Kirjeldus 2: 800+ gaming toodet. VIP kliendiprogramm. Koguge punkte ja saage allahindlusi. EstZone.eu`);

checkPageBreak();
addSectionTitle('Ad 1 - ENGLISH');
addCodeBlock(`Headline 1: EstZone Gaming
Headline 2: PS5, Xbox, VR Headsets
Headline 3: Fast Delivery Estonia
Description 1: Shop gaming consoles, VR headsets & controllers. 800+ products, 1-year warranty. Free shipping over €100!
Description 2: Premium gaming store in Estonia. PlayStation 5, Xbox Series X, Nintendo Switch, Meta Quest. Secure payments.`);

checkPageBreak();
addSectionTitle('Ad 2 - ENGLISH');
addCodeBlock(`Headline 1: PS5 & Xbox In Stock
Headline 2: VR Headsets Available
Headline 3: Up to -30% Off
Description 1: PlayStation 5, Xbox Series X in stock! Fast delivery with Omniva & DPD. Pay with card or installments.
Description 2: Meta Quest 3, PSVR2 and more. Estonia's trusted gaming store. Business reg: 16236733.`);

checkPageBreak();
addSectionTitle('Ad 3 - ENGLISH');
addCodeBlock(`Headline 1: Gaming Accessories
Headline 2: Controllers & Chairs
Headline 3: Best Prices
Description 1: Razer, SteelSeries, Logitech controllers & headsets. Gaming chairs for pros. Shop now at EstZone!
Description 2: 800+ gaming products. VIP loyalty program. Earn points and get discounts. Visit EstZone.eu`);

doc.addPage();

addTitle('SOODUSKOODID');

doc.moveDown(0.5);
doc.fontSize(12).fillColor('#333333').text('Kasuta neid koode erinevatel platvormidel:');
doc.moveDown(1);

const codes = [
  { code: 'GAMER10', discount: '-10%', platform: 'Facebook / Instagram' },
  { code: 'DISCORD10', discount: '-10%', platform: 'Discord serverid' },
  { code: 'REDDIT10', discount: '-10%', platform: 'Reddit' },
  { code: 'TIKTOK10', discount: '-10%', platform: 'TikTok' },
];

codes.forEach(item => {
  doc.fontSize(14).fillColor(GOLD).text(item.code, { continued: true });
  doc.fontSize(11).fillColor('#333333').text(`  ${item.discount}  -  ${item.platform}`);
  doc.moveDown(0.5);
});

doc.moveDown(1);
doc.fontSize(10).fillColor('#888888').text('NB! Need koodid tuleb luua admin paneelis: /admin/coupons', { align: 'center' });

doc.addPage();

addTitle('FIRMA ANDMED');

doc.moveDown(1);
doc.fontSize(12).fillColor('#333333');
doc.text('Firma: AVERING GRUPP OÜ');
doc.moveDown(0.3);
doc.text('Registrikood: 16236733');
doc.moveDown(0.3);
doc.text('Aadress: Pärnu mnt 31, Tallinn, 10119');
doc.moveDown(0.3);
doc.text('Riik: Eesti / Estonia');
doc.moveDown(0.3);
doc.text('Veebileht: www.estzone.eu');

doc.moveDown(2);
doc.fontSize(10).fillColor('#888888').text('Dokument genereeritud: ' + new Date().toLocaleDateString('et-EE'), { align: 'center' });

doc.end();

console.log('PDF genereeritud: ' + outputPath);
