import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableTabRowProps {
  children: React.ReactNode;
  /** Index of the active tab; it is scrolled into view when it changes. */
  activeIndex?: number;
  /** Shown under the row only while some tabs are out of view, e.g. "Swipe to see all 4 instructors". */
  hint?: string;
  className?: string;
}

/**
 * A single-line row of tabs/pills that scrolls horizontally when it doesn't fit,
 * instead of widening the page (which makes mobile browsers zoom out).
 * Centred when everything fits; edge fades + a hint appear only when it overflows.
 */
export const ScrollableTabRow: React.FC<ScrollableTabRowProps> = ({ children, activeIndex, hint, className = '' }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update]);

  // Keep the active tab visible without moving the page vertically.
  useEffect(() => {
    const el = scrollerRef.current;
    const tab = activeIndex === undefined ? null : (el?.firstElementChild?.children[activeIndex] as HTMLElement | undefined);
    if (!el || !tab) return;
    const left = tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeIndex]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  const fade = 32;
  const mask = `linear-gradient(to right, ${canLeft ? 'transparent' : '#000'} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${canRight ? 'transparent' : '#000'} 100%)`;
  const overflowing = canLeft || canRight;

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={scrollerRef}
          className="overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitMaskImage: mask, maskImage: mask, scrollPaddingInline: 16 }}
        >
          <div className="flex w-max mx-auto gap-3 px-1 py-2 [&>*]:shrink-0 [&>*]:snap-center [&>*]:whitespace-nowrap">
            {children}
          </div>
        </div>
        {canLeft && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByPage(-1)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:text-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canRight && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByPage(1)}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:text-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
      {hint && overflowing && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500" aria-hidden="true">
          <ChevronLeft className={`h-4 w-4 ${canLeft ? 'text-pink-500' : 'text-gray-300'}`} />
          {hint}
          <ChevronRight className={`h-4 w-4 ${canRight ? 'text-pink-500' : 'text-gray-300'}`} />
        </p>
      )}
    </div>
  );
};
