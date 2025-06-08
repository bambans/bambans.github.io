# bambans.github.io.tail

A modern personal website and blog built with **Tailwind CSS**, featuring a terminal-inspired dark theme and dynamic markdown blog functionality.

## 🚀 Features

- **Modern Design**: Built with Tailwind CSS for responsive, mobile-first design
- **Terminal Aesthetic**: Dark theme with terminal-inspired command prompts
- **Dynamic Blog**: Markdown blog that fetches posts from GitHub repository
- **Spotify Integration**: Embedded playlist for music preferences
- **Social Links**: Links to GitHub, LinkedIn, Instagram, Facebook, and Lattes
- **Responsive**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Focus styles and keyboard navigation support
- **Performance**: Fast loading with CDN-based dependencies

## 📁 Project Structure

```
bambans.github.io.tail/
├── index.html              # Main landing page
├── blog/                   # Blog section
│   ├── index.html          # Blog homepage
│   ├── css/
│   │   └── style.css       # Blog-specific styles
│   ├── js/
│   │   └── main.js         # Blog functionality
│   └── posts/              # Markdown blog posts
│       └── primeiro_post.md
├── css/
│   └── style.css           # Main site styles
├── img/                    # Images and assets
│   ├── otavio-pixel-sem-bg.png
│   ├── otavio.ico
│   └── otavio_pixel.png
├── package.json            # Project configuration
├── README.md               # This file
├── CNAME                   # GitHub Pages domain
└── robots.txt              # SEO configuration
```

## 🛠 Technology Stack

- **Frontend Framework**: Vanilla HTML/CSS/JavaScript
- **CSS Framework**: Tailwind CSS (CDN)
- **Blog Engine**: Custom JavaScript with Marked.js
- **Markdown Parser**: Marked.js
- **HTML Sanitization**: DOMPurify
- **Fonts**: Google Fonts (Roboto Mono)
- **Hosting**: GitHub Pages
- **Version Control**: Git

## 🎨 Design System

### Colors
- **Background**: `#121212` (terminal-bg)
- **Primary Purple**: `#8a2be2` (terminal-purple)
- **Accent Cyan**: `#40e0d0` (terminal-cyan)
- **Link Orange**: `#ff6347` (terminal-orange)
- **Link Hover**: `#7f1300` (terminal-orange-hover)

### Typography
- **Primary Font**: Roboto Mono (monospace)
- **Weights**: 300 (light), 400 (regular)

### Components
- Terminal-style command prompts
- Gradient section backgrounds
- Hover effects and transitions
- Custom scrollbars
- Profile image with hover effects

## 🚀 Getting Started

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)
- Git (for version control)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/bambans/bambans.github.io.git
   cd bambans.github.io.tail
   ```

2. **Start local server**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using npm script
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### File Serving
The site uses GitHub API to fetch blog posts, so it needs to be served over HTTP/HTTPS (not file://) for the blog functionality to work properly.

## 📝 Blog Management

### Adding New Posts

1. Create a new markdown file in `blog/posts/`
2. Use the format: `YYYY-MM-DD-title.md`
3. Add frontmatter for metadata:
   ```markdown
   ---
   title: "Your Post Title"
   date: "2024-01-15"
   ---
   
   # Your Post Title
   
   Your content here...
   ```

### Blog Configuration

Edit the configuration in `blog/js/main.js`:

```javascript
const username = "bambans";           // GitHub username
const repo = "bambans.github.io";     // Repository name
const branch = "main";                // Branch name
const postsPath = "blog/posts/";      // Posts directory
```

## 🎯 Customization

### Personal Information

Update the following in `index.html`:

- **Name**: Update the echo user.name section
- **Email**: Update the echo user.email section
- **Description**: Update the echo user.description section
- **Social Links**: Update URLs in the echo user.media section
- **Profile Image**: Replace images in the `img/` directory
- **Spotify Playlist**: Update the Spotify embed URL

### Styling

#### Main Site Colors
Edit the Tailwind config in `index.html`:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'terminal-bg': '#121212',      // Background color
                'terminal-purple': '#8a2be2',  // Command prompt
                'terminal-cyan': '#40e0d0',    // Commands
                'terminal-orange': '#ff6347',  // Links
                'terminal-orange-hover': '#7f1300', // Link hover
            }
        }
    }
}
```

#### Custom Animations
Add custom CSS in `css/style.css`:

```css
@keyframes yourAnimation {
    from { /* start state */ }
    to { /* end state */ }
}

.your-class {
    animation: yourAnimation 1s ease-in-out;
}
```

## 📱 Responsive Design

The site is built mobile-first with the following breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: 768px - 1024px
- **Large Desktop**: > 1024px

### Mobile Optimizations
- Responsive navigation with hamburger menu
- Optimized image sizes
- Touch-friendly interactive elements
- Readable font sizes across devices

## ♿ Accessibility Features

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Indicators**: Visible focus styles for keyboard users
- **Alt Text**: All images have descriptive alt text
- **Semantic HTML**: Proper heading hierarchy and HTML structure
- **Color Contrast**: High contrast ratios for text readability

## 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Serve the site locally
npm run serve

# Check for updates (placeholder)
npm run build

# Run tests (placeholder)
npm run test
```

## 🚀 Deployment

### GitHub Pages

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update site"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Select source branch (main)
   - Site will be available at `https://username.github.io`

### Custom Domain

1. Update `CNAME` file with your domain
2. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: username.github.io
   ```

## 🐛 Troubleshooting

### Blog Posts Not Loading
- Check GitHub API rate limits
- Verify repository and file paths
- Ensure files are in the correct directory
- Check browser console for errors

### Styles Not Applying
- Check Tailwind CDN connection
- Verify CSS file paths
- Clear browser cache
- Check for JavaScript errors

### Local Server Issues
- Ensure Python is installed
- Try different port: `python -m http.server 3000`
- Check firewall settings

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

**Otávio Rodrigues Bambans**
- Email: [otavio@bambans.top](mailto:otavio@bambans.top)
- GitHub: [@bambans](https://github.com/bambans)
- LinkedIn: [bambans](https://www.linkedin.com/in/bambans/)
- Website: [https://bambans.top](https://bambans.top)

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Marked.js](https://marked.js.org/) for markdown parsing
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization
- [GitHub Markdown CSS](https://github.com/sindresorhus/github-markdown-css) for markdown styling
- [Google Fonts](https://fonts.google.com/) for Roboto Mono font

---

**Built with ❤️ and ☕ by Otávio Bambans**