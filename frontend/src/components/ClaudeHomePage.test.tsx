/**
 * ClaudeHomePage Tests
 * اختبارات شاملة لصفحة Claude الرئيسية
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import ClaudeHomePage from './ClaudeHomePage';

describe('ClaudeHomePage', () => {
  describe('Rendering', () => {
    it('renders the home page correctly', () => {
      render(<ClaudeHomePage />);
      // QURABIA appears in both nav and footer logos
      const instances = screen.getAllByText(/QURABIA/i);
      expect(instances.length).toBeGreaterThan(0);
    });

    it('renders the hero section with Arabic text by default', () => {
      render(<ClaudeHomePage />);
      expect(screen.getByText(/القوة الكمية العربية/i)).toBeInTheDocument();
    });

    it('renders all stats correctly', () => {
      render(<ClaudeHomePage />);
      expect(screen.getByText('4.7')).toBeInTheDocument();
      expect(screen.getByText('17+')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText('95+')).toBeInTheDocument();
    });

    it('renders all 6 feature cards', () => {
      render(<ClaudeHomePage />);
      const featureCards = screen.getAllByRole('article');
      expect(featureCards).toHaveLength(6);
    });

    it('renders navigation links', () => {
      const { container } = render(<ClaudeHomePage />);
      const nav = container.querySelector('nav')!;

      expect(within(nav).getByRole('link', { name: /المميزات/i })).toBeInTheDocument();
      expect(within(nav).getByRole('link', { name: /عن المنصة/i })).toBeInTheDocument();
      expect(within(nav).getByRole('link', { name: /اتصل بنا/i })).toBeInTheDocument();
    });

    it('renders footer with all sections', () => {
      render(<ClaudeHomePage />);
      expect(screen.getByText(/نبني جسراً بين الحضارة العربية وتقنيات الغد/i)).toBeInTheDocument();
      expect(screen.getByText(/© 2026 QURABIA/i)).toBeInTheDocument();
    });

    it('renders skip link for accessibility', () => {
      render(<ClaudeHomePage />);
      const skipLink = screen.getByText(/انتقل إلى المحتوى الرئيسي/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveClass('skip-link');
    });
  });

  describe('Language Toggle', () => {
    it('toggles language when language button is clicked', () => {
      render(<ClaudeHomePage />);

      // Initially in Arabic (RTL)
      expect(screen.getByText(/القوة الكمية العربية/i)).toBeInTheDocument();

      // Click language toggle button
      const langButton = screen.getByRole('button', { name: /EN/i });
      fireEvent.click(langButton);

      // Should now show English
      expect(screen.getByText(/The Arab Quantum Power/i)).toBeInTheDocument();
    });

    it('changes dir attribute when toggling language', () => {
      const { container } = render(<ClaudeHomePage />);
      const homeDiv = container.querySelector('.claude-home');

      // Initially RTL
      expect(homeDiv).toHaveAttribute('dir', 'rtl');
      expect(homeDiv).toHaveAttribute('lang', 'ar');

      // Toggle to English
      const langButton = screen.getByRole('button', { name: /EN/i });
      fireEvent.click(langButton);

      // Now LTR
      expect(homeDiv).toHaveAttribute('dir', 'ltr');
      expect(homeDiv).toHaveAttribute('lang', 'en');
    });
  });

  describe('Interactive Elements', () => {
    it('renders CTA buttons with correct links', () => {
      render(<ClaudeHomePage />);

      const getStartedBtn = screen.getByRole('link', { name: /ابدأ الآن/i });
      expect(getStartedBtn).toHaveAttribute('href', '/dashboard');

      const discoverBtn = screen.getByRole('link', { name: /اكتشف المزيد/i });
      expect(discoverBtn).toHaveAttribute('href', '#features');
    });

    it('renders registration and demo buttons in CTA section', () => {
      render(<ClaudeHomePage />);

      const registerBtn = screen.getByRole('link', { name: /إنشاء حساب/i });
      expect(registerBtn).toHaveAttribute('href', '/register');

      const demoBtn = screen.getByRole('link', { name: /تجربة مجانية/i });
      expect(demoBtn).toHaveAttribute('href', '/demo');
    });

    it('feature cards have proper styling classes', () => {
      const { container } = render(<ClaudeHomePage />);
      const featureCards = container.querySelectorAll('.feature-card');

      expect(featureCards.length).toBeGreaterThan(0);
      featureCards.forEach(card => {
        expect(card).toHaveClass('card-glass');
        expect(card).toHaveClass('animate-slide-up');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic HTML structure', () => {
      const { container } = render(<ClaudeHomePage />);

      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('main content has proper id for skip link', () => {
      const { container } = render(<ClaudeHomePage />);
      const mainContent = container.querySelector('#main-content');
      expect(mainContent).toBeInTheDocument();
    });

    it('all buttons have accessible names', () => {
      render(<ClaudeHomePage />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        // Either has text content or aria-label
        expect(
          button.textContent || button.getAttribute('aria-label')
        ).toBeTruthy();
      });
    });

    it('language toggle has proper aria-label', () => {
      render(<ClaudeHomePage />);
      const langButton = screen.getByLabelText(/Switch to English|التبديل إلى العربية/i);
      expect(langButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies container class for proper layout', () => {
      const { container } = render(<ClaudeHomePage />);
      const containers = container.querySelectorAll('.container');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('uses fluid typography variables', () => {
      const { container } = render(<ClaudeHomePage />);
      const styles = container.querySelector('style');
      expect(styles?.textContent).toContain('var(--text-');
      expect(styles?.textContent).toContain('var(--sp-');
    });
  });

  describe('Visual Elements', () => {
    it('renders animated particles in hero section', () => {
      const { container } = render(<ClaudeHomePage />);
      const particles = container.querySelectorAll('.particle');
      expect(particles).toHaveLength(3);
    });

    it('renders feature icons', () => {
      const { container } = render(<ClaudeHomePage />);
      const icons = container.querySelectorAll('.feature-icon');
      expect(icons.length).toBeGreaterThanOrEqual(6);
    });

    it('renders version badge', () => {
      render(<ClaudeHomePage />);
      const badge = screen.getByText('v4.7');
      expect(badge).toHaveClass('badge');
    });

    it('renders logo with icon and text', () => {
      const { container } = render(<ClaudeHomePage />);
      const logos = container.querySelectorAll('.logo');
      expect(logos.length).toBeGreaterThan(0);

      logos.forEach(logo => {
        expect(logo.querySelector('.logo-icon')).toBeInTheDocument();
        expect(logo.querySelector('.logo-text')).toBeInTheDocument();
      });
    });
  });

  describe('Content Sections', () => {
    it('renders all main sections', () => {
      const { container } = render(<ClaudeHomePage />);

      expect(container.querySelector('.hero-section')).toBeInTheDocument();
      expect(container.querySelector('.features-section')).toBeInTheDocument();
      expect(container.querySelector('.about-section')).toBeInTheDocument();
      expect(container.querySelector('.cta-section')).toBeInTheDocument();
    });

    it('renders features with correct structure', () => {
      render(<ClaudeHomePage />);

      // Check for feature titles (in Arabic by default)
      expect(screen.getByText(/نظام GENESIS v4.7/i)).toBeInTheDocument();
      expect(screen.getByText(/الحوسبة الكمومية/i)).toBeInTheDocument();
      expect(screen.getByText(/الأمان الكمومي/i)).toBeInTheDocument();
      expect(screen.getByText(/ذكاء اصطناعي قابل للتفسير/i)).toBeInTheDocument();
    });

    it('renders about section with visual content', () => {
      const { container } = render(<ClaudeHomePage />);
      const aboutVisual = container.querySelector('.about-visual');
      expect(aboutVisual).toBeInTheDocument();
      expect(aboutVisual).toHaveClass('card-glass');
    });
  });

  describe('Performance', () => {
    it('uses CSS variables for consistent theming', () => {
      const { container } = render(<ClaudeHomePage />);
      const styles = container.querySelector('style');

      // Check for CSS variable usage
      expect(styles?.textContent).toContain('var(--bg-');
      expect(styles?.textContent).toContain('var(--text-');
      expect(styles?.textContent).toContain('var(--accent-');
      expect(styles?.textContent).toContain('var(--border-');
    });

    it('uses animation classes properly', () => {
      const { container } = render(<ClaudeHomePage />);
      const animatedElements = container.querySelectorAll('.animate-slide-up');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('applies Claude design system classes', () => {
      const { container } = render(<ClaudeHomePage />);

      // Check for common design system classes
      expect(container.querySelector('.btn')).toBeInTheDocument();
      expect(container.querySelector('.btn-secondary')).toBeInTheDocument();
      expect(container.querySelector('.card-glass')).toBeInTheDocument();
      expect(container.querySelector('.font-display')).toBeInTheDocument();
    });

    it('uses proper spacing variables', () => {
      const { container } = render(<ClaudeHomePage />);
      const styles = container.querySelector('style');
      expect(styles?.textContent).toContain('var(--sp-');
    });

    it('uses proper transition timing', () => {
      const { container } = render(<ClaudeHomePage />);
      const styles = container.querySelector('style');
      expect(styles?.textContent).toContain('var(--dur-');
      expect(styles?.textContent).toContain('var(--ease-');
    });
  });

  describe('Scroll Behavior', () => {
    it('applies parallax effect to header', async () => {
      const { container } = render(<ClaudeHomePage />);
      const header = container.querySelector('.home-header');
      expect(header).toBeInTheDocument();

      // Make window.scrollY writable in JSDOM
      Object.defineProperty(window, 'scrollY', {
        value: 100,
        writable: true,
        configurable: true,
      });

      await act(async () => {
        fireEvent.scroll(window);
      });

      // scrollY=100 with multiplier 0.5 → translateY(50px)
      expect(header).toHaveStyle({ transform: 'translateY(50px)' });
    });
  });
});

describe('ClaudeHomePage Integration', () => {
  it('matches snapshot', () => {
    const { container } = render(<ClaudeHomePage />);
    expect(container).toMatchSnapshot();
  });

  it('renders without crashing', () => {
    expect(() => render(<ClaudeHomePage />)).not.toThrow();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ClaudeHomePage />);

    // Basic accessibility checks
    expect(container.querySelector('[role="main"]') || container.querySelector('main')).toBeInTheDocument();
    expect(container.querySelector('[role="navigation"]') || container.querySelector('nav')).toBeInTheDocument();
    expect(container.querySelector('[role="contentinfo"]') || container.querySelector('footer')).toBeInTheDocument();
  });
});
