// Mermaid Handler Module - Robust chart rendering with API compatibility
'use strict';

/**
 * Mermaid chart rendering utilities
 */
const MermaidHandler = {
    // Configuration
    config: {
        theme: 'dark',
        securityLevel: 'loose',
        startOnLoad: false,
        fontFamily: 'Roboto Mono, monospace'
    },

    // State
    isInitialized: false,
    renderQueue: [],
    processingQueue: false,

    /**
     * Initialize Mermaid
     */
    async init() {
        if (this.isInitialized) return;

        try {
            if (typeof mermaid === 'undefined') {
                console.warn('Mermaid library not loaded');
                return false;
            }

            // Configure Mermaid
            mermaid.initialize({
                theme: this.config.theme,
                startOnLoad: this.config.startOnLoad,
                securityLevel: this.config.securityLevel,
                fontFamily: this.config.fontFamily,
                themeVariables: {
                    darkMode: true,
                    primaryColor: '#40e0d0',
                    primaryTextColor: '#ffffff',
                    primaryBorderColor: '#40e0d0',
                    lineColor: '#40e0d0',
                    secondaryColor: '#ff6347',
                    tertiaryColor: '#121212',
                    background: '#121212',
                    mainBkg: '#1e1e1e',
                    secondBkg: '#2d2d2d',
                    tertiaryTextColor: '#ffffff'
                },
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'basis'
                },
                sequence: {
                    useMaxWidth: true,
                    wrap: true,
                    messageFontFamily: this.config.fontFamily
                },
                gantt: {
                    useMaxWidth: true,
                    fontFamily: this.config.fontFamily
                },
                gitGraph: {
                    theme: 'dark',
                    useMaxWidth: true,
                    mainBranchName: 'main'
                },
                journey: {
                    useMaxWidth: true,
                    diagramMarginX: 50,
                    diagramMarginY: 10,
                    leftMargin: 150,
                    width: 150,
                    height: 50,
                    boxMargin: 10,
                    boxTextMargin: 5,
                    noteMargin: 10,
                    messageMargin: 35,
                    messageAlign: 'center',
                    bottomMarginAdj: 1,
                    rightAngles: false,
                    taskFontSize: 14,
                    taskFontFamily: this.config.fontFamily,
                    taskMargin: 50,
                    activationWidth: 10,
                    textPlacement: 'fo',
                    actorColours: ['#40e0d0', '#ff6347', '#ffa500', '#90ee90', '#da70d6']
                }
            });

            this.isInitialized = true;
            
            // Process any queued renders
            this.processQueue();
            
            return true;

        } catch (error) {
            console.error('Mermaid initialization error:', error);
            return false;
        }
    },

    /**
     * Render all Mermaid charts in a container
     * @param {HTMLElement} container - Container element
     */
    async renderChartsInContainer(container) {
        if (!container) return;

        console.log('[MermaidHandler] Searching for Mermaid charts in container:', container);

        // Find all potential Mermaid code blocks
        const mermaidElements = this.findMermaidElements(container);
        
        console.log('[MermaidHandler] Found', mermaidElements.length, 'Mermaid elements:', mermaidElements);
        
        if (mermaidElements.length === 0) return;

        // Process each chart
        for (let i = 0; i < mermaidElements.length; i++) {
            console.log('[MermaidHandler] Processing chart', i + 1, 'of', mermaidElements.length);
            await this.renderSingleChart(mermaidElements[i], i);
        }
    },

    /**
     * Find Mermaid elements in container
     * @param {HTMLElement} container - Container to search
     * @returns {Array} - Array of Mermaid elements
     */
    findMermaidElements(container) {
        const selectors = [
            'code.language-mermaid',
            'pre code.language-mermaid',
            'code.language-mermaid-protected',
            '.mermaid'
        ];

        const elements = [];
        
        selectors.forEach(selector => {
            const found = container.querySelectorAll(selector);
            console.log('[MermaidHandler] Selector', selector, 'found', found.length, 'elements');
            found.forEach(el => {
                if (!elements.includes(el)) {
                    // Double-check that this is actually a chart and not code example
                    const content = el.textContent.trim();
                    console.log('[MermaidHandler] Checking content:', content.substring(0, 50) + '...');
                    if (this.isMermaidContent(content)) {
                        console.log('[MermaidHandler] Content validated as Mermaid chart');
                        elements.push(el);
                    } else {
                        console.log('[MermaidHandler] Content rejected - not a valid Mermaid chart');
                    }
                }
            });
        });

        return elements;
    },

    /**
     * Check if content is Mermaid syntax
     * @param {string} content - Content to check
     * @returns {boolean} - True if Mermaid content
     */
    isMermaidContent(content) {
        const mermaidKeywords = [
            'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
            'stateDiagram', 'journey', 'gantt', 'pie', 'gitgraph',
            'gitGraph', 'requirement', 'erDiagram', 'mindmap',
            'timeline', 'quadrantChart', 'xychart', 'block'
        ];

        const trimmedContent = content.trim();
        
        // Check if it starts with a keyword
        const startsWithKeyword = mermaidKeywords.some(keyword => 
            trimmedContent.startsWith(keyword)
        );
        
        // Special handling for journey maps with more detailed validation
        const isJourney = trimmedContent.startsWith('journey') && 
                         (trimmedContent.includes('title') || 
                          trimmedContent.includes('section') ||
                          /:\s*\d+\s*:/.test(trimmedContent));
        
        // Check if it's not an example or code snippet
        const isNotExample = !content.includes('```') && 
                           !content.toLowerCase().includes('example') &&
                           !content.includes('EXAMPLE');

        const result = (startsWithKeyword || isJourney) && isNotExample;
        console.log('[MermaidHandler] Content validation:', {
            startsWithKeyword,
            isJourney,
            isNotExample,
            result,
            firstLine: trimmedContent.split('\n')[0]
        });
        
        return result;
    },

    /**
     * Render a single Mermaid chart
     * @param {HTMLElement} element - Element containing Mermaid code
     * @param {number} index - Chart index
     */
    async renderSingleChart(element, index = 0) {
        if (!this.isInitialized) {
            console.log('[MermaidHandler] Not initialized, queuing chart for later');
            // Queue for later processing
            this.renderQueue.push({ element, index });
            return;
        }

        try {
            const graphDefinition = element.textContent.trim();
            const graphId = `mermaid-chart-${Date.now()}-${index}`;
            
            console.log('[MermaidHandler] Rendering chart:', {
                id: graphId,
                definition: graphDefinition,
                element: element
            });
            
            // Get the parent element to replace
            const elementToReplace = this.getElementToReplace(element);
            
            // Create container for the chart
            const chartContainer = this.createChartContainer(graphId);
            
            // Render the chart
            await this.renderChart(graphId, graphDefinition, chartContainer, elementToReplace);

        } catch (error) {
            console.error('[MermaidHandler] Chart rendering error:', error);
            this.showChartError(element, error);
        }
    },

    /**
     * Get the element that should be replaced with the chart
     * @param {HTMLElement} element - Original element
     * @returns {HTMLElement} - Element to replace
     */
    getElementToReplace(element) {
        // If the element is inside a <pre>, replace the <pre>
        const preParent = element.closest('pre');
        if (preParent) {
            return preParent;
        }
        
        // If the element has class 'mermaid', replace it directly
        if (element.classList.contains('mermaid')) {
            return element;
        }
        
        // Otherwise, replace the element itself
        return element;
    },

    /**
     * Create chart container element
     * @param {string} id - Chart ID
     * @returns {HTMLElement} - Chart container
     */
    createChartContainer(id) {
        const container = document.createElement('div');
        container.id = id;
        container.className = 'mermaid-chart';
        container.setAttribute('role', 'img');
        container.setAttribute('aria-label', 'Chart diagram');
        container.style.cssText = `
            text-align: center;
            margin: 1.5rem 0;
            padding: 1rem;
            background-color: var(--bg-secondary, #1e1e1e);
            border: 1px solid var(--border-color, #333);
            border-radius: var(--border-radius, 8px);
            overflow-x: auto;
        `;
        
        return container;
    },

    /**
     * Render chart with API compatibility
     * @param {string} id - Chart ID
     * @param {string} definition - Chart definition
     * @param {HTMLElement} container - Chart container
     * @param {HTMLElement} elementToReplace - Element to replace
     */
    async renderChart(id, definition, container, elementToReplace) {
        try {
            // Validate and preprocess definition for journey maps
            const processedDefinition = this.preprocessDefinition(definition);
            console.log('Rendering chart:', { id, type: processedDefinition.split('\n')[0], definition: processedDefinition });
            
            // Try modern API first (v10+)
            if (mermaid.render && typeof mermaid.render === 'function') {
                try {
                    const result = await mermaid.render(id, processedDefinition);
                    
                    // Handle different response formats
                    if (result && typeof result === 'object' && result.svg) {
                        this.insertChart(result.svg, container, elementToReplace);
                    }
                    else if (typeof result === 'string') {
                        this.insertChart(result, container, elementToReplace);
                    }
                    else {
                        console.warn('Unexpected render result:', result);
                        throw new Error('Unexpected render result format');
                    }
                } catch (renderError) {
                    console.error('Modern API render failed:', renderError);
                    // Try alternative approach for journey maps
                    if (processedDefinition.trim().startsWith('journey')) {
                        await this.renderJourneyMapFallback(id, processedDefinition, container, elementToReplace);
                    } else {
                        throw renderError;
                    }
                }
            }
            // Fallback to older API
            else if (mermaid.init) {
                container.innerHTML = processedDefinition;
                container.classList.add('mermaid');
                elementToReplace.parentNode.replaceChild(container, elementToReplace);
                
                // Initialize with older API
                mermaid.init(undefined, container);
            }
            else {
                throw new Error('No compatible Mermaid API found');
            }

        } catch (error) {
            console.error('Chart rendering failed:', error);
            this.showChartError(elementToReplace, error);
        }
    },

    /**
     * Preprocess chart definition for better compatibility
     * @param {string} definition - Chart definition
     * @returns {string} - Processed definition
     */
    preprocessDefinition(definition) {
        let processed = definition.trim();
        
        // Special handling for journey maps
        if (processed.startsWith('journey')) {
            console.log('Processing journey map definition');
            
            // Clean up the definition
            const lines = processed.split('\n').map(line => line.trim()).filter(line => line);
            const result = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                if (line === 'journey') {
                    result.push('journey');
                } else if (line.startsWith('title ')) {
                    result.push(`    ${line}`);
                } else if (line.startsWith('section ')) {
                    result.push(`    ${line}`);
                } else if (line.includes(':') && /:\s*\d+\s*:/.test(line)) {
                    // This is a task line
                    result.push(`      ${line}`);
                } else {
                    // Keep other lines as-is but indented
                    result.push(`    ${line}`);
                }
            }
            
            processed = result.join('\n');
            console.log('Processed journey definition:', processed);
        }
        
        return processed;
    },

    /**
     * Fallback renderer for journey maps
     * @param {string} id - Chart ID
     * @param {string} definition - Chart definition
     * @param {HTMLElement} container - Chart container
     * @param {HTMLElement} elementToReplace - Element to replace
     */
    async renderJourneyMapFallback(id, definition, container, elementToReplace) {
        try {
            // Create a temporary element for mermaid to process
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = definition;
            tempDiv.className = 'mermaid';
            tempDiv.id = id + '-temp';
            
            // Add to DOM temporarily
            document.body.appendChild(tempDiv);
            
            // Use mermaid.init on the temporary element
            await mermaid.init(undefined, tempDiv);
            
            // Extract the rendered content
            const renderedSVG = tempDiv.innerHTML;
            
            // Remove temporary element
            document.body.removeChild(tempDiv);
            
            // Insert into our container
            this.insertChart(renderedSVG, container, elementToReplace);
            
        } catch (error) {
            console.error('Journey map fallback failed:', error);
            throw error;
        }
    },

    /**
     * Insert rendered chart into DOM
     * @param {string} svg - Rendered SVG
     * @param {HTMLElement} container - Chart container
     * @param {HTMLElement} elementToReplace - Element to replace
     */
    insertChart(svg, container, elementToReplace) {
        try {
            container.innerHTML = svg;
            
            // Enhance SVG for accessibility and styling
            this.enhanceSVG(container);
            
            // Replace the original element
            if (elementToReplace && elementToReplace.parentNode) {
                elementToReplace.parentNode.replaceChild(container, elementToReplace);
            }
            
            // Add animation if motion is not reduced
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                container.classList.add('fade-in');
            }

        } catch (error) {
            console.error('Chart insertion error:', error);
            this.showChartError(elementToReplace, error);
        }
    },

    /**
     * Enhance SVG for better accessibility and styling
     * @param {HTMLElement} container - Chart container
     */
    enhanceSVG(container) {
        const svg = container.querySelector('svg');
        if (!svg) return;

        // Make SVG responsive
        svg.style.cssText = `
            max-width: 100%;
            height: auto;
            background-color: transparent;
        `;

        // Add accessibility attributes
        if (!svg.getAttribute('role')) {
            svg.setAttribute('role', 'img');
        }
        
        if (!svg.getAttribute('aria-labelledby') && !svg.getAttribute('aria-label')) {
            svg.setAttribute('aria-label', 'Mermaid diagram');
        }

        // Add title if missing
        if (!svg.querySelector('title')) {
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = 'Chart diagram';
            svg.insertBefore(title, svg.firstChild);
        }
    },

    /**
     * Show chart error
     * @param {HTMLElement} element - Original element
     * @param {Error} error - Error object
     */
    showChartError(element, error) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'mermaid-error';
        errorContainer.setAttribute('role', 'alert');
        errorContainer.style.cssText = `
            color: #ff4444;
            background-color: var(--bg-secondary, #1e1e1e);
            border: 1px solid #ff4444;
            border-radius: var(--border-radius, 8px);
            padding: 1rem;
            margin: 1rem 0;
            font-family: var(--font-mono, monospace);
        `;
        
        errorContainer.innerHTML = `
            <strong>Chart Rendering Error:</strong><br>
            ${error.message}<br>
            <details style="margin-top: 0.5rem;">
                <summary style="cursor: pointer;">View chart definition</summary>
                <pre style="margin-top: 0.5rem; background: rgba(255,68,68,0.1); padding: 0.5rem; border-radius: 4px; overflow-x: auto;">${element.textContent}</pre>
            </details>
        `;

        // Replace the original element
        if (element && element.parentNode) {
            element.parentNode.replaceChild(errorContainer, element);
        }
    },

    /**
     * Process queued chart renders
     */
    async processQueue() {
        if (this.processingQueue || this.renderQueue.length === 0) return;
        
        this.processingQueue = true;
        
        while (this.renderQueue.length > 0) {
            const { element, index } = this.renderQueue.shift();
            await this.renderSingleChart(element, index);
        }
        
        this.processingQueue = false;
    },

    /**
     * Clear render queue
     */
    clearQueue() {
        this.renderQueue = [];
        this.processingQueue = false;
    },

    /**
     * Reset Mermaid handler
     */
    reset() {
        this.isInitialized = false;
        this.clearQueue();
    }
};

// Auto-initialize when Mermaid library is available
const initializeMermaid = () => {
    if (typeof mermaid !== 'undefined') {
        MermaidHandler.init();
    } else {
        // Wait for Mermaid to load
        setTimeout(initializeMermaid, 100);
    }
};

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMermaid);
} else {
    initializeMermaid();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MermaidHandler;
}

// Global access
window.MermaidHandler = MermaidHandler;