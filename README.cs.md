[English](README.md) | [Čeština](README.cs.md)

# v4air-site

Veřejný web akce V4AIR (V4 AI researchers meetup): bezplatné třídenní adaptivní setkání pro začínající výzkumníky v oblasti AI ze zemí V4, financované Mezinárodním visegrádským fondem. Koná se na zámku Kostelec u Prahy 28.–30. 4. 2027.

Web je jednostránková aplikace v Reactu. Veškeré texty vycházejí z podkladů projektu DoMore; tlačítko přihlášky vede na ostrý Google formulář.

## Co web umí

- Celoobrazovkový hero se zámeckou fotografií podle motivu (den/soumrak) a barevnou identitou plakátu (šalvějový papír, inkoust, petrolejová, oranžový přechod)
- Odpočet do otevření přihlášek (1. 9. 2026) ve stylu mechanického vlajkového displeje; po otevření se přepne do stavu s odpočtem uzávěrky (15. 1. 2027)
- Sekce „Should you apply?" se synchronizovaně rotujícími dvojicemi obor/vztah k AI a postupným odhalením odpovědi
- Přišpendlená sekvence čtyř kroků přihlášky se svítícím vláknem průběhu (na malých obrazovkách a při omezeném pohybu statická varianta)
- Noční časová osa („The road to Kostelec") s animovanou postavou, siluetou zámku a texty řízenými datem
- FAQ s přímými odkazy a hromadným rozbalením; stěna partnerských univerzit s popisky zemí; patička s logotypem, který se rozkládá z V4AIR na celý název
- Přichycená navigace: logotyp se při scrollu skládá a rozkládá, tlačítko Apply nese stav přihlašovacího okna
- Světlý (papírový) a tmavý motiv, uložený v localStorage

## Instalace

Vyžaduje Node 20+.

```
npm install
npm run dev      # vývojový server
npm run build    # typová kontrola + produkční build do dist/
```

## Použití

- `?debug` přidá simulátor data (posuvník + pole s datem) a přepínač titulkového písma pro náhled stavů řízených datem
- `?mocks` zobrazí interní galerii návrhů místo webu

## Technologie

- Vite, React 19, TypeScript, Tailwind v4 (`@tailwindcss/vite`)
- Motion (`motion/react`) s komponentami Motion Primitives (text-loop, text-morph, text-effect, in-view, animated-group, text-shimmer) a flip-clock z Watermelon UI
- Písma: Aileron (titulky), Satoshi (text, vlastní hosting), JetBrains Mono

## Formuláře

Přihlašovací a nominační formuláře jsou součástí tohoto repozitáře a nasazují se s webem: `public/apply/` a `public/nominate/` jsou čisté HTML, CSS a JavaScript bez buildu, dostupné na `/apply/` a `/nominate/`. Každé tlačítko Apply na webu vede na `/apply/`; panel s přihláškou odkazuje i na `/nominate/`.

- `forms/survey-spec.md`: specifikace, každá otázka s ID, zněním, možnostmi a podmínkami, plus chování, které musí backend zajistit (oddíly 5.1 až 5.17). Třetí nástroj, formulář po přijetí, je tam specifikován a zamražen.
- `forms/form-a-preview.html`, `forms/form-b-preview.html`: kontrolní pohledy na oba formuláře s ID proměnných, účastnickým režimem s vývojářskými ovládacími prvky (`j` a `k` přepínají obrazovky) a komentáři s exportem do markdownu. Otevřete přímo v prohlížeči.
- `public/apply/index.html`, `public/nominate/index.html`: formuláře tak, jak je vidí respondenti. Validace při opuštění pole a při stisku Další, automatické ukládání v prohlížeči, vážený ukazatel postupu se zbývajícím časem, ID odpovědí (`V4A-`, `V4N-`). „Dev controls“ v patičce nebo `?dev` v adrese přidá volný pohyb. Zatím se nic nikam neodesílá.

### Otevřené body k formulářům

Obsah, pro organizátory:

1. Texty souhlasů pro přihlášku (A8) a nominační formulář (B6), doba uchování a odkaz na zásady ochrany údajů. Obojí jsou zástupné texty v hranatých závorkách.
2. Data a čísla v textech: „Everyone hears from us by February“, „We will write to them within [N] days“ a případně rok u uzávěrky 15. ledna.
3. Dosud nepotvrzené texty: závěrečná věta obrazovky „What you are looking for“, dvě nápovědy k ceně účasti, čtyři příklady úrovní zkušeností a nápověda k Not-Just-Posters.
4. Pilot: pět lidí vyplní přihlášku na vlastních zařízeních, alespoň dva na telefonu, s měřením času na obrazovku (spec 5.14). Podle výsledků přepočítat minuty na obrazovku ve spec 5.1.

Stavba, aby formuláře fungovaly naostro:

1. Úložiště: Google tabulka s webovou aplikací v Apps Scriptu (ukládání při stisku Další, obnovení podle tokenu, LockService pro ID), nebo databáze a API. V tomto měřítku tabulka stačí.
2. E-mail: odkaz pro pokračování s ID přihlášky, potvrzení pro oba formuláře, pozvánka nominovaným. Pozor na kvótu MailApp, pokud je posílá Apps Script.
3. Administrace: počty podle zemí a kariérních stupňů, matice pokrytí „chci se naučit“ proti „mohl bych přednášet“, seznam nominovaných s detekcí duplicit, export (spec 5.11 a 5.12).
4. Uzavření k uzávěrce a mazání po uplynutí doby uchování.

## Autorství fotografií

Fotografie zámku v galerii jsou odvozeniny snímků z Wikimedia Commons pod licencemi CC BY-SA; autory a licence uvádí [ATTRIBUTION.md](ATTRIBUTION.md).

## Omezení

- Podstránka o interiérech zámku zatím neexistuje; návrhy jsou odložené v `src/mocks/`
- Fakta o akci (kapacita, formulace financování) odpovídají podkladům DoMore ze srpna 2026 a před většími oznámeními je nutné je ověřit
