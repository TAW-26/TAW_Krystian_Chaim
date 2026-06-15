# Temat: Webowy silnik gier 2D

**Autor: Krystian Chaim**

## 1. Opis wybranego tematu
Aplikacja webowa to zaawansowany, dwuwymiarowy silnik gier działający bezpośrednio w przeglądarce internetowej, zintegrowany z chmurowym panelem zarządzania projektami (Dashboard). System udostępnia interaktywny edytor sceny, zaawansowane zarządzanie obiektami gry na siatce współrzędnych (X, Y) oraz możliwość natychmiastowego uruchomienia i testowania projektu w trybie czasu rzeczywistego (**Play Mode**).

Silnik wykorzystuje zestaw uniwersalnych emotek (Emoji) jako natywne zasoby graficzne, co pozwala na błyskawiczne renderowanie różnorodnych postaci, przeciwników o odmiennych algorytmach sztucznej inteligencji (AI), barier fizycznych oraz zasobów do zebrania. Zapis stanu gry obejmuje kompletną serializację struktur danych do formatu JSON oraz automatyczne generowanie graficznej miniaturki podglądu planszy (Base64). Całość zintegrowana jest z relacyjną bazą danych PostgreSQL i zabezpieczona bezstanową autoryzacją tokenami JWT, oferując pełny podział uprawnień dla użytkowników oraz administratora systemu.

---

## 2. Cel projektu
Celem projektu jest stworzenie elastycznego, wieloużytkowniczego środowiska webowego do projektowania, udostępniania i testowania gier 2D bez konieczności instalacji dodatkowego oprogramowania klienckiego.

Projekt realizuje i prezentuje działanie zaawansowanych mechanizmów inżynierii oprogramowania webowego:
* **Renderowanie grafiki 2D:** Dynamiczne czyszczenie i rysowanie klatek na elemencie Canvas przy użyciu Canvas API.
* **Asynchroniczny cykl życia (Game Loop):** Zastosowanie niezależnych interwałów czasowych symulujących czas rzeczywisty dla procesów decyzyjnych sztucznej inteligencji.
* **Fizyka i Detekcja Kolizji:** Algorytmy sprawdzające nakładanie się współrzędnych punktowych obiektów ruchomych na elementy blokujące ruch.
* **Zarządzanie Stanem i Serializacja:** Zrzucanie struktur obiektowych JavaScript do ciągów tekstowych JSON i trwała persystencja w bazie SQL.
* **Bezpieczeństwo i Kontrola Dostępu:** Implementacja bezpiecznej rejestracji, uwierzytelniania oraz autoryzacji operacji bazodanowych CRUD w oparciu o role użytkowników.

---

## 3. Zakres funkcjonalny

### Panel Zarządzania (Dashboard)
* **Hub Projektów:** Główny pulpit wyświetlający siatkę (Grid) wszystkich gier zapisanych w chmurze przez społeczność.
* **Dynamiczne Miniaturki:** Każda gra na liście posiada unikalną, automatycznie generowaną podczas zapisu grafikę podglądu stanu planszy.
* **Statystyki Studia:** Panel boczny wyświetlający aktualną liczbę wszystkich dostępnych gier w bazie.
* **System Kontroli Uprawnień:**
    * Jeśli zalogowany użytkownik jest **Autorem** gry – otrzymuje pełne uprawnienia (przyciski *Edytuj* oraz *Usuń*).
    * Jeśli użytkownik jest **Gościem** – projekt otwiera się w bezpiecznym trybie podglądu (przycisk *Podgląd/Graj*, brak możliwości nadpisania cudzego pliku).
    * Jeśli zalogowany użytkownik ma rolę **Admin** – system przydziela mu uprawnienia globalne do usuwania dowolnej gry z bazy w celu moderacji.

### Interaktywny Edytor Sceny
* **Współrzędne Punktowe (Snap-to-Grid):** Pozycjonowanie obiektów za pomocą kliknięcia myszką, z automatycznym wyrównywaniem współrzędnych do bloków o rozmiarze 40x40 pikseli.
* **Biblioteka Elementów (Podział na 4 zakładki tematyczne):**
    * **Gracz:** 10 unikalnych archetypów bohatera (np. 🤠 Kowboj, 🥷 Ninja, 🧙 Mag, 🤖 Robot). Silnik pilnuje reguły biznesowej: na planszy może znajdować się maksymalnie jeden gracz.
    * **Wrogowie:** 10 typów potworów (np. 🦇 Nietoperz, 👾 Obcy, 🕷️ Pająk, 👻 Duch, 🧟 Zombie).
    * **Ściany:** 10 nieprzekraczalnych przeszkód fizycznych (np. 🧱 Cegła, 🪨 Kamień, 🌳 Drzewo, 🔥 Ogień).
    * **Ozdoby:** 10 elementów tła. Dzielą się na ozdoby neutralne (kwiaty) oraz zasoby punktowane (np. 🪙 Moneta, 💎 Diament, 💰 Złoto).
* **Narzędzie Wymazywania (🧽 Gumka):** Możliwość selektywnego usuwania konkretnego obiektu z planszy po jego kliknięciu.
* **Globalny Panel Konfiguracji (Prawa strona):** Modyfikacja tytułu gry, opisu, automatyczny podpis autora, wybór wymiarów planszy (Mała, Średnia, Duża), wybór koloru tła z palety RGB oraz suwak modyfikatora prędkości przeciwników.

### Silnik Gry & Play Mode
* **Interpreter JSON:** Backend przekazuje surowe dane tekstowe z bazy, które frontend dynamicznie parsuje i rekonstruuje do obiektów gry.
* **Sterowanie Klawiaturą:** Obsługa zdarzeń `keydown` (Strzałki na klawiaturze) do płynnego przemieszczania postaci gracza.
* **Niezależne AI Przeciwników:** Każdy typ wroga posiada przypisaną własną częstotliwość ruchu (np. Nietoperz porusza się bardzo szybko, Zombie bardzo wolno). Prędkość ta jest dodatkowo skalowana mnożnikiem z ustawień mapy. Przeciwnicy automatycznie omijają ściany oraz innych wrogów.
* **System Punktacji i HUD:** Dynamiczna nakładka graficzna rysowana na Canvasie wyświetlająca stan punktów gracza w czasie rzeczywistym. Zebranie zasobu podnosi wynik o +1 i trwale usuwa monetę z mapy. Punkty resetują się przy każdym uruchomieniu.
* **Warunki Zakończenia Rozgrywki:**
    * **Zwycięstwo:** Osiągnięcie limitu punktów zdefiniowanego przez twórcę w prawym panelu skutkuje komunikatem o wygranej.
    * **Przegrana:** Wejście gracza na pozycję wroga (lub potwora na gracza) powoduje kolizję śmiertelną, zatrzymanie procesów AI i reset do stanu sprzed uruchomienia testu.

### Autentykacja i Autoryzacja
* **Rejestracja:** Formularz sprawdzający unikalność loginu i wprowadzający rekord do bazy danych PostgreSQL z domyślną rolą `User`.
* **Logowanie:** Weryfikacja danych, po której serwer generuje bezstanowy, kryptograficznie podpisany token JWT (JSON Web Token) ważny przez 2 godziny, przesyłany w nagłówkach `Authorization: Bearer`.

---

## 4. Architektura i technologie

**Frontend (Aplikacja Kliencka)**
* **HTML5 & CSS3:** Struktura interfejsu z wykorzystaniem układu flexbox/grid oraz mrocznej palety deweloperskiej.
* **Vanilla JavaScript:** Logika operacji na interfejsie, obsługa żądań asynchronicznych HTTP (`fetch`).
* **Canvas API:** Niskopoziomowy silnik renderujący scenę gier na podstawie współrzędnych pikselowych oraz obsługujący funkcję `canvas.toDataURL()` do konwersji obrazu na format Base64.

**Backend (Serwer API)**
* **Node.js + Express.js:** Serwer REST API zarządzający routingiem, serwowaniem plików statycznych oraz polityką CORS.
* **jsonwebtoken:** Biblioteka do podpisywania, szyfrowania i dekodowania tokenów autoryzacyjnych.

**Baza danych**
* **PostgreSQL:** Relacyjna, zewnętrzna baza danych przechowująca profile użytkowników (tabele powiązane relacją klucza obcego) oraz długie ciągi tekstowe reprezentujące mapy JSON i skompresowane miniatury graficzne gier.
