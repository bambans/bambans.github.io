// Main JS - Minimal, optimized functionality for homepage
'use strict';

/**
 * Main application object
 */
const App = {
    // Configuration
    config: {
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        isTouch: 'ontouchstart' in window
    },

    /**
     * Initialize application
     */
    init() {
        this.setupAccessibility();
        this.setupPerformanceOptimizations();
        this.setupEventListeners();
        this.loadCriticalResources();
    },

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add skip link for keyboard navigation
        this.addSkipLink();
        
        // Enhance focus management
        this.setupFocusManagement();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    },

    /**
     * Add skip link for screen readers
     */
    addSkipLink() {
        if (document.querySelector('.skip-link')) return;
        
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.setAttribute('aria-label', 'Skip to main content');
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    },

    /**
     * Setup focus management for better accessibility
     */
    setupFocusManagement() {
        // Enhance focus visibility for keyboard users
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    },

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape key to blur current element
            if (e.key === 'Escape') {
                if (document.activeElement && document.activeElement !== document.body) {
                    document.activeElement.blur();
                }
            }
        });
    },

    /**
     * Setup performance optimizations
     */
    setupPerformanceOptimizations() {
        // Lazy load images
        this.setupLazyLoading();
        
        // Preload critical resources on user interaction
        this.setupResourcePreloading();
        
        // Optimize animations based on user preferences
        this.optimizeAnimations();
    },

    /**
     * Setup lazy loading for images
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },

    /**
     * Preload resources on user interaction
     */
    setupResourcePreloading() {
        let hasPreloaded = false;

        const preloadResources = () => {
            if (hasPreloaded) return;
            hasPreloaded = true;

            // Preload blog resources when user shows intent
            const blogLink = document.createElement('link');
            blogLink.rel = 'prefetch';
            blogLink.href = '/blog/';
            document.head.appendChild(blogLink);
        };

        // Preload on first user interaction
        ['mouseenter', 'touchstart', 'focus'].forEach(event => {
            document.addEventListener(event, preloadResources, { once: true, passive: true });
        });
    },

    /**
     * Optimize animations based on user preferences
     */
    optimizeAnimations() {
        if (this.config.prefersReducedMotion) {
            document.documentElement.style.setProperty('--transition-fast', '0ms');
            document.documentElement.style.setProperty('--transition-normal', '0ms');
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle card interactions
        this.setupCardInteractions();
        
        // Handle link analytics (if needed)
        this.setupLinkTracking();
        
        // Handle resize events
        this.setupResizeHandler();
    },

    /**
     * Setup card hover/focus interactions
     */
    setupCardInteractions() {
        const cards = document.querySelectorAll('.info-card');
        
        cards.forEach(card => {
            // Add enhanced touch support
            if (this.config.isTouch) {
                card.addEventListener('touchstart', () => {
                    card.classList.add('touch-active');
                }, { passive: true });
                
                card.addEventListener('touchend', () => {
                    setTimeout(() => card.classList.remove('touch-active'), 150);
                }, { passive: true });
            }

            // Improve keyboard navigation
            const links = card.querySelectorAll('a');
            if (links.length === 1) {
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        links[0].click();
                    }
                });
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `Navigate to ${links[0].textContent.trim()}`);
            }
        });
    },

    /**
     * Setup basic link tracking (privacy-conscious)
     */
    setupLinkTracking() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            // Track external links (client-side only, no data sent)
            if (link.hostname !== window.location.hostname) {
                this.logInteraction('external_link', {
                    url: link.href,
                    text: link.textContent.trim()
                });
            }
        });
    },

    /**
     * Handle window resize events efficiently
     */
    setupResizeHandler() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        }, { passive: true });
    },

    /**
     * Handle resize events
     */
    handleResize() {
        // Update viewport units if needed
        this.updateViewportUnits();
    },

    /**
     * Update CSS viewport units for mobile compatibility
     */
    updateViewportUnits() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    },

    /**
     * Load critical resources
     */
    loadCriticalResources() {
        // Load normalize.css if not already loaded
        if (!document.querySelector('link[href*="normalize"]')) {
            this.loadCSS('css/normalize.css');
        }
        
        // Register service worker
        this.registerServiceWorker();
    },

    /**
     * Utility: Load CSS file asynchronously
     */
    loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.media = 'print';
        link.onload = () => { link.media = 'all'; };
        document.head.appendChild(link);
    },

    /**
     * Register service worker for performance
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.handleServiceWorkerUpdate(registration);
                        }
                    });
                });
                
                this.logInteraction('service_worker_registered', { scope: registration.scope });
                
            } catch (error) {
                console.warn('Service worker registration failed:', error);
                this.logInteraction('service_worker_error', { error: error.message });
            }
        }
    },

    /**
     * Privacy-conscious logging (client-side only)
     */
    logInteraction(action, data = {}) {
        if (window.localStorage) {
            try {
                const log = JSON.parse(localStorage.getItem('app_interactions') || '[]');
                log.push({
                    action,
                    data,
                    timestamp: Date.now()
                });
                
                // Keep only last 50 interactions
                if (log.length > 50) {
                    log.splice(0, log.length - 50);
                }
                
                localStorage.setItem('app_interactions', JSON.stringify(log));
            } catch (e) {
                // Silently fail if localStorage is not available
            }
        }
    },

    /**
     * Setup service worker for enhanced performance
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('Service Worker registered:', registration);
                    
                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New version available
                                    this.handleServiceWorkerUpdate(registration);
                                }
                            });
                        }
                    });
                    
                } catch (error) {
                    console.log('Service Worker registration failed:', error);
                }
            });
        }
    },

    /**
     * Handle service worker updates
     */
    handleServiceWorkerUpdate(registration) {
        // Optional: Show update notification
        if (confirm('A new version is available. Reload to update?')) {
            window.location.reload();
        }
    },

    /**
     * Error handling
     */
    handleError(error, context = '') {
        console.error(`App Error ${context}:`, error);
        
        // Log error for debugging (client-side only)
        this.logInteraction('error', {
            message: error.message,
            context,
            stack: error.stack?.substring(0, 500) // Limit stack trace
        });
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            App.init();
        } catch (error) {
            App.handleError(error, 'initialization');
        }
    });
} else {
    try {
        App.init();
    } catch (error) {
        App.handleError(error, 'immediate_initialization');
    }
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    App.handleError(new Error(event.reason), 'unhandled_promise');
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}