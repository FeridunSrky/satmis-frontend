# Frontend kuralları (frontend/ klasörü)

- React + Vite + TypeScript (strict), Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form + Zod.
- Klasör yapısı feature-based: src/app, src/features/<özellik>, src/shared, src/pages.
- Sunucudan gelen veri TanStack Query ile, istemci/oturum durumu Zustand ile yönetilir.
- API çağrıları sadece features/*/api dosyalarında ve shared/api içindeki http istemcisinden yapılır, bileşenler axios'u doğrudan çağırmaz.
- Arayüz metinleri Türkçe, kod ve değişken isimleri İngilizce.
- `any` yok, `dangerouslySetInnerHTML` yok, token/şifre asla console.log'a yazılmaz.
- Formlar React Hook Form + Zod ile, erişilebilir (label, hata mesajı aria bağlantısı, klavye ile kullanılabilir).
- Her değişiklikten sonra `npm run lint`, `npm run build` ve `npm test` geçmeli.
