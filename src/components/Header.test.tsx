// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Header, type HeaderProps } from './Header';

const props: HeaderProps = { difficulty: 'Extreme', elapsedSeconds: 4834, mistakes: 2, showTimer: true, theme: 'dark', onCycleTheme: vi.fn(), onOpenSettings: vi.fn() };
afterEach(cleanup);

it('links the installed app icon to the explicit homepage', () => {
  render(<Header {...props} />);
  const home = screen.getByRole('link', { name: 'Sudoku home' });
  expect(home.getAttribute('href')).toMatch(/index\.html\?home$/);
  expect(home.querySelector('img')?.getAttribute('src')).toContain('icons/icon-192.png');
});

it('groups level, mistakes and time between home and the controls', () => {
  const { container } = render(<Header {...props} />);
  const stats = container.querySelector('.game-header__stats')!;
  expect([...stats.children].map(c => c.textContent)).toEqual(['Extreme', '2 mistakes', '1:20:34']);
  fireEvent.click(screen.getByRole('button', { name: 'Theme: dark. Click to change.' }));
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  expect(props.onCycleTheme).toHaveBeenCalledOnce();
  expect(props.onOpenSettings).toHaveBeenCalledOnce();
});

it('hides time when disabled and uses singular mistake copy', () => {
  render(<Header {...props} showTimer={false} mistakes={1} />);
  expect(screen.queryByText('1:20:34')).toBeNull();
  expect(screen.getByText('1 mistake')).toBeTruthy();
});
