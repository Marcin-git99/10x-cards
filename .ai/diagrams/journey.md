# Diagram podróży użytkownika - 10x-cards

<user_journey_analysis>

## 1. Ścieżki użytkownika z PRD

### US-001: Rejestracja konta
- Nowy użytkownik → Formularz rejestracji → Walidacja → Konto aktywne → Zalogowany

### US-002: Logowanie
- Zarejestrowany użytkownik → Formularz logowania → Weryfikacja → Zalogowany
- Zapomniałem hasła → Reset hasła → Email → Nowe hasło

### US-003: Generowanie fiszek (publiczne)
- Dowolny użytkownik → Wklejenie tekstu → Generowanie AI → Propozycje fiszek

### US-004: Zatwierdzanie propozycji
- Przegląd propozycji → Edycja/Zatwierdzenie → Próba zapisu
- Niezalogowany → Przekierowanie do logowania
- Zalogowany → Zapis do bazy

### US-005, US-006, US-007: Zarządzanie fiszkami (chronione)
- Zalogowany → Moje fiszki → Edycja/Usuwanie/Tworzenie

### US-008: Sesja nauki (chroniona)
- Zalogowany → Sesja nauki → Algorytm powtórek → Ocena

### US-009: Bezpieczny dostęp
- Próba dostępu do chronionych zasobów bez logowania → Przekierowanie

## 2. Główne podróże

| Podróż | Stan początkowy | Stan końcowy |
|--------|-----------------|--------------|
| Rejestracja | Nowy użytkownik | Zalogowany |
| Logowanie | Niezalogowany | Zalogowany |
| Generowanie | Dowolny | Propozycje fiszek |
| Zapis fiszek | Zalogowany | Moje fiszki |
| Nauka | Zalogowany | Sesja zakończona |

## 3. Punkty decyzyjne

- Czy użytkownik jest zalogowany?
- Czy dane są poprawne?
- Czy email istnieje w systemie?
- Czy użytkownik chce zapisać fiszki?
- Czy sesja wygasła?

## 4. Cele stanów

- **Strona główna**: Punkt wejścia, wybór akcji
- **Generowanie**: Tworzenie propozycji fiszek (publiczne)
- **Logowanie/Rejestracja**: Uzyskanie dostępu do funkcji chronionych
- **Moje fiszki**: Zarządzanie zapisanymi fiszkami
- **Sesja nauki**: Nauka z algorytmem powtórek
- **Reset hasła**: Odzyskanie dostępu do konta

</user_journey_analysis>

<mermaid_diagram>

```mermaid
stateDiagram-v2
    [*] --> StronaGlowna

    state "Strona Główna" as StronaGlowna {
        [*] --> WyborAkcji
        WyborAkcji: Użytkownik wybiera akcję
    }

    %% ===== GENEROWANIE FISZEK (PUBLICZNE) =====
    state "Generowanie Fiszek" as Generowanie {
        [*] --> WklejanieTekstu
        WklejanieTekstu --> WalidacjaTekstu
        
        state if_tekst <<choice>>
        WalidacjaTekstu --> if_tekst
        if_tekst --> GenerowanieAI: Tekst poprawny
        if_tekst --> WklejanieTekstu: Tekst niepoprawny
        
        GenerowanieAI --> PropozycjeFiszek
        PropozycjeFiszek --> PrzegladPropozycji
        
        state "Przegląd Propozycji" as PrzegladPropozycji {
            [*] --> EdycjaPropozycji
            EdycjaPropozycji --> ZatwierdzeniePropozycji
            ZatwierdzeniePropozycji --> OdrzuceniePropozycji
            OdrzuceniePropozycji --> EdycjaPropozycji
        }
        
        PrzegladPropozycji --> ProbaZapisu
    }

    %% ===== PUNKT DECYZYJNY - AUTORYZACJA =====
    state if_zalogowany <<choice>>
    ProbaZapisu --> if_zalogowany
    if_zalogowany --> ZapisDoMojeFiszki: Zalogowany
    if_zalogowany --> WymaganeLogowanie: Niezalogowany

    %% ===== MODUŁ AUTENTYKACJI =====
    state "Autentykacja" as Autentykacja {
        [*] --> WyborMetody
        
        state "Logowanie" as Logowanie {
            [*] --> FormularzLogowania
            FormularzLogowania --> WalidacjaLogowania
            
            state if_login <<choice>>
            WalidacjaLogowania --> if_login
            if_login --> LogowanieUdane: Dane poprawne
            if_login --> BladLogowania: Dane niepoprawne
            BladLogowania --> FormularzLogowania
            
            LogowanieUdane --> [*]
        }
        
        state "Rejestracja" as Rejestracja {
            [*] --> FormularzRejestracji
            FormularzRejestracji --> WalidacjaRejestracji
            
            state if_rejestracja <<choice>>
            WalidacjaRejestracji --> if_rejestracja
            if_rejestracja --> RejestracjaUdana: Dane poprawne
            if_rejestracja --> BladRejestracji: Dane niepoprawne
            if_rejestracja --> EmailIstnieje: Email zajęty
            
            BladRejestracji --> FormularzRejestracji
            EmailIstnieje --> FormularzRejestracji
            RejestracjaUdana --> [*]
        }
        
        state "Reset Hasła" as ResetHasla {
            [*] --> FormularzReset
            FormularzReset --> WyslanieEmaila
            WyslanieEmaila --> OczekiwanieNaEmail
            OczekiwanieNaEmail --> NoweHaslo
            NoweHaslo --> [*]
        }
        
        WyborMetody --> Logowanie: Mam konto
        WyborMetody --> Rejestracja: Nowe konto
        Logowanie --> ResetHasla: Zapomniałem hasła
    }

    WymaganeLogowanie --> Autentykacja

    %% ===== STREFA ZALOGOWANEGO UŻYTKOWNIKA =====
    state "Strefa Użytkownika" as StrefaUzytkownika {
        [*] --> PanelUzytkownika
        
        state "Moje Fiszki" as MojeFiszki {
            [*] --> ListaFiszek
            ListaFiszek --> EdycjaFiszki
            ListaFiszek --> UsuniecieFiszki
            ListaFiszek --> TworzenieFiszki
            
            EdycjaFiszki --> ListaFiszek
            UsuniecieFiszki --> PotwierdzUsuwanie
            PotwierdzUsuwanie --> ListaFiszek
            TworzenieFiszki --> ListaFiszek
        }
        
        state "Sesja Nauki" as SesjaNauki {
            [*] --> WyswietlFiszke
            WyswietlFiszke --> PokazOdpowiedz
            PokazOdpowiedz --> OcenaFiszki
            OcenaFiszki --> WyswietlFiszke: Następna fiszka
            OcenaFiszki --> SesjaZakonczona: Brak fiszek
            SesjaZakonczona --> [*]
        }
        
        PanelUzytkownika --> MojeFiszki
        PanelUzytkownika --> SesjaNauki
        PanelUzytkownika --> Generowanie: Nowe fiszki
    }

    %% ===== POŁĄCZENIA GŁÓWNE =====
    StronaGlowna --> Generowanie: Generuj fiszki
    StronaGlowna --> Autentykacja: Zaloguj się
    StronaGlowna --> StrefaUzytkownika: Już zalogowany

    Autentykacja --> StrefaUzytkownika: Logowanie udane
    ZapisDoMojeFiszki --> MojeFiszki

    %% ===== WYLOGOWANIE =====
    state "Wylogowanie" as Wylogowanie
    StrefaUzytkownika --> Wylogowanie: Wyloguj
    Wylogowanie --> StronaGlowna

    %% ===== OCHRONA TRAS =====
    state if_dostep <<choice>>
    note right of if_dostep
        Middleware sprawdza
        czy użytkownik jest
        zalogowany
    end note

    StronaGlowna --> if_dostep: Moje fiszki
    if_dostep --> MojeFiszki: Zalogowany
    if_dostep --> WymaganeLogowanie: Niezalogowany
```

</mermaid_diagram>

## Podsumowanie podróży użytkownika

### Ścieżka niezalogowanego użytkownika

```
Strona Główna → Generowanie → Propozycje → Próba zapisu → Logowanie/Rejestracja → Zapis
```

### Ścieżka zalogowanego użytkownika

```
Strona Główna → Moje Fiszki / Sesja Nauki / Generowanie
```

### Punkty przekierowania

| Akcja | Niezalogowany | Zalogowany |
|-------|---------------|------------|
| Generowanie fiszek | ✅ Dozwolone | ✅ Dozwolone |
| Zapis fiszek | ❌ → Logowanie | ✅ Dozwolone |
| Moje fiszki | ❌ → Logowanie | ✅ Dozwolone |
| Sesja nauki | ❌ → Logowanie | ✅ Dozwolone |
| Edycja fiszek | ❌ → Logowanie | ✅ Dozwolone |

## Kluczowe decyzje UX

1. **Niski próg wejścia** - generowanie bez logowania
2. **Motywacja do rejestracji** - zapis wymaga konta
3. **Zachowanie stanu** - propozycje nie są tracone przy przekierowaniu
4. **Jasne komunikaty** - użytkownik wie dlaczego musi się zalogować

