export type ContentType =
  | "general_news"
  | "technical_research"
  | "investment_intelligence"
  | "engineering_idea";

export type Article = {
  id: number;
  source: string;
  external_id: string | null;
  title: string;
  description: string;
  content: string;
  url: string;
  author: string | null;
  published_at: string | null;
  tags: string[];
  category: string;
  content_type: ContentType;
  summary: string;
  key_insights: string[];
  relevance_score: number;
  quality_score: number;
  engagement: number;
  comment_url: string | null;
  related_links: string[];
  ai_status: "completed" | "failed" | "not_configured" | "pending";
  created_at: string;
};

export type ArticlePage = {
  items: Article[];
  total: number;
  limit: number;
  offset: number;
};

export type Topic = {
  slug: string;
  name: string;
  count: number;
};

export type Dashboard = {
  total_articles: number;
  articles_last_7_days: number;
  category_counts: Record<string, number>;
  content_type_counts: Record<string, number>;
  ai_enabled: boolean;
};

export type Trend = {
  topic: string;
  observation: string;
  sources: { article_id: number; title: string; url: string }[];
};

export type AssistantAnswer = {
  answer: string;
  sources: { article_id: number; title: string; url: string }[];
};

export type Preferences = {
  categories: string[];
  topics: string[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_NEWSDC_API_URL?.replace(/\/+$/, "") ??
  "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  profileId?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (profileId) headers.set("X-Profile-Id", profileId);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Could not connect to NewsDC at ${API_BASE}. Start the backend and check its CORS_ORIGINS setting.`,
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status}).`;
    try {
      const body: { detail?: string } = await response.json();
      detail = body.detail || detail;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export const newsdcApi = {
  articles(
    params: {
      sort?: "recent" | "trending" | "for_you";
      category?: string;
      content_type?: ContentType;
      limit?: number;
      offset?: number;
    },
    profileId?: string,
  ) {
    return request<ArticlePage>(`/articles${queryString(params)}`, {}, profileId);
  },
  trending(limit = 9, offset = 0) {
    return request<ArticlePage>(`/trending${queryString({ limit, offset })}`);
  },
  search(q: string, limit = 9, offset = 0) {
    return request<ArticlePage>(`/search${queryString({ q, limit, offset })}`);
  },
  categories() {
    return request<{ items: Topic[] }>("/categories");
  },
  article(id: number) {
    return request<Article>(`/articles/${id}`);
  },
  related(id: number) {
    return request<Article[]>(`/articles/${id}/related`);
  },
  dashboard() {
    return request<Dashboard>("/dashboard");
  },
  trends(limit = 30) {
    return request<{ trends: Trend[] }>(`/trends${queryString({ limit })}`);
  },
  bookmarks(profileId: string, limit = 9, offset = 0) {
    return request<ArticlePage>(
      `/profiles/${encodeURIComponent(profileId)}/bookmarks${queryString({ limit, offset })}`,
    );
  },
  preferences(profileId: string) {
    return request<Preferences>(
      `/profiles/${encodeURIComponent(profileId)}/preferences`,
    );
  },
  updatePreferences(profileId: string, preferences: Preferences) {
    return request<Preferences>(
      `/profiles/${encodeURIComponent(profileId)}/preferences`,
      { method: "PUT", body: JSON.stringify(preferences) },
    );
  },
  bookmark(profileId: string, articleId: number, saved: boolean) {
    return request<void>(
      `/profiles/${encodeURIComponent(profileId)}/bookmarks/${articleId}`,
      { method: saved ? "PUT" : "DELETE" },
    );
  },
  activity(profileId: string, articleId: number, action: "read" | "click") {
    return request<void>(
      `/profiles/${encodeURIComponent(profileId)}/activity`,
      { method: "POST", body: JSON.stringify({ article_id: articleId, action }) },
    );
  },
  ask(question: string) {
    return request<AssistantAnswer>("/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question, limit: 8 }),
    });
  },
};

export const CATEGORY_GROUPS = [
  {
    label: "Infrastructure",
    topics: [
      "Data Center Infrastructure",
      "AI Compute and GPUs",
      "Power and Energy",
      "Cooling",
      "Networking",
    ],
  },
  {
    label: "Intelligence",
    topics: [
      "Hyperscaler Investments",
      "Economics and Financial Models",
      "Optimization",
      "AI/Agentic AI",
    ],
  },
  {
    label: "Impact & emerging",
    topics: [
      "Sustainability (PUE/WUE/carbon)",
      "Site Selection",
      "Security",
      "Regulation",
      "Emerging Technologies",
    ],
  },
];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  general_news: "Industry news",
  technical_research: "Research",
  investment_intelligence: "Investment intelligence",
  engineering_idea: "Engineering idea",
};
