// Maps service names from mock data to icon paths in /public/icons.
// Pulled from docs/seed-services.csv where the catalog of supported services
// lives. When a mock service matches, LogoPill shows the icon instead of
// the colored character fallback.

const ENTRIES: Record<string, string> = {
  // Landing & cabinet mocks
  'Netflix': '/icons/netflix.svg',
  'Spotify': '/icons/spotify.svg',
  'Notion': '/icons/notion.svg',
  'Figma Pro': '/icons/figma.svg',
  'Figma': '/icons/figma.svg',
  'GitHub Copilot': '/icons/githubcopilot.svg',
  'GitHub': '/icons/github.svg',
  'iCloud+': '/icons/icloud.svg',
  'ИВИ': '/icons/ivi.svg',
  'Okko': '/icons/okko.svg',
  'Kinopoisk HD': '/icons/kinopoisk.svg',
  'Coursera Plus': '/icons/coursera.svg',
  'Zoom Pro': '/icons/zoom.svg',
  'Vercel Pro': '/icons/vercel.svg',
  'Linear': '/icons/linear.svg',
  'ChatGPT Plus': '/icons/openai.svg',
  'Claude Pro': '/icons/anthropic.svg',
  'Google One': '/icons/googleone.svg',
  'Telegram Premium': '/icons/telegram.svg',
  '1Password': '/icons/1password.svg',
  'Яндекс Плюс': '/icons/yandex.svg',
  'СберПрайм': '/icons/sberbank.svg',
  'VK Музыка': '/icons/vkmusic.svg',
  'Т‑Банк Pro': '/icons/tinkoff.svg',
  'Apple Music': '/icons/applemusic.svg',
  'YouTube Premium': '/icons/youtubemusic.svg',
  'Dropbox': '/icons/dropbox.svg',
};

export function serviceIcon(name: string): string | null {
  return ENTRIES[name] ?? null;
}
