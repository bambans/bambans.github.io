// GitHub repo info - Change these to your repository
const username = "bambans";
const repo = "bambans.github.io";
const branch = "main";
const postsPath = "blog/posts/"; // Directory containing markdown files

// Post list container
const postList = document.getElementById("post-list");
const postTitle = document.getElementById("post-title");
const postDate = document.getElementById("post-date");
const contentArea = document.getElementById("content");

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

    // Sort by filename (you can modify this to sort by date in filename)
    markdownFiles.sort((a, b) => b.name.localeCompare(a.name));

    // Clear and populate the post list
    postList.innerHTML = "";

    markdownFiles.forEach((file) => {
      const listItem = document.createElement("li");
      listItem.className = "px-6 py-4 text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors duration-200 border-b border-gray-600 last:border-b-0";

      // Create display name without the extension
      const displayName = file.name.replace(/\.(md|markdown)$/, "");
      listItem.textContent = displayName;

      // Add click event to load the post
      listItem.addEventListener("click", () => {
        loadPost(file.download_url, displayName);

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
      loadPost(firstFile.download_url, displayName);
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
async function loadPost(url, title) {
  contentArea.innerHTML = '<div class="loading text-center py-16 text-gray-400">Loading post...</div>';
  postTitle.textContent = title;
  postDate.textContent = "";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const markdown = await response.text();

    // Extract date from frontmatter if present
    const dateMatch = markdown.match(/^---[\s\S]*?date:\s*(.+?)[\s\S]*?---/);
    if (dateMatch && dateMatch[1]) {
      const postDateTime = new Date(dateMatch[1].trim());
      postDate.textContent = postDateTime.toLocaleDateString();
    }

    // Render markdown to HTML (sanitized with DOMPurify)
    const rawHtml = marked.parse(markdown);
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    contentArea.innerHTML = cleanHtml;

    // Add target="_blank" to external links and style them
    document.querySelectorAll("#content a").forEach((link) => {
      if (link.hostname !== window.location.hostname) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
      // Add Tailwind classes to links
      link.classList.add("text-terminal-orange", "hover:text-terminal-orange-hover", "transition-colors", "duration-200");
    });

    // Style code blocks
    document.querySelectorAll("#content pre").forEach((pre) => {
      pre.classList.add("bg-gray-900", "border", "border-gray-600", "rounded-lg", "p-4", "overflow-x-auto");
    });

    // Style inline code
    document.querySelectorAll("#content code:not(pre code)").forEach((code) => {
      code.classList.add("bg-gray-700", "text-terminal-cyan", "px-2", "py-1", "rounded", "text-sm");
    });

    // Style blockquotes
    document.querySelectorAll("#content blockquote").forEach((blockquote) => {
      blockquote.classList.add("border-l-4", "border-terminal-purple", "pl-4", "italic", "text-gray-300");
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

  } catch (error) {
    console.error("Error loading post:", error);
    contentArea.innerHTML = `<div class="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded">Error loading post: ${error.message}</div>`;
  }
}

// Initial load
fetchPosts();

// Refresh button handler
document.getElementById("refreshPosts").addEventListener("click", (e) => {
  e.preventDefault();
  fetchPosts();
});