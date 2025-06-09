---
title: Mermaid Charts and Diagrams Showcase
date: 2024-01-16
author: Otávio Rodrigues Bambans
tags: [mermaid, charts, diagrams, visualization, demo]
description: Complete showcase of all Mermaid chart types supported in the blog
---

# Mermaid Charts and Diagrams Showcase

This post demonstrates all the different types of charts and diagrams you can create using Mermaid.js in the blog. Each diagram includes interactive controls for copying and fullscreen viewing.

## Table of Contents
- [Flowcharts](#flowcharts)
- [Sequence Diagrams](#sequence-diagrams)
- [Gantt Charts](#gantt-charts)
- [Pie Charts](#pie-charts)
- [Git Graphs](#git-graphs)
- [State Diagrams](#state-diagrams)
- [Journey Maps](#journey-maps)
- [Class Diagrams](#class-diagrams)
- [Entity Relationship Diagrams](#entity-relationship-diagrams)

## Flowcharts

### Basic Flowchart
```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Fix bugs]
    E --> B
    C --> F[Deploy]
    F --> G[End]
```

### Advanced Flowchart with Styling
```mermaid
flowchart LR
    subgraph "Development"
        A[Code] --> B[Test]
        B --> C[Review]
    end
    
    subgraph "Production"
        D[Build] --> E[Deploy]
        E --> F[Monitor]
    end
    
    C --> D
    F --> G{Issues?}
    G -->|Yes| H[Rollback]
    G -->|No| I[Success]
    H --> A
```

### Complex System Architecture
```mermaid
flowchart TB
    subgraph "Frontend"
        UI[User Interface]
        API[API Layer]
    end
    
    subgraph "Backend Services"
        AUTH[Authentication]
        DB[(Database)]
        CACHE[(Redis Cache)]
        QUEUE[Message Queue]
    end
    
    subgraph "External"
        CDN[CDN]
        EMAIL[Email Service]
        PAYMENT[Payment Gateway]
    end
    
    UI --> API
    API --> AUTH
    API --> DB
    API --> CACHE
    API --> QUEUE
    CDN --> UI
    QUEUE --> EMAIL
    API --> PAYMENT
```

## Sequence Diagrams

### API Request Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    participant C as Cache
    
    U->>F: Click button
    F->>A: POST /api/data
    A->>C: Check cache
    C-->>A: Cache miss
    A->>D: Query database
    D-->>A: Return data
    A->>C: Store in cache
    A-->>F: JSON response
    F-->>U: Update UI
```

### Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant S as Server
    participant DB as Database
    participant J as JWT Service
    
    U->>B: Enter credentials
    B->>S: POST /login
    S->>DB: Validate user
    DB-->>S: User valid
    S->>J: Generate JWT
    J-->>S: Return token
    S-->>B: Login success + token
    B->>B: Store token
    B-->>U: Redirect to dashboard
```

## Gantt Charts

### Project Timeline
```mermaid
gantt
    title Blog Enhancement Project
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements gathering    :done, req, 2024-01-01, 2024-01-03
    Design mockups           :done, design, 2024-01-02, 2024-01-05
    
    section Development
    Setup environment       :done, setup, 2024-01-05, 2024-01-06
    Implement Mermaid        :done, mermaid, 2024-01-06, 2024-01-08
    Add syntax highlighting  :done, syntax, 2024-01-07, 2024-01-10
    Math expressions         :done, math, 2024-01-09, 2024-01-11
    
    section Testing
    Unit tests              :active, tests, 2024-01-11, 2024-01-13
    Integration testing     :testing, 2024-01-12, 2024-01-14
    
    section Deployment
    Deploy to staging       :staging, 2024-01-14, 2024-01-15
    Production deployment   :prod, 2024-01-15, 2024-01-16
```

### Development Roadmap
```mermaid
gantt
    title Development Roadmap Q1 2024
    dateFormat  YYYY-MM-DD
    section Core Features
    Blog system             :done, blog, 2024-01-01, 2024-01-15
    Search functionality    :done, search, 2024-01-10, 2024-01-16
    Offline support         :active, offline, 2024-01-15, 2024-01-25
    
    section Enhancements
    Comment system          :comment, 2024-01-20, 2024-02-05
    RSS feed               :rss, 2024-01-25, 2024-02-10
    Analytics              :analytics, 2024-02-01, 2024-02-15
    
    section Polish
    Performance optimization :perf, 2024-02-10, 2024-02-25
    Accessibility audit     :a11y, 2024-02-15, 2024-02-28
    Final testing          :final, 2024-02-25, 2024-03-05
```

## Pie Charts

### Technology Stack Distribution
```mermaid
pie title Technology Stack Usage
    "JavaScript" : 35
    "CSS" : 25
    "HTML" : 20
    "Python" : 15
    "Other" : 5
```

### Blog Post Categories
```mermaid
pie title Blog Post Categories
    "Technical Tutorials" : 40
    "Project Updates" : 25
    "Personal Thoughts" : 15
    "Code Reviews" : 12
    "News & Updates" : 8
```

### Time Spent on Features
```mermaid
pie title Development Time Distribution
    "Mermaid Integration" : 30
    "Syntax Highlighting" : 25
    "Math Support" : 20
    "Offline Features" : 15
    "Testing & Documentation" : 10
```

## Git Graphs

### Feature Branch Workflow
```mermaid
gitgraph
    commit id: "Initial commit"
    commit id: "Add basic blog"
    branch feature/mermaid
    checkout feature/mermaid
    commit id: "Add Mermaid.js"
    commit id: "Enhance charts"
    checkout main
    commit id: "Fix bug"
    merge feature/mermaid
    commit id: "Update documentation"
    branch feature/search
    checkout feature/search
    commit id: "Add search functionality"
    checkout main
    merge feature/search
    commit id: "Release v2.1.0"
```

## State Diagrams

### Blog Post Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review : Submit for review
    Review --> Draft : Needs changes
    Review --> Approved : Looks good
    Approved --> Published : Publish
    Published --> Archived : Archive
    Draft --> Deleted : Delete draft
    Archived --> [*]
    Deleted --> [*]
```

### User Authentication States
```mermaid
stateDiagram-v2
    [*] --> Anonymous
    Anonymous --> LoggingIn : Enter credentials
    LoggingIn --> Authenticated : Success
    LoggingIn --> Anonymous : Failed
    Authenticated --> Anonymous : Logout
    Authenticated --> Authenticated : Refresh token
```

## Journey Maps

### User Blog Reading Experience
```mermaid
journey
    title User Blog Reading Journey
    section Discovery
      Visit homepage        : 5: User
      Browse post list      : 4: User
      Search for topic      : 3: User
    section Reading
      Open blog post        : 5: User
      Read content          : 5: User
      Copy code examples    : 4: User
      View diagrams         : 5: User
    section Engagement
      Share on social       : 3: User
      Leave feedback        : 2: User
      Subscribe to updates  : 3: User
```

### Developer Experience Journey
```mermaid
journey
    title Developer Experience with Blog System
    section Setup
      Clone repository      : 5: Developer
      Start dev server      : 5: Developer
      Read documentation    : 4: Developer
    section Development
      Write new post        : 5: Developer
      Add code examples     : 5: Developer
      Create diagrams       : 4: Developer
      Test on mobile        : 4: Developer
    section Deployment
      Commit changes        : 5: Developer
      Push to GitHub        : 5: Developer
      Auto deployment       : 5: Developer
```

## Class Diagrams

### Blog System Architecture
```mermaid
classDiagram
    class BlogSystem {
        +posts: Post[]
        +currentPost: Post
        +initialize()
        +loadPost(url: string)
        +searchPosts(query: string)
    }
    
    class Post {
        +title: string
        +content: string
        +author: string
        +date: Date
        +tags: string[]
        +render()
        +calculateReadingTime()
    }
    
    class MarkdownRenderer {
        +parseFrontmatter(content: string)
        +renderToHTML(markdown: string)
        +highlightSyntax()
        +renderMath()
        +renderDiagrams()
    }
    
    class SearchEngine {
        +index: Map
        +indexPosts(posts: Post[])
        +search(query: string)
        +filter(posts: Post[], criteria: object)
    }
    
    BlogSystem --> Post
    BlogSystem --> MarkdownRenderer
    BlogSystem --> SearchEngine
    Post --> MarkdownRenderer
```

## Entity Relationship Diagrams

### Blog Database Schema
```mermaid
erDiagram
    User {
        int id PK
        string username
        string email
        string password_hash
        datetime created_at
        datetime updated_at
    }
    
    Post {
        int id PK
        string title
        text content
        string slug
        int author_id FK
        datetime published_at
        datetime created_at
        datetime updated_at
        boolean is_published
    }
    
    Tag {
        int id PK
        string name
        string slug
        string color
    }
    
    PostTag {
        int post_id FK
        int tag_id FK
    }
    
    Comment {
        int id PK
        int post_id FK
        int user_id FK
        text content
        datetime created_at
        boolean is_approved
    }
    
    User ||--o{ Post : writes
    Post ||--o{ Comment : has
    User ||--o{ Comment : writes
    Post ||--o{ PostTag : has
    Tag ||--o{ PostTag : belongs_to
```

## Interactive Features

Each Mermaid diagram includes:

- **📋 Copy Code**: Click to copy the Mermaid source code
- **🔍 Fullscreen**: View diagrams in fullscreen mode
- **Responsive Design**: Diagrams adapt to different screen sizes
- **Terminal Theme**: Dark theme matching the blog aesthetic

## Creating Your Own Diagrams

To add Mermaid diagrams to your posts, use the following syntax:

````markdown
```mermaid
graph TD
    A[Your diagram] --> B[Goes here]
```
````

### Supported Diagram Types

1. **Flowcharts**: `flowchart` or `graph`
2. **Sequence Diagrams**: `sequenceDiagram`
3. **Gantt Charts**: `gantt`
4. **Pie Charts**: `pie`
5. **Git Graphs**: `gitgraph`
6. **State Diagrams**: `stateDiagram-v2`
7. **User Journey**: `journey`
8. **Class Diagrams**: `classDiagram`
9. **ER Diagrams**: `erDiagram`

## Tips for Better Diagrams

- **Keep it simple**: Don't overcrowd diagrams
- **Use descriptive labels**: Make diagrams self-explanatory
- **Consistent styling**: Stick to the terminal color scheme
- **Test responsiveness**: Ensure diagrams work on mobile
- **Add context**: Include explanatory text around diagrams

## Conclusion

Mermaid.js integration brings powerful visualization capabilities to the blog, making it perfect for technical documentation, project planning, and system architecture discussions. The charts automatically adapt to the terminal theme and provide interactive features for better user experience.

Try creating your own diagrams using the examples above as templates! 📊🚀