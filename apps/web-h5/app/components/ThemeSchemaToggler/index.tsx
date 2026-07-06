'use client';

import { useTheme } from 'next-themes';
import { memo, useEffect, useState } from 'react';
import * as _ from './index.css';

type ThemeMode = 'dark' | 'light';

const DEFAULT_ANIMATION_DURATION = 400;
const DEFAULT_ANIMATION_EASING = 'ease-in-out';

const ThemeSchemaToggler = memo(() => {
  const { setTheme, theme } = useTheme();

  const isDark = theme === 'dark';
  const [isMounted, setIsMounted] = useState(false);

  const toggleThemeScheme = () => {
    const themeSchemes: ThemeMode[] = ['light', 'dark'];

    const index = themeSchemes.findIndex(item => item === theme);

    const nextIndex = index === themeSchemes.length - 1 ? 0 : index + 1;

    const nextThemeScheme = themeSchemes[nextIndex];

    setTheme(nextThemeScheme);
  };

  const toggleDark = async (event: MouseEvent) => {
    const isAppearanceTransition = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      toggleThemeScheme();
      return;
    }

    await document.startViewTransition(() => {
      toggleThemeScheme();
    }).ready;

    if (theme === 'system') return;

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];

    document.documentElement.animate(
      {
        clipPath
      },
      {
        duration: DEFAULT_ANIMATION_DURATION,
        easing: DEFAULT_ANIMATION_EASING,
        pseudoElement: '::view-transition-new(root)'
      }
    );
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const themeClassName = isDark ? 'onOff' : 'onOff daySwitch';

  return (
    <div id="dayNightSwitch" className="generalWrapper">
      <a className="click" onClick={e => toggleDark(e as unknown as MouseEvent)}>
        <div className={themeClassName}>
          <div className="star star1" />
          <div className="star star2" />
          <div className="star star3" />
          <div className="star star4" />
          <div className="star star5" />
          <div className="star sky" />
          <div className="sunMoon">
            <div className="crater crater1" />
            <div className="crater crater2" />
            <div className="crater crater3" />
            <div className="cloud part1" />
            <div className="cloud part2" />
          </div>
        </div>
      </a>
    </div>
  );
});

export default ThemeSchemaToggler;
