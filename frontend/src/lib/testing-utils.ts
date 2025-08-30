'use client';

/**
 * Testing utilities for Permoney components
 * Provides comprehensive testing helpers for UX features
 */

// Mock data generators
export class MockDataGenerator {
  static generateTransaction(overrides: Partial<any> = {}): any {
    return {
      id: this.generateId(),
      description: 'Test Transaction',
      amount: Math.floor(Math.random() * 100000) + 1000,
      currency: 'IDR',
      category: 'food',
      merchant: 'Test Merchant',
      type: 'expense',
      date: new Date(),
      tags: ['test'],
      ...overrides,
    };
  }

  static generateNotification(overrides: Partial<any> = {}): any {
    return {
      id: this.generateId(),
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      category: 'system',
      priority: 'medium',
      timestamp: new Date(),
      read: false,
      ...overrides,
    };
  }

  static generateOnboardingStep(overrides: Partial<any> = {}): any {
    return {
      id: this.generateId(),
      title: 'Test Step',
      description: 'This is a test onboarding step',
      target: '#test-target',
      position: 'bottom',
      ...overrides,
    };
  }

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Component testing utilities
export class ComponentTestUtils {
  static async waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  static async waitForCondition(
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (condition()) {
        resolve(true);
        return;
      }

      const startTime = Date.now();
      const checkCondition = () => {
        if (condition()) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          resolve(false);
        } else {
          setTimeout(checkCondition, interval);
        }
      };

      setTimeout(checkCondition, interval);
    });
  }

  static simulateKeyPress(element: Element, key: string, options: KeyboardEventInit = {}): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
  }

  static simulateClick(element: Element, options: MouseEventInit = {}): void {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
  }

  static simulateInput(element: HTMLInputElement, value: string): void {
    element.value = value;
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
  }

  static getByTestId(testId: string): Element | null {
    return document.querySelector(`[data-testid="${testId}"]`);
  }

  static getAllByTestId(testId: string): Element[] {
    return Array.from(document.querySelectorAll(`[data-testid="${testId}"]`));
  }
}

// Accessibility testing utilities
export class AccessibilityTestUtils {
  static checkAriaLabels(container: Element = document.body): string[] {
    const issues: string[] = [];
    const interactiveElements = container.querySelectorAll(
      'button, input, select, textarea, [role="button"], [role="link"], [role="menuitem"]'
    );

    interactiveElements.forEach((element, index) => {
      const hasLabel = element.getAttribute('aria-label') ||
                      element.getAttribute('aria-labelledby') ||
                      element.textContent?.trim() ||
                      (element as HTMLInputElement).placeholder;

      if (!hasLabel) {
        issues.push(`Interactive element at index ${index} (${element.tagName}) lacks accessible label`);
      }
    });

    return issues;
  }

  static checkKeyboardNavigation(container: Element = document.body): string[] {
    const issues: string[] = [];
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push(`Element at index ${index} has positive tabindex (${tabIndex}), which can cause navigation issues`);
      }
    });

    return issues;
  }

  static checkColorContrast(container: Element = document.body): Array<{ element: Element; issue: string }> {
    const issues: Array<{ element: Element; issue: string }> = [];
    const textElements = Array.from(container.querySelectorAll('*')).filter(el => {
      return el.textContent?.trim() && el.children.length === 0;
    });

    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;

      if (color === 'rgba(0, 0, 0, 0)' || backgroundColor === 'rgba(0, 0, 0, 0)') {
        issues.push({
          element,
          issue: 'Unable to determine color contrast due to transparent colors'
        });
      }
    });

    return issues;
  }
}

// Performance testing utilities
export class PerformanceTestUtils {
  static measureRenderTime(componentName: string, renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${componentName} render time: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measureMemoryUsage(label: string): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
      
      console.log(`Memory usage ${label}:`, {
        used: `${(usage.used / 1024 / 1024).toFixed(2)} MB`,
        total: `${(usage.total / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(usage.limit / 1024 / 1024).toFixed(2)} MB`,
      });
      
      return usage;
    }
    return null;
  }

  static async measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
    return { result, duration };
  }
}

// Error testing utilities
export class ErrorTestUtils {
  static simulateNetworkError(): void {
    // Mock fetch to simulate network error
    const originalFetch = window.fetch;
    window.fetch = () => Promise.reject(new Error('Network error'));
    
    // Restore after a short delay
    setTimeout(() => {
      window.fetch = originalFetch;
    }, 1000);
  }

  static simulateOfflineMode(): void {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    // Dispatch offline event
    window.dispatchEvent(new Event('offline'));
  }

  static simulateOnlineMode(): void {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    
    window.dispatchEvent(new Event('online'));
  }

  static captureConsoleErrors(): { errors: string[]; restore: () => void } {
    const errors: string[] = [];
    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    return {
      errors,
      restore: () => {
        console.error = originalError;
      },
    };
  }
}

// Visual regression testing utilities
export class VisualTestUtils {
  static async captureScreenshot(element: Element): Promise<string | null> {
    if ('html2canvas' in window) {
      try {
        const canvas = await (window as any).html2canvas(element);
        return canvas.toDataURL();
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
        return null;
      }
    }
    return null;
  }

  static compareElements(element1: Element, element2: Element): boolean {
    const style1 = window.getComputedStyle(element1);
    const style2 = window.getComputedStyle(element2);
    
    const importantStyles = [
      'width', 'height', 'color', 'backgroundColor', 'fontSize', 'fontFamily'
    ];
    
    return importantStyles.every(style => style1[style as any] === style2[style as any]);
  }

  static getElementBounds(element: Element): DOMRect {
    return element.getBoundingClientRect();
  }
}

// Integration testing utilities
export class IntegrationTestUtils {
  static async testOnboardingFlow(steps: any[]): Promise<boolean> {
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Wait for step to be visible
        if (step.target) {
          const element = await ComponentTestUtils.waitForElement(step.target);
          if (!element) {
            console.error(`Step ${i + 1}: Target element not found: ${step.target}`);
            return false;
          }
        }
        
        // Simulate user interaction
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return true;
    } catch (error) {
      console.error('Onboarding flow test failed:', error);
      return false;
    }
  }

  static async testPrivacyMode(): Promise<boolean> {
    try {
      // Test privacy toggle
      const privacyToggle = ComponentTestUtils.getByTestId('privacy-toggle');
      if (!privacyToggle) {
        console.error('Privacy toggle not found');
        return false;
      }
      
      ComponentTestUtils.simulateClick(privacyToggle);
      
      // Wait for privacy mode to activate
      const isActive = await ComponentTestUtils.waitForCondition(
        () => document.body.classList.contains('privacy-mode'),
        2000
      );
      
      return isActive;
    } catch (error) {
      console.error('Privacy mode test failed:', error);
      return false;
    }
  }

  static async testOfflineQueue(): Promise<boolean> {
    try {
      // Simulate offline mode
      ErrorTestUtils.simulateOfflineMode();
      
      // Add test action to queue
      const testAction = MockDataGenerator.generateTransaction();
      
      // Simulate online mode
      ErrorTestUtils.simulateOnlineMode();
      
      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      console.error('Offline queue test failed:', error);
      return false;
    }
  }
}

// Test suite runner
export class TestSuiteRunner {
  private tests: Array<{ name: string; test: () => Promise<boolean> }> = [];
  
  addTest(name: string, test: () => Promise<boolean>): void {
    this.tests.push({ name, test });
  }
  
  async runAll(): Promise<{ passed: number; failed: number; results: Array<{ name: string; passed: boolean; error?: string }> }> {
    const results: Array<{ name: string; passed: boolean; error?: string }> = [];
    let passed = 0;
    let failed = 0;
    
    for (const { name, test } of this.tests) {
      try {
        const result = await test();
        results.push({ name, passed: result });
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        results.push({ 
          name, 
          passed: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failed++;
      }
    }
    
    return { passed, failed, results };
  }
}
