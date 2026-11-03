# Memorijal „Đelac”: upute za postavljanje

## Datoteke

| Datoteka | Čemu služi |
|---|---|
| `index.html` | **Web stranica** za sve: opće informacije, prijava ekipa, ekipe, ždrijeb i tablice, raspored i rezultati, eliminacije, strijelci |
| `admin.html` | **Aplikacija za organizatore**: potvrda i upis ekipa i igrača, ždrijeb, upis rezultata i strijelaca, postavke |
| `config.js` | Ovdje upisuješ podatke o bazi (jedina datoteka koju trebaš mijenjati) |
| `core.js`, `style.css` | Zajednička logika i izgled, ne treba ih dirati |
| `supabase.sql` | Skripta koja kreira bazu |

Dok `config.js` nije popunjen, sve radi u **demo načinu**: podaci se spremaju samo u tvom pregledniku. To je dobro za isprobavanje. U demo načinu `admin.html` ima i gumbe „Dodaj 12 primjer ekipa” i „Simuliraj rezultate”.

## 1. Baza (Supabase, besplatno)

1. Napravi račun na **supabase.com** i klikni **New project**. Za regiju odaberi Frankfurt (EU).
2. Otvori **SQL Editor → New query**, zalijepi cijeli `supabase.sql` i **na dnu promijeni** `organizator@primjer.hr` u svoj e-mail. Zatim klikni **Run**.
3. Otvori **Authentication → Users → Add user → Create new user**. Upiši isti e-mail i lozinku po izboru te uključi *Auto Confirm User*.
4. Preporuka: **Authentication → Sign In / Providers** i isključi *Allow new users to sign up*. Admin prava ionako ima samo e-mail iz koraka 2.
5. Otvori **Project Settings → API** (ili *Data API*) i kopiraj **Project URL** i ključ **anon public**.

## 2. Poveži stranicu s bazom

Otvori `config.js` i upiši:

```js
window.TURNIR_CONFIG = {
  SUPABASE_URL: "https://tvojprojekt.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi..."
};
```

Anon ključ smije biti javan. Zaštitu podataka rade pravila u bazi: posjetitelji mogu samo čitati i poslati prijavu, a mijenjati može samo organizator. Brojeve mobitela i e-mailove ekipa vidi samo organizator.

## 3. Objavi na GitHub Pages (besplatno)

1. Na github.com klikni **New repository** i daj mu ime, npr. `turnir-djelac`. Repozitorij mora biti **Public** (GitHub Pages je na besplatnom računu samo za javne repozitorije).
2. Klikni **Add file → Upload files**, povuci sve datoteke iz zipa (`index.html`, `admin.html`, `config.js`, `core.js`, `style.css`, ostale po želji) i klikni **Commit changes**. Datoteke moraju biti u korijenu repozitorija, ne u podmapi.
3. Otvori **Settings → Pages**. Pod *Source* odaberi **Deploy from a branch**, zatim granu `main` i mapu `/ (root)`, pa klikni **Save**.
4. Za minutu-dvije stranica je na adresi `https://TVOJE-KORISNICKO-IME.github.io/turnir-djelac/`.

- Web stranica: `https://TVOJE-KORISNICKO-IME.github.io/turnir-djelac/`
- Aplikacija za organizatore: `https://TVOJE-KORISNICKO-IME.github.io/turnir-djelac/admin.html` (link je i u podnožju stranice)

Promjene (npr. upis Supabase podataka u `config.js`) radiš izravno na GitHubu: otvori datoteku, klikni ikonu olovke, izmijeni i *Commit changes*. Stranica se osvježi za minutu-dvije.

`supabase.sql` u repozitoriju ne smeta (nema tajnih podataka), ali ga ne moraš ni stavljati.

Vlastitu domenu (npr. `turnir-djelac.hr`) možeš dodati u *Settings → Pages → Custom domain*.

## 4. Tijek turnira

1. **Postavke**: datum, mjesto, kotizacija, kontakt, pravila, format (skupine + eliminacije, kup ili liga), broj skupina, satnica i broj terena.
2. **Prijave**: ekipe se prijavljuju preko stranice i odmah se vide kao „na čekanju”. U aplikaciji ih potvrđuješ, a možeš dodati ekipu i sam te urediti igrače. Kvačica „nositelj” raspoređuje jače ekipe u različite skupine.
3. **Ždrijeb**: jedan klik raspoređuje ekipe i automatski slaže cijeli raspored s terminima i terenima. Prijave se zatvaraju.
4. **Dan turnira**: u kartici *Utakmice* upisuješ rezultat i pritišćeš **✓ Završi**. Gumb **▶ Počni** stavlja utakmicu u „uživo”. Pod *Detalji* su strijelci, kazneni udarci i promjena termina. Tablice, prolaznici u eliminacije, kostur i lista strijelaca računaju se sami, a stranica se posjetiteljima osvježava sama.
5. Ako kasnite ili promijeniš početak: *Ždrijeb → Ponovno složi satnicu* iznova računa vremena, a rezultati ostaju. Za kratke obavijesti posjetiteljima koristi polje *Obavijest* u postavkama.

## Slike (mapa `slike`)

Mapu `slike` prenesi na GitHub zajedno s ostalim datotekama (na GitHubu: **Add file → Upload files** i povuci cijelu mapu). U njoj je:

| Datoteka | Gdje se prikazuje |
|---|---|
| `logo.png` | grb u zaglavlju i na naslovnici |
| `naslovna.jpg` | fotografija tribine iza naslova |
| `sal-grad.jpg` | šal sa zidinama, iznad „O memorijalu” |
| `sal-1990.jpg` | šal iznad podnožja na svim stranicama |
| `transparent.jpg` | transparent ispod naslovnice i na vrhu podstranica |
| `galerija-1.jpg` … `galerija-8.jpg` | galerija „S tribine” |

Sliku zamijeniš tako da preneseš novu pod istim imenom. Za galeriju dodaj `galerija-3.jpg`, `galerija-4.jpg` itd. i one se same pojave. Ako neke slike nema, taj dio stranice se jednostavno ne prikaže.

Boje mijenjaš na dnu `style.css` (`--orange`, `--blue`).

## Napomene

- Besplatni Supabase projekt **pauzira se nakon 7 dana bez aktivnosti**. Ako je stranica dugo mirovala, prijavi se na supabase.com i klikni *Restore*. Tijekom prijava i turnira to nije problem.
- Kod jednakog broja bodova odlučuju: međusobni susret, gol-razlika, više postignutih golova.
- Ako dvoje organizatora istodobno mijenja isti dio, vrijedi zadnje spremanje. Najbolje je da rezultate upisuje jedna osoba.
