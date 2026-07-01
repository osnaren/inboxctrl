'use client';
import { useState, useEffect } from 'react';

import Link from 'next/link';

import { Menu, X } from 'lucide-react';

import { GithubIcon } from '@/components/github-icon';
import { navItems } from '@/config/nav.config';
import { siteConfig } from '@/config/site.config';

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Exclude github if it exists in navItems (we render it separately)
  const mainNavItems = navItems.filter((item) => !item.href.includes('github.com'));

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <Link className="brand-link" href="/" onClick={closeMobileMenu}>
          <span className="brand-mark" aria-hidden="true">
            Ic
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="site-nav">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link className="nav-link nav-github" href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
            <GithubIcon size={15} />
            <span>GitHub</span>
          </Link>
        </nav>
        <button
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mobile-nav-link"
            onClick={closeMobileMenu}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={siteConfig.githubUrl}
          className="mobile-nav-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMobileMenu}
        >
          GitHub
        </Link>
      </div>
    </>
  );
}
