'use client';

import { useEffect } from 'react';

const FORMSPREE_PORTFOLIO_URL = 'https://formspree.io/f/xlgvdzyq';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function submitToFormspree(
  url: string,
  body: Record<string, string>
): Promise<boolean> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok;
}

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
      const tickers =
        (form.querySelector('#review-tickers') as HTMLTextAreaElement | null)?.value.trim() ?? '';

      if (!name || !email || !tickers) {
        form.reportValidity();
        return;
      }

      if (!isValidEmail(email)) {
        const emailEl = form.querySelector('#review-email') as HTMLInputElement | null;
        emailEl?.setCustomValidity('Please enter a valid email address.');
        emailEl?.reportValidity();
        return;
      }

      clearFormError(form, 'portfolio-form__error');

      const btn = form.querySelector('.btn--submit') as HTMLButtonElement | null;
      const originalLabel = btn?.textContent ?? 'Submit for Review';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting...';
      }

      const ok = await submitToFormspree(FORMSPREE_PORTFOLIO_URL, {
        name,
        email,
        tickers,
        source: 'GoldSignal.ai Portfolio Review Form',
      });

      if (!ok) {
        showFormError(
          form,
          'Something went wrong. Please try again in a moment.',
          'portfolio-form__error'
        );
        if (btn) {
          btn.disabled = false;
          btn.textContent = originalLabel;
        }
        return;
      }

      card.innerHTML = `
        <div class="portfolio-form__success" role="status">
          <svg class="portfolio-form__check" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="22" fill="#EAF4EE" stroke="#2D6A4F" stroke-width="2"/>
            <path d="M14 24l7 7 13-14" fill="none" stroke="#2D6A4F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="portfolio-form__success-text">
            Your portfolio has been received. Check your inbox within 24 hours
            for your full SignalScore report.
          </p>
        </div>
      `;
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
