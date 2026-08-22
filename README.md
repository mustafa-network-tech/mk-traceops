# mk-traceops

**Malzemenin üretimdeki yolculuğu** — Excel aktarımından sevkiyata kadar Cloudflare Workers + D1 üzerinde çalışan iç operasyon paneli.

## Gereksinimler

- [Node.js](https://nodejs.org/) **20.x** veya üzeri (LTS önerilir)
- npm (Node ile birlikte gelir)

## Kurulum

```bash
git clone <repo-url> mk-traceops
cd mk-traceops
npm ci
```

Geliştirme sunucusu:

```bash
npm run dev
```

Uygulama: [http://localhost:3000](http://localhost:3000) (otomatik yönlendirme: `/kokpit`).

## Ortam değişkenleri

Şu an uygulama **mock repository** ile çalışır; `.env.local` zorunlu değildir.

Cloudflare D1 kurulumu:

1. Depodaki `.env.example` dosyasını referans alın.
2. Proje kökünde `.env.local` oluşturun (bu dosya Git’e **eklenmez**).
3. `npm run db:migrate:local` ile yerel şemayı uygulayın; remote için `npm run db:migrate:remote` kullanın.

```bash
cp .env.example .env.local
# .env.local içini düzenleyin
```

## Komutlar

| Komut           | Açıklama              |
|-----------------|------------------------|
| `npm run dev`   | Geliştirme sunucusu    |
| `npm run build` | Production derlemesi   |
| `npm run start` | Production sunucusu    |
| `npm run lint`  | ESLint                 |

## GitHub’a bağlama

1. GitHub’da yeni bir **boş repo** oluşturun (README eklemeden de olur).
2. Yerelde remote ekleyin ve ilk push:

```bash
git remote add origin https://github.com/KULLANICI/REPO_ADI.git
git branch -M main
git add .
git commit -m "Initial commit: mk-traceops"
git push -u origin main
```

3. **Actions**: `.github/workflows/ci.yml` her push ve pull request’te `lint` + `build` çalıştırır. Repo public ise ek ayar gerekmez; private’da Actions kullanımı organizasyon ayarlarınıza bağlıdır.

## Repoya eklendikten sonra yapmanız iyi olur

- **Branch koruması** (Settings → Branches): `main` için PR zorunluluğu, CI’nın geçmesi şartı.
- **Vercel / başka host**: Repo’yu import edin; build komutu `npm run build`, çıktı dizini Next için otomatik algılanır. Gerekirse env değişkenlerini panelden tanımlayın.
- **Dependabot** (Settings → Code security): güvenlik güncellemeleri için etkinleştirilebilir.

## Mimari not

- `src/lib/data/seed.ts` — mock veri
- `src/lib/d1/repositories/` — parametreli ve tenant-korumalı D1 veri erişimi

Eski Supabase/PostgreSQL migrationları yalnız geri dönüş ve veri eşleme referansı olarak `supabase/migrations` altında korunur; uygulama runtime’ında kullanılmaz.
- `src/lib/constants/brand.ts` — uygulama adı ve slogan

## Lisans

Özel proje — lisansı repo sahibi belirler.
