#!/usr/bin/env python3
"""Günlük yapım dosyasını (data/YYYY-AA-GG.js) üretir.

Kaynaklar
    TMDB          : metadata, poster, Türkiye platform bilgisi, çıkış/yayın tarihleri.
                    Anahtar TMDB_READ_TOKEN (Bearer). Yerelde config.env, GitHub'da Secrets.
    Wikidata      : TMDB id -> wikidata_id -> tr/en Wikipedia makale adı.
                    Makale adı ASLA tahmin edilmez; "La Casa de Papel" gerçekte
                    "La casa de papel" (küçük harf) — elle tahmin tutmuyor.
    Wikimedia     : tr/en Wikipedia günlük sayfa görüntülenmeleri. Ana ilgi sinyali.

Türk / yabancı ayrımı origin_country + original_language ile yapılır, Wikipedia'da
sayfası var mı diye bakılmaz (tutmuş Türk dizilerinin İngilizce sayfası olabiliyor).

İlgi sıralaması ham sayıyla YAPILMAZ: Türk yapımları yabancıların ~10 katı görüntülenme
alıyor. Her yapım kendi geçmişine göre ölçülür (son 7 gün / önceki 7 gün).
Yabancı yapımlarda ayrıca tr/en oranı hesaplanır; %1-2,6 bandının üstü "Türkiye
orantısız ilgi gösteriyor" demektir.

TMDB oy sayısı Türk içeriğinde kalite ölçüsü olarak KULLANILAMAZ
(Kızılcık Şerbeti 19 oy, Reacher 3.365) — eşik uygulanacaksa gruba özel olmalı.

Kullanım:
    python3 scripts/veri_cek.py                 # bu hafta
    python3 scripts/veri_cek.py --limit 10      # hızlı deneme, her listeden 10 kayıt
    python3 scripts/veri_cek.py --gun 2026-09-20

Güvenlik: hiç yapım çıkmazsa o günün mevcut dosyasına dokunulmaz.
"""
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo('Europe/Istanbul')
KOK = Path(__file__).resolve().parent.parent
VERI = KOK / 'data'
ONBELLEK = VERI / '_wiki_onbellek.json'
TMDB = 'https://api.themoviedb.org/3'
UA = 'sahnede/0.1 (kisisel, ticari olmayan proje; iletisim: mustafa85yks@gmail.com)'
GUN_SAYISI = 7          # kaç günlük pencere taranır
GECMIS_GUN = 30         # wikipedia için kaç günlük geçmiş çekilir
BEKLE = 0.12            # istekler arası nezaket beklemesi (sn)

HATALAR = []

# Latin alfabesi dışı başlıkla dönen yapım elenir: TMDB'de Türkçe/İngilizce adı yoksa
# bizim kitleye hitap etmiyor demektir (Japonca/Çince başlıklı anime kayıtları).
LATIN_DISI = re.compile(
    r'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\u0400-\u04ff'
    r'\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f]')


def latin_mi(ad):
    return not LATIN_DISI.search(ad or '')


# Anime ana listelerde GÖSTERİLMEZ (Mustafa'nın kararı, 20 Eylül 2026): ileride kendi
# başlığı olacak, o yüzden veriden silinmez, kategori olarak işaretlenir.
ANIME_ULKE = {'JP', 'CN', 'KR', 'TW'}
ANIME_TUR_ID = 16          # TMDB "Animation"


def anime_mi(d):
    kw = d.get('keywords') or {}
    adlar = {k['name'].lower() for k in (kw.get('results') or kw.get('keywords') or [])}
    if 'anime' in adlar or 'donghua' in adlar:
        return True
    tur_idler = {g['id'] for g in d.get('genres', [])}
    ulkeler = set(d.get('origin_country') or [])
    if ANIME_TUR_ID in tur_idler and (ulkeler & ANIME_ULKE):
        return True
    # başlık Latin alfabesi dışıysa ve Asya kökenliyse: pratikte anime/donghua
    ad = d.get('name') or d.get('title') or ''
    return bool(not latin_mi(ad) and (ulkeler & ANIME_ULKE))


# ----------------------------------------------------------------- yardımcılar
def ayar(ad):
    """Önce ortam değişkeni (GitHub Actions), yoksa yerel config.env."""
    d = os.environ.get(ad)
    if d:
        return d.strip()
    yol = KOK / 'config.env'
    if yol.exists():
        e = dict(re.findall(r'^(\w+)=(.*)$', yol.read_text(encoding='utf8'), re.M))
        return (e.get(ad) or '').strip()
    return ''


def getir(url, baslik=None, deneme=3):
    istek = urllib.request.Request(url, headers=baslik or {'User-Agent': UA})
    son = None
    for i in range(deneme):
        try:
            with urllib.request.urlopen(istek, timeout=30) as c:
                return json.load(c)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None            # yok, hata değil
            son = e
            time.sleep(1 + i)
        except Exception as e:
            son = e
            time.sleep(1 + i)
    HATALAR.append(f'{url.split("?")[0]} -> {son}')
    return None


def tmdb(yol, **p):
    time.sleep(BEKLE)
    u = TMDB + yol + ('?' + urllib.parse.urlencode(p) if p else '')
    return getir(u, {'Authorization': 'Bearer ' + TOKEN, 'accept': 'application/json',
                     'User-Agent': UA})


# ----------------------------------------------------------------- wikipedia
def _onbellek_yukle():
    if ONBELLEK.exists():
        try:
            return json.loads(ONBELLEK.read_text(encoding='utf8'))
        except Exception:
            pass
    return {}


def wiki_adlari(qid, onbellek):
    """wikidata_id -> {'tr': makale adı, 'en': makale adı}. Tahmin yok, sitelink okunur."""
    if qid in onbellek:
        return onbellek[qid]
    time.sleep(BEKLE)
    u = ('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json'
         f'&props=sitelinks&ids={qid}')
    d = getir(u)
    sonuc = {'tr': None, 'en': None}
    if d:
        sl = (d.get('entities', {}).get(qid, {}) or {}).get('sitelinks', {})
        sonuc['tr'] = (sl.get('trwiki') or {}).get('title')
        sonuc['en'] = (sl.get('enwiki') or {}).get('title')
    onbellek[qid] = sonuc
    return sonuc


def gorunt(proje, makale, bitis):
    """Günlük görüntülenme listesi. Yoksa None."""
    if not makale:
        return None
    bas = (bitis - dt.timedelta(days=GECMIS_GUN)).strftime('%Y%m%d')
    a = urllib.parse.quote(makale.replace(' ', '_'), safe='')
    u = (f'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/'
         f'{proje}/all-access/user/{a}/daily/{bas}/{bitis.strftime("%Y%m%d")}')
    time.sleep(BEKLE)
    d = getir(u)
    if not d or 'items' not in d:
        return None
    return [x['views'] for x in d['items']]


def ilgi_hesapla(gunler):
    """son 7 gün, önceki 7 gün ve değişim oranı."""
    if not gunler or len(gunler) < 14:
        return None
    son, onceki = sum(gunler[-7:]), sum(gunler[-14:-7])
    return {
        'son7': son,
        'onceki7': onceki,
        'degisim': round(son / onceki, 3) if onceki else None,
    }


# ----------------------------------------------------------------- TMDB listeleri
def liste_cek(yol, etiket, limit, **p):
    """discover sonuçlarını (id, tip, liste etiketi) olarak döndürür."""
    cikti = []
    for sayfa in (1, 2, 3):
        d = tmdb(yol, page=sayfa, language='tr-TR', sort_by='popularity.desc', **p)
        if not d:
            break
        for o in d.get('results', []):
            cikti.append(o)
            if limit and len(cikti) >= limit:
                return cikti, etiket
        if sayfa >= d.get('total_pages', 1):
            break
    return cikti, etiket


def kokeni(o):
    ulkeler = o.get('origin_country') or []
    dil = o.get('original_language')
    return 'turk' if ('TR' in ulkeler or dil == 'tr') else 'yabanci'


def yapim_detay(tip, tmdb_id):
    """Tek çağrıda detay + external_ids + TR platformları."""
    return tmdb(f'/{tip}/{tmdb_id}', language='tr-TR',
                append_to_response='external_ids,watch/providers,keywords')


# ----------------------------------------------------------------- ana akış
def main():
    global TOKEN
    TOKEN = ayar('TMDB_READ_TOKEN')
    if not TOKEN:
        sys.exit('TMDB_READ_TOKEN yok. config.env doldurulmali (ya da ortam degiskeni).')

    limit = 0
    bugun = dt.datetime.now(TZ).date()
    a = sys.argv[1:]
    if '--limit' in a:
        limit = int(a[a.index('--limit') + 1])
    if '--gun' in a:
        bugun = dt.date.fromisoformat(a[a.index('--gun') + 1])

    bas = (bugun - dt.timedelta(days=GUN_SAYISI - 1)).isoformat()
    bit = bugun.isoformat()
    print(f'Pencere: {bas} .. {bit}' + (f'  (limit {limit})' if limit else ''))

    ham = []
    listeler = [
        ('/discover/movie', 'dijital-cikis', 'film',
         dict(region='TR', with_release_type='4|5',
              **{'release_date.gte': bas, 'release_date.lte': bit})),
        ('/discover/tv', 'turk-dizi', 'dizi',
         dict(with_origin_country='TR',
              **{'air_date.gte': bas, 'air_date.lte': bit})),
        ('/discover/tv', 'yabanci-dizi', 'dizi',
         dict(watch_region='TR', with_watch_monetization_types='flatrate',
              **{'air_date.gte': bas, 'air_date.lte': bit})),
    ]
    for yol, etiket, tur, p in listeler:
        sonuc, _ = liste_cek(yol, etiket, limit, **p)
        print(f'  {etiket:14s} {len(sonuc):>4} kayit')
        for o in sonuc:
            ham.append((tur, o, etiket))

    # aynı yapım birden çok listede olabilir → birleştir
    birlesik = {}
    for tur, o, etiket in ham:
        anahtar = f'{tur}-{o["id"]}'
        if anahtar not in birlesik:
            birlesik[anahtar] = {'tur': tur, 'ozet': o, 'listeler': []}
        if etiket not in birlesik[anahtar]['listeler']:
            birlesik[anahtar]['listeler'].append(etiket)
    print(f'  benzersiz yapim: {len(birlesik)}')

    onbellek = _onbellek_yukle()
    yapimlar = []
    for i, (anahtar, kayit) in enumerate(birlesik.items(), 1):
        tip = 'tv' if kayit['tur'] == 'dizi' else 'movie'
        d = yapim_detay(tip, kayit['ozet']['id'])
        if not d:
            continue
        ad = d.get('name') or d.get('title') or ''
        print(f'  [{i}/{len(birlesik)}] {ad[:44]}', flush=True)

        saglayici = (d.get('watch/providers', {}).get('results', {}) or {}).get('TR') or {}
        platformlar = {k: [x['provider_name'] for x in v]
                       for k, v in saglayici.items() if isinstance(v, list)}

        qid = (d.get('external_ids') or {}).get('wikidata_id')
        wiki = wiki_adlari(qid, onbellek) if qid else {'tr': None, 'en': None}

        koken = kokeni(d if d.get('origin_country') or d.get('original_language')
                       else kayit['ozet'])
        tr_gun = gorunt('tr.wikipedia', wiki['tr'], bugun)
        en_gun = gorunt('en.wikipedia', wiki['en'], bugun) if koken == 'yabanci' else None

        ilgi = {'tr': ilgi_hesapla(tr_gun), 'en': ilgi_hesapla(en_gun)}
        # tr/en oranı: sadece yabancı yapımlarda, ve en tarafı yeterince hacimliyse
        oran = None
        if ilgi['tr'] and ilgi['en'] and ilgi['en']['son7'] >= 500:
            oran = round(ilgi['tr']['son7'] / ilgi['en']['son7'], 4)
        ilgi['trEnOran'] = oran

        # Filtre sırası: anime hiç listelenmez → sinyalsiz yabancı gizlenir →
        # Latin dışı başlık gizlenir. Sinyalsiz Türk yapımı gizlenmez.
        sinyal_var = bool(ilgi['tr'] or ilgi['en'])
        anime = anime_mi(d)
        # Sinyalsiz ama yeni çıkmış yapımlar: Wikipedia yeni içeriğe geç yetişiyor
        # (ör. "Canavar: Lizzie Borden'ın Hikâyesi" — Netflix'te yayında, wikidata yok).
        # Tanınan bir TR platformunda yayındaysa "yeni" olması yeterli sebep sayılır.
        if anime:
            goster = False
        elif not latin_mi(ad):
            goster = False
        else:
            goster = sinyal_var or koken == 'turk' or bool(platformlar)
        yapimlar.append({
            'goster': goster,
            'kategori': 'anime' if anime else None,
            'sinyalVar': sinyal_var,
            'yeniSayilir': not sinyal_var and bool(platformlar),
            'id': anahtar,
            'tmdbId': d['id'],
            'tur': kayit['tur'],
            'koken': koken,
            'listeler': kayit['listeler'],
            'ad': ad,
            'orijinalAd': d.get('original_name') or d.get('original_title'),
            'yil': (d.get('first_air_date') or d.get('release_date') or '')[:4] or None,
            'ozet': d.get('overview') or None,
            'poster': d.get('poster_path'),
            'arkaplan': d.get('backdrop_path'),
            'turler': [t['name'] for t in d.get('genres', [])],
            'ulkeler': d.get('origin_country') or [],
            'puan': d.get('vote_average'),
            'oySayisi': d.get('vote_count'),
            'platformlar': platformlar,
            'wikidata': qid,
            'wiki': wiki,
            'ilgi': ilgi,
            'sonrakiBolum': (d.get('next_episode_to_air') or {}).get('air_date'),
            'sonBolum': (d.get('last_episode_to_air') or {}).get('air_date'),
        })

    if not yapimlar:
        print('HIC YAPIM CIKMADI — mevcut dosyaya dokunulmuyor.')
        return 1

    ONBELLEK.parent.mkdir(parents=True, exist_ok=True)
    ONBELLEK.write_text(json.dumps(onbellek, ensure_ascii=False, indent=1), encoding='utf8')

    cikti = {
        'tarih': bit,
        'pencere': {'bas': bas, 'bit': bit},
        'uretildi': dt.datetime.now(TZ).isoformat(timespec='seconds'),
        'kaynaklar': [
            {'ad': 'TMDB', 'not': 'Bu urun TMDB API sini kullanir, TMDB tarafindan onaylanmamistir.'},
            {'ad': 'Wikimedia', 'not': 'tr/en Wikipedia gunluk sayfa goruntulenmeleri'},
        ],
        'sayim': {
            'toplam': len(yapimlar),
            'turk': sum(1 for y in yapimlar if y['koken'] == 'turk'),
            'yabanci': sum(1 for y in yapimlar if y['koken'] == 'yabanci'),
            'gosterilen': sum(1 for y in yapimlar if y['goster']),
            'anime': sum(1 for y in yapimlar if y['kategori'] == 'anime'),
            'wikiEslesen': sum(1 for y in yapimlar if y['wiki']['tr'] or y['wiki']['en']),
            'ilgiVerisiOlan': sum(1 for y in yapimlar if y['ilgi']['tr'] or y['ilgi']['en']),
            'platformBilinen': sum(1 for y in yapimlar if y['platformlar']),
        },
        'hatalar': HATALAR[:20],
        'yapimlar': yapimlar,
    }
    # .json değil .js: index.html'e çift tıklayınca (file://) fetch() çalışmaz,
    # <script> ile yüklenen bir çağrı çalışır. Kardeş projede yaşanmış tuzak.
    VERI.mkdir(parents=True, exist_ok=True)
    hedef = VERI / f'{bit}.js'
    govde = json.dumps(cikti, ensure_ascii=False, indent=1)
    hedef.write_text(f'/* Otomatik uretildi: scripts/veri_cek.py */\nSAHNE_GUN({govde});\n',
                     encoding='utf8')

    s = cikti['sayim']
    print(f'\nYazildi: {hedef}')
    print(f'  {s["toplam"]} yapim ({s["turk"]} turk / {s["yabanci"]} yabanci)'
          f' -> gosterilecek {s["gosterilen"]}  (anime {s["anime"]}, listelenmiyor)')
    print(f'  wikipedia eslesen {s["wikiEslesen"]} | ilgi verisi olan {s["ilgiVerisiOlan"]}'
          f' | platformu bilinen {s["platformBilinen"]}')
    if HATALAR:
        print(f'  UYARI: {len(HATALAR)} istek basarisiz oldu (ilk 20 dosyaya yazildi)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
