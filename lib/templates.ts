export interface Template {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  prompt: string;
}

export const TEMPLATES: Template[] = [
  {
    slug: "portfolio",
    name: "Portfolio Site",
    description: "Personal portfolio with projects, about, and contact form.",
    tags: ["landing", "personal"],
    prompt:
      "Build me a personal portfolio website: hero section with name/title, about section, projects grid (data from Supabase), contact form that saves messages to Supabase. Dark modern design, mobile-first, SEO meta tags.",
  },
  {
    slug: "todo-auth",
    name: "Todo + Auth",
    description: "Todo app with Supabase email login and per-user tasks.",
    tags: ["app", "auth"],
    prompt:
      "Build a todo app with Supabase email/password auth. Each logged-in user sees only their own tasks (RLS). Add, toggle, delete tasks. Clean mobile-first UI with loading and empty states.",
  },
  {
    slug: "mini-shop",
    name: "Mini Shop",
    description: "Product listing, cart, and checkout starter with Supabase.",
    tags: ["ecommerce", "app"],
    prompt:
      "Build a mini e-commerce shop: product listing from Supabase, product detail pages, cart with localStorage persistence synced per user, simple checkout form saving orders to Supabase. Mobile-first, Flipkart-style product cards.",
  },
  {
    slug: "blog",
    name: "Blog",
    description: "Markdown-style blog with Supabase posts and SEO.",
    tags: ["content", "seo"],
    prompt:
      "Build a blog: posts stored in Supabase, listing page + slug-based post pages, proper SEO metadata per post, simple admin form to publish posts (protected by Supabase auth). Clean reading-focused design.",
  },
  {
    slug: "landing",
    name: "SaaS Landing",
    description: "High-converting landing page with waitlist signup.",
    tags: ["landing", "marketing"],
    prompt:
      "Build a SaaS landing page: hero with headline + CTA, features grid, pricing section, testimonial placeholders REMOVED (use honest empty state), waitlist email form saving to Supabase. Animated, mobile-first, OG tags.",
  },
  {
    slug: "dashboard",
    name: "Admin Dashboard",
    description: "KPI dashboard with charts-ready layout and Supabase data.",
    tags: ["app", "admin"],
    prompt:
      "Build an admin dashboard: sidebar nav, KPI stat cards from Supabase aggregates, data table with search, login-protected via Supabase auth. Dark theme, responsive, loading skeletons.",
  },
];
