// GitHub repo info - Change these to your repository
const username = "bambans";
const repo = "bambans.github.io";
const branch = "main";
const postsPath = "blog/posts/"; // Directory containing markdown files

// Post list container
const postList = document.getElementById("post-list");
const postTitle = document.getElementById("post-title");
const postDate = document.getElementById("post-date");
const readingTime = document.getElementById("reading-time");
const contentArea = document.getElementById("content");

// Initialize enhanced features
let allPosts = [];
let currentPost = null;

// Initialize Mermaid
mermaid.initialize({
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#1f2937',
    primaryColor: '#8a2be2',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#4b5563',
    lineColor: '#40e0d0',
    secondaryColor: '#ff6347',
    tertiaryColor: '#40e0d0'
  }
});

// Configure marked with enhanced options
marked.setOptions({
  gfm: true,
  breaks: true,
  smartLists: true,
  smartypants: false,
  sanitize: false // We'll use DOMPurify for sanitization
});

// Add custom renderer for enhanced features
const renderer = new marked.Renderer();

// Custom renderer for task lists
renderer.listitem = function(text) {
  if (/^\s*\[[x ]\]\s*/.test(text)) {
    text = text
      .replace(/^\s*\[ \]\s*/, '<input type="checkbox" disabled> ')
      .replace(/^\s*\[x\]\s*/, '<input type="checkbox" checked disabled> ');
    return '<li class="task-list-item">' + text + '</li>\n';
  }
  return '<li>' + text + '</li>\n';
};

// Custom renderer for code blocks with language detection
renderer.code = function(code, language) {
  const validLang = language && Prism.languages[language] ? language : 'text';
  return `<pre class="language-${validLang} line-numbers"><code class="language-${validLang}">${code}</code></pre>`;
};

marked.use({ renderer });

// Function to fetch posts list
async function fetchPosts() {
  postList.innerHTML = '<li class="px-6 py-4 text-gray-300">Loading posts...</li>';

  try {
    const response = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents/${postsPath}?ref=${branch}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Filter for markdown files only
    const markdownFiles = data.filter(
      (file) =>
        file.type === "file" &&
        (file.name.endsWith(".md") || file.name.endsWith(".markdown")),
    );

    if (markdownFiles.length === 0) {
      postList.innerHTML =
        '<li class="px-6 py-4 text-gray-300">No markdown files found</li>';
      return;
    }

    // Store all posts for search functionality
    allPosts = markdownFiles;

    // Sort by filename (you can modify this to sort by date in filename)
    markdownFiles.sort((a, b) => b.name.localeCompare(a.name));

    // Clear and populate the post list
    postList.innerHTML = "";

    markdownFiles.forEach((file, index) => {
      const listItem = document.createElement("li");
      listItem.className = "px-6 py-4 text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors duration-200 border-b border-gray-600 last:border-b-0 slide-in-left";
      listItem.style.animationDelay = `${index * 0.1}s`;

      // Create display name without the extension
      const displayName = file.name.replace(/\.(md|markdown)$/, "");
      listItem.textContent = displayName;
      listItem.dataset.filename = file.name;
      listItem.dataset.downloadUrl = file.download_url;

      // Add click event to load the post
      listItem.addEventListener("click", () => {
        loadPost(file.download_url, displayName, file);

        // Remove active class from all items and add to clicked
        document
          .querySelectorAll("#post-list li")
          .forEach((item) => {
            item.classList.remove("bg-terminal-purple", "text-white");
            item.classList.add("text-gray-300");
          });
        listItem.classList.remove("text-gray-300");
        listItem.classList.add("bg-terminal-purple", "text-white");
      });

      postList.appendChild(listItem);
    });

    // Load the first post by default
    if (markdownFiles.length > 0) {
      const firstFile = markdownFiles[0];
      const displayName = firstFile.name.replace(/\.(md|markdown)$/, "");
      loadPost(firstFile.download_url, displayName, firstFile);
      const firstItem = postList.firstChild;
      firstItem.classList.remove("text-gray-300");
      firstItem.classList.add("bg-terminal-purple", "text-white");
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    postList.innerHTML = `<li class="px-6 py-4 text-red-400">Error loading posts: ${error.message}</li>`;
  }
}

// Function to load a specific post
async function loadPost(url, title, fileInfo = null) {
  contentArea.innerHTML = '<div class="loading text-center py-16 text-gray-400">Loading post...</div>';
  postTitle.textContent = title;
  postDate.textContent = "";
  readingTime.textContent = "";
  readingTime.classList.add("hidden");
  currentPost = { url, title, fileInfo };

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const markdown = await response.text();

    // Parse frontmatter
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let content = markdown;
    let frontmatter = {};

    if (frontmatterMatch) {
      const frontmatterText = frontmatterMatch[1];
      content = frontmatterMatch[2];
      
      // Parse YAML-like frontmatter
      frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
          frontmatter[key] = value;
        }
      });
    }

    // Extract and display date
    if (frontmatter.date) {
      const postDateTime = new Date(frontmatter.date);
      postDate.textContent = postDateTime.toLocaleDateString();
    } else if (fileInfo) {
      // Fallback to file creation date
      const fileDate = new Date(fileInfo.sha ? '' : Date.now());
      if (fileDate.getTime()) {
        postDate.textContent = fileDate.toLocaleDateString();
      }
    }

    // Calculate and display reading time
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
    readingTime.textContent = `${readingTimeMinutes} min read`;
    readingTime.classList.remove("hidden");

    // Render markdown to HTML
    const rawHtml = marked.parse(content);
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['iframe', 'embed'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
    });
    
    contentArea.innerHTML = cleanHtml;
    contentArea.classList.add("fade-in");

    // Initialize syntax highlighting
    Prism.highlightAllUnder(contentArea);

    // Initialize Mermaid diagrams
    const mermaidElements = contentArea.querySelectorAll('pre code.language-mermaid');
    mermaidElements.forEach((element, index) => {
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = element.textContent;
      mermaidDiv.id = `mermaid-${Date.now()}-${index}`;
      element.parentElement.replaceWith(mermaidDiv);
    });
    
    if (mermaidElements.length > 0) {
      mermaid.run();
    }

    // Initialize math expressions
    renderMathInElement(contentArea, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });

    // Enhance links
    document.querySelectorAll("#content a").forEach((link) => {
      if (link.hostname !== window.location.hostname) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
      link.classList.add("text-terminal-orange", "hover:text-terminal-orange-hover", "transition-colors", "duration-200");
    });

    // Style tables
    document.querySelectorAll("#content table").forEach((table) => {
      table.classList.add("w-full", "border-collapse", "border", "border-gray-600");
    });

    document.querySelectorAll("#content th").forEach((th) => {
      th.classList.add("border", "border-gray-600", "bg-gray-700", "px-4", "py-2", "text-left");
    });

    document.querySelectorAll("#content td").forEach((td) => {
      td.classList.add("border", "border-gray-600", "px-4", "py-2");
    });

    // Style blockquotes
    document.querySelectorAll("#content blockquote").forEach((blockquote) => {
      blockquote.classList.add("border-l-4", "border-terminal-purple", "pl-4", "italic", "text-gray-300");
    });

    // Handle task lists
    document.querySelectorAll("#content .task-list-item input[type='checkbox']").forEach((checkbox) => {
      if (checkbox.checked) {
        checkbox.parentElement.classList.add("checked");
      }
    });

    // Add copy buttons to code blocks
    document.querySelectorAll("#content pre[class*='language-']").forEach((pre) => {
      if (!pre.querySelector('.copy-to-clipboard-button')) {
        const button = document.createElement('button');
        button.className = 'copy-to-clipboard-button';
        button.textContent = 'Copy';
        button.addEventListener('click', () => {
          const code = pre.querySelector('code').textContent;
          navigator.clipboard.writeText(code).then(() => {
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = 'Copy';
            }, 2000);
          });
        });
        pre.appendChild(button);
      }
    });

    // Create reading progress indicator
    createReadingProgress();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error("Error loading post:", error);
    contentArea.innerHTML = `<div class="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded">Error loading post: ${error.message}</div>`;
  }
}

// Function to create reading progress indicator
function createReadingProgress() {
  let progressBar = document.querySelector('.reading-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);
  }

  function updateProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
  }

  window.addEventListener('scroll', updateProgress);
  updateProgress();
}

// Function to calculate estimated reading time
function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Function to highlight search terms
function highlightSearchTerms(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-terminal-purple text-white">$1</mark>');
}

// Function to search posts
function searchPosts(query) {
  if (!query.trim()) {
    displayAllPosts();
    return;
  }

  const filteredPosts = allPosts.filter(post => {
    const displayName = post.name.replace(/\.(md|markdown)$/, "");
    return displayName.toLowerCase().includes(query.toLowerCase());
  });

  displayPosts(filteredPosts, query);
}

// Function to display filtered posts
function displayPosts(posts, searchQuery = '') {
  postList.innerHTML = "";

  if (posts.length === 0) {
    postList.innerHTML = '<li class="px-6 py-4 text-gray-300">No posts found</li>';
    return;
  }

  posts.forEach((file, index) => {
    const listItem = document.createElement("li");
    listItem.className = "px-6 py-4 text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors duration-200 border-b border-gray-600 last:border-b-0 slide-in-left";
    listItem.style.animationDelay = `${index * 0.1}s`;

    const displayName = file.name.replace(/\.(md|markdown)$/, "");
    listItem.innerHTML = highlightSearchTerms(displayName, searchQuery);
    listItem.dataset.filename = file.name;
    listItem.dataset.downloadUrl = file.download_url;

    listItem.addEventListener("click", () => {
      loadPost(file.download_url, displayName, file);

      document.querySelectorAll("#post-list li").forEach((item) => {
        item.classList.remove("bg-terminal-purple", "text-white");
        item.classList.add("text-gray-300");
      });
      listItem.classList.remove("text-gray-300");
      listItem.classList.add("bg-terminal-purple", "text-white");
    });

    postList.appendChild(listItem);
  });
}

// Function to display all posts
function displayAllPosts() {
  displayPosts(allPosts);
}

// Function to add search functionality
function initializeSearch() {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-container px-6 py-4';
  searchContainer.innerHTML = `
    <input 
      type="text" 
      placeholder="Search posts..." 
      class="search-input"
      id="post-search"
    >
  `;

  const postListContainer = postList.parentElement.parentElement;
  postListContainer.insertBefore(searchContainer, postList.parentElement);

  const searchInput = document.getElementById('post-search');
  let searchTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchPosts(e.target.value);
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      displayAllPosts();
    }
  });
}

// Function to enhance error handling
function handleError(error, context) {
  console.error(`Error in ${context}:`, error);
  
  // Show user-friendly error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded mb-4';
  errorDiv.innerHTML = `
    <strong>Error:</strong> ${error.message || 'An unexpected error occurred'}
    <br><small>Context: ${context}</small>
  `;
  
  const container = document.querySelector('.max-w-7xl');
  if (container) {
    container.insertBefore(errorDiv, container.firstChild);
    
    // Auto-remove error after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 10000);
  }
}

// Function to add keyboard shortcuts
function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Only activate shortcuts when not typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case '/':
        e.preventDefault();
        const searchInput = document.getElementById('post-search');
        if (searchInput) {
          searchInput.focus();
        }
        break;
      case 'r':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          fetchPosts();
        }
        break;
      case 'ArrowLeft':
        // Navigate to previous post
        navigatePost(-1);
        break;
      case 'ArrowRight':
        // Navigate to next post
        navigatePost(1);
        break;
    }
  });
}

// Function to navigate between posts
function navigatePost(direction) {
  const activePost = document.querySelector('#post-list li.bg-terminal-purple');
  if (!activePost) return;

  const allPostItems = Array.from(document.querySelectorAll('#post-list li'));
  const currentIndex = allPostItems.indexOf(activePost);
  const nextIndex = currentIndex + direction;

  if (nextIndex >= 0 && nextIndex < allPostItems.length) {
    allPostItems[nextIndex].click();
  }
}

// Enhanced initialization
async function initialize() {
  try {
    // Initialize search functionality
    initializeSearch();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Load posts
    await fetchPosts();
    
    console.log('Blog initialized successfully');
  } catch (error) {
    handleError(error, 'Blog initialization');
  }
}

// Initial load
initialize();

// Refresh button handler
document.getElementById("refreshPosts").addEventListener("click", (e) => {
  e.preventDefault();
  fetchPosts();
});

// Service Worker registration for offline functionality (optional)
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