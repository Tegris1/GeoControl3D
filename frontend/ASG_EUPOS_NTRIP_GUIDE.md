# 🛰️ Konfiguracja RTK z ASG EUPOS dla Topcon Hiper2

## Jak to działa

Aplikacja wysyła do odbiornika Topcon Hiper2 **komendy NMEA proprietary**, które:

1. Konfigurują połączenie NTRIP z ASG EUPOS
2. Aktywują RTK (Real Time Kinematic)
3. Włączają odbieranie poprawek GNSS

---

## 📋 Kroki konfiguracji w aplikacji

### 1. Połącz się z odbiornikiem

- Kliknij "Szukaj sparowanych urządzeń"
- Wybierz **Topcon Hiper2**
- Czekaj na potwierdzenie połączenia

### 2. Wejdź do konfiguracji RTK

- W sekcji "Konfiguracja RTK (ASG EUPOS)"
- Wpisz **login do ASG EUPOS**
- Wpisz **hasło do ASG EUPOS**

### 3. Wybierz punkt montażu

- Dostępne punkty:
  - **WRZ0** - Wrocław
  - **WAW0** - Warszawa (domyślnie)
  - **KRK0** - Kraków
  - **GDA0** - Gdańsk
  - **POZ0** - Poznań

- Aplikacja **automatycznie wybierze** punkt najbliższy Twojej bieżącej pozycji

### 4. Kliknij "Aktywuj RTK"

- Aplikacja wyśle komendy do odbiornika
- Poczekaj **10-30 sekund** na uzyskanie poprawek

### 5. Sprawdzaj status

- **HDOP**: Powinno zmaleć poniżej 1.0 (było >10 bez RTK)
- **Satelity**: Powinno być >8
- **Fix**: Powinien zmienić się z 1 (GPS) na 2 (DGPS/RTK)

---

## 🔧 Wymagane uprawnienia na odbiorniku

Topcon Hiper2 obsługuje komendy PASHS (Proprietary Topcon):

```
$PASHS,NMX,RTCM,{...}          → Konfiguracja NTRIP
$PASHS,NMX,RTK,ACTIVATE        → Aktywacja RTK
$PASHS,NMX,RTK,DEACTIVATE      → Wyłączenie RTK
$PASHS,NMX,NMEA,GGA,1          → Włączenie zdań GGA
$PASHS,NMX,CONSTELLATIONS,...  → Konfiguracja konstelacji
```

---

## 📊 Co to jest RTK?

| Parametr         | Bez RTK | Z RTK         |
| ---------------- | ------- | ------------- |
| **Dokładność**   | ±5-10 m | ±2-5 cm       |
| **HDOP**         | 5-15    | <1.0          |
| **Czas do fixa** | 30-60 s | 10-20 s       |
| **Fix type**     | GPS (1) | RTK Fixed (2) |

---

## 🐛 Troubleshooting

### Brak poprawek (RTK nie aktywuje się)

**Przyczyny:**

1. Brak internetu na odbiorniku (RTK wymaga łącza LTE/WiFi)
2. Błędne dane logowania do ASG EUPOS
3. Punkt montażu niedostępny
4. Bluetooth disconnect

**Rozwiązanie:**

- Sprawdź połączenie internetowe odbiornika
- Potwierź login/hasło na stronie ASG EUPOS
- Ponieważ punktów nie można automatycznie rozpoznać, wybierz najbliższy

### RTK się łączy ale zrywa

**Przyczyna:** Słaba jakość sygnału internetu
**Rozwiązanie:** Upewnij się że odbiornik ma stały 4G/LTE

### Urządzenie się rozłączy

**Przyczyna:** Timeout Bluetooth po bezczynności
**Rozwiązanie:** Aplikacja automatycznie wysyła komendy co 10 sekund

---

## 📡 ASG EUPOS Informacje

- **Server:** asg-eupos.geonet.pl
- **Port NTRIP:** 2101
- **Protokół:** RTCM v3
- **Strona:** https://www.asg-eupos.pl

Więcej informacji: https://www.asg-eupos.pl/index.php/pl/faq

---

## ✅ Checklist przed uruchomieniem

- [ ] Konto w ASG EUPOS utworzone i aktywne
- [ ] Hasło do ASG EUPOS skopjowane (bez błędów)
- [ ] Topcon Hiper2 sparowany przez Bluetooth
- [ ] Odbiornik ma dostęp do internetu (LTE/WiFi)
- [ ] Telefon ma dostęp do internetu (dla synchronizacji)

---

## 🎯 Oczekiwane rezultaty

Po aktywacji RTK w aplikacji powinieneś zobaczyć:

1. **Status:** ✓ RTK aktywny - oczekiwanie na poprawki
2. **HDOP:** Zmiana z ~10 na <1.0
3. **Satelity:** ~12-15 GPS + GLONASS
4. **Pozycja:** Znacznie dokładniejsza (cm zamiast m)
5. **Zdania NMEA:** Zawierać będą kod 2 (DGPS fix)

---

**Pytania?** Sprawdź dokumentację Topcon Hiper2 lub skontaktuj się z ASG EUPOS Support.
