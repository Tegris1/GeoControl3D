# 🔧 Troubleshooting Bluetooth Connection Crashes

## Problemy i Rozwiązania

### Problem 1: Crash przy podłączaniu

**Symptomy:**

- Aplikacja zamyka się po kliknięciu "Szukaj urządzeń" lub wybraniu urządzenia
- Brak komunikatu błędu w aplikacji

**Przyczyny:**

1. **Brakujące uprawnienia Android** - Bluetooth Connect, Bluetooth Scan
2. **Błędna wersja biblioteki** `react-native-bluetooth-classic`
3. **Urządzenie nie obsługuje RFCOMM**

**Rozwiązanie:**

Sprawdź uprawnienia w `app.json`:

```json
"android": {
  "permissions": [
    "android.permission.BLUETOOTH",
    "android.permission.BLUETOOTH_ADMIN",
    "android.permission.BLUETOOTH_CONNECT",
    "android.permission.BLUETOOTH_SCAN",
    "android.permission.ACCESS_FINE_LOCATION"
  ]
}
```

Sprawdź wersję biblioteki:

```bash
npm list react-native-bluetooth-classic
```

Jeśli stara wersja, zaktualizuj:

```bash
npm install react-native-bluetooth-classic@latest
```

---

### Problem 2: Crash przy odbiorze danych

**Symptomy:**

- Aplikacja podłącza się, ale pada przy pierwszych danych
- Error: "Cannot read property 'data' of undefined"

**Przyczyna:**
Zły format danych z urządzenia

**Rozwiązanie:**
Zaktualizowany kod obsługuje teraz różne formaty:

```typescript
const line = data?.data?.trim?.() || String(data).trim();
```

---

### Problem 3: Crash przy wysyłaniu komend RTK

**Symptomy:**

- Aplikacja pada po kliknięciu "Aktywuj RTK"
- Error w wysyłaniu komendy

**Przyczyna:**
Urządzenie nie obsługuje metody `write()`

**Rozwiązanie:**
Sprawdź czy urządzenie je obsługuje:

```typescript
if (connectedDevice.write) {
  await connectedDevice.write(command);
}
```

---

## 📋 Checklist przed testowaniem

- [ ] Wszystkie uprawnienia w `app.json` ✓
- [ ] Urządzenie sparowane poprzez Bluetooth ✓
- [ ] Urządzenie w Developer Mode ✓
- [ ] Aplikacja ma dostęp do Bluetooth ✓
- [ ] Topcon Hiper2 włączony ✓
- [ ] Topcon Hiper2 widoczny w systemowych ustawieniach ✓

---

## 🐛 Debugowanie

### Włącz logi do konsoli

Na Android, użyj adb:

```bash
adb logcat | grep "Topcon\|Bluetooth\|Błąd"
```

### Sprawdzenie statusu Bluetooth

```bash
adb shell settings get secure bluetooth_on
```

### Resetowanie cache aplikacji

```bash
adb shell pm clear com.frontend
```

---

## 💡 Wiadomo dobra praktyka

1. **Zawsze sprawdzaj czy metoda istnieje:**

   ```typescript
   if (device.connect) {
     await device.connect(options);
   }
   ```

2. **Dodaj timeout:**

   ```typescript
   const timeoutPromise = new Promise((_, reject) =>
     setTimeout(() => reject(new Error("Timeout")), 10000),
   );

   await Promise.race([connectionPromise, timeoutPromise]);
   ```

3. **Obsłuż disconnect:**
   ```typescript
   useEffect(() => {
     return () => {
       if (connectedDevice) {
         disconnectDevice();
       }
     };
   }, []);
   ```

---

## 📞 Jeśli dalej nie działa:

1. Pobierz logi z aplikacji:

   ```bash
   adb logcat > logs.txt
   ```

2. Sprawdź wersję:

   ```bash
   adb shell getprop ro.build.version.sdk
   ```

3. Sprawdź czy Hiper2 obsługuje RFCOMM:
   - Dokumentacja: Topcon Hiper2 User Manual
   - Domyślny port: SPP/RFCOMM

---

**Ostatnia aktualizacja:** 26.04.2026
