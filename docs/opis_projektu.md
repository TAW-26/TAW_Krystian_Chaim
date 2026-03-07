# Temat: Webowy silnik gier 2D

**Autor: Krystian Chaim**

## 1. Opis wybranego tematu
Aplikacja webowa umożliwiająca tworzenie prostych gier 2D bezpośrednio w przeglądarce internetowej.
System udostępnia edytor sceny (mapy), zarządzanie obiektami gry oraz możliwość natychmiastowego uruchomienia projektu w trybie testowym.
Użytkownik może tworzyć mapy oparte na siatce (tilemap), dodawać postacie niezależne (NPC), definiować zdarzenia oraz dialogi. Projekt gry zapisywany jest w postaci pliku konfiguracyjnego (JSON), który jest interpretowany przez wbudowany silnik gry działający w przeglądarce.
System stanowi uproszczony odpowiednik środowisk do tworzenia gier, takich jak Unity czy Unreal Engine, jednak jest przeznaczony wyłącznie do prostych gier 2D działających w przeglądarce.

---

## 2. Cel projektu
Celem projektu jest stworzenie narzędzia umożliwiającego projektowanie i testowanie prostych gier 2D bez konieczności instalowania dodatkowego oprogramowania.

System ma pokazać sposób działania podstawowych mechanizmów silnika gry, takich jak:

- renderowanie sceny 2D,
- obsługa obiektów gry,
- system zdarzeń i interakcji,
- pętla gry (game loop),
- serializacja danych gry.

Projekt ma również zaprezentować możliwość integracji edytora poziomów z silnikiem gry oraz umożliwić szybkie testowanie tworzonych projektów bezpośrednio w przeglądarce.

---

## 3. Zakres funkcjonalny

### Edytor projektu
- Tworzenie i edycja projektu gry.
- Zarządzanie mapami (scenami).
- Edycja mapy w oparciu o siatkę tilemap.
- Dodawanie obiektów gry (NPC, teleporty, przedmioty).
- Zarządzanie zasobami graficznymi

### Silnik gry
- Renderowanie mapy i obiektów w technologii Canvas 2D.
- Obsługa ruchu gracza i kolizji z elementami mapy.
- System zdarzeń (np. dialog z NPC, teleport między mapami).
- Interpreter danych gry zapisanych w pliku JSON.

### Tryb testowania
- Uruchomienie projektu w trybie **Play Mode** bez opuszczania aplikacji.
- Symulacja działania gry w czasie rzeczywistym.
- Powrót do trybu edycji po zakończeniu testu.

### Zarządzanie projektami
- Zapisywanie projektu gry w bazie danych i lokalnie.
- Możliwość ponownego otwierania i edytowania projektu.
- Eksport projektu gry jako pakiet plików (HTML + JavaScript + JSON).

### Autoryzacja
- Rejestracja i logowanie użytkowników.
- Każdy użytkownik posiada własne projekty gier.

---

## 4. Proponowane technologie

**Frontend**
- HTML5
- CSS3
- JavaScript
- Canvas API (renderowanie sceny 2D)

**Silnik gry**
- JavaScript (UI oraz własny runtime silnika)

**Backend**
- Node.js (np. Express lub NestJS)
- REST API

**Baza danych**
- PostgreSQL lub MongoDB

**Format zapisu projektu**
- Lokalnie (plik JSON)
- W chmurze (baza danych)

