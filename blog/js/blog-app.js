// Blog Application - Streamlined and fully functional
'use strict';

class BlogApp {
    constructor() {
        this.config = {
            github: {
                username: 'bambans',
                repo: 'bambans.github.io',
                branch: 'main',
                postsPath: 'blog/posts'
            },
            cache: { maxSize: 50, ttl: 5 * 60 * 1000 },
            ui: { debounceDelay: 250 }
        };

        this.posts = [];
        this.currentPost = null;
        this.filteredPosts = [];
        this.cache = new Map();
        this.elements = {};
        this.searchQuery = '';
        this.selectedTag = '';
        this.allTags = new Set();
        this.searchTimeout = null;

        this.init();
    }

    async init() {
        try {
            await this.waitForDependencies();
            this.cacheElements();
            this.setupEventListeners();
            await this.loadPosts();
            await this.loadDefaultPost();
            this.setupURLHandling();
        } catch (error) {
            console.error('Blog initialization error:', error);
            this.showError(`Failed to initialize blog: ${error.message}`);
        }
    }

    async waitForDependencies() {
        const maxWait = 10000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.MarkdownRenderer && window.marked && window.DOMPurify && 
                window.mermaid && window.MermaidHandler && window.MermaidHandler.isInitialized) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.warn('Some dependencies may not be loaded');
    }

    cacheElements() {
        const ids = ['sidebar-toggle', 'sidebar', 'posts-list', 'search-input', 'clear-search', 
                    'tag-filter', 'post-title', 'post-content', 'post-metadata', 'post-author', 
                    'post-date', 'reading-time', 'post-tags', 'post-navigation', 'prev-post', 
                    'next-post', 'error-modal', 'error-message', 'error-close'];
        
        ids.forEach(id => {
            this.elements[id.replace('-', '')] = document.getElementById(id);
        });
    }

    setupEventListeners() {
        // Toggle sidebar
        this.elements.sidebartoggle?.addEventListener('click', () => this.toggleSidebar());
        
        // Search
        this.elements.searchinput?.addEventListener('input', 
            this.debounce((e) => this.handleSearch(e.target.value), this.config.ui.debounceDelay));
        
        // Clear search
        this.elements.clearsearch?.addEventListener('click', () => this.clearSearch());
        
        // Tag filter
        this.elements.tagfilter?.addEventListener('change', (e) => this.handleTagFilter(e.target.value));
        
        // Navigation
        this.elements.prevpost?.addEventListener('click', () => this.navigatePost(-1));
        this.elements.nextpost?.addEventListener('click', () => this.navigatePost(1));
        
        // Close error
        this.elements.errorclose?.addEventListener('click', () => this.hideError());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Window events
        window.addEventListener('popstate', () => this.handlePopState());
        window.addEventListener('resize', this.debounce(() => this.handleResize(), this.config.ui.debounceDelay));
    }

    async loadPosts() {
        try {
            const cacheKey = 'posts-list';
            let cached = this.getFromCache(cacheKey);
            
            if (cached) {
                this.posts = cached;
                this.renderPostsList();
                return;
            }

            const apiUrl = `https://api.github.com/repos/${this.config.github.username}/${this.config.github.repo}/contents/${this.config.github.postsPath}`;
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const files = await response.json();
            this.posts = files
                .filter(file => file.name.endsWith('.md'))
                .sort((a, b) => {
                    if (a.name === 'README.md') return -1;
                    if (b.name === 'README.md') return 1;
                    return b.name.localeCompare(a.name);
                })
                .map(file => ({
                    name: file.name,
                    title: this.formatTitle(file.name),
                    url: file.download_url,
                    size: file.size,
                    sha: file.sha
                }));

            this.setCache(cacheKey, this.posts);
            await this.extractTags();
            this.updateFilteredPosts();
            this.renderPostsList();
            this.renderTagFilter();

        } catch (error) {
            console.error('Error loading posts:', error);
            this.showError(`Failed to load posts: ${error.message}`);
        }
    }

    async extractTags() {
        this.allTags.clear();
        
        for (const post of this.posts.slice(0, 10)) { // Limit to prevent rate limiting
            try {
                const response = await fetch(post.url);
                if (response.ok) {
                    const content = await response.text();
                    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
                    if (frontmatterMatch) {
                        const tagsMatch = frontmatterMatch[1].match(/tags:\s*(.+)/);
                        if (tagsMatch) {
                            const tags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/^\[|\]$/g, ''));
                            tags.forEach(tag => this.allTags.add(tag));
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to extract tags from ${post.name}:`, error);
            }
        }
    }

    renderTagFilter() {
        if (!this.elements.tagfilter) return;
        
        const options = Array.from(this.allTags).sort().map(tag => 
            `<option value="${tag}">${tag}</option>`
        ).join('');
        
        this.elements.tagfilter.innerHTML = '<option value="">All tags</option>' + options;
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.updateFilteredPosts();
        this.renderPostsList();
        
        if (this.elements.clearsearch) {
            this.elements.clearsearch.classList.toggle('d-none', !query);
        }
    }

    handleTagFilter(tag) {
        this.selectedTag = tag;
        this.updateFilteredPosts();
        this.renderPostsList();
    }

    clearSearch() {
        if (this.elements.searchinput) {
            this.elements.searchinput.value = '';
        }
        this.searchQuery = '';
        this.selectedTag = '';
        if (this.elements.tagfilter) {
            this.elements.tagfilter.value = '';
        }
        this.updateFilteredPosts();
        this.renderPostsList();
        if (this.elements.clearsearch) {
            this.elements.clearsearch.classList.add('d-none');
        }
    }

    updateFilteredPosts() {
        this.filteredPosts = this.posts.filter(post => {
            const matchesSearch = !this.searchQuery || 
                post.title.toLowerCase().includes(this.searchQuery) ||
                post.name.toLowerCase().includes(this.searchQuery);
            
            const matchesTag = !this.selectedTag || 
                (post.tags && post.tags.includes(this.selectedTag));
            
            return matchesSearch && matchesTag;
        });
    }

    renderPostsList() {
        if (!this.elements.postslist) return;

        const postsToShow = this.filteredPosts.length > 0 ? this.filteredPosts : this.posts;

        if (postsToShow.length === 0) {
            const message = this.searchQuery || this.selectedTag ? 'No posts match your search' : 'No posts found';
            this.elements.postslist.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
            return;
        }

        const postsHTML = postsToShow.map(post => `
            <article class="post-item" data-post="${post.name}" role="button" tabindex="0">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">${this.formatFileSize(post.size)}</div>
            </article>
        `).join('');

        this.elements.postslist.innerHTML = postsHTML;
        this.elements.postslist.addEventListener('click', (e) => this.handlePostClick(e));
        this.elements.postslist.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handlePostClick(e);
            }
        });
    }

    handlePostClick(event) {
        const postItem = event.target.closest('.post-item');
        if (!postItem) return;
        
        const postName = postItem.dataset.post;
        if (postName) {
            this.loadPost(postName);
        }
    }

    async loadDefaultPost() {
        if (this.posts.length === 0) return;
        
        const readmePost = this.posts.find(p => p.name === 'README.md');
        const defaultPost = readmePost || this.posts[0];
        await this.loadPost(defaultPost.name);
    }

    async loadPost(postName) {
        try {
            this.updateActivePost(postName);
            
            const cacheKey = `post-${postName}`;
            let postData = this.getFromCache(cacheKey);

            if (!postData) {
                const post = this.posts.find(p => p.name === postName);
                if (!post) throw new Error('Post not found');

                const response = await fetch(post.url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const content = await response.text();
                if (!content || content.trim() === '') {
                    throw new Error('Post content is empty');
                }

                let metadata = {};
                let body = content;
                
                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
                if (frontmatterMatch) {
                    body = frontmatterMatch[2];
                    frontmatterMatch[1].split('\n').forEach(line => {
                        const [key, ...value] = line.split(':');
                        if (key && value.length > 0) {
                            metadata[key.trim()] = value.join(':').trim().replace(/^["']|["']$/g, '');
                        }
                    });
                }

                postData = { ...post, content: body, metadata };
                this.setCache(cacheKey, postData);
            }

            this.currentPost = postData;
            await this.updatePostContent();
            this.updatePostMetadata();
            this.updatePostNavigation();
            this.updateURL(postName);

            if (window.innerWidth <= 768) {
                this.closeSidebar();
            }

        } catch (error) {
            console.error('Error loading post:', error);
            this.showError(`Failed to load post "${postName}": ${error.message}`);
        }
    }

    updateActivePost(postName) {
        if (!this.elements.postslist) return;
        
        this.elements.postslist.querySelectorAll('.post-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = this.elements.postslist.querySelector(`[data-post="${postName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    async updatePostContent() {
        if (!this.currentPost || !this.elements.postcontent) return;

        try {
            const title = this.currentPost.metadata.title || this.currentPost.title;
            if (this.elements.posttitle) {
                this.elements.posttitle.textContent = title;
                document.title = `${title} - blog@bambans`;
            }

            if (window.MarkdownRenderer && MarkdownRenderer.renderToElement) {
                await MarkdownRenderer.renderToElement(this.currentPost.content, this.elements.postcontent);
            } else {
                this.elements.postcontent.innerHTML = `<pre style="white-space: pre-wrap;">${this.currentPost.content}</pre>`;
            }

            if (window.MermaidHandler && window.MermaidHandler.isInitialized) {
                await MermaidHandler.renderChartsInContainer(this.elements.postcontent);
            }

        } catch (error) {
            console.error('Error updating post content:', error);
            if (this.elements.postcontent) {
                this.elements.postcontent.innerHTML = `<pre style="white-space: pre-wrap;">${this.currentPost.content}</pre>`;
            }
        }
    }

    updatePostMetadata() {
        if (!this.currentPost) return;

        const hasMetadata = Object.keys(this.currentPost.metadata).length > 0;
        
        if (this.elements.postmetadata) {
            this.elements.postmetadata.classList.toggle('d-none', !hasMetadata);
        }

        if (hasMetadata) {
            if (this.elements.postauthor && this.currentPost.metadata.author) {
                this.elements.postauthor.textContent = this.currentPost.metadata.author;
            }
            
            if (this.elements.postdate && this.currentPost.metadata.date) {
                this.elements.postdate.textContent = this.formatDate(this.currentPost.metadata.date);
                this.elements.postdate.setAttribute('datetime', this.currentPost.metadata.date);
            }
            
            if (this.elements.readingtime && window.MarkdownRenderer) {
                const readingTime = MarkdownRenderer.calculateReadingTime(this.currentPost.content);
                this.elements.readingtime.textContent = `${readingTime} min read`;
            }
            
            this.updatePostTags();
        }
    }

    updatePostTags() {
        if (!this.elements.posttags || !this.currentPost.metadata.tags) {
            if (this.elements.posttags) this.elements.posttags.innerHTML = '';
            return;
        }

        const tags = this.currentPost.metadata.tags
            .split(',')
            .map(tag => tag.trim().replace(/^\[|\]$/g, ''))
            .filter(tag => tag);

        if (tags.length > 0) {
            this.elements.posttags.innerHTML = tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        }
    }

    updatePostNavigation() {
        if (!this.elements.postnavigation || !this.currentPost) return;

        const currentIndex = this.posts.findIndex(p => p.name === this.currentPost.name);
        this.elements.postnavigation.classList.remove('d-none');

        if (this.elements.prevpost) {
            const hasPrev = currentIndex > 0;
            this.elements.prevpost.disabled = !hasPrev;
            if (hasPrev) {
                const prevPost = this.posts[currentIndex - 1];
                this.elements.prevpost.setAttribute('aria-label', `Previous: ${prevPost.title}`);
            }
        }

        if (this.elements.nextpost) {
            const hasNext = currentIndex < this.posts.length - 1;
            this.elements.nextpost.disabled = !hasNext;
            if (hasNext) {
                const nextPost = this.posts[currentIndex + 1];
                this.elements.nextpost.setAttribute('aria-label', `Next: ${nextPost.title}`);
            }
        }
    }

    navigatePost(direction) {
        if (!this.currentPost) return;
        
        const currentIndex = this.posts.findIndex(p => p.name === this.currentPost.name);
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.posts.length) {
            this.loadPost(this.posts[newIndex].name);
        }
    }

    handleKeyboard(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        switch (event.key) {
            case '/':
                event.preventDefault();
                this.elements.searchinput?.focus();
                break;
            case 'Escape':
                if (window.innerWidth <= 768) this.closeSidebar();
                break;
            case 'ArrowLeft':
                if (event.ctrlKey || event.metaKey) this.navigatePost(-1);
                break;
            case 'ArrowRight':
                if (event.ctrlKey || event.metaKey) this.navigatePost(1);
                break;
        }
    }

    toggleSidebar() {
        if (!this.elements.sidebar) return;
        
        const isOpen = this.elements.sidebar.classList.contains('show');
        if (isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.add('show');
        }
        if (this.elements.sidebartoggle) {
            this.elements.sidebartoggle.setAttribute('aria-expanded', 'true');
        }
    }

    closeSidebar() {
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove('show');
        }
        if (this.elements.sidebartoggle) {
            this.elements.sidebartoggle.setAttribute('aria-expanded', 'false');
        }
    }

    handleResize() {
        if (window.innerWidth > 768) {
            this.openSidebar();
        }
    }

    setupURLHandling() {
        this.handleInitialURL();
    }

    handleInitialURL() {
        const hash = window.location.hash.slice(1);
        if (hash && this.posts.some(p => p.name === hash)) {
            this.loadPost(hash);
        }
    }

    handlePopState() {
        this.handleInitialURL();
    }

    updateURL(postName) {
        if (postName !== 'README.md') {
            window.history.pushState(null, '', `#${postName}`);
        } else {
            window.history.pushState(null, '', window.location.pathname);
        }
    }

    showError(message) {
        if (this.elements.errormessage) {
            this.elements.errormessage.textContent = message;
        }
        if (this.elements.errormodal) {
            this.elements.errormodal.classList.remove('d-none');
        }
    }

    hideError() {
        if (this.elements.errormodal) {
            this.elements.errormodal.classList.add('d-none');
        }
    }

    setCache(key, value) {
        if (this.cache.size >= this.config.cache.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, { value, timestamp: Date.now() });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.config.cache.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }

    formatTitle(filename) {
        return filename.replace(/\.md$/, '').replace(/[-_]/g, ' ');
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / 1048576) + ' MB';
    }

    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blogApp = new BlogApp();
    });
} else {
    window.blogApp = new BlogApp();
}