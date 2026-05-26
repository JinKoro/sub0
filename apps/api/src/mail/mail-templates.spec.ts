import { Locale } from '@subzero/shared';

import { renderMail } from './mail-templates';

const BASE = 'http://localhost:3000';

describe('renderMail', () => {
  it('verify-email RU: subject + link in html and text', () => {
    const m = renderMail(
      'verify-email',
      Locale.RU,
      { verifyPath: '/registration/complete?token=abc', name: 'Иван' },
      BASE,
    );
    expect(m.subject.length).toBeGreaterThan(0);
    expect(m.subject).toMatch(/Sub0/);
    const link = `${BASE}/registration/complete?token=abc`;
    expect(m.html).toContain(link);
    expect(m.text).toContain(link);
    expect(m.html).toMatch(/Подтвердите|регистрац/i);
  });

  it('verify-email EN differs from RU (localized)', () => {
    const ru = renderMail('verify-email', Locale.RU, { verifyPath: '/x' }, BASE);
    const en = renderMail('verify-email', Locale.EN, { verifyPath: '/x' }, BASE);
    expect(en.subject).not.toBe(ru.subject);
    expect(en.html).toMatch(/confirm|sign|verif/i);
  });

  it('reset-password: link composed from baseUrl + verifyPath', () => {
    const m = renderMail('reset-password', Locale.RU, { verifyPath: '/reset-password?token=z' }, BASE);
    expect(m.html).toContain(`${BASE}/reset-password?token=z`);
    expect(m.text).toContain(`${BASE}/reset-password?token=z`);
  });

  it('trims a trailing slash on baseUrl', () => {
    const m = renderMail('verify-email', Locale.RU, { verifyPath: '/a?token=t' }, 'http://x.io/');
    expect(m.html).toContain('http://x.io/a?token=t');
    expect(m.html).not.toContain('http://x.io//a');
  });

  it('falls back to RU for an unknown locale id', () => {
    const ru = renderMail('verify-email', Locale.RU, { verifyPath: '/x' }, BASE);
    const unknown = renderMail('verify-email', 999, { verifyPath: '/x' }, BASE);
    expect(unknown.subject).toBe(ru.subject);
  });

  it('throws on an unknown template', () => {
    expect(() => renderMail('nope', Locale.RU, { verifyPath: '/x' }, BASE)).toThrow();
  });

  it('upcoming-charge RU: subject содержит сервис и формат даты', () => {
    const m = renderMail(
      'upcoming-charge',
      Locale.RU,
      {
        subscriptionPath: '/account/subscriptions/sub-abc',
        serviceName: 'Netflix',
        amount: '799.00',
        currency: '₽',
        billingDate: '2026-06-15',
        daysBefore: 3,
        projectName: 'Personal',
      },
      BASE,
    );
    expect(m.subject).toMatch(/Sub0/);
    expect(m.subject).toContain('Netflix');
    expect(m.html).toContain('15 июня 2026');
    expect(m.html).toContain('799.00');
    expect(m.html).toContain(`${BASE}/account/subscriptions/sub-abc`);
  });

  it('upcoming-charge daysBefore=0: тема "сегодня"', () => {
    const m = renderMail(
      'upcoming-charge',
      Locale.RU,
      {
        subscriptionPath: '/account/subscriptions/sub-x',
        serviceName: 'Spotify',
        amount: '299.00',
        currency: '₽',
        billingDate: '2026-06-15',
        daysBefore: 0,
        projectName: 'Personal',
      },
      BASE,
    );
    expect(m.subject).toMatch(/сегодня/i);
  });

  it('upcoming-charge EN: формат даты', () => {
    const m = renderMail(
      'upcoming-charge',
      Locale.EN,
      {
        subscriptionPath: '/account/subscriptions/sub-y',
        serviceName: 'GitHub',
        amount: '10.00',
        currency: 'USD',
        billingDate: '2026-06-15',
        daysBefore: 1,
        projectName: 'Work',
      },
      BASE,
    );
    expect(m.html).toContain('June 15, 2026');
    expect(m.subject).toMatch(/1 day/);
  });
});
