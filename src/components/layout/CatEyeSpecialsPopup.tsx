import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { CAT_EYE_MOBILE_IMAGE, CAT_EYE_DESKTOP_IMAGE } from '../../lib/catEyeAssets';
import { useBundleStock, type BundleStock } from '../../hooks/useBundleStock';

// Nude Cat Eye Collection launch popup — promotes the 3 specials (fixed 6-item
// bundle, capped buy-2, fixed 5-item bundle). Unlike WomensDayPopup/
// BirthdayBundlePopup this collection isn't time-boxed, so there's no
// countdown/expiry — it simply shows on a visit cadence like the others.

const VISITS_KEY = 'blom_cateye_specials_visits';
const SHOW_AT_KEY = 'blom_cateye_specials_show_at';
const SESSION_KEY = 'blom_cateye_specials_session';
const SHOW_DELAY_MS = 3000;

const MOBILE_IMAGE = CAT_EYE_MOBILE_IMAGE;
const DESKTOP_IMAGE = CAT_EYE_DESKTOP_IMAGE;

// Sold-out state is read live from the bundles (and the products inside them), so a
// special flips to "Sold out" by itself when any of its products sells out.
const FULL_COLLECTION_SLUG = 'nude-cat-eye-collection-top-coat';
const FIVE_COLOUR_SLUG = 'nude-cat-eye-5-color-bundle';
const BUNDLE_SLUGS = [FULL_COLLECTION_SLUG, FIVE_COLOUR_SLUG];
const COUNT_WORDS = ['', 'One way', 'Two ways', 'Three ways'];

const SPECIALS = [
  {
    label: 'Full Collection + Top Coat',
    detail: 'All 5 shades plus the Cat Eye Top Coat',
    price: 'R972',
    was: 'R1080',
    bundleSlug: FULL_COLLECTION_SLUG,
  },
  {
    label: 'Any 2 Colours',
    detail: 'Mix and match any 2 of the 5 shades',
    price: 'R340',
    was: null,
    bundleSlug: null,
  },
  {
    label: '5-Colour Bundle',
    detail: 'All 5 shades, Top Coat not included',
    price: 'R860',
    was: null,
    bundleSlug: FIVE_COLOUR_SLUG,
  },
];

const readInt = (key: string, fallback: number): number => {
  try {
    const value = Number.parseInt(localStorage.getItem(key) || '', 10);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const nextInterval = (): number => 3 + Math.floor(Math.random() * 3);

// "Any 2 Colours" isn't a bundle row — it needs at least 2 of the 5 shades in stock.
export const isCatEyeSpecialSoldOut = (
  bundleSlug: string | null,
  stock: Record<string, BundleStock> | null
): boolean => {
  if (!stock) return false;
  if (bundleSlug) return stock[bundleSlug] ? !stock[bundleSlug].inStock : false;
  const shades = stock[FIVE_COLOUR_SLUG];
  return shades ? shades.componentsInStock < 2 : false;
};

export const useCatEyeSpecials = () => {
  const stock = useBundleStock(BUNDLE_SLUGS);
  return SPECIALS.map((special) => ({
    ...special,
    soldOut: isCatEyeSpecialSoldOut(special.bundleSlug, stock),
  }));
};

export const CatEyeSpecialsPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const specials = useCatEyeSpecials();
  const availableCount = specials.filter((special) => !special.soldOut).length;

  useEffect(() => {
    let visits = readInt(VISITS_KEY, 0);
    const showAt = readInt(SHOW_AT_KEY, 1);
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        visits += 1;
        localStorage.setItem(VISITS_KEY, String(visits));
        sessionStorage.setItem(SESSION_KEY, '1');
      }
    } catch {
      // Storage may be unavailable in private browsing; the popup can still show.
    }

    if (visits < showAt) return;

    // Another auto-popup already claimed this visit — yield to avoid stacking.
    if (typeof window !== 'undefined' && window.__blomSignup?.hasShown) return;

    try {
      localStorage.setItem(SHOW_AT_KEY, String(visits + nextInterval()));
    } catch {
      // A failed reminder write should not block the current promo view.
    }

    if (typeof window !== 'undefined') {
      window.__blomSignup = window.__blomSignup || {};
      window.__blomSignup.hasShown = true;
    }

    timerRef.current = window.setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    html.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      html.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  const dismiss = () => setIsOpen(false);
  const shopCollection = () => {
    window.location.href = '/shop?category=gel-system';
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cateye-specials-popup-title"
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#2e1c14]/55 p-3 backdrop-blur-sm sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div className="relative flex max-h-[94vh] w-[min(880px,96vw)] flex-col overflow-y-auto rounded-[28px] border border-white/70 bg-[#fffaf5] shadow-[0_28px_90px_rgba(90,55,35,0.35)] motion-safe:animate-[bounce-in_0.45s_ease] md:grid md:grid-cols-2 md:overflow-hidden">
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close Nude Cat Eye Collection specials"
          onClick={dismiss}
          className="absolute right-3 top-3 z-20 rounded-full border border-white/80 bg-white/90 p-2 text-[#7a4a34] shadow-md transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#b8826a]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Visual panel — landscape strip on mobile, portrait column on desktop */}
        <div className="relative h-56 shrink-0 overflow-hidden bg-[#f3e1d3] sm:h-64 md:h-auto" aria-hidden="true">
          <img
            src={MOBILE_IMAGE}
            alt="Nude Cat Eye Collection"
            className="absolute inset-0 h-full w-full object-cover object-center md:hidden"
            loading="lazy"
          />
          <img
            src={DESKTOP_IMAGE}
            alt="Nude Cat Eye Collection"
            className="absolute inset-0 hidden h-full w-full object-cover object-top md:block"
            loading="lazy"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#a9715c] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow md:px-3.5 md:py-1.5 md:text-xs">
            New Collection
          </span>
        </div>

        {/* Content panel */}
        <div className="relative flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 md:px-9">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a9715c]">
            Nude Cat Eye Collection
          </p>
          <h2
            id="cateye-specials-popup-title"
            className="mt-2 font-serif text-2xl leading-[1.1] text-[#3f2a22] sm:text-3xl"
          >
            Five new shades.{availableCount > 0 && ` ${COUNT_WORDS[availableCount]} to save.`}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6e5548] sm:text-base">
            Soft rose-gold shimmer, one non-magnetic surprise, and a special for however you like to shop.
          </p>

          <div className="mt-5 space-y-2.5">
            {specials.map((special) => (
              <div
                key={special.label}
                className={`flex items-center justify-between gap-3 rounded-2xl border border-[#ecdccb] px-4 py-3 ${
                  special.soldOut ? 'bg-[#f7efe8]' : 'bg-white'
                }`}
              >
                <div className={special.soldOut ? 'opacity-60' : undefined}>
                  <p className="text-sm font-bold text-[#3f2a22]">{special.label}</p>
                  <p className="text-xs text-[#8a7062]">{special.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  {special.soldOut ? (
                    <span className="inline-flex rounded-full bg-[#3f2a22] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      Sold out
                    </span>
                  ) : (
                    <>
                      <p className="text-base font-bold text-[#3f2a22]">{special.price}</p>
                      {special.was && (
                        <p className="text-xs text-[#b3a091] line-through">{special.was}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={shopCollection}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#a9715c] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(169,113,92,0.32)] transition hover:-translate-y-0.5 hover:bg-[#8f5c44] focus:outline-none focus:ring-2 focus:ring-[#a9715c] focus:ring-offset-2"
          >
            Shop the Collection
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2 w-full py-2 text-sm font-medium text-[#8a7062] transition hover:text-[#3f2a22]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
