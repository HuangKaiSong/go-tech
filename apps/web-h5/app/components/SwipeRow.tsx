'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Children, type HTMLAttributes, type ReactNode, useEffect, useRef, useState } from 'react';
import { useViewMode } from '@/contexts/view-mode-context';
import { getCardScrollTarget, getClosestCard } from '@/lib/swipe-row';

type SwipeRowProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & { children: ReactNode };
type DragState = { index: number; left: number; moved: boolean; pointerId: number; x: number; y: number };

/** A single carousel implementation for touch, pen and mouse, including scaled previews. */
export default function SwipeRow({ children, className = '', ...props }: SwipeRowProps) {
  const { frame, isMobile } = useViewMode();
  const scale = frame?.scale ?? 1;
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = Children.toArray(children).length;
  const activeIndex = Math.min(index, Math.max(0, count - 1));
  const drag = useRef<DragState | null>(null);
  const ignoreClick = useRef(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const getTargets = () => {
    const el = ref.current;
    if (!el) return [];
    const viewportLeft = el.getBoundingClientRect().left + el.clientLeft * scale;
    return Array.from(el.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement)
      .map(child =>
        getCardScrollTarget({
          cardLeft: child.getBoundingClientRect().left,
          cardWidth: child.offsetWidth,
          viewportLeft,
          viewportWidth: el.clientWidth,
          scrollLeft: el.scrollLeft,
          maxScroll: Math.max(0, el.scrollWidth - el.clientWidth),
          scale
        })
      );
  };

  const goTo = (nextIndex: number) => {
    const el = ref.current;
    const targets = getTargets();
    if (!el || targets.length === 0) return;
    const targetIndex = Math.max(0, Math.min(targets.length - 1, nextIndex));
    el.scrollTo({
      left: targets[targetIndex],
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const updateIndex = () => {
      const cards = Array.from(el.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
      const first = cards[0];
      if (!first) {
        setIndex(0);
        return;
      }
      const left = el.getBoundingClientRect().left + el.clientLeft * scale;
      const targets = cards.map(child =>
        getCardScrollTarget({
          cardLeft: child.getBoundingClientRect().left,
          cardWidth: child.offsetWidth,
          viewportLeft: left,
          viewportWidth: el.clientWidth,
          scrollLeft: el.scrollLeft,
          maxScroll: Math.max(0, el.scrollWidth - el.clientWidth),
          scale
        })
      );
      setIndex(getClosestCard(targets, el.scrollLeft));
    };
    const observer = new ResizeObserver(updateIndex);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    updateIndex();
    el.addEventListener('scroll', updateIndex, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', updateIndex);
    };
  }, [count, scale]);

  useEffect(
    () => () => {
      clearTimeout(clickTimer.current);
    },
    []
  );

  const finishDrag = (cancelled = false) => {
    const current = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!current || !el) return;
    el.style.scrollSnapType = '';
    if (el.hasPointerCapture(current.pointerId)) el.releasePointerCapture(current.pointerId);
    if (!current.moved) return;
    const distance = el.scrollLeft - current.left;
    goTo(
      cancelled
        ? getClosestCard(getTargets(), el.scrollLeft)
        : current.index + (Math.abs(distance) > 30 ? Math.sign(distance) : 0)
    );
    ignoreClick.current = true;
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      ignoreClick.current = false;
    }, 0);
  };

  return (
    <div className="relative min-w-0" data-carousel>
      <div
        {...props}
        ref={ref}
        className={`${className} touch-pan-y touch-pinch-zoom md:touch-auto select-none md:select-auto`}
        data-carousel-track
        onDragStart={event => event.preventDefault()}
        onPointerDown={event => {
          if (!isMobile || !event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return;
          if (event.target.closest('button,input,textarea,select')) return;
          clearTimeout(clickTimer.current);
          ignoreClick.current = false;
          drag.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            left: event.currentTarget.scrollLeft,
            index: activeIndex,
            moved: false
          };
        }}
        onPointerMove={event => {
          const current = drag.current;
          if (!current || event.pointerId !== current.pointerId) return;
          const dx = (event.clientX - current.x) / scale;
          const dy = (event.clientY - current.y) / scale;
          if (!current.moved && Math.abs(dy) > Math.max(8, Math.abs(dx))) {
            drag.current = null;
            return;
          }
          if (!current.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
            current.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.style.scrollSnapType = 'none';
          }
          if (current.moved) {
            event.preventDefault();
            event.currentTarget.scrollLeft = current.left - dx;
          }
        }}
        onPointerUp={() => finishDrag()}
        onPointerCancel={() => finishDrag(true)}
        onLostPointerCapture={() => finishDrag(true)}
        onClickCapture={event => {
          if (ignoreClick.current) {
            event.preventDefault();
            event.stopPropagation();
            ignoreClick.current = false;
          }
        }}
      >
        {children}
      </div>
      {count > 1 ? (
        <div className="md:hidden flex items-center justify-center gap-3 mt-3" data-carousel-controls>
          <button
            type="button"
            aria-label="上一個"
            disabled={activeIndex === 0}
            onClick={() => goTo(activeIndex - 1)}
            className="w-9 h-9 rounded-full border bg-background shadow flex items-center justify-center text-primary disabled:opacity-40"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: count }, (_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`第 ${i + 1} 張，共 ${count} 張`}
                aria-pressed={i === activeIndex}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${i === activeIndex ? 'w-5 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
              />
            ))}
            <span className="ml-1 text-xs text-muted-foreground tabular-nums" aria-live="polite">
              {activeIndex + 1}/{count}
            </span>
          </div>
          <button
            type="button"
            aria-label="下一個"
            disabled={activeIndex === count - 1}
            onClick={() => goTo(activeIndex + 1)}
            className="w-9 h-9 rounded-full border bg-background shadow flex items-center justify-center text-primary disabled:opacity-40"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
