# satmis.com Frontend Başlangıç Görevi

Proje kökündeki `CLAUDE.md` dosyasını oku. Oradaki genel kurallar (sırları koda yazma, `git commit/push` yapma, var olan dosyaları sormadan silme/ezme) geçerli. Backend'e özgü kuralları (Spring, JPA, Maven vb.) yok say.

Bu belgedeki adımları **sırayla** uygula. Her adımdan sonra derle/kontrol et, hata varsa düzelt, sonra devam et. Bana soru sormadan ilerle. Karar vermen gerekirse bu belgeye en yakın seçeneği seç ve sonda raporla.

## Hedef

`frontend/` klasöründe React tabanlı arayüzün temelini kur: proje iskeleti, JWT oturum yönetimi, giriş/kayıt/profil sayfaları ve genel layout. Backend aynı anda **başka bir agent tarafından** yazılıyor, bu yüzden aşağıdaki API sözleşmesine göre çalış.

## Çalışma sınırları (kesin)

- Sadece `frontend/` klasörüne yaz. `backend/`, kök `docker-compose.yml`, kök `.gitignore`, kök `CLAUDE.md` dosyalarına **dokunma**.
- Git durumunu kontrol ederken sadece `git status -- frontend` bak. `backend/` altındaki değişiklikler diğer agent'a ait, onları yok say.
- Backend sözleşmeden farklı davranırsa backend'i düzeltmeye çalışma. Farkı raporla ve frontend tarafında dayanıklı davran.
- `git commit` ve `git push` yapma.
- Listede olmayan bağımlılık ekleme, gerekiyorsa nedenini yazıp ekle.

## Kapsam dışı (bunları YAPMA)

- İlan listeleme, ilan detay, ilan verme, favoriler, katalog filtreleri (backend API'leri henüz yok).
- Admin paneli, mesajlaşma, çoklu dil (i18n), dark mode.
- Docker/nginx dosyaları.

---

## Adım 0: Ön kontrol

- `node -v` kontrol et. Node 20.19+ veya 22+ olmalı, değilse dur ve bildir.
- `frontend/package.json` var mı bak. Varsa içeriğini oku ve onu temel al, yoksa Adım 1'e geç.

## Adım 1: Proje iskeleti

`frontend/` içinde Vite + React + **TypeScript** projesi oluştur (`npm create vite@latest` ile, şablon `react-ts`). Paketler:

- Çalışma zamanı: `react-router-dom`, `@tanstack/react-query`, `axios`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`, `sonner`
- Stil: `tailwindcss` ve `@tailwindcss/vite` (Tailwind'in güncel Vite entegrasyonuyla kur, ayrı CSS framework/UI kit ekleme)
- Test: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw`
- Şablonla gelen ESLint kalsın, `prettier` ekle (tek tırnak, noktalı virgül, 100 karakter satır genişliği)

`vite.config.ts`: geliştirme sunucusu portu 5173, `/api` isteklerini `http://localhost:8080` adresine yönlendiren **proxy**. Böylece geliştirmede CORS sorunu olmaz. Vitest ayarlarını (`jsdom`, setup dosyası) aynı yapılandırmaya ekle.

`package.json` script'leri: `dev`, `build`, `lint`, `format`, `test`.

`frontend/.env.example`: `VITE_APP_NAME=satmis.com` (proje adı henüz kesin değil, arayüzde bu değişkenden okunsun).

Bu adımın sonunda `frontend/CLAUDE.md` dosyasını aşağıdaki içerikle oluştur:

```
# Frontend kuralları (frontend/ klasörü)
- React + Vite + TypeScript (strict), Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form + Zod.
- Klasör yapısı feature-based: src/app, src/features/<özellik>, src/shared, src/pages.
- Sunucudan gelen veri TanStack Query ile, istemci/oturum durumu Zustand ile yönetilir.
- API çağrıları sadece features/*/api dosyalarında ve shared/api içindeki http istemcisinden yapılır, bileşenler axios'u doğrudan çağırmaz.
- Arayüz metinleri Türkçe, kod ve değişken isimleri İngilizce.
- `any` yok, `dangerouslySetInnerHTML` yok, token/şifre asla console.log'a yazılmaz.
- Formlar React Hook Form + Zod ile, erişilebilir (label, hata mesajı aria bağlantısı, klavye ile kullanılabilir).
- Her değişiklikten sonra `npm run lint`, `npm run build` ve `npm test` geçmeli.
```

## Adım 2: API sözleşmesi ve tipler

Backend (Spring Boot, `http://localhost:8080`) aşağıdaki sözleşmeyi sunacak. `src/shared/api/types.ts` içinde birebir TypeScript tipleri olarak tanımla.

| Endpoint                     | İstek gövdesi                                      | Başarı cevabı                                                     |
| ---------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| `POST /api/auth/register`    | `{ email, password, firstName, lastName, phone? }` | 201 `AuthResponse`                                                |
| `POST /api/auth/login`       | `{ email, password }`                              | 200 `AuthResponse`                                                |
| `POST /api/auth/refresh`     | `{ refreshToken }`                                 | 200 `AuthResponse` (yeni çift, eski refresh token artık geçersiz) |
| `POST /api/auth/logout`      | `{ refreshToken }`                                 | 204                                                               |
| `GET /api/users/me`          | -                                                  | 200 `UserResponse`                                                |
| `PUT /api/users/me`          | `{ firstName, lastName, phone? }`                  | 200 `UserResponse`                                                |
| `PUT /api/users/me/password` | `{ currentPassword, newPassword }`                 | 204                                                               |

```ts
type Role = 'USER' | 'ADMIN';
interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
}
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: UserResponse;
}
interface ErrorResponse {
  timestamp: string;
  status: number;
  message: string;
  path: string;
  errors?: Record<string, string>;
}
```

Hata anlamları:

- `400`: doğrulama hatası. `errors` alanı **alan adı → Türkçe mesaj** haritasıdır, ilgili form alanına `setError` ile yaz.
- `401`: giriş endpoint'inde "e-posta veya şifre hatalı", korumalı endpoint'lerde token geçersiz/süresi dolmuş.
- `403`: hesap devre dışı veya yetki yok. `409`: e-posta zaten kayıtlı. Diğer hatalarda `message` alanını göster.
- Sunucuya ulaşılamazsa (ağ hatası) "Sunucuya ulaşılamıyor, lütfen tekrar deneyin" göster.

Kimlik doğrulama gerektirmeyen endpoint'ler: `/api/auth/**`. Diğerleri `Authorization: Bearer <accessToken>` ister. Access token ömrü 15 dakika, refresh token 7 gün.

Doğrulama kuralları (Zod şemalarında backend ile aynı olsun, mesajlar Türkçe):

- `email`: zorunlu, geçerli e-posta, en çok 100 karakter
- `password` / `newPassword`: 8-64 karakter
- `firstName`, `lastName`: zorunlu, en çok 50 karakter
- `phone`: opsiyonel, boşsa gönderme, doluysa `^\+?[0-9]{10,15}$`

## Adım 3: HTTP katmanı ve oturum yönetimi (en kritik kısım)

**Backend refresh token'ı her kullanımda döndürür (rotasyon) ve eski token'ın ikinci kez kullanılmasını "çalınma" sayıp kullanıcının TÜM oturumlarını kapatır.** Bu yüzden aynı refresh token ile asla iki istek atma.

Dosyalar ve davranışlar:

- `shared/api/http.ts`: `baseURL: '/api'` olan axios örneği (`http`). `auth` endpoint'leri için interceptor'sız ayrı bir örnek (`authHttp`) kullan, böylece refresh çağrısı kendi interceptor'ına takılıp döngüye girmez.
- **Token saklama** (`features/auth/tokenStorage.ts`): access token sadece bellekte (Zustand, kalıcı değil), refresh token `localStorage`'da (`satmis.refreshToken`). `localStorage` erişimi her zaman `try/catch` içinde olsun (özel pencerede hata verebilir). Refresh token'ı localStorage'da tutmak backend'in şu anki tasarımının sonucudur, ileride HttpOnly cookie'ye taşınabilir, bunu koda kısa yorum olarak yaz.
- **Auth store** (`features/auth/authStore.ts`, Zustand): `status: 'bootstrapping' | 'authenticated' | 'anonymous'`, `user`, `accessToken`, eylemler: `setSession(AuthResponse)`, `clearSession()`.
- **Request interceptor**: store'da access token varsa `Authorization: Bearer ...` ekler.
- **Response interceptor**: korumalı istekte `401` gelirse ve istek daha önce yeniden denenmediyse:
  1. `refreshSession()` çağır, ardından isteği **bir kez** yeniden dene.
  2. `refreshSession()` **single-flight** olmalı: aynı anda birden fazla 401 gelirse hepsi aynı promise'i bekler, refresh çağrısı **tek** kez atılır.
  3. Refresh başarısız olursa oturumu temizle, `/giris?next=<mevcut yol>` adresine yönlendir.
  4. `/auth/*` istekleri bu mantığın dışındadır (login'deki 401 normal bir hatadır).
- **Çoklu sekme**: `refreshSession()` içinde `navigator.locks.request('satmis-refresh', ...)` kullan. Kilidi alınca `localStorage`'daki refresh token'ı **yeniden oku**. Başka bir sekme bu arada yenilemişse (token değişmişse) yeni oturumu `localStorage`'dan alıp tekrar refresh çağırma. `navigator.locks` yoksa doğrudan devam et.
- **Bootstrap** (`features/auth/bootstrapSession.ts`): uygulama açılışında refresh token varsa `refreshSession()` ile oturumu geri kur, yoksa `anonymous`. **React StrictMode geliştirmede efektleri iki kez çalıştırır**, bu yüzden bootstrap çağrısı modül seviyesinde tek bir promise'e bağlı olmalı (iki kez refresh atılırsa backend kullanıcıyı atar). `status === 'bootstrapping'` iken tam sayfa yükleniyor ekranı göster.
- **Logout**: `POST /auth/logout` çağrısını best-effort yap (hata verirse yok say), her durumda `clearSession()` ve react-query cache'ini temizle.
- Şifre değişince backend tüm refresh token'ları iptal eder. Şifre değiştirme başarılı olunca kullanıcıyı çıkış yaptır, "Şifreniz değişti, lütfen tekrar giriş yapın" toast'ı göster ve `/giris`'e yönlendir.

## Adım 4: Sayfalar ve yönlendirme

Klasör yapısı: `src/app` (router, providers, queryClient), `src/features/auth`, `src/features/user`, `src/shared` (api, components, lib, config), `src/pages`.

Rotalar (React Router, `createBrowserRouter`):

| Yol        | Sayfa                                                                                                            | Erişim                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `/`        | Ana sayfa: kısa tanıtım bölümü ve "Satılık Araçlar" sayfasına buton                                              | herkes                                      |
| `/ilanlar` | "Satılık Araçlar" yer tutucu sayfa: sol filtre paneli yerine sade bir "İlanlar yakında burada olacak" boş durumu | herkes                                      |
| `/giris`   | Giriş formu                                                                                                      | sadece misafir (girişliyse `/`'e yönlendir) |
| `/kayit`   | Kayıt formu                                                                                                      | sadece misafir                              |
| `/profil`  | Profil bilgilerini güncelle + şifre değiştir (iki ayrı kart)                                                     | sadece girişli                              |
| `*`        | 404 sayfası                                                                                                      | herkes                                      |

- `ProtectedRoute` ve `GuestRoute` bileşenleri `bootstrapping` durumunda yükleniyor ekranı gösterir. Korumalı sayfaya girişsiz gelen kullanıcı `/giris?next=<yol>` adresine gider, giriş sonrası `next` yoluna döner (sadece `/` ile başlayan dahili yollara izin ver, dış adrese yönlendirme yapma).
- **Layout**: üstte sabit header (logo/uygulama adı, "Satılık Araçlar" bağlantısı; misafirse "Giriş Yap" ve "Kayıt Ol", girişliyse ad-soyad menüsü: Profilim, Çıkış Yap), altta sade footer. Mobil uyumlu (küçük ekranda menü daralır).
- **Formlar**: React Hook Form + Zod. Gönderim sırasında buton devre dışı ve "Gönderiliyor..." durumu. Backend `errors` haritasını ilgili alanlara yaz, alan dışı hataları form üstünde bir uyarı kutusu veya `sonner` toast olarak göster. Şifre alanlarında göster/gizle düğmesi.
- Kayıt başarılı olunca backend token çifti döner, kullanıcıyı otomatik giriş yapmış say ve `/`'e yönlendir.
- Profil sayfası mevcut kullanıcı bilgisiyle dolu gelir. Güncelleme `useMutation` ile yapılır, başarılıysa store'daki `user` güncellenir ve toast gösterilir. Ayrıca sayfa açılınca `GET /users/me` ile güncel veri çekilebilir.

Tasarım: Tailwind ile sade, modern, temiz bir görünüm. Ana renk olarak tek bir vurgu rengi (marka rengi, Tailwind teması içinde tek yerden değiştirilebilir) kullan, yeterli kontrast, görünür focus halkaları, tutarlı boşluklar. UI kütüphanesi ekleme. Yatay kaydırma olmasın, 360px genişlikte düzgün çalışsın.

## Adım 5: Testler

Vitest + React Testing Library + MSW (backend'i taklit eder). En az şu senaryolar:

1. Giriş formu: boş/hatalı alanlarda Türkçe doğrulama mesajları görünür.
2. Başarılı giriş: oturum store'a yazılır, kullanıcı yönlendirilir.
3. Korumalı istekte `401` gelince `refresh` çağrılır ve istek **bir kez** yeniden denenir.
4. Aynı anda iki istek `401` alırsa `refresh` endpoint'i **yalnızca bir kez** çağrılır.
5. Refresh başarısız olursa oturum temizlenir ve `/giris`'e yönlendirilir.
6. `StrictMode` içinde bootstrap `refresh` endpoint'ini **yalnızca bir kez** çağırır.
7. `ProtectedRoute` girişsiz kullanıcıyı `/giris?next=...`'e yönlendirir.
8. Kayıtta backend `409` dönerse e-posta alanında hata görünür.

Testi geçirmek için testi zayıflatma, hata kodda ise kodu düzelt.

## Adım 6: Son kontrol ve rapor

1. `npm run lint`, `npm run build`, `npm test` çalıştır, sonuçları yaz.
2. Kendi kodunu gözden geçir: token'ın log/URL/`localStorage` dışında bir yere yazıldığı yer, refresh'in tek-uçuşlu (single-flight) olduğu, açık yönlendirme (open redirect) riski, erişilebilirlik eksikleri, kullanılmayan kod. Bulduklarını düzelt.
3. Kısa rapor yaz:
   - Oluşturduğun dosyaların listesi
   - Bu belgeden sapmalar ve nedenleri
   - Uygulamayı çalıştırma komutları (`cd frontend`, `npm install`, `npm run dev`)
   - Backend ile gerçek entegrasyon için yapılacaklar ve bilinen eksikler

`git commit` veya `git push` **yapma**.
