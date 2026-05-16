import { SUB0 } from '@/shared/constants/tokens';
import type { Review } from './types';

export const SEED_REVIEWS: Review[] = [
  {
    quote: {
      ru: 'Sub0 показал, что я плачу 6 200 ₽ в месяц за подписки и даже не замечала. Отменила треть — забытых подписок.',
      en: "Sub0 showed me I was spending 6,200 ₽/mo on subs. Killed a third and didn't notice a thing.",
    },
    name: 'Анна К.',
    role: { ru: 'Маркетолог', en: 'Marketer' },
    init: 'А',
    color: SUB0.blue,
    date: { ru: '12 апр 2026', en: 'Apr 12, 2026' },
  },
  {
    quote: {
      ru: 'Запустили за 10 минут. Обработчик писем нашёл подписки, про которые мы забыли ещё в 2023.',
      en: "Set up in 10 minutes. The inbox parser found subs we'd forgotten about since 2023.",
    },
    name: 'Марк С.',
    role: { ru: 'Предприниматель', en: 'Founder' },
    init: 'М',
    color: SUB0.good,
    date: { ru: '08 апр 2026', en: 'Apr 08, 2026' },
  },
  {
    quote: {
      ru: 'Главное — наглядный календарь списаний. Утром открыл — увидел, что и когда уйдёт. Перестал жить от выписки до выписки.',
      en: "The charge calendar is the main thing. Open it in the morning, see exactly what'll leave the account. No more living statement-to-statement.",
    },
    name: 'Дмитрий В.',
    role: { ru: 'Продакт-менеджер', en: 'Product manager' },
    init: 'Д',
    color: SUB0.purple,
    date: { ru: '02 апр 2026', en: 'Apr 02, 2026' },
  },
  {
    quote: {
      ru: 'Удобно делить личные и командные подписки. Бухгалтер выгружает CSV, мы видим только свои — без чужих Netflix.',
      en: "Splitting personal and team subscriptions is handy. Accounting exports CSV, we only see ours — no one else's Netflix.",
    },
    name: 'Ольга Р.',
    role: { ru: 'Финансовый директор', en: 'CFO' },
    init: 'О',
    color: SUB0.danger,
    date: { ru: '29 мар 2026', en: 'Mar 29, 2026' },
  },
  {
    quote: {
      ru: 'Использую как чек-лист по продлениям сервисов и доменов. Раньше пропустил — потерял домен на год. Теперь — нет.',
      en: 'I use it as a renewal checklist for services and domains. Missed one once — lost a domain for a year. Not anymore.',
    },
    name: 'Igor M.',
    role: { ru: 'Веб-разработчик', en: 'Web developer' },
    init: 'I',
    color: SUB0.warn,
    date: { ru: '24 мар 2026', en: 'Mar 24, 2026' },
  },
  {
    quote: {
      ru: 'Не хватает виджета на главный экран iOS — но обещают в мобильном приложении. В остальном перекрывает все мои потребности.',
      en: "Missing an iOS home screen widget — but it's promised in the mobile app. Otherwise, covers all my needs.",
    },
    name: 'Кирилл П.',
    role: { ru: 'UX-дизайнер', en: 'UX designer' },
    init: 'К',
    color: SUB0.blue,
    date: { ru: '18 мар 2026', en: 'Mar 18, 2026' },
  },
  {
    quote: {
      ru: 'Уведомления в Telegram — то, чего не хватало другим сервисам. Никаких писем, которые тонут в почте.',
      en: 'Telegram notifications — exactly what other services lacked. No more emails drowning in the inbox.',
    },
    name: 'Татьяна Б.',
    role: { ru: 'Журналист', en: 'Journalist' },
    init: 'Т',
    color: SUB0.good,
    date: { ru: '11 мар 2026', en: 'Mar 11, 2026' },
  },
  {
    quote: {
      ru: 'Перевела всю семью на один аккаунт. Видно, кто за что платит — и сколько уходит на детей. Полезно.',
      en: "Moved the whole family onto one account. Now we can see who's paying for what — and how much goes to the kids. Useful.",
    },
    name: 'Мария Л.',
    role: { ru: 'Преподаватель', en: 'Teacher' },
    init: 'М',
    color: SUB0.purple,
    date: { ru: '06 мар 2026', en: 'Mar 06, 2026' },
  },
  {
    quote: {
      ru: 'Простой, без перегруза. Нет лишних графиков — только то, что нужно. За это спасибо.',
      en: "Simple, not overloaded. No useless charts — just what's needed. Thanks for that.",
    },
    name: 'Sergey N.',
    role: { ru: 'Аналитик', en: 'Analyst' },
    init: 'S',
    color: SUB0.ink,
    date: { ru: '01 мар 2026', en: 'Mar 01, 2026' },
  },
  {
    quote: {
      ru: 'Раньше держал все подписки в Notion. Sub0 быстрее, проще и не нужно вручную писать формулы.',
      en: 'I used to keep all my subs in Notion. Sub0 is faster, simpler, no manual formulas.',
    },
    name: 'Павел Ж.',
    role: { ru: 'Frontend-разработчик', en: 'Frontend developer' },
    init: 'П',
    color: SUB0.blue,
    date: { ru: '26 фев 2026', en: 'Feb 26, 2026' },
  },
  {
    quote: {
      ru: 'Удивил импорт из почты — нашёл два сервиса, которые я считал отменёнными. На деле списания шли год.',
      en: "The email import surprised me — found two services I thought I'd cancelled. They'd been charging for a year.",
    },
    name: 'Елена Т.',
    role: { ru: 'Бухгалтер', en: 'Accountant' },
    init: 'Е',
    color: SUB0.danger,
    date: { ru: '20 фев 2026', en: 'Feb 20, 2026' },
  },
  {
    quote: {
      ru: 'Использую Sub0 в студии — у нас 40+ облачных подписок на команду из 6. Без него был бы хаос.',
      en: 'I use Sub0 at our studio — 40+ cloud subscriptions across a team of 6. Without it, total chaos.',
    },
    name: 'Артём К.',
    role: { ru: 'Тимлид', en: 'Team lead' },
    init: 'А',
    color: SUB0.good,
    date: { ru: '14 фев 2026', en: 'Feb 14, 2026' },
  },
  {
    quote: {
      ru: 'Удобный интерфейс на мобиле — пользуюсь чаще с телефона, чем с компа.',
      en: 'Nice mobile interface — I use it more on phone than desktop.',
    },
    name: 'Наталья В.',
    role: { ru: 'Юрист', en: 'Lawyer' },
    init: 'Н',
    color: SUB0.purple,
    date: { ru: '09 фев 2026', en: 'Feb 09, 2026' },
  },
  {
    quote: {
      ru: 'Хотелось бы добавить расчёт в евро отдельной валютой по умолчанию — но это мелочь, сервис отличный.',
      en: 'Would like a default EUR view as a separate currency — but minor; service is great.',
    },
    name: 'Виктор И.',
    role: { ru: 'DevOps-инженер', en: 'DevOps engineer' },
    init: 'В',
    color: SUB0.warn,
    date: { ru: '03 фев 2026', en: 'Feb 03, 2026' },
  },
  {
    quote: {
      ru: 'Команда отзывчивая. Написал в поддержку про баг — ответили за час, исправили на следующий день.',
      en: 'Responsive team. Reported a bug — got a reply in an hour, fixed the next day.',
    },
    name: 'Roman B.',
    role: { ru: 'Стартап-фаундер', en: 'Startup founder' },
    init: 'R',
    color: SUB0.blue,
    date: { ru: '28 янв 2026', en: 'Jan 28, 2026' },
  },
  {
    quote: {
      ru: 'Использую как «бухгалтерию для себя» — Sub0 помогает не переплачивать за дубликаты сервисов.',
      en: 'I use it as personal accounting — Sub0 keeps me from paying twice for duplicate services.',
    },
    name: 'Юлия М.',
    role: { ru: 'Иллюстратор', en: 'Illustrator' },
    init: 'Ю',
    color: SUB0.good,
    date: { ru: '22 янв 2026', en: 'Jan 22, 2026' },
  },
  {
    quote: {
      ru: 'Работает быстро. Никаких подвисаний, страницы открываются мгновенно. Уже это — большой плюс.',
      en: 'Works fast. No lag, pages open instantly. That alone is a big plus.',
    },
    name: 'Семён Г.',
    role: { ru: 'Системный администратор', en: 'Sysadmin' },
    init: 'С',
    color: SUB0.ink,
    date: { ru: '16 янв 2026', en: 'Jan 16, 2026' },
  },
  {
    quote: {
      ru: 'Понятный онбординг. Не пришлось искать инструкции — всё разобрал за пять минут.',
      en: "Clear onboarding. No need to hunt for docs — figured everything out in five minutes.",
    },
    name: 'Алина Д.',
    role: { ru: 'PR-менеджер', en: 'PR manager' },
    init: 'А',
    color: SUB0.danger,
    date: { ru: '10 янв 2026', en: 'Jan 10, 2026' },
  },
];
