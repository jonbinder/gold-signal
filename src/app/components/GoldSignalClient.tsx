'use client';

import { useEffect } from 'react';

const VISIBLE_RANKINGS = 5;
const HERO_CARD_COUNT = 6;
const STORAGE_KEY = 'gs_email';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ScoreTier = 'high' | 'mid' | 'low';

type Stock = {
  ticker: string;
  company: string;
  sector: string;
  weeklyChange: number;
  signalScore: number;
};

type FamousInvestor = {
  initials: string;
  name: string;
  role: string;
  tickers: string[];
};

const famousInvestors: FamousInvestor[] = [
  {
    initials: 'ES',
    name: 'Eric Sprott',
    role: 'Founder, Sprott Asset Management',
    tickers: ['WPM', 'AEM', 'PAAS', 'MAG', 'AG'],
  },
  {
    initials: 'PS',
    name: 'Peter Schiff',
    role: 'CEO, Euro Pacific Asset Management',
    tickers: ['RGLD', 'NEM', 'FNV', 'GOLD'],
  },
  {
    initials: 'RR',
    name: 'Rick Rule',
    role: 'Founder, Rule Investment Media',
    tickers: ['AEM', 'KGC', 'WPM', 'OR', 'SAND'],
  },
  {
    initials: 'JH',
    name: 'John Hathaway',
    role: 'Senior Portfolio Manager, Sprott',
    tickers: ['NEM', 'GOLD', 'AEM', 'FNV'],
  },
];

function getScoreColor(score: number): ScoreTier {
  const n = Number(score);
  if (n >= 80) return 'high';
  if (n >= 60) return 'mid';
  return 'low';
}

function isValidEmail(email: string) {
  return EMAIL_RE.test(String(email).trim());
}

function formatWeeklyChange(value: number) {
  const n = Number(value);
  if (n > 0) {
    return {
      text: `▲ +${Math.abs(n).toFixed(1)}%`,
      className: 'change change--up',
    };
  }
  if (n < 0) {
    return {
      text: `▼ ${n.toFixed(1)}%`,
      className: 'change change--down',
    };
  }
  return {
    text: '— 0.0%',
    className: 'change change--flat',
  };
}

function createScoreBadge(score: number) {
  const tier = getScoreColor(score);
  const badge = document.createElement('span');
  badge.className = `mono score score--${tier}`;
  badge.textContent = String(score);
  return badge;
}

function createScoreBarFill(score: number) {
  const tier = getScoreColor(score);
  const fill = document.createElement('span');
  fill.className = `score-card__bar-fill score-card__bar-fill--${tier}`;
  fill.style.width = `${Math.min(100, Math.max(0, score))}%`;
  return fill;
}

function sortStocks(stocks: Stock[]) {
  return [...stocks].sort((a, b) => b.signalScore - a.signalScore);
}

function buildRankingRow(stock: Stock, rank: number, { locked = false } = {}) {
  const tr = document.createElement('tr');
  tr.className = `fade-in rankings-row${locked ? ' rankings-row--locked' : ''}`;

  const weekly = formatWeeklyChange(stock.weeklyChange);

  tr.innerHTML = `
    <td class="mono">${rank}</td>
    <td class="mono rankings-table__ticker">${stock.ticker}</td>
    <td>${stock.company}</td>
    <td>${stock.sector}</td>
    <td class="mono ${weekly.className}">${weekly.text}</td>
    <td></td>
  `;

  tr.querySelector('td:last-child')?.appendChild(createScoreBadge(stock.signalScore));
  return tr;
}

function buildHeroRow(stock: Stock, rank: number) {
  const li = document.createElement('li');
  li.className = 'score-card__row';

  const tier = getScoreColor(stock.signalScore);
  const shortName = stock.company.split(' ')[0];

  li.innerHTML = `
    <span class="mono score-card__rank">${rank}</span>
    <span class="mono score-card__ticker">${stock.ticker}</span>
    <span class="score-card__name">${shortName}</span>
    <span class="score-card__bar" aria-hidden="true"></span>
    <span class="mono score score--${tier}">${stock.signalScore}</span>
  `;

  li.querySelector('.score-card__bar')?.appendChild(createScoreBarFill(stock.signalScore));
  return li;
}

function buildInvestorCard(investor: FamousInvestor) {
  const article = document.createElement('article');
  article.className = 'investor-card fade-in';

  const tickersHtml = investor.tickers
    .map((ticker) => `<span class="pill mono">${ticker}</span>`)
    .join('');

  article.innerHTML = `
    <div class="investor-card__avatar mono" aria-hidden="true">${investor.initials}</div>
    <h3 class="investor-card__name">${investor.name}</h3>
    <p class="investor-card__role">${investor.role}</p>
    <div class="investor-card__tickers">${tickersHtml}</div>
  `;

  return article;
}

export default function GoldSignalClient() {
  useEffect(() => {
    let fadeObserver: IntersectionObserver | null = null;

    const observeFadeIns = (elements: Element[] | NodeListOf<Element>) => {
      if (!fadeObserver) return;
      elements.forEach((el) => fadeObserver!.observe(el));
    };

    const renderRankingsTable = (stocks: Stock[], unlocked: boolean) => {
      const tbody = document.getElementById('rankings-tbody');
      if (!tbody) return;

      const sorted = sortStocks(stocks);
      tbody.replaceChildren();

      sorted.forEach((stock, index) => {
        const rank = index + 1;
        const locked = !unlocked && index >= VISIBLE_RANKINGS;
        tbody.appendChild(buildRankingRow(stock, rank, { locked }));
      });

      observeFadeIns(tbody.querySelectorAll('.fade-in'));
    };

    const renderHeroCard = (stocks: Stock[]) => {
      const list = document.getElementById('score-card-list');
      if (!list) return;

      const sorted = sortStocks(stocks).slice(0, HERO_CARD_COUNT);
      list.replaceChildren();

      sorted.forEach((stock, index) => {
        list.appendChild(buildHeroRow(stock, index + 1));
      });
    };

    const renderInvestors = () => {
      const grid = document.getElementById('investors-grid');
      if (!grid) return;

      grid.replaceChildren();
      famousInvestors.forEach((investor) => {
        grid.appendChild(buildInvestorCard(investor));
      });

      observeFadeIns(grid.querySelectorAll('.fade-in'));
    };

    const unlockRankings = (email: string) => {
      localStorage.setItem(STORAGE_KEY, email.trim());

      const gate = document.getElementById('email-gate');
      if (gate) {
        gate.classList.add('is-unlocked');
        gate.hidden = true;
      }

      document.querySelectorAll('.rankings-row--locked').forEach((row) => {
        row.classList.remove('rankings-row--locked');
        observeFadeIns([row]);
      });
    };

    const initScrollAnimations = () => {
      fadeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              fadeObserver?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );

      observeFadeIns(document.querySelectorAll('.fade-in'));
    };

    const nav = document.querySelector('.nav');
    const onScroll = () => {
      nav?.classList.toggle('nav--scrolled', window.scrollY > 20);
    };

    const initEmailGate = (stocks: Stock[]) => {
      const gateForm = document.getElementById('gate-form') as HTMLFormElement | null;
      const gate = document.getElementById('email-gate');
      const emailInput = document.getElementById('gate-email') as HTMLInputElement | null;

      if (!gateForm || !gate) return undefined;

      const savedEmail = localStorage.getItem(STORAGE_KEY);
      if (savedEmail) {
        unlockRankings(savedEmail);
        return undefined;
      }

      gate.hidden = stocks.length <= VISIBLE_RANKINGS;

      const onGateSubmit = async (e: Event) => {
        e.preventDefault();

        const email = emailInput?.value.trim() ?? '';
        if (!isValidEmail(email)) {
          emailInput?.focus();
          emailInput?.setCustomValidity('Please enter a valid email address.');
          emailInput?.reportValidity();
          return;
        }
        emailInput?.setCustomValidity('');

        const btn = gateForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        const originalLabel = btn?.textContent ?? 'Unlock Full List';
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Unlocking...';
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));

        unlockRankings(email);

        if (btn) {
          btn.disabled = false;
          btn.textContent = originalLabel;
        }
      };

      gateForm.addEventListener('submit', onGateSubmit);
      return () => gateForm.removeEventListener('submit', onGateSubmit);
    };

    const initPortfolioForm = () => {
      const form = document.getElementById('portfolio-form') as HTMLFormElement | null;
      const card = form?.querySelector('.portfolio-form__card');
      if (!form || !card) return undefined;

      const onPortfolioSubmit = async (e: Event) => {
        e.preventDefault();

        const name =
          (form.querySelector('#review-name') as HTMLInputElement | null)?.value.trim() ?? '';
        const email =
          (form.querySelector('#review-email') as HTMLInputElement | null)?.value.trim() ?? '';
        const tickers =
          (form.querySelector('#review-tickers') as HTMLTextAreaElement | null)?.value.trim() ??
          '';

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

        const btn = form.querySelector('.btn--submit') as HTMLButtonElement | null;
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Analyzing...';
        }

        const submission = { name, email, tickers };
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log('Portfolio submission:', submission);

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

      form.addEventListener('submit', onPortfolioSubmit);
      return () => form.removeEventListener('submit', onPortfolioSubmit);
    };

    const loadStocks = async () => {
      const response = await fetch('/data/stocks.json');
      if (!response.ok) {
        throw new Error(`Failed to load stocks: ${response.status}`);
      }
      return response.json() as Promise<Stock[]>;
    };

    initScrollAnimations();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const cleanupPortfolio = initPortfolioForm();
    renderInvestors();

    let cleanupGate: (() => void) | undefined;

    loadStocks()
      .then((stocks) => {
        const unlocked = Boolean(localStorage.getItem(STORAGE_KEY));

        renderHeroCard(stocks);
        renderRankingsTable(stocks, unlocked);
        cleanupGate = initEmailGate(stocks);

        if (unlocked) {
          const gate = document.getElementById('email-gate');
          if (gate) gate.hidden = true;
        }
      })
      .catch((err) => {
        console.error(err);
        const tbody = document.getElementById('rankings-tbody');
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="6">Unable to load stock rankings.</td></tr>`;
        }
      });

    return () => {
      window.removeEventListener('scroll', onScroll);
      fadeObserver?.disconnect();
      fadeObserver = null;
      cleanupPortfolio?.();
      cleanupGate?.();
    };
  }, []);

  return null;
}
