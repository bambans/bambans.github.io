// Markdown Renderer Module - Optimized for performance and accessibility
'use strict';

/**
 * Markdown rendering utilities
 */
const MarkdownRenderer = {
    // Configuration
    config: {
        wordsPerMinute: 200,
        sanitize: true,
        breaks: true,
        gfm: true
    },

    // Cache for parsed content
    cache: new Map(),

    /**
     * Initialize markdown renderer
     */
    init() {
        this.setupMarked();
        this.setupPrism();
    },

    /**
     * Setup marked configuration
     */
    setupMarked() {
        if (typeof marked === 'undefined') {
            console.warn('Marked library not loaded');
            return;
        }

        marked.setOptions({
            highlight: (code, lang) => {
                if (typeof Prism !== 'undefined' && lang && Prism.languages[lang]) {
                    try {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    } catch (error) {
                        console.warn('Prism highlighting error:', error);
                        return code;
                    }
                }
                return code;
            },
            breaks: this.config.breaks,
            gfm: this.config.gfm,
            sanitize: false // We'll use DOMPurify instead
        });
    },

    /**
     * Setup Prism for syntax highlighting
     */
    setupPrism() {
        if (typeof Prism === 'undefined') {
            console.warn('Prism library not loaded');
            return;
        }

        // Configure Prism for manual highlighting
        Prism.manual = true;
    },

    /**
     * Parse frontmatter from markdown content
     * @param {string} content - Raw markdown content
     * @returns {Object} - {metadata, body}
     */
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (match) {
            const frontmatter = match[1];
            const body = match[2];
            
            const metadata = {};
            frontmatter.split('\n').forEach(line => {
                const [key, ...value] = line.split(':');
                if (key && value.length > 0) {
                    const cleanValue = value.join(':').trim().replace(/^["']|["']$/g, '');
                    metadata[key.trim()] = cleanValue;
                }
            });
            
            return { metadata, body };
        }
        
        return { metadata: {}, body: content };
    },

    /**
     * Render markdown to HTML
     * @param {string} content - Markdown content
     * @param {Object} options - Rendering options
     * @returns {Promise<string>} - Rendered HTML
     */
    async render(content, options = {}) {
        const cacheKey = this.getCacheKey(content, options);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            if (typeof marked === 'undefined') {
                throw new Error('Marked library not available');
            }

            // Parse markdown
            let html = marked.parse(content);
            
            // Sanitize HTML if enabled
            if (this.config.sanitize && typeof DOMPurify !== 'undefined') {
                html = DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: [
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'p', 'br', 'strong', 'em', 'u', 's',
                        'a', 'img', 'code', 'pre',
                        'ul', 'ol', 'li',
                        'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
                        'div', 'span'
                    ],
                    ALLOWED_ATTR: [
                        'href', 'title', 'alt', 'src', 'class', 'id',
                        'target', 'rel', 'role', 'aria-label', 'aria-describedby'
                    ]
                });
            }

            // Cache the result
            this.cache.set(cacheKey, html);
            
            // Limit cache size
            if (this.cache.size > 50) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            return html;

        } catch (error) {
            console.error('Markdown rendering error:', error);
            return `<div class="error-message">Error rendering content: ${error.message}</div>`;
        }
    },

    /**
     * Render markdown content to DOM element
     * @param {string} content - Markdown content
     * @param {HTMLElement} container - Target container
     * @param {Object} options - Rendering options
     */
    async renderToElement(content, container, options = {}) {
        if (!container) {
            throw new Error('Container element required');
        }

        try {
            // Show loading state
            this.showLoadingState(container);

            // Render markdown
            const html = await this.render(content, options);
            
            // Update container
            container.innerHTML = html;
            
            // Enhance content
            await this.enhanceContent(container);

            // Add fade-in animation
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                container.classList.add('fade-in');
            }

        } catch (error) {
            console.error('Error rendering to element:', error);
            this.showError(container, error.message);
        }
    },

    /**
     * Enhance rendered content
     * @param {HTMLElement} container - Container with rendered content
     */
    async enhanceContent(container) {
        // Add syntax highlighting
        this.highlightSyntax(container);
        
        // Enhance links
        this.enhanceLinks(container);
        
        // Add accessibility improvements
        this.addAccessibilityEnhancements(container);
        
        // Add table responsiveness
        this.makeTablesResponsive(container);
    },

    /**
     * Add syntax highlighting to code blocks
     * @param {HTMLElement} container - Container element
     */
    highlightSyntax(container) {
        if (typeof Prism === 'undefined') return;

        try {
            // First, protect Mermaid code blocks from Prism processing
            const mermaidBlocks = container.querySelectorAll('code.language-mermaid, pre code.language-mermaid');
            mermaidBlocks.forEach(block => {
                block.classList.add('language-mermaid-protected');
                block.classList.remove('language-mermaid');
            });

            // Use requestIdleCallback for non-blocking highlighting
            if (window.requestIdleCallback) {
                window.requestIdleCallback(() => {
                    Prism.highlightAllUnder(container);
                    // Restore Mermaid classes after Prism processing
                    this.restoreMermaidBlocks(container);
                });
            } else {
                setTimeout(() => {
                    Prism.highlightAllUnder(container);
                    // Restore Mermaid classes after Prism processing
                    this.restoreMermaidBlocks(container);
                }, 0);
            }
        } catch (error) {
            console.warn('Syntax highlighting error:', error);
        }
    },

    /**
     * Restore Mermaid code blocks after Prism processing
     * @param {HTMLElement} container - Container element
     */
    restoreMermaidBlocks(container) {
        const protectedBlocks = container.querySelectorAll('code.language-mermaid-protected');
        protectedBlocks.forEach(block => {
            block.classList.remove('language-mermaid-protected');
            block.classList.add('language-mermaid');
        });
    },

    /**
     * Enhance links with better accessibility
     * @param {HTMLElement} container - Container element
     */
    enhanceLinks(container) {
        const links = container.querySelectorAll('a');
        
        links.forEach(link => {
            // Add external link indicators
            if (link.hostname && link.hostname !== window.location.hostname) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
                
                // Add screen reader text
                const srText = document.createElement('span');
                srText.className = 'visually-hidden';
                srText.textContent = ' (opens in new tab)';
                link.appendChild(srText);
            }
            
            // Ensure links have meaningful text
            if (!link.textContent.trim()) {
                link.setAttribute('aria-label', link.href);
            }
        });
    },

    /**
     * Add accessibility enhancements
     * @param {HTMLElement} container - Container element
     */
    addAccessibilityEnhancements(container) {
        // Add proper heading hierarchy
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = `heading-${index + 1}`;
            }
        });

        // Add alt text reminders for images without alt
        const images = container.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            img.setAttribute('alt', 'Image');
            console.warn('Image missing alt text:', img.src);
        });

        // Add role and aria-label to code blocks
        const codeBlocks = container.querySelectorAll('pre code');
        codeBlocks.forEach(code => {
            const pre = code.parentElement;
            pre.setAttribute('role', 'region');
            pre.setAttribute('aria-label', 'Code block');
            pre.setAttribute('tabindex', '0');
        });
    },

    /**
     * Make tables responsive
     * @param {HTMLElement} container - Container element
     */
    makeTablesResponsive(container) {
        const tables = container.querySelectorAll('table');
        
        tables.forEach(table => {
            // Wrap table in responsive container
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            wrapper.setAttribute('role', 'region');
            wrapper.setAttribute('aria-label', 'Data table');
            wrapper.setAttribute('tabindex', '0');
            
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
            
            // Add table caption if missing
            if (!table.caption) {
                const caption = document.createElement('caption');
                caption.className = 'visually-hidden';
                caption.textContent = 'Data table';
                table.insertBefore(caption, table.firstChild);
            }
        });
    },

    /**
     * Calculate reading time
     * @param {string} content - Text content
     * @returns {number} - Reading time in minutes
     */
    calculateReadingTime(content) {
        const words = content.split(/\s+/).filter(word => word.length > 0).length;
        return Math.ceil(words / this.config.wordsPerMinute);
    },

    /**
     * Get word count
     * @param {string} content - Text content
     * @returns {number} - Word count
     */
    getWordCount(content) {
        return content.split(/\s+/).filter(word => word.length > 0).length;
    },

    /**
     * Show loading state
     * @param {HTMLElement} container - Container element
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner" aria-hidden="true"></div>
                <span>Rendering content...</span>
            </div>
        `;
    },

    /**
     * Show error state
     * @param {HTMLElement} container - Container element
     * @param {string} message - Error message
     */
    showError(container, message) {
        container.innerHTML = `
            <div class="error-message" role="alert">
                <h3>Content Error</h3>
                <p>${message}</p>
            </div>
        `;
    },

    /**
     * Generate cache key
     * @param {string} content - Content to cache
     * @param {Object} options - Rendering options
     * @returns {string} - Cache key
     */
    getCacheKey(content, options) {
        const optionsStr = JSON.stringify(options);
        return `${content.length}-${this.simpleHash(content)}-${this.simpleHash(optionsStr)}`;
    },

    /**
     * Simple hash function for cache keys
     * @param {string} str - String to hash
     * @returns {number} - Hash value
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    },

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MarkdownRenderer.init();
    });
} else {
    MarkdownRenderer.init();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownRenderer;
}

// Global access
window.MarkdownRenderer = MarkdownRenderer;