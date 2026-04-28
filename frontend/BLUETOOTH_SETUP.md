# 📡 Integracja Topcon GPS Bluetooth - Przewodnik Konfiguracji

## ✅ Co zostało zrobione:

1. ✓ Zainstalowana biblioteka `react-native-bluetooth-classic`
2. ✓ Dodane uprawnienia w `app.json`
3. ✓ Stworzony komponent `TopconGPSReader`
4. ✓ Zintegrowany ekran GPS w nawigacji tabów

---

## 📋 Wymagane kroki do uruchomienia na Androidzie

### **Krok 1: Eject z Managed Expo na Bare Workflow**

Ponieważ `react-native-bluetooth-classic` wymaga dostępu do natywnego kodu Android, musisz wyejeżdżać z managed Expo:

```bash
cd frontend
eas build:configure  # Lub możesz bezpośrednio wyejeżdżać
npx expo prebuild --clean
```

Alternatywnie, jeśli chcesz użyć EAS:

```bash
eas build --platform android
```

### **Krok 2: Konfiguracja AndroidManifest.xml**

Po ejectowaniu z Expo, otwórz plik:

```
android/app/src/main/AndroidManifest.xml
```

Dodaj następujące uprawnienia w tagu `<manifest>`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.frontend">

    <!-- Bluetooth uprawnienia -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />

    <!-- Lokalizacja (wymagana dla Bluetooth Low Energy) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- ... reszta manifestu ... -->
</manifest>
```

### **Krok 3: Configuracja dla API 31+**

Dla Androida 12 (API 31) i wyższych, dodaj do `android/build.gradle`:

```gradle
android {
    compileSdkVersion 34

    defaultConfig {
        targetSdkVersion 34
        minSdkVersion 21
        // ...
    }

    // ...
}
```

### **Krok 4: Budowa i testowanie na Androidzie**

```bash
# Budowanie APK
npx react-native run-android

# Lub budowanie producji
cd android
./gradlew assembleRelease
```

---

## 🔧 Struktura komponentu

- **Plik komponentu:** `components/topcon-gps-reader.tsx`
- **Ekran GPS:** `app/(tabs)/gps.tsx`
- **Nawigacja:** Zaktualizowana w `app/(tabs)/_layout.tsx`

---

## 📱 Funkcjonalności komponentu

✓ **Wyszukiwanie urządzeń** - Skanowanie sparowanych urządzeń Bluetooth  
✓ **Połączenie** - Nawiązanie połączenia poprzez RFCOMM  
✓ **Czytanie NMEA** - Parsowanie zdań GPS (GGA)  
✓ **Wyświetlanie pozycji** - Szerokość, długość, wysokość  
✓ **Status informacyjny** - Liczba satelitów, HDOP  
✓ **Obsługa uprawnień** - Automatyczne żądanie uprawnień na Androidzie

---

## 🚀 Uruchomienie aplikacji

### Development:

```bash
npm start
# Następnie wybierz: a (Android)
```

### Production (EAS Build):

```bash
eas build --platform android --auto-submit
```

---

## ⚠️ Typowe problemy

### Problem: "react-native-bluetooth-classic is not installed"

**Rozwiązanie:** Po ejectowaniu, uruchom ponownie:

```bash
npm install react-native-bluetooth-classic
cd android && ./gradlew clean
```

### Problem: Uprawnienia nie działają

**Rozwiązanie:** Sprawdź, czy urządzenie ma Android 6.0+ i ręcznie przyznaj uprawnienia w Ustawieniach > Aplikacje > frontend

### Problem: Nie mogę się połączyć z urządzeniem

- Upewnij się, że urządzenie jest spięte (pairing mode)
- Sprawdź, czy urządzenie widnieje na liście sparowanych urządzeń
- Spróbuj wyłączyć i włączyć Bluetooth

---

## 📚 Dodatkowe zasoby

- [react-native-bluetooth-classic GitHub](https://github.com/react-native-bluetooth-classic)
- [NMEA Parser Guide](https://en.wikipedia.org/wiki/NMEA_0183)
- [Android Bluetooth Documentation](https://developer.android.com/guide/topics/connectivity/bluetooth)

---

## 🎯 Następne kroki

1. **Eject aplikację** na bare workflow
2. **Zaktualizuj AndroidManifest.xml** z uprawnieniami Bluetooth
3. **Przetestuj** na fizycznym urządzeniu z systemem Android
4. (Opcjonalnie) **Dodaj iOS support** - na iOS będzie potrzebna inna biblioteka

---

**Pytania?** Sprawdź dokumentację biblioteki lub logi błędów w konsoli.
