# SAHNEDE — Proje Karar Notu

Son güncelleme: 20 Eylül 2026 gece (bot + arayüz çalışır durumda), ev bilgisayarı (`mustafayuksel`).
Kod henüz yok. Bu dosya kararları kaydeder; yazmaya başlamadan önce baştan sona okunmalı.
Kullanıcı Mustafa, dil Türkçe. Çalışma ilkeleri Günün Maçları projesindekiyle aynı.

---

## 1. Ne bu proje

Türkiye'de **ne izlendiğini ve ne konuşulduğunu** tek sayfada gösteren film/dizi keşif
uygulaması. Streaming platformlarını ve Türk televizyon dizilerini birlikte kapsar.

Klasik bir "ne izlesem" öneri motoru değil; **keşif katmanı**: hangi yapım şu an ilgi
görüyor, nerede izlenir, yeni sezon ne zaman, ve yapımlar arasında **açıklanabilir**
bağlantılar (aynı yönetmen / senarist / görüntü yönetmeni).

Fikrin çıkışı: GPT ile hazırlanan `Streaming_Discovery_Proje_Brifi.docx` (Mustafa'nın
Downloads klasöründe) + mockup görseli. Bu not o brifin **yapılabilirlik süzgecinden
geçmiş** hâlidir; brifteki her özellik burada yok, sebebi §4'te.

## 2. Verilen kararlar (değiştirmeden önce Mustafa'ya sor)

- **Türk TV dizileri kapsama dahil.** Bu yüzden proje "streaming keşif" değil,
  "Türkiye'de ne izleniyor". Mockup'taki Kızılcık Şerbeti / İnci Taneleri zaten bunu söylüyordu.
- **Telefon önceliği (şimdilik).** Mockup masaüstü için çizildi ama havası korunarak
  mobil öncelikli kurulacak. Günün Maçları gibi ana ekrana eklenip kullanılacak.
- **Editoryal içerik ("Tarihte Bugün", "Film Kültürü") kalıyor** — Mustafa ile birlikte
  **haftalık** üretilecek. Şart: güncellenmediği hafta kutu boş görünmemeli, sessizce gizlenmeli.
- **Üyelik yok, sunucu yok.** Takip listesi ve platform seçimi tarayıcıda (`localStorage`).
  Mockup'taki giriş yapmış kullanıcı ("Deniz") uygulanmayacak.
- **Bildirim yok, takvim var.** Günün Maçları'ndaki kararın aynısı; push bildirim sunucu ister.
- **Poster kullanılacak.** TMDB posterleri kaynak gösterilerek kullanılabiliyor; maç
  projesindeki "logo yok" kararı buraya geçmez (orada sorun kulüp armalarının tescili idi).
- **Türk ve yabancı yapımlar ayrı listelerde.** Mustafa'nın önerisi; ölçekten doğan
  10 kat farkı normalizasyonla uğraşmadan yapısal olarak çözüyor. Ayrım TMDB'nin
  `origin_country` / `original_language` alanıyla yapılır — Wikipedia'da sayfası var mı
  diye bakılmaz (Kızılcık Şerbeti'nin İngilizce sayfası yok ama tutmuş Türk dizilerinin oluyor).
- **Yabancı yapımların sinyali en.wikipedia'dan alınır.** tr.wikipedia'da hacim çok düşük
  (Shōgun: 30 günde 941, yani günde ~30 kişi — trend hesaplanmaz). en.wikipedia 87 bin, sağlam.
  Ama bu **dünyanın** ilgisidir, Türkiye'nin değil; kutunun adı buna göre dürüst olacak.
- **Anime ana listelerde gösterilmez** (20 Eylül 2026). İleride kendi başlığı olacak,
  o yüzden veriden **silinmez**, `kategori: "anime"` olarak işaretlenir ve `goster: false`
  alır. Tespit: TMDB `anime`/`donghua` anahtar kelimesi, ya da Animasyon türü + JP/CN/KR/TW
  kökeni. Kore dizileri (The Scandal, Made in Korea) anime sayılmaz, listede kalır.
- **Tek sahte popülerlik puanı üretilmeyecek.** Her sinyalin kaynağı kartta yazar.
  (Brifin 5. maddesi; doğru ilke, korunuyor.)

## 3. Mimari — Günün Maçları modelinin aynısı

Sunucu ve veritabanı yok. GitHub Actions'taki bot veriyi çeker, **statik JSON** üretir,
GitHub Pages yayınlar. Maliyet sıfır, bakım sıfır. Brifteki "veritabanı şeması" bu yüzden
uygulanmadı; birkaç bin yapım birkaç MB eder, dosya yeter.

API anahtarları **GitHub Secrets**'ta durur, depo açık kalabilir, anahtar görünmez.

## 4. Veri kaynakları — doğrulanmış durum (20 Eylül 2026)

| Kaynak | Ne verir | Durum |
|---|---|---|
| **TMDB** | Metadata, poster, TR platform bilgisi, ekip, sezon/bölüm tarihleri | ✅ Ücretsiz, anahtar gerekir |
| **tr.wikipedia sayfa görüntülenme** | Ana ilgi sinyali, her tür yapımı kapsar | ✅ **Ölçüldü, sağlam** (aşağıda) |
| **YouTube Data API** | Türk dizisi bölüm/fragman görüntülenmesi, TR trend listesi | ✅ Ücretsiz kota, anahtar gerekir |
| **TİAK reyting** | TV'de resmî izlenme, günlük Top 10, 2017'ye kadar arşiv | ⚠️ **Çalışıyor** ama 2-3 gün gecikmeli, listenin yarısı haber bülteni, streaming yok, lisans şartları okunmalı |
| **X trend aynaları** (getdaytrends vb.) | "Dün gündem oldu" rozeti | 🔸 Sadece süs. Çok gürültülü, kırılgan |
| Netflix resmî Top 10 | TR haftalık en çok izlenen | ✅ Ama sadece Netflix, haftalık |
| Prime / Disney+ / diğer izlenme | — | ❌ Yayınlamıyorlar |
| X / TikTok / Instagram / Ekşi API | — | ❌ Ücretli, kapalı ya da şartlara aykırı |

### Ölçüm sonucu — tr.wikipedia (30 gün, 21 Ağu – 19 Eyl 2026)

| Yapım | 30 gün | Son 7 gün | Değişim |
|---|---|---|---|
| Kızılcık Şerbeti | 20.128 | 6.566 | +33% |
| Sevdiğim Sensin | 15.011 | 4.480 | sabit |
| Aşk-ı Memnu (2008) | 10.374 | 2.088 | sabit |
| Dune: Çöl Gezegeni | 3.162 | 561 | −16% |
| The Last of Us | 3.149 | 584 | −14% |
| Shōgun | 941 | 278 | +17% |

**Doğrulama:** Sevdiğim Sensin hem TİAK'ta 17 Eylül'ün 2 numarası hem Wikipedia'da yüksek.
İki bağımsız kaynak örtüşüyor.

### Ölçüm sonucu — tr/en karşılaştırması (aynı dönem)

| Yapım | tr.wiki | en.wiki | tr/en |
|---|---|---|---|
| The Last of Us | 3.149 | 120.440 | 2,6% |
| Dune: Çöl Gezegeni | 3.162 | 160.492 | 2,0% |
| Squid Game | 1.443 | 63.356 | 2,3% |
| Shōgun | 941 | 87.862 | 1,1% |
| Kızılcık Şerbeti | 20.128 | sayfa yok | — |

**Yabancı yapımların tr/en oranı %1–2,6 bandında.** Bu Türkiye'nin normal payı. Oranı bu
bandın belirgin üstündeki yabancı yapım = **Türkiye'de orantısız ilgi görüyor**. Hiçbir
uluslararası uygulamada olmayan özgün keşif sinyali; brifin aradığı keşif tam olarak bu.
Uyarı: oran düşük hacimde oynak, hesaplamadan önce en.wikipedia'da asgari hacim eşiği aranacak.

**Eski kural (artık kısmen geçersiz):** Türk dizileri ile yabancı yapımlar arasında ~10 kat fark var. Sıralama **ham
sayıyla değil, her yapımın kendi geçmişine göre değişimle** yapılacaktı. Türk/yabancı ayrımı bu sorunu
zaten yapısal olarak çözüyor; değişim bazlı sıralama yine tercih edilir ("konuşuluyor"
mutlak hacim değil hareket demektir) ama artık zorunluluk değil.


## 4b. TMDB fizibilitesi — yapıldı, sonuç OLUMLU (20 Eylül 2026)

Anahtar alındı, `~/Documents/SAHNEDE/config.env` (yerel, izin 600, `.gitignore`'da).
Ölçüm penceresi 14–20 Eylül 2026.

| Ölçüm | Sonuç |
|---|---|
| TR dijital film çıkışı (1 hafta) | **17 film** |
| Bu hafta yayındaki Türk dizisi | **28** |
| TR platformlarında yayındaki yabancı dizi | **106** |
| TR'de tanımlı platform sayısı | **43** |

**Hacim küçük.** Haftada yüzlerce çöp içerik korkusu gerçekleşmedi; sıkı kalite eşiğine
gerek olmayabilir. Eşik kararı (§8) bu yüzden düşük öncelikli.

### Fizibiliteden çıkan dört bulgu

1. **TMDB `vote_count` Türk içeriğinde kullanılamaz.** Kızılcık Şerbeti 19 oy, Reacher 3.365.
   Genel eşik bütün Türk yapımlarını siler. Türk içeriğinde popülerlik TİAK + tr.wikipedia +
   YouTube'dan gelir, TMDB'den değil. (10 kat ölçek farkının üçüncü tezahürü.)
2. **TMDB, Türk dizilerinin nerede izleneceğini çoğu zaman bilmiyor.**
   Kızılcık Şerbeti → TR platform verisi **yok**. Uzak Şehir → Prime + puhutv.
   Türk dizilerinde "nerede izlenir" **kanal adına** düşecek → TİAK entegrasyonu
   tercih değil **zorunluluk**.
3. **Platform kapsamı eksik:** Exxen, TOD TV, puhutv, TV+, MUBI var; **BluTV ve Gain yok.**
4. **Wikidata zinciri çalışıyor, §6'daki tuzak çözüldü.** TMDB id → `/external_ids` →
   `wikidata_id` → Wikidata sitelinks → tr/en makale adı. Dördü de doğru çözüldü.
   Kanıt: `La Casa de Papel → tr="La casa de papel", en="Money Heist"` — küçük harfli
   "casa/papel" yüzünden elle tahmin tutmuyordu.
   Not: Türk dizilerinin İngilizce makalesi yok (Kızılcık Şerbeti `enwiki=None`) →
   tr/en oranı sadece yabancı yapımlara uygulanır, zaten tasarım böyleydi.

### Çalışan uç noktalar (bot bunları kullanacak)

- Bu hafta dijital çıkanlar: `/discover/movie?region=TR&with_release_type=4|5&release_date.gte=&release_date.lte=`
- Türk dizileri: `/discover/tv?with_origin_country=TR&air_date.gte=&air_date.lte=`
- Yabancı diziler: `/discover/tv?watch_region=TR&with_watch_monetization_types=flatrate`
- Nerede izlenir: `/tv/{id}/watch/providers` → `results.TR`
- Wikipedia adı: `/{tip}/{id}/external_ids` → `wikidata_id` → wikidata `wbgetentities&props=sitelinks`

Kimlik doğrulama `Authorization: Bearer <TMDB_READ_TOKEN>` başlığıyla yapılıyor, v3 anahtarı
sorgu parametresi olarak da çalışır.


## 4c. İlk gerçek koşu — 20 Eylül 2026

`scripts/veri_cek.py` yazıldı ve çalıştı. 103 yapım (29 Türk / 74 yabancı), **hiç istek
hatası yok**, ~4 dakika. Çıktı: `data/2026-09-20.json`.

Kapsama: wikipedia eşleşen 68/103 · ilgi verisi olan 67 · platformu bilinen 68.

### Sinyal çalışıyor

| Yapım | kaynak | son 7 gün | değişim |
|---|---|---|---|
| Uzak Şehir | tr.wiki | 8.272 | **+77%** |
| Kızılcık Şerbeti | tr.wiki | 6.566 | +33% |
| Daha 17 | tr.wiki | 10.607 | −21% |
| Lanterns | en.wiki | 593.875 | +33% |
| Neagley | en.wiki | 318.693 | **+878%** |
| The Scandal | en.wiki | 107.595 | +773% |

### Kalite eşiği kararı: oy sayısı KULLANILMAYACAK

Ölçüldü ve çürütüldü. **Neagley 78 oy, +%878. The Scandal 7 oy, +%773.** Minimum oy
eşiği haftanın en çok patlayan iki dizisini silerdi. Oy sayısı yeni içerikte her zaman
düşüktür; tam da yakalamak istediğimiz şeyi eler.

**Bunun yerine filtre sinyalin kendisidir:**
1. En az bir sinyali olan (wikipedia / TİAK / YouTube) yapım listeye girer.
2. Hiç sinyali olmayan **yabancı** yapım gizlenir.
3. Hiç sinyali olmayan **Türk** yapımı gizlenmez; ilgi sayısı olmadan "bu hafta yayında"
   listesinde durur (TİAK/YouTube gelince sayısı da olur).
4. **Yeni çıkmış ama sinyalsiz yapımlar, tanınan bir TR platformunda yayındaysa girer.**
   Wikipedia yeni içeriğe geç yetişiyor: "Canavar: Lizzie Borden'ın Hikâyesi" Netflix'te
   yayında ama `wikidata_id` yok — kural düzeltilmeden gizleniyordu. Yenilik zaten
   göstermek istediğimiz şey; platform da güvenilirlik sağlıyor. `yeniSayilir: true`.
5. **Latin alfabesi dışı başlıkla dönen yapımlar gizlenir.** TMDB'de Türkçe/İngilizce adı
   yoksa bizim kitleye hitap etmiyor demektir. Bu kural `魔入りました！入間くん`,
   `吞噬星空`, `ヤニねこ`, `名探偵プリキュア！` gibi ~6 anime kaydını temizliyor.

### Filtre sonrası durum (20 Eylül 2026)

103 yapım → **80 gösteriliyor**, 21 anime (ayrı başlık için saklanıyor), 2 gerçekten
elendi (SAMURAI, MONSTER — sinyali de platformu da yok).

### Wikipedia'nın kör noktası — TİAK artık zorunlu

**Güneşin Doğduğu Yer**: TİAK'ta 17 Eylül'ün **3 numarası** (4,66 reyting), ama
`wikidata_id` **yok**, tr.wikipedia makalesi **yok** (sayfa id `-1`). Türkiye'nin en çok
izlenen üçüncü programı ana sinyalimize tamamen görünmez.

Aynı şekilde 29 Türk yapımının 18'inde wikipedia sinyali yok. Bu yüzden:
- **TİAK entegrasyonu ertelenmez** — Türk TV dizilerinde tek güvenilir kapsama o.
- **YouTube anahtarı önemli** (daha önce "engel değil" denmişti, **bu düzeltildi**):
  yeni başlayan Türk dizileri Wikipedia'ya girmeden önce YouTube'da bölüm/fragman
  yayınlıyor; yeni diziyi yakalayabilecek tek sinyal o.

Anime tarafında ayrı bir sorun: Kaiju No. 8'in `wikidata_id`'si var (Q115777186) ama
trwiki/enwiki sitelink'i yok — zincir animede zayıf. 3. kural bunları zaten eliyor.


## 4d. Arayüz — ilk sürüm çalışıyor (20 Eylül 2026)

`index.html` + `style.css` + `app.js`. Mobil öncelikli, koyu/sinematik, poster merkezli.
Yerelde denemek için: `cd ~/Documents/SAHNEDE && python3 -m http.server 8791`
→ http://localhost:8791

Veri `.js` olarak yazılıyor (`SAHNE_GUN({...})`), `.json` değil: `index.html`'e çift
tıklayınca `file://` altında `fetch()` çalışmaz, `<script>` çalışır. Kardeş projeden
devralınan çözüm. Uygulama bugünün dosyasını arar, yoksa 7 gün geriye düşer.

**Ekranlar:** ana sayfa (hero + 5 bölüm), detay katmanı, arama, takip listesi.
**Bölümler:** Türkiye'de konuşulanlar · Bu hafta gelenler · Dünyada gündemde ·
Dünya bilmiyor Türkiye izliyor · Yayındaki Türk dizileri. **Boş bölüm hiç çizilmez.**

Her ilgi sayısının altında kaynağı yazıyor ("Kaynak: tr.wikipedia, son 7 gün / önceki 7 gün").
Platformu bilinmeyen Türk dizisinde dürüst metin: "Televizyonda yayınlanıyor. Platform
bilgisi yok." + sebebi.

Takip listesi ve platform seçimi `localStorage`'da (`sahnede-takip`, `sahnede-platform`).

### Yaşanan tuzaklar

- **CSS `display:flex`, HTML `hidden` özniteliğini eziyor** → katmanlar hep açık kaldı,
  sayfa boş göründü. `.katman[hidden] { display: none; }` gerekiyor.
- Türkçe `toLocaleLowerCase('tr')` tuzağı burada da var; `kat()` fonksiyonu kullanılıyor.
- Tarayıcı JS/CSS'i önbellekte tutuyor; `?v=` ile sürüm verilmiş.

### "Dünya bilmiyor, Türkiye izliyor" gerçekten çalışıyor

İlk çıktı: **Maşa ile Koca Ayı** ve **WWE Friday Night SmackDown** — ikisi de Türkiye'de
gerçekten orantısız popüler. Kutu seyrek ama anlamlı sonuç veriyor.

### Henüz YOK (§5'te vaat edilenler)

- **Yönetmen / senarist / görüntü yönetmeni bağlantıları.** Bot `credits` çekmiyor;
  §5'in en ayırt edici özelliği henüz yazılmadı. Sıradaki iş bu.
- TİAK reyting okuyucu · YouTube sinyali · haftalık editoryal kutu
- GitHub deposu ve `gunluk.yml` zamanlı görevi

## 5. İlk sürüm kapsamı

**Ana sayfa (mobil):**
- Bu hafta Türkiye'de yayına girenler
- Türkiye'de konuşulanlar — **Türk yapımları** (tr.wikipedia değişimi + YouTube)
- Dünyada gündemde — **yabancı yapımlar** (en.wikipedia)
- **"Dünya bilmiyor, Türkiye izliyor"** — tr/en oranı bandın üstündeki yabancı yapımlar
- Türkiye'de TV'de en çok izlenen diziler (TİAK, haftalık, dizilere filtreli)
- Takip ettiklerinde yaklaşan bölümler
- Haftalık editoryal kutu (boşsa gizlenir)

**Detay sayfası:** Poster, nerede izlenir, sezon/bölüm, takip et, ilgi özeti + kaynağı,
"aynı yönetmen / senarist / görüntü yönetmeninden" bağlantıları

**Ayrıca:** Arama, platform filtresi (kullanıcı kendi aboneliklerini seçer)

**İlk sürüme girmeyecek:** kişiselleştirilmiş öneri motoru, ruh hali önerisi, gerçek
izlenme verisi (Netflix dışı), sosyal medya analizi, bildirim, gelişmiş ekip grafı,
"benzer atmosfer" eşleştirmesi (LLM ile, v2).

## 6. Şimdiden bilinen tuzaklar

- **Wikipedia makale eşleşmesi aramayla yapılamaz.** "Güneşin Doğduğu Yer" araması oyuncu
  **Ali Erkazan**'ın sayfasını döndürdü. İkinci kez doğrulandı: "La Casa de Papel" ve
  "Wednesday" için tahmin edilen Türkçe makale adları da tutmadı, veri boş döndü.
  Doğru yol: TMDB → Wikidata → sitelink (hem tr hem en makale adı oradan alınır).
- **TİAK program adları büyük harf ve Türkçe karaktersiz** ("GUNESIN DOGDUGU YER").
  TMDB adlarıyla eşleştirmek için harf normalizasyonu gerekir — Günün Maçları'ndaki
  `GM.fold` mantığının aynısı.
- TİAK günlük Top 10'un yarısı ana haber ve gündüz kuşağı; dizi filtresi şart.
- Wikimedia API `User-Agent` başlığı istiyor, yoksa reddediyor.
- X trend listesi film/dizi içermeyebilir (20 Eylül ölçümünde ilk 30'da hiç yoktu) ve
  siyasi kampanya hashtag'leriyle dolu. **Sadece bizim başlık listemizle eşleşenler alınacak**,
  gerisi çöpe — politik gürültü böylece kendiliğinden elenir.

## 7. Sıradaki adım

1. ~~TMDB anahtarı~~ ✅ alındı.
2. ~~TMDB fizibilitesi~~ ✅ yapıldı, olumlu (§4b).
3. ~~Bot~~ ✅ `scripts/veri_cek.py` yazıldı, gerçek veri üretiyor (§4c).
4. ~~Filtre kuralları + arayüz~~ ✅ çalışıyor (§4c, §4d).
   **Sıradaki: `credits` (yönetmen/senarist/görüntü yönetmeni bağlantıları) — §5'in
   en ayırt edici özelliği, henüz yok.**
5. Sonra TİAK okuyucu, sonra GitHub'a taşıma (depoyu Mustafa web arayüzünden açar).
6. YouTube Data API anahtarı — hâlâ boş. §4c'den sonra önceliği **arttı**.

## 8. Açık başlıklar

- [ ] Proje adı: mockup'ta **"Sahnede — İyi hikayeler hep var."** yazıyor. Kalsın mı? (soruldu, cevap yok)
- [ ] TİAK verisini uygulamada yeniden yayınlamanın şartları okunacak; en azından kaynak
      gösterilip kendi sayfalarına bağlanacak.
- [ ] Editoryal kutunun teknik biçimi: botun okuyacağı basit bir dosya (haftalık elle doldurulur).
- [x] ~~Kalite eşiği sayısı~~ — çözüldü: oy sayısı kullanılmayacak, filtre sinyal tabanlı (§4c).
- [ ] BluTV ve Gain TMDB'de yok; bu platformlardaki içerik için ne yapılacak?
- [ ] YouTube Data API anahtarı alınacak.
