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
  postList.innerHTML = '<li class="list-group-item">Loading posts...</li>';

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
        '<li class="list-group-item">No markdown files found</li>';
      return;
    }

    // Sort by filename (you can modify this to sort by date in filename)
    markdownFiles.sort((a, b) => b.name.localeCompare(a.name));

    // Clear and populate the post list
    postList.innerHTML = "";

    markdownFiles.forEach((file) => {
      const listItem = document.createElement("li");
      listItem.className = "list-group-item list-group-item-action";

      // Create display name without the extension
      const displayName = file.name.replace(/\.(md|markdown)$/, "");
      listItem.textContent = displayName;

      // Add click event to load the post
      listItem.addEventListener("click", () => {
        loadPost(file.download_url, displayName);

        // Remove active class from all items and add to clicked
        document
          .querySelectorAll("#post-list .list-group-item")
          .forEach((item) => {
            item.classList.remove("active");
          });
        listItem.classList.add("active");
      });

      postList.appendChild(listItem);
    });

    // Load the first post by default
    if (markdownFiles.length > 0) {
      const firstFile = markdownFiles[0];
      const displayName = firstFile.name.replace(/\.(md|markdown)$/, "");
      loadPost(firstFile.download_url, displayName);
      postList.firstChild.classList.add("active");
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    postList.innerHTML = `<li class="list-group-item text-danger">Error loading posts: ${error.message}</li>`;
  }
}

// Function to load a specific post
async function loadPost(url, title) {
  contentArea.innerHTML = '<div class="loading">Loading post...</div>';
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

    // Add target="_blank" to external links
    document.querySelectorAll("#content a").forEach((link) => {
      if (link.hostname !== window.location.hostname) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
  } catch (error) {
    console.error("Error loading post:", error);
    contentArea.innerHTML = `<div class="alert alert-danger">Error loading post: ${error.message}</div>`;
  }
}

// Initial load
fetchPosts();

// Refresh button handler
document.getElementById("refreshPosts").addEventListener("click", (e) => {
  e.preventDefault();
  fetchPosts();
});
