'use client';

/**
 * Accessibility utilities for Permoney
 * Implements comprehensive accessibility features and WCAG compliance
 */

// ARIA live region manager
export class LiveRegionManager {
  private static regions: Map<string, HTMLElement> = new Map();

  static createRegion(id: string, politeness: 'polite' | 'assertive' = 'polite'): HTMLElement {
    if (this.regions.has(id)) {
      return this.regions.get(id)!;
    }

    const region = document.createElement('div');
    region.id = `live-region-${id}`;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    document.body.appendChild(region);
    this.regions.set(id, region);
    return region;
  }

  static announce(message: string, regionId: string = 'default', politeness: 'polite' | 'assertive' = 'polite'): void {
    const region = this.createRegion(regionId, politeness);
    
    // Clear previous message
    region.textContent = '';
    
    // Announce new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }

  static clear(regionId: string = 'default'): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.textContent = '';
    }
  }

  static cleanup(): void {
    this.regions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    this.regions.clear();
  }
}

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  private static trapStack: HTMLElement[] = [];

  static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  static restoreFocus(): void {
    const element = this.focusStack.pop();
    if (element && element.focus) {
      element.focus();
    }
  }

  static trapFocus(container: HTMLElement): void {
    this.trapStack.push(container);
    
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    // Store cleanup function
    (container as any)._focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  static releaseFocusTrap(): void {
    const container = this.trapStack.pop();
    if (container && (container as any)._focusTrapCleanup) {
      (container as any)._focusTrapCleanup();
      delete (container as any)._focusTrapCleanup;
    }
  }

  private static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)).filter(
      element => this.isVisible(element as HTMLElement)
    ) as HTMLElement[];
  }

  private static isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      wrap?: boolean;
      onSelect?: (index: number) => void;
    } = {}
  ): number {
    const { orientation = 'vertical', wrap = true, onSelect } = options;
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? items.length - 1 : currentIndex);
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : (wrap ? 0 : currentIndex);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? items.length - 1 : currentIndex);
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : (wrap ? 0 : currentIndex);
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect) {
          onSelect(currentIndex);
        }
        return currentIndex;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }

    return newIndex;
  }
}

// Color contrast utilities
export class ColorContrast {
  static calculateContrast(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;

    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  static meetsWCAG(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const contrast = this.calculateContrast(color1, color2);
    return level === 'AA' ? contrast >= 4.5 : contrast >= 7;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private static getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  static describeElement(element: HTMLElement): string {
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('aria-labelledby') ||
                  (element as any).textContent?.trim() ||
                  element.getAttribute('title') ||
                  element.getAttribute('alt');
    
    const state = [];
    if (element.getAttribute('aria-expanded') === 'true') state.push('expanded');
    if (element.getAttribute('aria-expanded') === 'false') state.push('collapsed');
    if (element.getAttribute('aria-selected') === 'true') state.push('selected');
    if (element.getAttribute('aria-checked') === 'true') state.push('checked');
    if (element.hasAttribute('disabled')) state.push('disabled');

    return `${role}${label ? ` "${label}"` : ''}${state.length ? ` (${state.join(', ')})` : ''}`;
  }

  static announcePageChange(title: string): void {
    LiveRegionManager.announce(`Navigated to ${title}`, 'navigation', 'assertive');
  }

  static announceFormError(fieldName: string, error: string): void {
    LiveRegionManager.announce(`Error in ${fieldName}: ${error}`, 'form-errors', 'assertive');
  }

  static announceLoadingState(isLoading: boolean, context?: string): void {
    const message = isLoading 
      ? `Loading${context ? ` ${context}` : ''}...`
      : `Finished loading${context ? ` ${context}` : ''}`;
    
    LiveRegionManager.announce(message, 'loading-states', 'polite');
  }
}

// Reduced motion utilities
export class MotionPreferences {
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static respectMotionPreference<T>(
    normalValue: T,
    reducedValue: T
  ): T {
    return this.prefersReducedMotion() ? reducedValue : normalValue;
  }

  static createMotionMediaQuery(callback: (prefersReduced: boolean) => void): MediaQueryList {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    callback(mediaQuery.matches); // Call immediately with current value
    
    return mediaQuery;
  }
}

// High contrast mode detection
export class HighContrastMode {
  static isActive(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches;
  }

  static createContrastMediaQuery(callback: (isHighContrast: boolean) => void): MediaQueryList {
    const mediaQuery = window.matchMedia('(prefers-contrast: high), (-ms-high-contrast: active)');
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    callback(mediaQuery.matches);
    
    return mediaQuery;
  }
}

// Text scaling utilities
export class TextScaling {
  static getCurrentScale(): number {
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: absolute;
      visibility: hidden;
      font-size: 16px;
      width: 100px;
    `;
    document.body.appendChild(testElement);
    
    const actualWidth = testElement.offsetWidth;
    document.body.removeChild(testElement);
    
    return actualWidth / 100;
  }

  static isTextScaled(): boolean {
    return this.getCurrentScale() > 1.2;
  }
}

// Accessibility testing utilities
export class AccessibilityTester {
  static checkMissingAltText(): HTMLImageElement[] {
    return Array.from(document.querySelectorAll('img:not([alt])')) as HTMLImageElement[];
  }

  static checkMissingLabels(): HTMLElement[] {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea')) as HTMLElement[];
    return inputs.filter(input => {
      const hasLabel = input.getAttribute('aria-label') ||
                      input.getAttribute('aria-labelledby') ||
                      document.querySelector(`label[for="${input.id}"]`);
      return !hasLabel;
    });
  }

  static checkColorContrastIssues(): Array<{ element: HTMLElement; contrast: number }> {
    const issues: Array<{ element: HTMLElement; contrast: number }> = [];
    const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.color && style.backgroundColor && el.textContent?.trim();
    }) as HTMLElement[];

    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const contrast = ColorContrast.calculateContrast(style.color, style.backgroundColor);
      
      if (contrast < 4.5) {
        issues.push({ element, contrast });
      }
    });

    return issues;
  }

  static generateAccessibilityReport(): {
    missingAltText: number;
    missingLabels: number;
    contrastIssues: number;
    focusableElements: number;
  } {
    return {
      missingAltText: this.checkMissingAltText().length,
      missingLabels: this.checkMissingLabels().length,
      contrastIssues: this.checkColorContrastIssues().length,
      focusableElements: FocusManager['getFocusableElements'](document.body).length,
    };
  }
}
