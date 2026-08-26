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

## Omezení

- Podstránka o interiérech zámku zatím neexistuje; návrhy jsou odložené v `src/mocks/`
- Fakta o akci (kapacita, formulace financování) odpovídají podkladům DoMore ze srpna 2026 a před většími oznámeními je nutné je ověřit
