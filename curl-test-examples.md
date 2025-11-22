# Przykłady testowania endpointu POST /generations za pomocą curl

## Poprawne wywołanie
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco."}'
```

## Testowanie walidacji - za krótki tekst (< 1000 znaków)
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Ten tekst jest za krótki."}'
```

## Testowanie walidacji - za długi tekst (> 10000 znaków)
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Lorem ipsum dolor sit amet..."}'  # Wstaw tutaj tekst o długości ponad 10000 znaków
```

## Testowanie walidacji - nieprawidłowy format JSON
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Tekst" - nieprawidłowy json'
```

## Wskazówki:
1. Upewnij się, że serwer jest uruchomiony na porcie 4321 przed wywołaniem polecenia.
2. Sprawdź odpowiedzi HTTP i kody statusów, które powinny zawierać:
   - 201 Created dla poprawnego wywołania
   - 400 Bad Request dla nieprawidłowych danych
   - 500 Internal Server Error w przypadku problemów wewnętrznych
3. W systemie Windows możesz użyć polecenia Invoke-WebRequest zamiast curl:

```powershell
$body = @{
    source_text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...'  # wstaw długi tekst (min. 1000 znaków)
} | ConvertTo-Json

Invoke-WebRequest -Method POST -Uri "http://localhost:4321/api/generations" -ContentType "application/json" -Body $body
```
