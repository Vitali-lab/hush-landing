# Hush — landing page

Лендинг для [Hush](https://github.com/Vitali-lab/hush) — диктовки на устройстве для macOS.
Две локали: английская на `/`, русская на `/ru/`.

- Живой сайт: `https://vitali-lab.github.io/hush-landing/`
- Скачивание: `https://github.com/Vitali-lab/hush/releases/latest/download/Hush-macOS-arm64.dmg`
- Windows: везде указано «в разработке» / «in development».

## Стек

- **Astro 5**, полностью статическая сборка без клиентского фреймворка.
- **Manrope** (self-hosted, latin + cyrillic), без Google Fonts в рантайме.
- Ноль аналитики, cookie и внешних скриптов.
- Реальные скриншоты приложения и реальные иконки macOS-приложений.

## Команды

```bash
npm ci
npm run dev       # http://localhost:4321
npm run build     # dist/
npm run build:pages # dist + docs/ для GitHub Pages
npm run preview   # локальный предпросмотр сборки
npm run fonts     # перекачать Manrope в public/fonts
```

QA (нужен установленный Google Chrome и запущенный `npm run dev`):

```bash
node scripts/qa.mjs
node scripts/shoot.mjs
```

## Структура

```
src/
  pages/index.astro        EN
  pages/ru/index.astro     RU
  i18n/en.ts, ru.ts        весь текст и ссылки
  components/              Header, Hero, Feature, темы, установка, FAQ, CTA
  styles/global.css        дизайн-система
  lib/url.ts               base path, canonical, ассеты
public/
  img/shots/               реальные скриншоты Hush (WebP)
  img/apps/                иконки Slack, Mail, Cursor, Terminal, Notion, Figma, Chrome, Messages
  fonts/                   Manrope + OFL
  og.png                   share-картинка
```

## Контент

Весь текст — в `src/i18n/en.ts` и `src/i18n/ru.ts`. Ссылка на скачивание —
`common.downloadUrl` в обоих файлах.

Упоминания Windows есть в hero, футере, CTA и FAQ. Когда появится сборка,
замените чипы на ссылку и обновите FAQ.

## Скриншоты

Экраны меню, моделей, настроек, тем и установки — реальные рендеры приложения
через `Hush --render-ui` (SwiftUI `ImageRenderer`), обрезанные и сжатые в WebP.
Hero-демо (письмо, пилюля, набор текста) — интерактивная HTML-реплика, чтобы
показать сценарий удержания. Если UI изменится, пересоберите приложение,
отрендерьте превью и замените файлы в `public/img/shots/`.

Иконки приложений извлечены из установленных macOS-приложений
(`scripts/extract-app-icons.sh`); Figma — официальная иконка Figma. Все логотипы
принадлежат их владельцам и используются только для обозначения совместимости.
Подробнее — [THIRD_PARTY.md](THIRD_PARTY.md).

## SEO

Всё статическое и индексируемое:

- один H1 и последовательные H2/H3 на каждой локали;
- `canonical`, `hreflang` en/ru/x-default, `og:*`, `twitter:*`, `robots`;
- JSON-LD `Organization`, `WebSite`, `WebPage`, `SoftwareApplication`, `FAQPage`;
- `sitemap.xml` с alternate-ссылками и `robots.txt`;
- alt у содержательных изображений и размеры у всех картинок;
- шрифты self-hosted, без сторонних запросов и аналитики.

Canonical, sitemap и robots собираются из `SITE_URL` и `BASE_PATH`.

Для полного SEO лучше корень домена (свой домен или Vercel/Netlify). На GitHub
Pages с `BASE_PATH=/hush-landing` `robots.txt` и `sitemap.xml` окажутся в
подпапке: поисковики не запросят такой `robots.txt` автоматически. В этом
случае добавьте sitemap в Search Console вручную или переезжайте на корень.

## Деплой

Сайт статический: подойдут Vercel, Netlify, Cloudflare Pages или GitHub Pages.
Сейчас он публикуется из папки `docs/` на ветке `main`:

```bash
npm run build:pages
git add docs && git commit -m "Update site" && git push
```

В GitHub: Settings → Pages → Source: Deploy from a branch → `main` / `/docs`.
Готовый workflow для Actions (если позже понадобится) лежит в
`deploy/pages.yml.example`; для пуша workflow-файла нужен токен с `workflow` scope.

В примере workflow заданы:

- `SITE_URL=https://vitali-lab.github.io`
- `BASE_PATH=/hush-landing`

Если репозиторий переименован или подключён свой домен, поменяйте `BASE_PATH`
(`/` для корня) и `SITE_URL`.

Для локальной сборки под подпапку:

```bash
BASE_PATH=/hush-landing SITE_URL=https://vitali-lab.github.io npm run build
```

## Важно

- Сайт не собирает данные и не подключает аналитику.
- Лицензия кода лендинга — MIT. Шрифт Manrope — SIL OFL 1.1.
