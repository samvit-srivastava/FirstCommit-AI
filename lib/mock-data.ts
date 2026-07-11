import type { AnalysisResult, ChatMessage, OverviewStat, ActivityItem } from "@/types";

export const mockAnalysis: AnalysisResult = {
  summary: {
    name: "next.js",
    description:
      "Next.js is a React framework for building full-stack web applications. It provides server-side rendering, static site generation, API routes, and a powerful file-system based router. Developed and maintained by Vercel, it is one of the most popular frameworks in the React ecosystem.",
    purpose:
      "To provide developers with a production-ready React framework that handles routing, rendering strategies, bundling, and deployment out of the box — enabling teams to build fast, scalable web applications without complex configuration.",
    architecture:
      "Next.js uses a modular monorepo architecture managed with Turborepo. The core framework lives in `packages/next`, with the App Router providing nested layouts, server components, and streaming. The compiler is built with SWC (Rust-based) for fast builds. It supports both Pages Router (legacy) and App Router (recommended) paradigms.",
    stars: 128000,
    language: "TypeScript",
    url: "https://github.com/vercel/next.js",
  },
  techStack: [
    { name: "React", category: "frontend" },
    { name: "TypeScript", category: "language" },
    { name: "JavaScript", category: "language" },
    { name: "Webpack", category: "devops" },
    { name: "Turbopack", category: "devops" },
    { name: "SWC", category: "devops" },
    { name: "Jest", category: "devops" },
    { name: "Playwright", category: "devops" },
    { name: "Rust", category: "language" },
    { name: "CSS Modules", category: "frontend" },
    { name: "PostCSS", category: "frontend" },
    { name: "Node.js", category: "backend" },
  ],
  folders: [
    {
      name: "packages",
      path: "packages/",
      explanation:
        "Contains the core Next.js framework and related packages, organized as a monorepo.",
      children: [
        {
          name: "next",
          path: "packages/next/",
          explanation:
            "The main Next.js framework package — includes the compiler, router, server, and client runtime.",
        },
        {
          name: "create-next-app",
          path: "packages/create-next-app/",
          explanation:
            "CLI tool for scaffolding new Next.js projects with templates and configuration options.",
        },
        {
          name: "font",
          path: "packages/font/",
          explanation:
            "Provides the next/font module for optimized, self-hosted font loading with zero layout shift.",
        },
      ],
    },
    {
      name: "apps",
      path: "apps/",
      explanation:
        "Contains example applications and internal tools used for testing and documentation.",
    },
    {
      name: "docs",
      path: "docs/",
      explanation:
        "Source files for the official Next.js documentation site, written in MDX.",
    },
    {
      name: "examples",
      path: "examples/",
      explanation:
        "A collection of ready-to-use example projects demonstrating Next.js features and integrations.",
    },
    {
      name: "test",
      path: "test/",
      explanation:
        "Contains integration tests, end-to-end tests, and test fixtures for the framework.",
      children: [
        {
          name: "e2e",
          path: "test/e2e/",
          explanation:
            "End-to-end tests using Playwright that verify full application behavior in real browsers.",
        },
        {
          name: "integration",
          path: "test/integration/",
          explanation:
            "Integration tests that verify individual Next.js features work correctly together.",
        },
      ],
    },
    {
      name: "turbopack",
      path: "turbopack/",
      explanation:
        "Source code for Turbopack, the Rust-based bundler being developed as Webpack's successor in Next.js.",
    },
  ],
  roadmap: {
    frontend: [
      {
        step: 1,
        title: "Read the README and Contributing Guide",
        description:
          "Start with the project README to understand the overall mission, then read CONTRIBUTING.md for development setup instructions and coding standards.",
        files: ["README.md", "contributing.md"],
      },
      {
        step: 2,
        title: "Understand the Project Structure",
        description:
          "Explore the monorepo layout. Focus on the packages/ directory — especially packages/next/ which contains the core framework code.",
        files: ["packages/next/package.json", "turbo.json"],
      },
      {
        step: 3,
        title: "Learn the App Router Architecture",
        description:
          "Study how the App Router handles file-system routing, nested layouts, and server components. This is the modern paradigm in Next.js.",
        files: [
          "packages/next/src/server/app-render/",
          "packages/next/src/client/app-index.tsx",
        ],
      },
      {
        step: 4,
        title: "Explore the Component System",
        description:
          "Understand how Next.js built-in components like Image, Link, and Script work under the hood.",
        files: [
          "packages/next/src/client/image.tsx",
          "packages/next/src/client/link.tsx",
        ],
      },
      {
        step: 5,
        title: "Make Your First Contribution",
        description:
          "Look for issues labeled 'good first issue' on GitHub. Start with documentation fixes, small bug fixes, or adding test cases for existing features.",
        files: ["contributing.md", "test/"],
      },
    ],
    backend: [
      {
        step: 1,
        title: "Read the README and Contributing Guide",
        description:
          "Start with the project README, then read the contributing guide for development setup and build instructions.",
        files: ["README.md", "contributing.md"],
      },
      {
        step: 2,
        title: "Understand the Server Architecture",
        description:
          "Study how Next.js handles server-side rendering, API routes, and middleware. The server code lives in packages/next/src/server/.",
        files: [
          "packages/next/src/server/next-server.ts",
          "packages/next/src/server/base-server.ts",
        ],
      },
      {
        step: 3,
        title: "Learn the Build Pipeline",
        description:
          "Understand how Next.js compiles and bundles applications using SWC and Webpack/Turbopack.",
        files: [
          "packages/next/src/build/index.ts",
          "packages/next/src/build/webpack-config.ts",
        ],
      },
      {
        step: 4,
        title: "Explore API Routes and Middleware",
        description:
          "Study the request/response handling for API routes and edge middleware in the App Router.",
        files: [
          "packages/next/src/server/web/spec-extension/",
          "packages/next/src/server/web/adapter.ts",
        ],
      },
      {
        step: 5,
        title: "Make Your First Contribution",
        description:
          "Look for server-related issues labeled 'good first issue'. Consider improving error messages, adding test coverage, or fixing edge cases.",
        files: ["contributing.md", "test/integration/"],
      },
    ],
    fullstack: [
      {
        step: 1,
        title: "Read the README and Contributing Guide",
        description:
          "Understand the project vision and development workflow before diving into code.",
        files: ["README.md", "contributing.md"],
      },
      {
        step: 2,
        title: "Understand the Full Architecture",
        description:
          "Study both the client and server sides of Next.js — how they connect through the App Router, and how data flows between them.",
        files: [
          "packages/next/src/server/app-render/",
          "packages/next/src/client/",
        ],
      },
      {
        step: 3,
        title: "Learn Data Fetching Patterns",
        description:
          "Understand Server Components, server actions, and how Next.js handles data fetching, caching, and revalidation.",
        files: [
          "packages/next/src/server/app-render/action-handler.ts",
          "packages/next/src/client/components/action-async-storage.external.ts",
        ],
      },
      {
        step: 4,
        title: "Explore the Routing System",
        description:
          "Study the file-system router, dynamic routes, route groups, and parallel routes in the App Router.",
        files: [
          "packages/next/src/server/lib/router-utils/",
          "packages/next/src/client/components/layout-router.tsx",
        ],
      },
      {
        step: 5,
        title: "Make Your First Contribution",
        description:
          "Find issues that span both client and server — such as hydration bugs, routing edge cases, or documentation improvements.",
        files: ["contributing.md", "test/"],
      },
    ],
    opensource: [
      {
        step: 1,
        title: "Read the README and Contributing Guide",
        description:
          "This is essential. Understand the contribution workflow, PR process, and coding standards before writing any code.",
        files: ["README.md", "contributing.md", "code-of-conduct.md"],
      },
      {
        step: 2,
        title: "Set Up the Development Environment",
        description:
          "Clone the repo, install dependencies with pnpm, and run the development build. Verify tests pass locally.",
        files: ["contributing.md", "pnpm-lock.yaml", "turbo.json"],
      },
      {
        step: 3,
        title: "Browse Good First Issues",
        description:
          "Check the GitHub Issues tab for issues labeled 'good first issue'. These are specifically curated for new contributors.",
        files: [],
      },
      {
        step: 4,
        title: "Understand the Test Infrastructure",
        description:
          "Learn how tests are organized — Jest for unit tests, Playwright for E2E tests. Every PR should include relevant test updates.",
        files: [
          "test/",
          "jest.config.js",
          "test/lib/next-test-utils.ts",
        ],
      },
      {
        step: 5,
        title: "Submit Your First Pull Request",
        description:
          "Pick an issue, create a branch, implement the fix with tests, and submit a PR following the contributing guidelines.",
        files: ["contributing.md"],
      },
    ],
  },
};

export const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Where is the authentication logic in this project?",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Next.js itself doesn't include built-in authentication. However, the framework provides several hooks for implementing auth:\n\n1. **Middleware** (`packages/next/src/server/web/`) handles request interception, which is commonly used for auth checks.\n2. **Server Components** can verify sessions server-side before rendering.\n3. **Route Handlers** in the App Router can be used to create auth API endpoints.\n\nFor actual auth implementation, Next.js recommends using libraries like NextAuth.js (Auth.js), which integrate seamlessly with the App Router.",
    referencedFiles: [
      "packages/next/src/server/web/adapter.ts",
      "packages/next/src/server/app-render/action-handler.ts",
    ],
  },
  {
    id: "3",
    role: "user",
    content: "How do I add a new page in the App Router?",
  },
  {
    id: "4",
    role: "assistant",
    content:
      "In Next.js App Router, pages are created using the file-system convention:\n\n1. Create a new directory under `app/` for your route (e.g., `app/about/`).\n2. Add a `page.tsx` file inside that directory — this becomes the route's UI.\n3. Optionally add `layout.tsx` for shared layout, `loading.tsx` for loading states, and `error.tsx` for error boundaries.\n\nFor example, creating `app/dashboard/settings/page.tsx` automatically creates the route `/dashboard/settings`.\n\nDynamic routes use bracket syntax: `app/blog/[slug]/page.tsx` creates `/blog/:slug`.",
    referencedFiles: [
      "packages/next/src/server/app-render/app-render.tsx",
      "packages/next/src/build/webpack/loaders/next-app-loader/index.ts",
    ],
  },
];

export const mockOverviewStats: OverviewStat[] = [
  {
    label: "Technologies",
    value: "12",
    description: "Frameworks, languages, and tools detected",
  },
  {
    label: "Folders Mapped",
    value: "6",
    description: "Top-level directories analyzed",
  },
  {
    label: "Roadmap Steps",
    value: "5",
    description: "Personalized onboarding steps generated",
  },
  {
    label: "GitHub Stars",
    value: "128k",
    description: "Community popularity score",
  },
];

export const mockRecentActivity: ActivityItem[] = [
  {
    id: "a1",
    title: "Repository cloned",
    description: "vercel/next.js cloned and indexed successfully",
    timestamp: "2 minutes ago",
  },
  {
    id: "a2",
    title: "Tech stack detected",
    description: "12 technologies identified across the codebase",
    timestamp: "2 minutes ago",
  },
  {
    id: "a3",
    title: "Folder structure mapped",
    description: "6 top-level directories analyzed with AI explanations",
    timestamp: "1 minute ago",
  },
  {
    id: "a4",
    title: "Onboarding roadmap generated",
    description: "5-step personalized learning path created",
    timestamp: "1 minute ago",
  },
  {
    id: "a5",
    title: "RAG index built",
    description: "Repository embeddings generated for AI chat",
    timestamp: "30 seconds ago",
  },
  {
    id: "a6",
    title: "Analysis complete",
    description: "Repository is ready for exploration",
    timestamp: "Just now",
  },
];
