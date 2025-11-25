# Testy cURL dla POST /api/generations

## 1. Test pozytywny - Prawidłowy tekst (1000-10000 znaków)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Informatyka to dziedzina nauki zajmująca się przetwarzaniem informacji za pomocą komputerów i systemów komputerowych. Obejmuje ona szerokie spektrum zagadnień, od teorii algorytmów i struktur danych, przez programowanie i inżynierię oprogramowania, aż po sztuczną inteligencję i uczenie maszynowe. Podstawowe koncepcje informatyki to algorytmy, które są precyzyjnymi instrukcjami rozwiązywania problemów, oraz struktury danych, które organizują i przechowują informacje w sposób umożliwiający efektywny dostęp i manipulację. Języki programowania to narzędzia służące do implementacji algorytmów i tworzenia oprogramowania. Popularne języki to Python, Java, C++, JavaScript i wiele innych, każdy z własnymi zastosowaniami i charakterystykami. Bazy danych są kluczowe dla przechowywania i zarządzania dużymi ilościami informacji. Systemy zarządzania bazami danych (DBMS) jak MySQL, PostgreSQL czy MongoDB umożliwiają efektywne przechowywanie, wyszukiwanie i aktualizowanie danych. Sieci komputerowe łączą komputery i umożliwiają komunikację oraz udostępnianie zasobów. Internet, jako globalna sieć komputerowa, zrewolucjonizował sposób, w jaki przekazujemy informacje i współpracujemy na całym świecie. Cyberbezpieczeństwo to kluczowa dziedzina zajmująca się ochroną systemów komputerowych przed zagrożeniami takimi jak wirusy, malware, ataki hakerskie i naruszenia danych. Sztuczna inteligencja i uczenie maszynowe to szybko rozwijające się obszary informatyki, które umożliwiają komputerom uczenie się i podejmowanie decyzji na podstawie danych bez bezpośredniego programowania każdej akcji."
  }' \
  -v
```

**Oczekiwana odpowiedź:** Status 201, JSON z wygenerowanymi propozycjami fiszek

## 2. Test negatywny - Tekst za krótki (< 1000 znaków)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "To jest za krótki tekst do generowania fiszek. Musi mieć co najmniej 1000 znaków."
  }' \
  -v
```

**Oczekiwana odpowiedź:** Status 400, JSON z błędem walidacji

```json
{
  "error": "Bad Request",
  "message": "Tekst źródłowy musi mieć co najmniej 1000 znaków"
}
```

## 3. Test negatywny - Tekst za długi (> 10000 znaków)

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  }' \
  -v
```

**Oczekiwana odpowiedź:** Status 400, JSON z błędem walidacji

```json
{
  "error": "Bad Request",
  "message": "Tekst źródłowy nie może przekraczać 10000 znaków"
}
```

## 4. Test negatywny - Nieprawidłowy JSON

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Nieprawidłowy JSON - brakuje zamykającego nawiasu"
  ' \
  -v
```

**Oczekiwana odpowiedź:** Status 400, JSON z błędem parsowania

```json
{
  "error": "Bad Request",
  "message": "Nieprawidłowy format JSON"
}
```

## 5. Test negatywny - Brak pola source_text

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "other_field": "Wartość innego pola"
  }' \
  -v
```

**Oczekiwana odpowiedź:** Status 400, JSON z błędem walidacji

## 6. Test negatywny - Puste pole source_text

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": ""
  }' \
  -v
```

**Oczekiwana odpowiedź:** Status 400, JSON z błędem walidacji

## 7. Test negatywny - Null w source_text

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": null
  }' \
  -v
```

**Oczekiwana odpowiedź:** Status 400, JSON z błędem walidacji

## Notatki dotyczące testów:

1. **URL endpointu:** Zmień `http://localhost:4321` na rzeczywisty adres Twojego serwera
2. **Flaga `-v`:** Dodaje verbose output, pokazuje szczegóły żądania i odpowiedzi
3. **Content-Type:** Zawsze ustawiaj na `application/json` dla żądań JSON
4. **Długość tekstu:** Endpoint wymaga tekstu o długości 1000-10000 znaków

## Dodatkowe opcje cURL:

```bash
# Zapisanie odpowiedzi do pliku
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @test-data.json \
  -o response.json

# Pokazanie tylko nagłówków odpowiedzi
curl -I http://localhost:4321/api/generations

# Pomiar czasu wykonania
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @test-data.json \
  -w "Czas całkowity: %{time_total}s\n"
```

## Przygotowanie pliku z danymi testowymi:

Utwórz plik `test-data.json`:

```json
{
  "source_text": "Długi tekst o informatyce... (1000-10000 znaków)"
}
```

Następnie użyj:

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @test-data.json \
  -v
```
