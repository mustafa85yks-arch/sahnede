# SAHNEDE

Türkiye'de ne izlendiğini ve ne konuşulduğunu tek sayfada gösteren film/dizi keşif
uygulaması. Streaming platformları ve Türk televizyon dizileri birlikte.

**Site:** https://mustafa85yks-arch.github.io/sahnede/

Sade HTML + CSS + vanilla JS. Sunucu yok, veritabanı yok, üyelik yok.
Takip listesi ve platform seçimi tarayıcıda (`localStorage`) durur.

## Nasıl çalışıyor

`.github/workflows/gunluk.yml` GitHub'ın sunucusunda her gün **07:00, 13:00, 19:00**
(TSİ) `scripts/veri_cek.py`'yi çalıştırır, `data/` klasörünü kendisi yazar.

| Kaynak | Ne verir |
|---|---|
| TMDB | Metadata, poster, Türkiye platform bilgisi, sezon/bölüm tarihleri |
| Wikidata | TMDB id → tr/en Wikipedia makale adı (tahmin edilmez, sitelink okunur) |
| Wikimedia | tr/en Wikipedia günlük sayfa görüntülenmeleri — ana ilgi sinyali |

İlgi sıralaması **ham sayıyla yapılmaz**: Türk yapımları yabancıların ~10 katı
görüntülenme alıyor. Her yapım kendi geçmişine göre ölçülür (son 7 / önceki 7 gün).

## Kurulum

API anahtarı **depoda değil**, GitHub Secrets'ta:
`Settings → Secrets and variables → Actions → TMDB_READ_TOKEN`

Yerelde çalıştırmak için `config.env` (depoya girmez, `.gitignore`'da):

```
TMDB_READ_TOKEN=...
```

```bash
python3 scripts/veri_cek.py          # veriyi uret
python3 -m http.server 8791          # http://localhost:8791
```

## Önemli

- **`data/` klasörünü elle yükleme.** Botun işi; bilgisayarındaki kopya hiçbir zaman güncel değil.
- Proje kararları, ölçümler ve tuzaklar: **`PROJE.md`** — işe başlamadan önce oku.
- Anime ana listelerde gösterilmez; veride `kategori: "anime"` olarak durur, ileride kendi başlığı olacak.

---

Bu ürün TMDB API'sini kullanır, TMDB tarafından onaylanmamıştır.
İlgi verisi Wikimedia sayfa görüntülenmelerinden gelir.
