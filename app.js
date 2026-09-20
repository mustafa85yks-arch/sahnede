/* Sahnede — arayüz.
   Veri: data/YYYY-AA-GG.js, SAHNE_GUN(...) çağrısıyla gelir (file:// için <script>).
   Sıralama ham görüntülenme sayısıyla YAPILMAZ — Türk yapımları yabancıların ~10 katı
   alıyor. Her bölüm kendi grubunun içinde, değişim oranına göre sıralanır. */

var SAHNE = (function () {
  'use strict';

  var GUN = null;                      // yüklenen gün verisi
  var TUM = [];                        // gösterilecek yapımlar
  var TAKIP_ANAHTAR = 'sahnede-takip';
  var PLATFORM_ANAHTAR = 'sahnede-platform';
  var POSTER = 'https://image.tmdb.org/t/p/w342';
  var KAPAK = 'https://image.tmdb.org/t/p/w780';

  // -------------------------------------------------------------- yardımcı
  function $(s, k) { return (k || document).querySelector(s); }
  function el(etiket, sinif, metin) {
    var e = document.createElement(etiket);
    if (sinif) e.className = sinif;
    if (metin != null) e.textContent = metin;
    return e;
  }
  /* Türkçe "I" tuzağı: "Inter".toLocaleLowerCase('tr') → "ınter".
     Karşılaştırmalarda hep bu kullanılır (kardeş projeden gelen kural). */
  function kat(s) {
    return (s || '').replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase();
  }
  function yerelOku(anahtar, varsayilan) {
    try { return JSON.parse(localStorage.getItem(anahtar)) || varsayilan; }
    catch (e) { return varsayilan; }
  }
  function yerelYaz(anahtar, deger) {
    try { localStorage.setItem(anahtar, JSON.stringify(deger)); } catch (e) {}
  }

  function platformlari(y) {
    var hepsi = [];
    Object.keys(y.platformlar || {}).forEach(function (k) {
      (y.platformlar[k] || []).forEach(function (p) {
        if (hepsi.indexOf(p) < 0) hepsi.push(p);
      });
    });
    return hepsi;
  }

  function degisim(y, proje) {
    var i = y.ilgi && y.ilgi[proje];
    return (i && i.degisim) ? i.degisim : null;
  }
  function hacim(y, proje) {
    var i = y.ilgi && y.ilgi[proje];
    return (i && i.son7) ? i.son7 : 0;
  }
  /* "2026-09-21" -> "21 Eylül Pazartesi" / "yarın" / "bugün" */
  function tarihYaz(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00');
    var bugun = new Date(); bugun.setHours(12, 0, 0, 0);
    var fark = Math.round((d - bugun) / 86400000);
    if (fark === 0) return 'Bugün';
    if (fark === 1) return 'Yarın';
    var s = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
    return (fark > 1 && fark < 8) ? s + ' (' + fark + ' gün sonra)' : s;
  }

  function yuzde(d) {
    if (!d) return null;
    var p = Math.round((d - 1) * 100);
    return (p > 0 ? '+' : '') + p + '%';
  }

  // --------------------------------------------------------------- kartlar
  function kartYap(y) {
    var k = el('div', 'kart');
    var p = el('div', 'poster');

    if (y.poster) {
      var im = el('img');
      im.src = POSTER + y.poster;
      im.alt = y.ad;
      im.loading = 'lazy';
      p.appendChild(im);
    } else {
      p.appendChild(el('div', 'bos', y.ad));
    }

    var d = degisim(y, y.koken === 'turk' ? 'tr' : 'en');
    if (d && d >= 1.15) {
      p.appendChild(el('span', 'rozet artis', yuzde(d)));
    } else if (d && d < 0.85) {
      p.appendChild(el('span', 'rozet dusus', yuzde(d)));
    } else if (y.yeniSayilir) {
      p.appendChild(el('span', 'rozet yeni', 'YENİ'));
    }

    var pf = platformlari(y);
    if (pf.length) p.appendChild(el('span', 'platform', pf.join(' · ')));

    k.appendChild(p);
    k.appendChild(el('h3', null, y.ad));
    k.appendChild(el('p', 'altbilgi',
      [y.yil, y.tur === 'dizi' ? 'dizi' : 'film'].filter(Boolean).join(' · ')));
    k.onclick = function () { detayAc(y); };
    return k;
  }

  function bolumYap(baslik, aciklama, kaynak, liste) {
    if (!liste.length) return null;               // boş bölüm hiç çizilmez
    var b = el('section', 'bolum');
    var u = el('div', 'bolum-ust');
    u.appendChild(el('h2', null, baslik));
    if (aciklama) u.appendChild(el('p', null, aciklama));
    if (kaynak) u.appendChild(el('p', 'kaynak', kaynak));
    b.appendChild(u);
    var y = el('div', 'yatay');
    liste.forEach(function (o) { y.appendChild(kartYap(o)); });
    b.appendChild(y);
    return b;
  }

  // ---------------------------------------------------------------- detay
  function detayAc(y) {
    var g = $('#detayGovde');
    g.innerHTML = '';

    if (y.arkaplan) {
      var kap = el('div', 'detay-kapak');
      var im = el('img');
      im.src = KAPAK + y.arkaplan; im.alt = '';
      kap.appendChild(im);
      g.appendChild(kap);
    }

    var bas = el('div', 'detay-bas');
    bas.appendChild(el('h2', null, y.ad));
    var altYazi = [y.yil, y.tur === 'dizi' ? 'Dizi' : 'Film'].filter(Boolean);
    if (y.turler && y.turler.length) altYazi.push(y.turler.slice(0, 3).join(', '));
    bas.appendChild(el('div', 'alt', altYazi.join(' · ')));
    g.appendChild(bas);

    var takip = yerelOku(TAKIP_ANAHTAR, []);
    var takipte = takip.indexOf(y.id) >= 0;
    var td = el('button', 'takip-dugme', takipte ? '★ Takip ediliyor' : '☆ Takip et');
    td.dataset.takipte = takipte ? '1' : '0';
    td.onclick = function () {
      var l = yerelOku(TAKIP_ANAHTAR, []);
      var i = l.indexOf(y.id);
      if (i >= 0) l.splice(i, 1); else l.push(y.id);
      yerelYaz(TAKIP_ANAHTAR, l);
      var v = l.indexOf(y.id) >= 0;
      td.textContent = v ? '★ Takip ediliyor' : '☆ Takip et';
      td.dataset.takipte = v ? '1' : '0';
    };
    g.appendChild(td);

    if (y.ozet) g.appendChild(el('p', 'ozet', y.ozet));

    // Nerede izlenir — Türk dizilerinde TMDB çoğu zaman bilmiyor, dürüstçe söyle.
    var pf = platformlari(y);
    var kutu = el('div', 'kutu');
    kutu.appendChild(el('h4', null, 'Nerede izlenir'));
    if (pf.length) {
      kutu.appendChild(el('div', 'buyuk', pf.join(' · ')));
    } else if (y.koken === 'turk') {
      kutu.appendChild(el('div', null, 'Televizyonda yayınlanıyor. Platform bilgisi yok.'));
      kutu.appendChild(el('div', 'kaynak', 'TMDB Türk dizilerinin çoğunda platform bilgisi taşımıyor.'));
    } else {
      kutu.appendChild(el('div', null, 'Bilinmiyor.'));
    }
    g.appendChild(kutu);

    // İlgi — kaynağı her zaman yazılır (tek sahte puan üretme ilkesi)
    var it = y.ilgi || {};
    if (it.tr || it.en) {
      var ik = el('div', 'kutu');
      ik.appendChild(el('h4', null, 'İlgi'));
      if (it.tr) {
        var d1 = yuzde(it.tr.degisim);
        ik.appendChild(el('div', 'buyuk',
          it.tr.son7.toLocaleString('tr') + ' görüntülenme' + (d1 ? '  (' + d1 + ')' : '')));
        ik.appendChild(el('div', 'kaynak', 'Kaynak: tr.wikipedia, son 7 gün / önceki 7 gün'));
      }
      if (it.en) {
        var d2 = yuzde(it.en.degisim);
        ik.appendChild(el('div', 'buyuk',
          it.en.son7.toLocaleString('tr') + ' görüntülenme' + (d2 ? '  (' + d2 + ')' : '')));
        ik.appendChild(el('div', 'kaynak', 'Kaynak: en.wikipedia (dünya geneli)'));
      }
      if (it.trEnOran) {
        ik.appendChild(el('div', 'kaynak',
          'Türkiye payı: %' + (it.trEnOran * 100).toFixed(1) +
          ' (yabancı yapımlarda olağan bant %1–2,6)'));
      }
      g.appendChild(ik);
    }

    if (y.sonrakiBolum) {
      var yk = el('div', 'kutu');
      yk.appendChild(el('h4', null, 'Yeni bölüm'));
      yk.appendChild(el('div', 'buyuk', tarihYaz(y.sonrakiBolum)));
      g.appendChild(yk);
    }

    $('#detayKatman').hidden = false;
    $('#detayKatman').scrollTop = 0;
  }

  // ---------------------------------------------------------------- çizim
  function secilenPlatform() { return yerelOku(PLATFORM_ANAHTAR, []); }

  function suzgectenGecir(liste) {
    var sec = secilenPlatform();
    if (!sec.length) return liste;
    return liste.filter(function (y) {
      var pf = platformlari(y);
      if (!pf.length) return y.koken === 'turk';   // TV dizisi elenmesin
      return pf.some(function (p) { return sec.indexOf(p) >= 0; });
    });
  }

  function ciz() {
    var ana = $('#icerik');
    ana.innerHTML = '';
    var liste = suzgectenGecir(TUM);

    var turk = liste.filter(function (y) { return y.koken === 'turk'; });
    var yabanci = liste.filter(function (y) { return y.koken === 'yabanci'; });

    // Hero: en çok yükselen Türk yapımı (Türkiye'de olan bitenin başlığı)
    var hero = turk.slice().filter(function (y) { return degisim(y, 'tr'); })
      .sort(function (a, b) { return degisim(b, 'tr') - degisim(a, 'tr'); })[0];
    if (hero) {
      var h = el('div', 'hero');
      if (hero.arkaplan) {
        var im = el('img'); im.src = KAPAK + hero.arkaplan; im.alt = ''; h.appendChild(im);
      }
      var uz = el('div', 'uzeri');
      uz.appendChild(el('div', 'etiket', 'BU HAFTA EN ÇOK YÜKSELEN'));
      uz.appendChild(el('h2', null, hero.ad));
      uz.appendChild(el('p', null,
        'Türkiye\'de ilgisi ' + yuzde(degisim(hero, 'tr')) + ' arttı'));
      h.appendChild(uz);
      h.onclick = function () { detayAc(hero); };
      ana.appendChild(h);
    }

    var bolumler = [
      bolumYap('Türkiye\'de konuşulanlar',
        'Türk yapımları, kendi geçmişine göre en çok yükselenler',
        'Kaynak: tr.wikipedia sayfa görüntülenmeleri',
        turk.filter(function (y) { return degisim(y, 'tr'); })
            .sort(function (a, b) { return degisim(b, 'tr') - degisim(a, 'tr'); })),

      bolumYap('Bu hafta gelenler',
        'Türkiye\'de bu hafta yayına giren film ve diziler', null,
        liste.filter(function (y) {
          return y.listeler.indexOf('dijital-cikis') >= 0 || y.yeniSayilir;
        })),

      bolumYap('Dünyada gündemde',
        'Yabancı yapımlar, dünya genelinde en çok ilgi görenler',
        'Kaynak: en.wikipedia sayfa görüntülenmeleri',
        yabanci.filter(function (y) { return hacim(y, 'en'); })
               .sort(function (a, b) { return hacim(b, 'en') - hacim(a, 'en'); })),

      bolumYap('Dünya bilmiyor, Türkiye izliyor',
        'Türkiye payı olağan bandın (%1–2,6) üstünde olan yabancı yapımlar',
        'Kaynak: tr.wikipedia / en.wikipedia oranı',
        yabanci.filter(function (y) { return y.ilgi && y.ilgi.trEnOran > 0.026; })
               .sort(function (a, b) { return b.ilgi.trEnOran - a.ilgi.trEnOran; })),

      bolumYap('Yayındaki Türk dizileri',
        'Bu hafta ekranda olanlar', null,
        turk.filter(function (y) { return y.tur === 'dizi'; })
            .sort(function (a, b) { return hacim(b, 'tr') - hacim(a, 'tr'); }))
    ];

    bolumler.forEach(function (b) { if (b) ana.appendChild(b); });
    if (!ana.children.length) {
      ana.appendChild(el('p', 'bos-not', 'Seçtiğin platformlarda bu hafta bir şey yok.'));
    }
  }

  function platformCipleriCiz() {
    var sayac = {};
    TUM.forEach(function (y) {
      platformlari(y).forEach(function (p) { sayac[p] = (sayac[p] || 0) + 1; });
    });
    var adlar = Object.keys(sayac).sort(function (a, b) { return sayac[b] - sayac[a]; }).slice(0, 12);
    var kap = $('#platformCip');
    kap.innerHTML = '';
    var sec = secilenPlatform();

    var hepsi = el('button', 'cip', 'Hepsi');
    hepsi.setAttribute('aria-pressed', sec.length ? 'false' : 'true');
    hepsi.onclick = function () { yerelYaz(PLATFORM_ANAHTAR, []); platformCipleriCiz(); ciz(); };
    kap.appendChild(hepsi);

    adlar.forEach(function (ad) {
      var c = el('button', 'cip', ad);
      c.setAttribute('aria-pressed', sec.indexOf(ad) >= 0 ? 'true' : 'false');
      c.onclick = function () {
        var l = secilenPlatform();
        var i = l.indexOf(ad);
        if (i >= 0) l.splice(i, 1); else l.push(ad);
        yerelYaz(PLATFORM_ANAHTAR, l);
        platformCipleriCiz(); ciz();
      };
      kap.appendChild(c);
    });
  }

  // ---------------------------------------------------------- arama/takip
  function satirYap(y) {
    var s = el('div', 'satir');
    if (y.poster) {
      var im = el('img'); im.src = POSTER + y.poster; im.alt = ''; im.loading = 'lazy';
      s.appendChild(im);
    } else { s.appendChild(el('div', 'bosk')); }
    var m = el('div');
    m.appendChild(el('div', 'ad', y.ad));
    m.appendChild(el('div', 'alt',
      [y.yil, y.tur === 'dizi' ? 'dizi' : 'film', platformlari(y).join(' · ')]
        .filter(Boolean).join(' · ')));
    s.appendChild(m);
    s.onclick = function () { detayAc(y); };
    return s;
  }

  function aramaCiz() {
    var q = kat($('#aramaGirdi').value.trim());
    var k = $('#aramaSonuc');
    k.innerHTML = '';
    if (q.length < 2) { k.appendChild(el('p', 'bos-not', 'En az iki harf yaz.')); return; }
    var bulunan = TUM.filter(function (y) {
      return kat(y.ad).indexOf(q) >= 0 || kat(y.orijinalAd).indexOf(q) >= 0;
    });
    if (!bulunan.length) { k.appendChild(el('p', 'bos-not', 'Bulunamadı.')); return; }
    bulunan.forEach(function (y) { k.appendChild(satirYap(y)); });
  }

  function takipCiz() {
    var l = yerelOku(TAKIP_ANAHTAR, []);
    var k = $('#takipListe');
    k.innerHTML = '';
    var bulunan = TUM.filter(function (y) { return l.indexOf(y.id) >= 0; });
    if (!bulunan.length) {
      k.appendChild(el('p', 'bos-not',
        'Henüz takip ettiğin bir şey yok. Bir yapıma dokunup "Takip et" de.'));
      return;
    }
    bulunan.forEach(function (y) { k.appendChild(satirYap(y)); });
  }

  // ----------------------------------------------------------- veri yükle
  function gunYukle(tarih, kalanDeneme, bitti) {
    var s = document.createElement('script');
    s.src = 'data/' + tarih + '.js';
    s.onload = function () { bitti(true); };
    s.onerror = function () {
      if (kalanDeneme <= 0) { bitti(false); return; }
      var d = new Date(tarih + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      gunYukle(d.toISOString().slice(0, 10), kalanDeneme - 1, bitti);
    };
    document.head.appendChild(s);
  }

  function istanbulBugun() {
    var s = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    return s;
  }

  function baslat() {
    // katman kapatma
    Array.prototype.forEach.call(document.querySelectorAll('[data-kapat]'), function (b) {
      b.onclick = function () { $('#' + b.dataset.kapat).hidden = true; };
    });
    $('#araDugme').onclick = function () {
      $('#aramaKatman').hidden = false; $('#aramaGirdi').focus(); aramaCiz();
    };
    $('#takipDugme').onclick = function () { $('#takipKatman').hidden = false; takipCiz(); };
    $('#aramaGirdi').oninput = aramaCiz;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        Array.prototype.forEach.call(document.querySelectorAll('.katman'), function (k) {
          k.hidden = true;
        });
      }
    });

    gunYukle(istanbulBugun(), 7, function (oldu) {
      if (!oldu || !GUN) {
        $('#icerik').innerHTML =
          '<p class="bos-not">Veri dosyası bulunamadı.<br>' +
          'scripts/veri_cek.py çalıştırıldı mı?</p>';
        return;
      }
      TUM = (GUN.yapimlar || []).filter(function (y) { return y.goster; });
      platformCipleriCiz();
      ciz();
      $('#kaynakSatiri').textContent =
        GUN.tarih + ' · ' + TUM.length + ' yapım · güncellendi ' +
        (GUN.uretildi || '').slice(11, 16);
    });
  }

  // veri dosyasının çağırdığı kanca
  window.SAHNE_GUN = function (veri) { GUN = veri; };

  return { baslat: baslat };
})();
