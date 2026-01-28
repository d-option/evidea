# GTM → Next.js API Migration Guide

Bu doküman, legacy GTM tag’lerinin çağırdığı dış servis URL’lerini Vercel üzerinde çalışan Next.js (App Router) API route’larına taşımak içindir.

## URL Mapping

| Old URL (Legacy) | New Route (Next.js) | Method |
|---|---|---|
| `https://us-central1-ommetrics-cartsharing.cloudfunctions.net/cartSharing` | `/api/cart-sharing` | POST |
| `https://us-central1-ommetrics-cartsharing.cloudfunctions.net/cartSharing/{id}` | `/api/cart-sharing/{id}` | GET |
| `https://us-central1-ommetrics-widget.cloudfunctions.net/app/evideaNPSSaveScore` | `/api/nps/score` | POST |
| `https://us-central1-ommetrics-widget.cloudfunctions.net/app/evideaNPSSaveNote` | `/api/nps/note` | POST |
| `https://assets.ommetrics.net/evidea/?action=add-to-basket&user={user}&product={product}` | `/api/om/add-to-basket?action=add-to-basket&user={user}&product={product}` | GET |

> **Not:** Yeni route’lar CORS (OPTIONS + `Access-Control-Allow-Origin: *`) destekleyecek şekilde implement edilmiştir.

## GTM Cut-over Checklist

- [ ] **Vercel’e deploy** et (Production).
- [ ] **Vercel Postgres** ekle / bağla.
- [ ] **Environment Variables** ayarla:
  - [ ] `POSTGRES_PRISMA_URL`
  - [ ] `POSTGRES_URL_NON_POOLING`
- [ ] **Prisma migration** uygula (Vercel build sırasında veya ayrı bir CI adımıyla).
- [ ] GTM’de ilgili tag’lerdeki URL’leri **yeni domain** + **yeni route** ile değiştir.
- [ ] Browser’da (Prod) `Network` tab’ında:
  - [ ] `cart-sharing` POST 200 + `{ id }`
  - [ ] `cart-sharing/{id}` GET 200 + `{ basket, products }`
  - [ ] `nps/score` POST 200 + `{ id }`
  - [ ] `nps/note` POST 200 + `{ ok: true }`
  - [ ] `om/add-to-basket` GET 200 + `{ ok: true }`
- [ ] Canlı metriklerde (DB kayıtları / logs) veri akışını doğrula.

