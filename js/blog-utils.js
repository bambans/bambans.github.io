// Blog Utilities - Extended functionality for the blog system
// Extends the main site utilities with blog-specific features

// Blog-specific configuration
const BLOG_CONFIG = {
  ...window.SiteConfig,
  blog: {
    github: {
      username: "bambans",
      repo: "bambans.github.io",
      branch: "main",
      postsPath: "blog/posts/"
    },
    features: {
      search: true,
      readingTime: true,
      progressIndicator: true,
      syntaxHighlighting: true,
      mathExpressions: true,
      mermaidDiagrams: true,
      offlineSupport: true
    },
    settings: {
      wordsPerMinute: 200,
      searchDelay: 300,
      animationDelay: 100
    }
  }
};

// Blog-specific utilities
const BlogUtils = {
  // Parse frontmatter from markdown content
  parseFrontmatter: function(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      return { content, frontmatter: {} };
    }

    const frontmatterText = frontmatterMatch[1];
    const markdownContent = frontmatterMatch[2];
    const frontmatter = {};

    frontmatterText.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
        
        // Parse arrays (tags)
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
        }
        
        frontmatter[key] = value;
      }
    });

    return { content: markdownContent, frontmatter };
  },

  // Calculate reading time
  calculateReadingTime: function(text) {
    const wordCount = text.trim().split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / BLOG_CONFIG.blog.settings.wordsPerMinute);
    return {
      minutes: readingTimeMinutes,
      words: wordCount,
      formatted: `${readingTimeMinutes} min read`
    };
  },

  // Format post date
  formatPostDate: function(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return dateString;
    }
  },

  // Extract excerpt from content
  extractExcerpt: function(content, maxLength = 150) {
    // Remove frontmatter and markdown formatting
    const cleaned = content
      .replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();

    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...'
      : cleaned;
  },

  // Generate post slug from title
  generateSlug: function(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove multiple hyphens
      .trim('-'); // Remove leading/trailing hyphens
  },

  // Search posts by title, content, or tags
  searchPosts: function(posts, query) {
    if (!query.trim()) return posts;

    const searchTerm = query.toLowerCase();
    
    return posts.filter(post => {
      const title = (post.title || post.name || '').toLowerCase();
      const content = (post.content || '').toLowerCase();
      const tags = Array.isArray(post.tags) ? post.tags.join(' ').toLowerCase() : '';
      
      return title.includes(searchTerm) || 
             content.includes(searchTerm) || 
             tags.includes(searchTerm);
    });
  },

  // Highlight search terms in text
  highlightSearchTerms: function(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="bg-terminal-purple text-white px-1 rounded">$1</mark>');
  },

  // Debounced search function
  createDebouncedSearch: function(searchFunction, delay = BLOG_CONFIG.blog.settings.searchDelay) {
    return window.SiteUtils.debounce(searchFunction, delay);
  },

  // GitHub API helpers
  github: {
    // Build API URL for posts list
    getPostsUrl: function() {
      const { username, repo, branch, postsPath } = BLOG_CONFIG.blog.github;
      return `https://api.github.com/repos/${username}/${repo}/contents/${postsPath}?ref=${branch}`;
    },

    // Build raw content URL for a post
    getPostContentUrl: function(filename) {
      const { username, repo, branch, postsPath } = BLOG_CONFIG.blog.github;
      return `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${postsPath}${filename}`;
    },

    // Check API rate limit
    checkRateLimit: async function() {
      try {
        const response = await fetch('https://api.github.com/rate_limit');
        const data = await response.json();
        return data.rate;
      } catch (error) {
        console.warn('Could not check GitHub API rate limit:', error);
        return null;
      }
    }
  }
};

// Blog animations
const BlogAnimations = {
  // Animate post list items
  animatePostList: function(items, delay = BLOG_CONFIG.blog.settings.animationDelay) {
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
      item.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, index * delay);
    });
  },

  // Animate content loading
  animateContentLoad: function(element) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
    
    // Use requestAnimationFrame for smooth animation
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  },

  // Loading spinner for async operations
  showLoadingSpinner: function(element, text = 'Loading...') {
    if (!element) return;
    
    element.innerHTML = `
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-terminal-cyan mr-3"></div>
        <span class="text-gray-400">${text}</span>
      </div>
    `;
  },

  // Error message display
  showError: function(element, message, details = null) {
    if (!element) return;
    
    const detailsHtml = details ? `
      <details class="mt-2">
        <summary class="cursor-pointer text-terminal-cyan text-sm">Show details</summary>
        <pre class="mt-2 p-2 bg-gray-800 rounded text-xs overflow-x-auto">${details}</pre>
      </details>
    ` : '';
    
    element.innerHTML = `
      <div class="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded">
        <p class="font-bold">❌ ${message}</p>
        ${detailsHtml}
      </div>
    `;
  }
};

// Blog performance utilities
const BlogPerformance = {
  // Measure and log post loading time
  measurePostLoad: function(startTime, postTitle) {
    const endTime = performance.now();
    const loadTime = Math.round(endTime - startTime);
    
    console.log(`Post "${postTitle}" loaded in ${loadTime}ms`);
    
    // Store performance data
    if (!window.blogPerformanceData) {
      window.blogPerformanceData = [];
    }
    
    window.blogPerformanceData.push({
      post: postTitle,
      loadTime,
      timestamp: new Date().toISOString()
    });
    
    return loadTime;
  },

  // Get average loading times
  getAverageLoadTime: function() {
    if (!window.blogPerformanceData || window.blogPerformanceData.length === 0) {
      return 0;
    }
    
    const total = window.blogPerformanceData.reduce((sum, data) => sum + data.loadTime, 0);
    return Math.round(total / window.blogPerformanceData.length);
  },

  // Optimize images for better performance
  optimizeImages: function(container) {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading lazy if not already set
      if (!img.loading) {
        img.loading = 'lazy';
      }
      
      // Add proper alt text if missing
      if (!img.alt) {
        img.alt = 'Blog post image';
      }
      
      // Add error handling
      img.onerror = function() {
        this.style.display = 'none';
        console.warn('Failed to load image:', this.src);
      };
    });
  }
};

// Blog error handling
const BlogErrorHandler = {
  // Handle GitHub API errors
  handleGitHubError: function(error, context = 'GitHub API') {
    let message = 'An error occurred';
    let userMessage = 'Unable to load content. Please try again later.';
    
    if (error.response) {
      // HTTP error
      const status = error.response.status;
      switch (status) {
        case 403:
          message = 'GitHub API rate limit exceeded';
          userMessage = 'API rate limit exceeded. Please wait a moment and try again.';
          break;
        case 404:
          message = 'Content not found';
          userMessage = 'The requested content could not be found.';
          break;
        case 500:
          message = 'GitHub server error';
          userMessage = 'GitHub is experiencing issues. Please try again later.';
          break;
        default:
          message = `HTTP ${status} error`;
      }
    } else if (error.name === 'NetworkError' || !navigator.onLine) {
      message = 'Network connection error';
      userMessage = 'Please check your internet connection and try again.';
    }
    
    console.error(`${context}: ${message}`, error);
    
    return {
      technical: message,
      user: userMessage,
      canRetry: error.response?.status !== 404
    };
  },

  // Show user-friendly error message
  displayError: function(container, errorInfo, onRetry = null) {
    const retryButton = onRetry && errorInfo.canRetry ? `
      <button 
        onclick="(${onRetry})()"
        class="mt-3 bg-terminal-purple hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
      >
        🔄 Try Again
      </button>
    ` : '';
    
    BlogAnimations.showError(container, errorInfo.user, errorInfo.technical);
    
    if (retryButton) {
      container.querySelector('.bg-red-900').insertAdjacentHTML('beforeend', retryButton);
    }
  }
};

// Utility function for escaping regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Initialize blog utilities when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Blog utilities initialized');
  
  // Make utilities available globally
  window.BlogUtils = BlogUtils;
  window.BlogAnimations = BlogAnimations;
  window.BlogPerformance = BlogPerformance;
  window.BlogErrorHandler = BlogErrorHandler;
  window.BLOG_CONFIG = BLOG_CONFIG;
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BlogUtils,
    BlogAnimations,
    BlogPerformance,
    BlogErrorHandler,
    BLOG_CONFIG
  };
}