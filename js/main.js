// Main Site JavaScript - Shared Utilities
// Common functionality used across the bambans.github.io site

// Global configuration
const SITE_CONFIG = {
  name: 'bambans.github.io',
  version: '2.1.0',
  author: 'Otávio Rodrigues Bambans',
  email: 'otavio@bambans.top',
  social: {
    github: 'https://github.com/bambans/',
    linkedin: 'https://www.linkedin.com/in/bambans/',
    instagram: 'https://www.instagram.com/otavio_bambans/',
    facebook: 'https://www.facebook.com/otavio.rodrigues.bambans',
    lattes: 'http://lattes.cnpq.br/9571686392212007'
  },
  colors: {
    terminalBg: '#121212',
    terminalPurple: '#8a2be2',
    terminalCyan: '#40e0d0',
    terminalOrange: '#ff6347',
    terminalOrangeHover: '#7f1300'
  }
};

// Utility functions
const Utils = {
  // Debounce function for performance optimization
  debounce: function(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  },

  // Throttle function for scroll events
  throttle: function(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Check if element is in viewport
  isInViewport: function(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Smooth scroll to element
  scrollToElement: function(element, offset = 0) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  },

  // Copy text to clipboard
  copyToClipboard: async function(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  },

  // Format date consistently
  formatDate: function(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const finalOptions = { ...defaultOptions, ...options };
    return new Date(date).toLocaleDateString('en-US', finalOptions);
  },

  // Get random terminal color
  getRandomTerminalColor: function() {
    const colors = [
      SITE_CONFIG.colors.terminalPurple,
      SITE_CONFIG.colors.terminalCyan,
      SITE_CONFIG.colors.terminalOrange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
};

// Animation utilities
const Animations = {
  // Fade in elements with delay
  fadeInElements: function(selector = '.fade-in', delay = 100) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      setTimeout(() => {
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * delay);
    });
  },

  // Typing effect for terminal commands
  typeText: function(element, text, speed = 50) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) return;

    let i = 0;
    element.textContent = '';
    element.style.borderRight = '2px solid ' + SITE_CONFIG.colors.terminalCyan;
    
    const timer = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          element.style.borderRight = 'none';
        }, 1000);
      }
    }, speed);
  },

  // Terminal cursor blink effect
  addCursorBlink: function(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (element) {
      element.classList.add('terminal-cursor');
    }
  },

  // Glitch effect for text
  glitchEffect: function(element, duration = 1000) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) return;

    element.classList.add('glitch-effect');
    setTimeout(() => {
      element.classList.remove('glitch-effect');
    }, duration);
  }
};

// Theme utilities
const Theme = {
  // Apply terminal theme to element
  applyTerminalTheme: function(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (element) {
      element.style.backgroundColor = SITE_CONFIG.colors.terminalBg;
      element.style.color = '#ffffff';
      element.style.fontFamily = '"Roboto Mono", monospace';
    }
  },

  // Toggle high contrast mode
  toggleHighContrast: function() {
    document.body.classList.toggle('high-contrast');
    const isHighContrast = document.body.classList.contains('high-contrast');
    localStorage.setItem('highContrast', isHighContrast);
    return isHighContrast;
  },

  // Load saved theme preferences
  loadThemePreferences: function() {
    const highContrast = localStorage.getItem('highContrast');
    if (highContrast === 'true') {
      document.body.classList.add('high-contrast');
    }
  }
};

// Performance monitoring
const Performance = {
  // Measure page load time
  measurePageLoad: function() {
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log(`Page loaded in ${loadTime}ms`);
      
      // Send to analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_load_time', {
          custom_parameter: loadTime
        });
      }
    });
  },

  // Monitor Core Web Vitals
  measureWebVitals: function() {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });
  }
};

// Error handling
const ErrorHandler = {
  // Global error handler
  init: function() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.logError(event.error, 'global');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.logError(event.reason, 'promise');
    });
  },

  // Log errors (can be extended to send to monitoring service)
  logError: function(error, type = 'unknown') {
    const errorInfo = {
      message: error.message || error,
      stack: error.stack || 'No stack trace',
      type: type,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in localStorage for debugging
    const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
    errorLog.push(errorInfo);
    if (errorLog.length > 50) errorLog.shift(); // Keep only last 50 errors
    localStorage.setItem('errorLog', JSON.stringify(errorLog));

    console.error('Error logged:', errorInfo);
  }
};

// Site-wide event handlers
const EventHandlers = {
  // Initialize all event handlers
  init: function() {
    this.initKeyboardShortcuts();
    this.initLinkTracking();
    this.initScrollEffects();
  },

  // Keyboard shortcuts
  initKeyboardShortcuts: function() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K for search (if available)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], .search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape to close modals/overlays
      if (e.key === 'Escape') {
        const overlay = document.querySelector('.overlay, .modal, .fullscreen');
        if (overlay) {
          overlay.classList.add('hidden');
        }
      }
    });
  },

  // Track external link clicks
  initLinkTracking: function() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.hostname !== window.location.hostname) {
        console.log('External link clicked:', link.href);
        
        // Add analytics tracking if available
        if (typeof gtag !== 'undefined') {
          gtag('event', 'click', {
            event_category: 'external_link',
            event_label: link.href
          });
        }
      }
    });
  },

  // Scroll-based effects
  initScrollEffects: function() {
    const scrollHandler = Utils.throttle(() => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      
      // Update any scroll progress indicators
      const progressBars = document.querySelectorAll('.scroll-progress');
      progressBars.forEach(bar => {
        bar.style.width = `${scrollPercent}%`;
      });

      // Parallax effects
      const parallaxElements = document.querySelectorAll('.parallax');
      parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        const yPos = -(window.scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    }, 16); // ~60fps

    window.addEventListener('scroll', scrollHandler);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Load theme preferences
  Theme.loadThemePreferences();
  
  // Initialize error handling
  ErrorHandler.init();
  
  // Initialize event handlers
  EventHandlers.init();
  
  // Start performance monitoring
  Performance.measurePageLoad();
  
  // Add fade-in effects to elements
  Animations.fadeInElements();
  
  console.log(`${SITE_CONFIG.name} v${SITE_CONFIG.version} initialized`);
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Expose utilities globally for use in other scripts
window.SiteUtils = Utils;
window.SiteAnimations = Animations;
window.SiteTheme = Theme;
window.SiteConfig = SITE_CONFIG;

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Utils,
    Animations,
    Theme,
    Performance,
    ErrorHandler,
    EventHandlers,
    SITE_CONFIG
  };
}