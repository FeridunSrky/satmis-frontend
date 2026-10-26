# satmis-frontend

satmis.com araç ilanı platformunun web arayüzü. React 19 + Vite + TypeScript (strict), Tailwind CSS v4,
React Router, TanStack Query, Zustand, React Hook Form + Zod.

## Çalıştırma

```bash
npm install
cp .env.example .env   # isteğe bağlı, VITE_APP_NAME
npm run dev            # http://localhost:5173
```

Backend `http://localhost:8080` adresinde çalışmalıdır. Geliştirmede `/api` istekleri Vite proxy ile
backend'e yönlendirilir (CORS gerekmez).

## Komutlar

| Komut            | Açıklama                                              |
| ---------------- | ----------------------------------------------------- |
| `npm run dev`    | Geliştirme sunucusu                                   |
| `npm run build`  | Tip kontrolü + üretim derlemesi                       |
| `npm run lint`   | oxlint (react, hooks, a11y, vitest kuralları) + `tsc` |
| `npm run format` | Prettier                                              |
| `npm test`       | Vitest + Testing Library + MSW                        |

## Klasör yapısı

```
src/
  app/        router, provider'lar, query client, layout
  features/   auth (oturum, token yenileme, formlar), user (profil, şifre)
  pages/      rota sayfaları (lazy yüklenir)
  shared/     api (http istemcisi, tipler, hata ayrıştırma), components, config, lib
  test/       MSW sunucusu, fixture'lar, render yardımcıları
```

## Oturum yönetimi

- Access token yalnızca bellekte, refresh token `localStorage`'da (`satmis.refreshToken`).
- Backend refresh token'ı her kullanımda döndürür ve eski token'ın tekrar kullanımını hırsızlık sayar.
  Bu yüzden yenileme sekme içinde tek uçuşlu (single-flight), sekmeler arasında `navigator.locks` ile
  sıralıdır ve token kilit alındıktan sonra yeniden okunur.
- Açılıştaki oturum geri yükleme modül seviyesinde tek bir promise'e bağlıdır (StrictMode güvenli).
