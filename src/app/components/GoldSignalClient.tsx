'use client';

import { useEffect } from 'react';
import { MAX_PORTFOLIO_TICKERS, parseTickerInput, sanitizeTickers } from '@/lib/portfolio-submission';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showFormError(form: HTMLFormElement, message: string, className: string) {
  let el = form.querySelector<HTMLElement>(`.${className}`);
  if (!el) {
    el = document.createElement('p');
    el.className = className;
    el.setAttribute('role', 'alert');
    el.style.color = '#8B2635';
    el.style.marginTop = '0.75rem';
    el.style.fontSize = '0.875rem';
    form.appendChild(el);
  }
  el.textContent = message;
}

function clearFormError(form: HTMLFormElement, className: string) {
  form.querySelector(`.${className}`)?.remove();
}

function isValidEmail(email: string) {
  return EMAIL_RE.test(String(email).trim());
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function GoldSignalClient() {
  useEffect(() => {
    const nav = document.querySelector('.nav');
    const onScroll = () => {
      nav?.classList.toggle('nav--scrolled', window.scrollY > 20);
    };

    const form = document.getElementById('portfolio-form') as HTMLFormElement | null;
    const card = form?.querySelector('.portfolio-form__card');

    const onPortfolioSubmit = async (e: Event) => {
      e.preventDefault();
      if (!form || !card) return;

      const name =
        (form.querySelector('#review-name') as HTMLInputElement | null)?.value.trim() ?? '';
      const email =
        (form.querySelector('#review-email') as HTMLInputElement | null)?.value.trim() ?? '';
      const tickersRaw =
        (form.querySelector('#review-tickers') as HTMLTextAreaElement | null)?.value.trim() ?? '';

      const emailEl = form.querySelector('#review-email') as HTMLInputElement | null;
      emailEl?.setCustomValidity('');

      if (!name || !email || !tickersRaw) {
        form.reportValidity();
        return;
      }

      if (!isValidEmail(email)) {
        emailEl?.setCustomValidity('Please enter a valid email address.');
        emailEl?.reportValidity();
        return;
      }

      const tickers = sanitizeTickers(parseTickerInput(tickersRaw));
      if (tickers.length === 0) {
        showFormError(
          form,
          'Enter at least one valid ticker (letters and dots only, e.g. NEM or BRK.A).',
          'portfolio-form__error'
        );
        return;
      }
      if (tickers.length > MAX_PORTFOLIO_TICKERS) {
        showFormError(
          form,
          `You can submit at most ${MAX_PORTFOLIO_TICKERS} tickers.`,
          'portfolio-form__error'
        );
        return;
      }

      clearFormError(form, 'portfolio-form__error');

      const btn = form.querySelector('.btn--submit') as HTMLButtonElement | null;
      const originalLabel = btn?.textContent ?? 'Submit for Review';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting...';
      }

      try {
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, tickers: tickersRaw }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          showFormError(
            form,
            payload.error ?? 'Something went wrong. Please try again in a moment.',
            'portfolio-form__error'
          );
          if (btn) {
            btn.disabled = false;
            btn.textContent = originalLabel;
          }
          return;
        }

        const successText =
          payload.message ??
          `Thanks, ${name}! Your SignalScore report is being generated and will arrive at ${email} within the next few minutes.`;

        card.innerHTML = `
        <div class="portfolio-form__success" role="status">
          <svg class="portfolio-form__check" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="22" fill="#EAF4EE" stroke="#2D6A4F" stroke-width="2"/>
            <path d="M14 24l7 7 13-14" fill="none" stroke="#2D6A4F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="portfolio-form__success-text">
            ${escapeHtml(successText)}
          </p>
        </div>
      `;
      } catch {
        showFormError(
          form,
          'Something went wrong. Please try again in a moment.',
          'portfolio-form__error'
        );
        if (btn) {
          btn.disabled = false;
          btn.textContent = originalLabel;
        }
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    form?.addEventListener('submit', onPortfolioSubmit);

    return () => {
      window.removeEventListener('scroll', onScroll);
      form?.removeEventListener('submit', onPortfolioSubmit);
    };
  }, []);

  return null;
}
