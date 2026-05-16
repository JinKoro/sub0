'use client';

import { CSSProperties, FormEvent, ReactNode, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import type { Review } from '../model/types';

interface Props {
  onSubmit: (review: Review) => void;
}

interface FormState {
  name: string;
  role: string;
  text: string;
}

interface FormErrors {
  name?: string;
  text?: string;
}

const PALETTE = [SUB0.blue, SUB0.good, SUB0.purple, SUB0.danger, SUB0.warn];
const MAX_TEXT_LEN = 255;

function todayLabel(lang: 'ru' | 'en'): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (lang === 'en') {
    return `${monthsEn[today.getMonth()]} ${day}, ${today.getFullYear()}`;
  }
  return `${day} ${months[today.getMonth()]} ${today.getFullYear()}`;
}

export function ReviewForm({ onSubmit }: Props) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const [form, setForm] = useState<FormState>({ name: '', role: '', text: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    const name = form.name.trim();
    const text = form.text.trim();
    if (!name) e.name = t('Укажите имя', 'Enter your name');
    else if (name.length < 2) e.name = t('Слишком короткое', 'Too short');
    if (!text) e.text = t('Напишите текст отзыва', 'Write your review');
    else if (text.length < 20) e.text = t('Минимум 20 символов', 'At least 20 characters');
    return e;
  };

  const handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const name = form.name.trim();
    const init = name[0]!.toUpperCase();
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]!;
    const review: Review = {
      quote: form.text.trim(),
      name,
      role: form.role.trim(),
      init,
      color,
      date: todayLabel(lang),
      pending: true,
    };
    onSubmit(review);
    setForm({ name: '', role: '', text: '' });
    setErrors({});
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 11,
          color: SUB0.muted,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <span style={{ width: 24, height: 1, background: SUB0.line }} />
        {t('Оставить отзыв', 'Leave a review')}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: SUB0.bg,
          border: `1px solid ${SUB0.line}`,
          borderRadius: 16,
          padding: isMobile ? '24px 20px' : '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 20 : 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            color: SUB0.ink,
          }}
        >
          {t('Поделитесь опытом', 'Share your experience')}
        </div>

        <Field
          label={t('Имя', 'Name')}
          hint={t('Можно только имя или с фамилией', 'First name, or first + last')}
          error={errors.name}
        >
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('Анна К.', 'Anna K.')}
            maxLength={60}
            style={inputStyle(!!errors.name)}
          />
        </Field>

        <Field
          label={t('Должность', 'Job title')}
          hint={t('Например: маркетолог, CTO', 'e.g. marketer, CTO')}
        >
          <input
            type="text"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder={t('Маркетолог', 'Marketer')}
            maxLength={80}
            style={inputStyle(false)}
          />
        </Field>

        <Field
          label={t('Отзыв', 'Review')}
          hint={`${form.text.length}/${MAX_TEXT_LEN} ${t('символов', 'characters')}`}
          error={errors.text}
        >
          <textarea
            value={form.text}
            onChange={(e) =>
              setForm((f) => ({ ...f, text: e.target.value.slice(0, MAX_TEXT_LEN) }))
            }
            placeholder={t(
              'Что вам понравилось? Что мешает? Чего не хватает?',
              "What did you like? What could be better? What's missing?",
            )}
            rows={5}
            style={{
              ...inputStyle(!!errors.text),
              resize: 'vertical',
              minHeight: 120,
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
        </Field>

        <button
          type="submit"
          className="s-btn"
          style={{
            marginTop: 4,
            background: SUB0.ink,
            color: SUB0.bg,
            border: 'none',
            borderRadius: 10,
            padding: '14px 18px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '-0.005em',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {t('Опубликовать отзыв', 'Publish review')}
          <span aria-hidden>→</span>
        </button>

        {submitted && (
          <div
            style={{
              background: '#e9fff0',
              border: `1px solid ${SUB0.good}`,
              color: SUB0.good,
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <CheckCircle />
            <span>
              <strong style={{ display: 'block', marginBottom: 2 }}>
                {t('Спасибо!', 'Thank you!')}
              </strong>
              {t(
                'Ваш отзыв отправлен на модерацию и появится в списке после проверки.',
                'Your review has been submitted for moderation and will appear after review.',
              )}
            </span>
          </div>
        )}

        <div
          style={{
            fontFamily: mono,
            fontSize: 11,
            color: SUB0.muted,
            lineHeight: 1.55,
            paddingTop: 8,
            borderTop: `1px dashed ${SUB0.line}`,
          }}
        >
          {t(
            'Отзывы публикуются после модерации. Мы не редактируем тексты — только проверяем на спам и оскорбления.',
            "Reviews are published after moderation. We don't edit content — only check for spam and abuse.",
          )}
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: SUB0.ink,
            letterSpacing: '-0.005em',
          }}
        >
          {label}
        </span>
        {error ? (
          <span style={{ fontFamily: mono, fontSize: 11, color: SUB0.danger }}>{error}</span>
        ) : hint ? (
          <span style={{ fontFamily: mono, fontSize: 11, color: SUB0.muted }}>{hint}</span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function inputStyle(invalid: boolean): CSSProperties {
  return {
    width: '100%',
    background: SUB0.panel,
    border: `1px solid ${invalid ? SUB0.danger : SUB0.line}`,
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 15,
    color: SUB0.ink,
    fontFamily: 'inherit',
    outline: 'none',
    letterSpacing: '-0.005em',
    transition: 'border-color .15s',
    boxSizing: 'border-box',
  };
}

function CheckCircle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M6.5 10.2l2.4 2.4 4.6-4.8" />
    </svg>
  );
}
