import game from '../play.html?raw';
import { describe, expect, it } from 'vitest';

import html from '../index.html?raw';
const redirect = html.match(/<script>([\s\S]*?)<\/script>/)![1];
const destination = (standalone: boolean, search = '', ios = false) => {
  const location = { search, replace: (path: string) => { target = path; } };
  let target: string | null = null;
  new Function('window', 'navigator', 'location', redirect)(
    { matchMedia: () => ({ matches: standalone }) }, { standalone: ios }, location,
  );
  return target;
};

describe('homepage entry', () => {
  it('sends installed launches to the game, including older home-screen shortcuts', () => {
    expect(destination(true)).toBe('./play.html');
    expect(destination(false, '', true)).toBe('./play.html');
  });
  it('allows the explicit home link inside an installed app', () => {
    expect(destination(true, '?home')).toBeNull();
    expect(destination(false, '?home', true)).toBeNull();
  });
  it('keeps ordinary browser visitors on the landing page', () => {
    expect(destination(false)).toBeNull();
  });
  it('links calls to action to the game and keeps its existing entry module', () => {
    expect(html.match(/href="\.\/play.html"/g)?.length).toBe(4);
    expect(game).toContain('src="/src/main.tsx"');
  });
});
