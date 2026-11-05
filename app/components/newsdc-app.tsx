"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  ApiError,
  CATEGORY_GROUPS,
  CONTENT_TYPE_LABELS,
  type Article,
  type ArticlePage,
  type ContentType,
  type Dashboard,
  type Preferences,
  type Topic,
  type Trend,
  newsdcApi,
} from "@/lib/newsdc";

type View =
  | "for-you"
  | "trending"
  | "topics"
  | "bookmarks"
  | "dashboard"
  | "category"
  | "search"
  | "article";
type FeedView = Exclude<View, "article">;
type IconName =
  | "sparkles"
  | "trending"
  | "layers"
  | "bookmark"
  | "chart"
  | "search"
  | "sun"
  | "moon"
  | "menu"
  | "close"
  | "arrow-right"
  | "arrow-left"
  | "external"
  | "clock"
  | "message"
  | "send"
  | "settings"
  | "check"
  | "refresh"
  | "zap"
  | "grid"
  | "plus"
  | "filter"
  | "link"
  | "command"
  | "server"
  | "leaf"
  | "briefcase"
  | "book"
  | "globe";

const iconPaths: Record<IconName, ReactNode> = {
  sparkles: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
    </>
  ),
  trending: <path d="m3 17 6-6 4 4 8-8M15 7h6v6" />,
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z" />,
  chart: (
    <>
      <path d="M4 19V5M4 19h17" />
      <path d="m7 15 4-4 3 2 6-7" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </>
  ),
  moon: <path d="M20.9 13A8.4 8.4 0 0 1 11 3.1 8.6 8.6 0 1 0 20.9 13Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  "arrow-right": <path d="M5 12h14m-7-7 7 7-7 7" />,
  "arrow-left": <path d="M19 12H5m7 7-7-7 7-7" />,
  external: (
    <>
      <path d="M13 5h6v6m0-6-9 9" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  message: (
    <>
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.8-3.6A7.5 7.5 0 1 1 20 11.5Z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.3 1-1.4 2.4-1.6-.6a8 8 0 0 1-1.5.9l-.3 1.7h-2.8l-.3-1.7a8 8 0 0 1-1.5-.9l-1.6.6-1.4-2.4 1.3-1a8 8 0 0 1 0-1.8l-1.3-1 1.4-2.4 1.6.6a8 8 0 0 1 1.5-.9l.3-1.7h2.8l.3 1.7a8 8 0 0 1 1.5.9l1.6-.6 1.4 2.4-1.3 1a8 8 0 0 1 0 1.8Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M5.5 9A7 7 0 0 1 18 6l2 2m-16 8 2 2a7 7 0 0 0 12.5-3" />
    </>
  ),
  zap: <path d="m13 2-3 9h7L8 22l3-9H4l9-11Z" />,
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  plus: <path d="M12 5v14m-7-7h14" />,
  filter: <path d="M4 7h16M7 12h10m-7 5h4" />,
  link: <path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7m2.7 6.4a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" />,
  command: (
    <>
      <path d="M9 8V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V8Z" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01M11 7.5h7m-7 9h7" />
    </>
  ),
  leaf: <path d="M20 4c-9 0-15 4-15 11a5 5 0 0 0 5 5c7 0 11-7 10-16ZM5 20c2-4 6-7 11-10" />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 6h18m-11 0v2h4v-2" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" />
      <path d="M4 16h16M8 7h8m-8 4h6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18" />
    </>
  ),
};

function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Date not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not provided";
  const elapsed = Date.now() - date.getTime();
  if (elapsed < 60_000) return "Just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  if (elapsed < 7 * 86_400_000) return `${Math.floor(elapsed / 86_400_000)}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    date,
  );
}

function publisherName(source: string): string {
  if (source === "hacker_news") return "Hacker News";
  if (source.startsWith("rss:")) {
    return source.slice(4).replace(/^www\./, "");
  }
  return source.replaceAll("_", " ");
}

function articleType(article: Article): string {
  return CONTENT_TYPE_LABELS[article.content_type] ?? "Industry news";
}

function initials(name: string): string {
  return name
    .split(/[ .-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getOrCreateProfileId(): string | null {
  if (typeof window === "undefined") return null;
  const existing = localStorage.getItem("newsdc-profile-id");
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "")
      : `newsdc-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  localStorage.setItem("newsdc-profile-id", id);
  return id;
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function ArticleCard({
  article,
  index,
  bookmarked,
  onOpen,
  onBookmark,
}: {
  article: Article;
  index: number;
  bookmarked: boolean;
  onOpen: () => void;
  onBookmark: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <article
      className="article-card"
      style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}
    >
      <div className="article-eyebrow">
        <span className="publisher">
          <span className={`source-mark ${article.source.startsWith("rss:") ? "source-mark-rss" : ""}`}>
            {article.source === "hacker_news" ? "Y" : initials(publisherName(article.source))}
          </span>
          {publisherName(article.source)}
        </span>
        <span className="eyebrow-dot" />
        <span>{formatDate(article.published_at)}</span>
        <button
          className={`icon-button card-bookmark ${bookmarked ? "is-saved" : ""}`}
          onClick={onBookmark}
          aria-label={bookmarked ? "Remove bookmark" : "Save article"}
          aria-pressed={bookmarked}
          title={bookmarked ? "Remove bookmark" : "Save article"}
        >
          <Icon name="bookmark" size={17} />
        </button>
      </div>
      <button className="article-copy" onClick={onOpen}>
        <span className="article-type">{articleType(article)}</span>
        <span className="article-title">{article.title}</span>
        <span className="article-summary">
          {article.summary || article.description || "Open this source to read the full article."}
        </span>
      </button>
      <div className="article-tags">
        <span className="category-chip">{article.category}</span>
        {article.tags
          .filter((tag) => tag !== article.category && tag !== "Hacker News")
          .slice(0, 2)
          .map((tag) => (
            <span className="muted-chip" key={tag}>
              {tag}
            </span>
          ))}
      </div>
      {article.key_insights.length > 0 && (
        <p className="card-insight">
          <Icon name="sparkles" size={14} />
          {article.key_insights[0]}
        </p>
      )}
      <div className="article-footer">
        <span className="engagement-note">
          <Icon name="zap" size={14} />
          {Math.round(article.relevance_score)} relevance
        </span>
        {article.engagement > 0 && (
          <span className="engagement-note">
            <Icon name="message" size={14} />
            {article.engagement.toLocaleString()} engagement
          </span>
        )}
        {article.comment_url && (
          <a
            href={article.comment_url}
            target="_blank"
            rel="noreferrer"
            className="discussion-link"
            onClick={(event) => event.stopPropagation()}
          >
            Discussion <Icon name="external" size={13} />
          </a>
        )}
      </div>
    </article>
  );
}

export default function NewsDCApp() {
  const [view, setView] = useState<View>("for-you");
  const [profileId] = useState<string | null>(getOrCreateProfileId);
  const previousFeedView = useRef<FeedView>("for-you");
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [pageOffset, setPageOffset] = useState(0);
  const [feedRefresh, setFeedRefresh] = useState(0);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [category, setCategory] = useState<Topic | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contentType, setContentType] = useState<ContentType | "">("");
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [articleId, setArticleId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardStatus, setDashboardStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendError, setTrendError] = useState("");
  const [feedError, setFeedError] = useState("");
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trendStatus, setTrendStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [preferences, setPreferences] = useState<Preferences>({
    categories: [],
    topics: [],
  });
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{
    text: string;
    sources: { article_id: number; title: string; url: string }[];
  } | null>(null);
  const [asking, setAsking] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [todayLabel, setTodayLabel] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const pageSize = 9;
  const loadingTrends = trendStatus === "loading";
  const loadingDetail =
    view === "article" && articleId !== null && detail?.id !== articleId;
  const loadingDashboard =
    dashboardStatus === "idle" || dashboardStatus === "loading";
  const isFeedView: boolean = view !== "article" && view !== "dashboard" && view !== "topics";
  const title =
    view === "article"
      ? "Article brief"
      : view === "dashboard"
        ? "Your dashboard"
        : view === "topics"
          ? "Explore topics"
          : view === "search"
            ? "Search results"
            : view === "bookmarks"
              ? "Your reading list"
              : view === "trending"
                ? "Trending now"
                : view === "category"
                  ? category?.name ?? "Topic"
                  : "Your daily briefing";

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const storedTheme = localStorage.getItem("newsdc-theme");
      if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
      setTodayLabel(
        new Intl.DateTimeFormat("en", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }).format(new Date()),
      );
      try {
        const saved = JSON.parse(
          localStorage.getItem("newsdc-bookmarks") ?? "[]",
        ) as number[];
        if (Array.isArray(saved)) setBookmarkedIds(new Set(saved));
      } catch {
        localStorage.removeItem("newsdc-bookmarks");
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("newsdc-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    void newsdcApi
      .categories()
      .then((response) => setTopics(response.items))
      .catch(() => {
        setTopics(
          CATEGORY_GROUPS.flatMap((group) => group.topics).map((name) => ({
            name,
            slug: name
              .toLowerCase()
              .replaceAll("/", "-")
              .replaceAll(" ", "-")
              .replace(/[()]/g, ""),
            count: 0,
          })),
        );
      });
  }, []);

  useEffect(() => {
    if (!profileId) return;
    void Promise.all([
      newsdcApi
        .preferences(profileId)
        .then(setPreferences)
        .catch(() => {}),
      newsdcApi
        .bookmarks(profileId, 100)
        .then((saved) => {
          const ids = new Set(saved.items.map((item) => item.id));
          setBookmarkedIds(ids);
          localStorage.setItem("newsdc-bookmarks", JSON.stringify([...ids]));
        })
        .catch(() => {}),
    ]);
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingFeed(true);
      setFeedError("");
      try {
        let response: ArticlePage;
        if (view === "search") {
          response = await newsdcApi.search(activeQuery, pageSize, pageOffset);
        } else if (view === "bookmarks") {
          if (!profileId) {
            if (!cancelled) {
              setArticles([]);
              setTotal(0);
            }
            return;
          }
          response = await newsdcApi.bookmarks(profileId, pageSize, pageOffset);
        } else if (view === "trending") {
          response = await newsdcApi.trending(pageSize, pageOffset);
        } else if (view === "category" && category) {
          response = await newsdcApi.articles(
            {
              category: category.slug,
              content_type: contentType || undefined,
              sort: "recent",
              limit: pageSize,
              offset: pageOffset,
            },
            profileId ?? undefined,
          );
        } else {
          response = await newsdcApi.articles(
            {
              sort: "for_you",
              content_type: contentType || undefined,
              limit: pageSize,
              offset: pageOffset,
            },
            profileId ?? undefined,
          );
        }
        if (cancelled) return;
        setArticles((current) =>
          pageOffset === 0 ? response.items : [...current, ...response.items],
        );
        setTotal(response.total);
      } catch (error) {
        if (cancelled) return;
        setFeedError(
          error instanceof Error ? error.message : "The article feed could not be loaded.",
        );
        if (pageOffset === 0) {
          setArticles([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoadingFeed(false);
          setLoadingMore(false);
        }
      }
    };
    if (isFeedView) void load();
    return () => {
      cancelled = true;
    };
  }, [
    activeQuery,
    category,
    contentType,
    feedRefresh,
    isFeedView,
    pageOffset,
    profileId,
    view,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (view !== "article" || articleId === null) return;
    void Promise.all([
      newsdcApi.article(articleId),
      newsdcApi.related(articleId).catch((error: unknown) => {
        if (!cancelled) {
          showToast(
            error instanceof Error ? error.message : "Related stories could not be loaded.",
          );
        }
        return [];
      }),
    ])
      .then(([articleResponse, relatedResponse]) => {
        if (cancelled) return;
        setDetail(articleResponse);
        setRelated(relatedResponse);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          showToast(
            error instanceof Error ? error.message : "The article could not be loaded.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, showToast, view]);

  useEffect(() => {
    if (view !== "dashboard") return;
    let cancelled = false;
    void newsdcApi
      .dashboard()
      .then((result) => {
        if (!cancelled) {
          setDashboard(result);
          setDashboardError("");
          setDashboardStatus("loaded");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDashboardError(
            error instanceof Error ? error.message : "The dashboard could not be loaded.",
          );
          setDashboardStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dashboardRefresh, view]);

  const loadTrends = useCallback(
    () =>
      newsdcApi
        .trends()
        .then((result) => {
          setTrends(result.trends);
          setTrendError("");
          setTrendStatus("loaded");
        })
        .catch((error: unknown) => {
      setTrendError(
        error instanceof ApiError && error.status === 503
          ? "Add an AI provider to your server to unlock live trend analysis."
          : error instanceof Error
            ? error.message
            : "Emerging trends could not be loaded.",
      );
      setTrendStatus("error");
        }),
    [],
  );

  useEffect(() => {
    void loadTrends();
  }, [loadTrends]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(
          (document.activeElement as HTMLElement | null)?.tagName ?? "",
        )
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setPreferencesOpen(false);
        setAssistantOpen(false);
        if (view === "article") setView(previousFeedView.current);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [view]);

  const favoriteTopics = useMemo(
    () => topics.filter((topic) => preferences.categories.includes(topic.name)),
    [preferences.categories, topics],
  );

  function navigate(nextView: FeedView) {
    previousFeedView.current = nextView;
    setView(nextView);
    setCategory(null);
    setActiveQuery("");
    setContentType("");
    setPageOffset(0);
    setMobileNavOpen(false);
  }

  function selectCategory(topic: Topic) {
    previousFeedView.current = "category";
    setCategory(topic);
    setView("category");
    setContentType("");
    setPageOffset(0);
    setMobileNavOpen(false);
  }

  function openArticle(article: Article) {
    if (view !== "article") previousFeedView.current = view;
    setArticleId(article.id);
    setDetail(null);
    setRelated([]);
    setView("article");
    if (profileId) {
      void newsdcApi
        .activity(profileId, article.id, "read")
        .catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : "Reading activity could not be saved.");
        });
    }
  }

  async function toggleBookmark(
    event: MouseEvent<HTMLButtonElement>,
    article: Article,
  ) {
    event.stopPropagation();
    if (!profileId) {
      showToast("Preparing your private reading list. Please try again in a moment.");
      return;
    }
    const wasSaved = bookmarkedIds.has(article.id);
    const updated = new Set(bookmarkedIds);
    if (wasSaved) updated.delete(article.id);
    else updated.add(article.id);
    setBookmarkedIds(updated);
    localStorage.setItem("newsdc-bookmarks", JSON.stringify([...updated]));
    try {
      await newsdcApi.bookmark(profileId, article.id, !wasSaved);
      if (view === "bookmarks" && wasSaved) {
        setArticles((current) => current.filter((item) => item.id !== article.id));
        setTotal((current) => Math.max(0, current - 1));
      }
      showToast(wasSaved ? "Removed from your reading list." : "Saved to your reading list.");
    } catch (error) {
      setBookmarkedIds(bookmarkedIds);
      localStorage.setItem("newsdc-bookmarks", JSON.stringify([...bookmarkedIds]));
      showToast(error instanceof Error ? error.message : "Your bookmark could not be saved.");
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = queryInput.trim();
    if (trimmed.length < 2) {
      showToast("Enter at least 2 characters to search.");
      return;
    }
    setActiveQuery(trimmed);
    setView("search");
    setCategory(null);
    setContentType("");
    setPageOffset(0);
    setMobileNavOpen(false);
  }

  async function saveInterests(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileId) return;
    setSavingPreferences(true);
    const next = { categories: draftCategories, topics: preferences.topics };
    try {
      const saved = await newsdcApi.updatePreferences(profileId, next);
      setPreferences(saved);
      setPreferencesOpen(false);
      setView("for-you");
      setCategory(null);
      setPageOffset(0);
      showToast("Your interests are updated. Your For You feed is ready.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Your interests could not be saved.");
    } finally {
      setSavingPreferences(false);
    }
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length < 4) {
      setAssistantError("Add a little more detail to your question.");
      return;
    }
    setAsking(true);
    setAssistantError("");
    setAnswer(null);
    try {
      const response = await newsdcApi.ask(trimmed);
      setAnswer({ text: response.answer, sources: response.sources });
    } catch (error) {
      setAssistantError(
        error instanceof ApiError && error.status === 503
          ? "Connect an AI model to your server to ask research questions."
          : error instanceof Error
            ? error.message
            : "The assistant could not answer right now.",
      );
    } finally {
      setAsking(false);
    }
  }

  function toggleInterest(name: string) {
    setDraftCategories((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  }

  const nav = (
    <>
      <div className="sidebar-section-label">DISCOVER</div>
      <button
        className={`nav-link ${view === "for-you" ? "active" : ""}`}
        onClick={() => navigate("for-you")}
      >
        <Icon name="sparkles" />
        <span>For you</span>
        <span className="nav-new">AI</span>
      </button>
      <button
        className={`nav-link ${view === "trending" ? "active" : ""}`}
        onClick={() => navigate("trending")}
      >
        <Icon name="trending" />
        <span>Trending</span>
      </button>
      <button
        className={`nav-link ${view === "topics" ? "active" : ""}`}
        onClick={() => navigate("topics")}
      >
        <Icon name="layers" />
        <span>Explore topics</span>
      </button>

      <div className="sidebar-section-label sidebar-section-spaced">
        YOUR LIBRARY
      </div>
      <button
        className={`nav-link ${view === "bookmarks" ? "active" : ""}`}
        onClick={() => navigate("bookmarks")}
      >
        <Icon name="bookmark" />
        <span>Reading list</span>
        {bookmarkedIds.size > 0 && (
          <span className="nav-count">{bookmarkedIds.size}</span>
        )}
      </button>
      <button
        className={`nav-link ${view === "dashboard" ? "active" : ""}`}
        onClick={() => {
          previousFeedView.current = "dashboard";
          setDashboardStatus("loading");
          setDashboardError("");
          setView("dashboard");
          setDashboardRefresh((current) => current + 1);
          setMobileNavOpen(false);
        }}
      >
        <Icon name="chart" />
        <span>Dashboard</span>
      </button>

      <div className="sidebar-topics">
        <div className="sidebar-section-heading">
          <span className="sidebar-section-label">YOUR TOPICS</span>
          <button
            className="sidebar-add"
            onClick={() => {
              setDraftCategories(preferences.categories);
              setPreferencesOpen(true);
            }}
            aria-label="Edit your topics"
            title="Edit your topics"
          >
            <Icon name="plus" size={15} />
          </button>
        </div>
        {favoriteTopics.length > 0 ? (
          favoriteTopics.slice(0, 5).map((topic) => (
            <button
              key={topic.slug}
              className={`topic-nav-link ${category?.slug === topic.slug && view === "category" ? "selected" : ""}`}
              onClick={() => selectCategory(topic)}
            >
              <span className="topic-nav-dot" />
              <span>{topic.name}</span>
            </button>
          ))
        ) : (
          <button
            className="topic-empty-link"
            onClick={() => {
              setDraftCategories(preferences.categories);
              setPreferencesOpen(true);
            }}
          >
            Pick topics for your feed <Icon name="arrow-right" size={13} />
          </button>
        )}
      </div>
    </>
  );

  const renderedFeed = (
    <>
      <section className="feed-section">
        {feedError && (
          <div className="api-notice">
            <span className="api-notice-dot" />
            <span>{feedError}</span>
            <button
              onClick={() => {
                setFeedError("");
                setFeedRefresh((current) => current + 1);
              }}
            >
              <Icon name="refresh" size={14} /> Retry
            </button>
          </div>
        )}
        {!feedError && articles.length === 0 && !loadingFeed ? (
          <EmptyState
            icon={view === "bookmarks" ? "bookmark" : view === "search" ? "search" : "sparkles"}
            title={
              view === "bookmarks"
                ? "Your reading list is a blank page"
                : view === "search"
                  ? "Nothing matched that search"
                  : view === "category"
                    ? `No stories in ${category?.name ?? "this topic"} yet`
                    : contentType
                      ? `No ${CONTENT_TYPE_LABELS[contentType]} stories yet`
                    : "Your briefing is ready to take shape"
            }
            description={
              view === "bookmarks"
                ? "Save an article you want to come back to. It will be waiting here."
                : view === "search"
                  ? "Try a broader phrase or another data-center topic."
                  : view === "category"
                    ? contentType
                      ? `No ${CONTENT_TYPE_LABELS[contentType]} stories are currently tagged ${category?.name ?? "with this topic"}. Clear the content filter or explore another topic.`
                      : `There are currently no collected articles tagged ${category?.name ?? "with this topic"}. Choose a topic with stories or ingest more coverage.`
                    : contentType
                      ? `There are currently no collected ${CONTENT_TYPE_LABELS[contentType].toLowerCase()} stories. Clear the content filter or collect more coverage.`
                  : "Ingest content from your backend to discover current articles and research here."
            }
            action={
              view === "bookmarks" ? (
                <button className="button button-outline" onClick={() => navigate("for-you")}>
                  Discover stories <Icon name="arrow-right" size={15} />
                </button>
              ) : view === "category" ? (
                contentType ? (
                  <button
                    className="button button-outline"
                    onClick={() => {
                      setContentType("");
                      setPageOffset(0);
                    }}
                  >
                    Clear content filter <Icon name="arrow-right" size={15} />
                  </button>
                ) : (
                  <button className="button button-outline" onClick={() => navigate("topics")}>
                    Explore other topics <Icon name="arrow-right" size={15} />
                  </button>
                )
              ) : contentType && view !== "search" ? (
                <button
                  className="button button-outline"
                  onClick={() => {
                    setContentType("");
                    setPageOffset(0);
                  }}
                >
                  Clear content filter <Icon name="arrow-right" size={15} />
                </button>
              ) : view !== "search" ? (
                <a
                  className="button button-outline"
                  href={`${process.env.NEXT_PUBLIC_NEWSDC_API_URL?.replace(/\/api\/v1\/?$/, "") ?? "http://localhost:8000"}/docs`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open backend API docs <Icon name="external" size={15} />
                </a>
              ) : undefined
            }
          />
        ) : (
          <div className="article-list">
            {loadingFeed && articles.length === 0
              ? Array.from({ length: 4 }, (_, index) => (
                  <div className="article-skeleton" key={index}>
                    <span className="skeleton-line skeleton-short" />
                    <span className="skeleton-line skeleton-title" />
                    <span className="skeleton-line" />
                    <span className="skeleton-line skeleton-medium" />
                  </div>
                ))
              : articles.map((article, index) => (
                  <ArticleCard
                    key={`${article.id}-${index}`}
                    article={article}
                    index={index}
                    bookmarked={bookmarkedIds.has(article.id)}
                    onOpen={() => openArticle(article)}
                    onBookmark={(event) => void toggleBookmark(event, article)}
                  />
                ))}
          </div>
        )}
      </section>
      {isFeedView && articles.length > 0 && (
        <div className="pagination-row">
          <span>
            Showing <strong>{articles.length}</strong> of{" "}
            <strong>{total}</strong> stories
          </span>
          {articles.length < total && (
            <button
              className="button button-outline load-more"
              onClick={() => {
                setLoadingMore(true);
                setPageOffset((current) => current + pageSize);
              }}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading…" : "Load more stories"}
              {!loadingMore && <Icon name="arrow-right" size={15} />}
            </button>
          )}
        </div>
      )}
    </>
  );

  const articleDetail = (
    <>
      <button className="back-link" onClick={() => setView(previousFeedView.current)}>
        <Icon name="arrow-left" size={16} /> Back to your briefing
      </button>
      {loadingDetail ? (
        <div className="article-detail-skeleton">
          <span className="skeleton-line skeleton-short" />
          <span className="skeleton-line skeleton-title" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-medium" />
        </div>
      ) : detail ? (
        <article className="detail-card">
          <div className="detail-kicker">
            <span className="category-chip">{detail.category}</span>
            <span className={`ai-status status-${detail.ai_status}`}>
              {detail.ai_status === "completed" ? "AI enriched" : detail.ai_status.replace("_", " ")}
            </span>
          </div>
          <p className="detail-publisher">
            <span className="source-mark">{initials(publisherName(detail.source))}</span>
            {publisherName(detail.source)}
            <span className="eyebrow-dot" />
            {formatDate(detail.published_at)}
            {detail.author && <span>by {detail.author}</span>}
          </p>
          <h2 className="detail-title">{detail.title}</h2>
          <p className="detail-summary">
            {detail.summary || detail.description || "No summary is available yet."}
          </p>
          <div className="detail-actions">
            <a
              className="button button-primary"
              href={detail.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                if (profileId)
                  void newsdcApi.activity(profileId, detail.id, "click").catch(() => {
                    showToast("The source opened, but click activity could not be saved.");
                  });
              }}
            >
              Read original story <Icon name="external" size={16} />
            </a>
            <button
              className={`button button-outline ${bookmarkedIds.has(detail.id) ? "saved-action" : ""}`}
              onClick={(event) => void toggleBookmark(event, detail)}
            >
              <Icon name="bookmark" size={16} />
              {bookmarkedIds.has(detail.id) ? "Saved" : "Save for later"}
            </button>
          </div>
          <div className="detail-divider" />
          <div className="detail-insights">
            <h3>
              <span className="insight-icon">
                <Icon name="sparkles" size={16} />
              </span>
              Key takeaways
            </h3>
            {detail.key_insights.length > 0 ? (
              <ul>
                {detail.key_insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            ) : (
              <p className="subtle-copy">
                {detail.ai_status === "not_configured"
                  ? "Configure an AI model on the server to extract technical and business insights."
                  : detail.description || "No additional insights are available for this story yet."}
              </p>
            )}
          </div>
          {detail.comment_url && (
            <a
              className="discussion-card"
              href={detail.comment_url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="discussion-card-icon">
                <Icon name="message" size={18} />
              </span>
              <span>
                <strong>Continue the discussion</strong>
                <small>Open the conversation on {publisherName(detail.source)}</small>
              </span>
              <Icon name="arrow-right" size={16} />
            </a>
          )}
          {detail.related_links.length > 0 && (
            <div className="detail-related-links">
              <h3>Related links</h3>
              {detail.related_links.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <Icon name="link" size={14} /> {url}
                </a>
              ))}
            </div>
          )}
        </article>
      ) : (
        <EmptyState
          icon="book"
          title="This story is not available"
          description="It may have been removed from the collection. Go back to your feed and choose another article."
          action={
            <button className="button button-outline" onClick={() => navigate("for-you")}>
              Return to the feed
            </button>
          }
        />
      )}
      {related.length > 0 && (
        <section className="related-section">
          <div className="section-heading">
            <div>
              <span className="section-overline">KEEP EXPLORING</span>
              <h2>More in this topic</h2>
            </div>
          </div>
          <div className="article-list">
            {related.slice(0, 3).map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
                bookmarked={bookmarkedIds.has(article.id)}
                onOpen={() => openArticle(article)}
                onBookmark={(event) => void toggleBookmark(event, article)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );

  const dashboardView = (
    <section className="dashboard-view">
      {loadingDashboard ? (
        <div className="dashboard-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="stat-skeleton" key={index}>
              <span className="skeleton-line skeleton-short" />
              <span className="skeleton-line skeleton-title" />
            </div>
          ))}
        </div>
      ) : dashboard ? (
        <>
          <div className="dashboard-welcome">
            <span className="welcome-icon">
              <Icon name="chart" size={20} />
            </span>
            <div>
              <span className="section-overline">YOUR NEWSDC SNAPSHOT</span>
              <h2>Stay close to what’s changing.</h2>
              <p>Every story, topic and signal from your data-center briefing.</p>
            </div>
          </div>
          <div className="dashboard-grid">
            <div className="stat-card stat-card-primary">
              <span>Articles collected</span>
              <strong>{dashboard.total_articles.toLocaleString()}</strong>
              <small>Across every configured source</small>
            </div>
            <div className="stat-card">
              <span>New this week</span>
              <strong>{dashboard.articles_last_7_days.toLocaleString()}</strong>
              <small>Published in the last seven days</small>
            </div>
            <div className="stat-card">
              <span>Your saved reads</span>
              <strong>{bookmarkedIds.size.toLocaleString()}</strong>
              <small>Stories in your private reading list</small>
            </div>
            <div className="stat-card">
              <span>Topics to explore</span>
              <strong>{topics.length.toLocaleString()}</strong>
              <small>Curated data-center categories</small>
            </div>
          </div>
          <div className="dashboard-columns">
            <div className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="section-overline">THE LANDSCAPE</span>
                  <h3>Stories by topic</h3>
                </div>
                <Icon name="layers" size={19} />
              </div>
              {topics.length > 0 && Object.keys(dashboard.category_counts).length > 0 ? (
                <div className="category-bars">
                  {topics
                    .map((topic) => ({
                      ...topic,
                      count: dashboard.category_counts[topic.name] ?? 0,
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 9)
                    .map((topic) => (
                      <button
                        key={topic.slug}
                        className="category-bar-row"
                        onClick={() => selectCategory(topic)}
                      >
                        <span className="category-bar-label">{topic.name}</span>
                        <span className="category-bar-track">
                          <span
                            className="category-bar-fill"
                            style={{
                              width: `${Math.max(3, (topic.count / Math.max(1, dashboard.total_articles)) * 100)}%`,
                            }}
                          />
                        </span>
                        <span className="category-bar-count">{topic.count}</span>
                      </button>
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon="grid"
                  title="Your landscape is taking shape"
                  description="As articles are collected, they will appear here by topic."
                />
              )}
            </div>
            <div className="dashboard-panel content-type-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="section-overline">SIGNAL MIX</span>
                  <h3>Content at a glance</h3>
                </div>
                <Icon name="sparkles" size={19} />
              </div>
              {Object.entries(CONTENT_TYPE_LABELS).map(([type, label], index) => (
                <button
                  className="content-type-row"
                  key={type}
                  onClick={() => {
                    setContentType(type as ContentType);
                    setView("for-you");
                    setPageOffset(0);
                  }}
                >
                  <span className={`type-bullet type-bullet-${index}`} />
                  <span>{label}</span>
                  <strong>{dashboard.content_type_counts[type] ?? 0}</strong>
                </button>
              ))}
            </div>
          </div>
          {!dashboard.ai_enabled && (
            <div className="api-notice">
              <Icon name="sparkles" size={16} />
              <span>
                Add an OpenAI-compatible provider on the server for AI summaries,
                trend analysis and research answers.
              </span>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="server"
          title="Your dashboard could not connect"
          description={dashboardError || "Check that the NewsDC backend is running and try again."}
          action={
            <button
              className="button button-outline"
              onClick={() => {
                setDashboardStatus("loading");
                setDashboardError("");
                setDashboardRefresh((current) => current + 1);
              }}
            >
              Retry
            </button>
          }
        />
      )}
    </section>
  );

  const topicsView = (
    <section className="topics-view">
      <div className="topics-intro">
        <span className="section-overline">A WHOLE INDUSTRY, IN FOCUS</span>
        <h2>Follow the ideas shaping tomorrow’s data centers.</h2>
        <p>
          Explore the systems, investments and innovations reshaping the world’s
          digital infrastructure.
        </p>
      </div>
      <div className="topic-groups">
        {CATEGORY_GROUPS.map((group, groupIndex) => (
          <section className="topic-group" key={group.label}>
            <div className="topic-group-heading">
              <span className={`topic-group-symbol topic-group-symbol-${groupIndex}`}>
                <Icon
                  name={groupIndex === 0 ? "server" : groupIndex === 1 ? "briefcase" : "leaf"}
                  size={18}
                />
              </span>
              <div>
                <span className="section-overline">0{groupIndex + 1} / FIELD NOTES</span>
                <h3>{group.label}</h3>
              </div>
            </div>
            <div className="topic-card-grid">
              {group.topics.map((topicName, topicIndex) => {
                const topic = topics.find((item) => item.name === topicName) ?? {
                  name: topicName,
                  slug: topicName.toLowerCase().replaceAll(" ", "-"),
                  count: 0,
                };
                return (
                  <button
                    className="topic-card"
                    key={topicName}
                    onClick={() => selectCategory(topic)}
                    style={{ animationDelay: `${topicIndex * 35}ms` }}
                  >
                    <span className="topic-card-top">
                      <span className="topic-marker">{String(topicIndex + 1).padStart(2, "0")}</span>
                      <span className="topic-story-count">{topic.count} stories</span>
                    </span>
                    <strong>{topic.name}</strong>
                    <span className="topic-card-link">
                      Explore topic <Icon name="arrow-right" size={15} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );

  const trendsPanel = (
    <section className="side-panel trends-panel">
      <div className="side-panel-heading">
        <div className="heading-with-icon">
          <span className="panel-icon panel-icon-peach">
            <Icon name="trending" size={16} />
          </span>
          <div>
            <h3>Emerging signals</h3>
            <span className="panel-kicker">AI SCAN · RECENT COVERAGE</span>
          </div>
        </div>
        <button
          className="icon-button"
          onClick={() => {
            setTrendStatus("loading");
            void loadTrends();
          }}
          aria-label="Refresh emerging signals"
          title="Refresh emerging signals"
        >
          <Icon name="refresh" size={16} />
        </button>
      </div>
      {loadingTrends ? (
        <div className="trend-loading">
          <span />
          <span />
          <span />
        </div>
      ) : trendError ? (
        <div className="trend-empty">
          <span className="trend-empty-icon">
            <Icon name="sparkles" size={16} />
          </span>
          <p>{trendError}</p>
        </div>
      ) : trends.length === 0 ? (
        <div className="trend-empty">
          <span className="trend-empty-icon">
            <Icon name="trending" size={16} />
          </span>
          <p>With a few more articles, new cross-topic signals will surface here.</p>
        </div>
      ) : (
        <div className="trend-list">
          {trends.slice(0, 3).map((trend, index) => (
            <article className="trend-item" key={`${trend.topic}-${index}`}>
              <span className="trend-index">0{index + 1}</span>
              <div>
                <h4>{trend.topic}</h4>
                <p>{trend.observation}</p>
                <div className="trend-sources">
                  {trend.sources.slice(0, 2).map((source) => (
                    <a
                      key={source.article_id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      title={source.title}
                      aria-label={`Read source: ${source.title}`}
                    >
                      <Icon name="external" size={12} />
                    </a>
                  ))}
                  <span>
                    {trend.sources.length} cited source{trend.sources.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const assistantPanel = (
    <section className={`assistant-panel ${assistantOpen ? "assistant-expanded" : ""}`}>
      <div className="assistant-intro">
        <span className="assistant-orbit">
          <span className="assistant-orbit-core">
            <Icon name="sparkles" size={18} />
          </span>
        </span>
        <span className="assistant-eyebrow">YOUR RESEARCH PARTNER</span>
        <h3>Ask NewsDC anything.</h3>
        <p>Get answers grounded in industry coverage, with sources attached.</p>
      </div>
      {!assistantOpen ? (
        <button
          className="assistant-open-button"
          onClick={() => setAssistantOpen(true)}
        >
          Ask a question <Icon name="arrow-right" size={15} />
        </button>
      ) : (
        <form className="assistant-form" onSubmit={(event) => void askQuestion(event)}>
          <label className="sr-only" htmlFor="assistant-question">
            Ask a data-center research question
          </label>
          <textarea
            id="assistant-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What are the latest developments in liquid cooling?"
            maxLength={1000}
            rows={3}
          />
          {assistantError && <p className="form-error">{assistantError}</p>}
          <div className="assistant-form-footer">
            <span>{question.length}/1000</span>
            <button
              className="assistant-send-button"
              type="submit"
              disabled={asking || question.trim().length < 4}
            >
              {asking ? "Researching…" : "Ask"}
              <Icon name="send" size={14} />
            </button>
          </div>
        </form>
      )}
      {answer && (
        <div className="assistant-answer">
          <span className="answer-label">
            <Icon name="sparkles" size={14} /> RESEARCH BRIEF
          </span>
          <p>{answer.text}</p>
          {answer.sources.length > 0 && (
            <div className="answer-sources">
              <strong>Sources</strong>
              {answer.sources.map((source) => (
                <a
                  key={source.article_id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title} <Icon name="external" size={13} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="assistant-trust">
        <span className="trust-dot" /> Answers cite articles in your collection
      </div>
    </section>
  );

  return (
    <div className={`app-shell ${mobileNavOpen ? "mobile-nav-visible" : ""}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <button
          className="brand-lockup"
          onClick={() => navigate("for-you")}
          aria-label="NewsDC home"
        >
          <span className="brand-icon">
            <Icon name="server" size={19} />
            <span className="brand-signal" />
          </span>
          <span className="brand-wordmark">news<span>dc</span></span>
          <span className="brand-version">BETA</span>
        </button>
        <div className="sidebar-scroll">
          <nav className="primary-nav">{nav}</nav>
          <div className="sidebar-ai-card">
            <span className="sidebar-ai-stars">
              <Icon name="sparkles" size={16} />
            </span>
            <strong>Think beyond the feed.</strong>
            <p>Ask a research question and find answers in the coverage.</p>
            <button
              onClick={() => {
                setAssistantOpen(true);
                setMobileNavOpen(false);
              }}
            >
              Meet your AI assistant <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </div>
        <div className="sidebar-footer">
          <button
            className="nav-link settings-link"
            onClick={() => {
              setDraftCategories(preferences.categories);
              setPreferencesOpen(true);
            }}
          >
            <Icon name="settings" />
            <span>Your interests</span>
          </button>
          <div className="profile-card">
            <span className="profile-avatar">N</span>
            <span className="profile-copy">
              <strong>Independent reader</strong>
              <small>Private · no account needed</small>
            </span>
            <span className="online-indicator" />
          </div>
          <div className="sidebar-copyright">NEWS & RESEARCH FOR THE DIGITAL AGE</div>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button icon-button"
              onClick={() => setMobileNavOpen((current) => !current)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              <Icon name={mobileNavOpen ? "close" : "menu"} />
            </button>
            <span className="topbar-breadcrumb">
              <span className="breadcrumb-home">NewsDC</span>
              <Icon name="arrow-right" size={13} />
              <strong>{view === "article" ? "Article" : view === "category" ? "Topics" : "Discover"}</strong>
            </span>
          </div>
          <form className="global-search" onSubmit={submitSearch} role="search">
            <Icon name="search" size={17} />
            <input
              ref={searchRef}
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search industry news, ideas…"
              aria-label="Search data-center stories"
              maxLength={200}
            />
            <kbd>/</kbd>
          </form>
          <div className="topbar-actions">
            <button
              className="theme-toggle icon-button"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
            </button>
            <span className="header-divider" />
            <button
              className="header-profile"
              onClick={() => {
                setDraftCategories(preferences.categories);
                setPreferencesOpen(true);
              }}
              aria-label="Manage your topic interests"
              title="Manage topic interests"
            >
              N
            </button>
          </div>
        </header>

        <div className="page-layout">
          <section className="content-column">
            <div className="page-heading">
              <div className="page-title-block">
                <span className="page-date">
                  <span className="live-dot" /> FIELD NOTES
                  <span className="date-divider" />
                  {todayLabel || "YOUR DAILY BRIEFING"}
                </span>
                <h1>{title}<span className="title-period">.</span></h1>
                <p>
                  {view === "for-you"
                    ? favoriteTopics.length > 0
                      ? "A considered briefing, shaped around what matters to you."
                      : "A considered briefing on the infrastructure powering our world."
                    : view === "trending"
                      ? "The stories and discussions with the strongest signal."
                      : view === "topics"
                        ? "Follow the technologies and ideas moving the industry forward."
                        : view === "bookmarks"
                          ? "Good reads, kept close for whenever you need them."
                          : view === "dashboard"
                            ? "Your personal window into the data-center landscape."
                            : view === "search"
                              ? `Results for “${activeQuery}”`
                              : view === "category"
                                ? `${category?.count ?? 0} collected stories and signals.`
                                : "A concise, source-backed briefing from across the industry."}
                </p>
              </div>
              {view !== "article" && view !== "dashboard" && view !== "topics" && (
                <div className="header-story-count">
                  <span className="story-count-value">{total.toLocaleString()}</span>
                  <span>{total === 1 ? "STORY" : "STORIES"}</span>
                </div>
              )}
            </div>

            {isFeedView && view !== "search" && view !== "bookmarks" && (
              <div className="feed-toolbar">
                <div className="feed-tabs" role="tablist" aria-label="Feed order">
                  {view !== "category" && (
                    <>
                      <button
                        className={`feed-tab ${view === "for-you" ? "selected" : ""}`}
                        onClick={() => navigate("for-you")}
                      >
                        <Icon name="sparkles" size={15} />
                        For you
                      </button>
                      <button
                        className={`feed-tab ${view === "trending" ? "selected" : ""}`}
                        onClick={() => navigate("trending")}
                      >
                        <Icon name="trending" size={15} />
                        Trending
                      </button>
                    </>
                  )}
                  {view === "category" && (
                    <button className="feed-tab selected" onClick={() => setPageOffset(0)}>
                      <Icon name="layers" size={15} />
                      {category?.name}
                    </button>
                  )}
                </div>
                <label className="filter-select">
                  <Icon name="filter" size={15} />
                  <span className="sr-only">Filter by content type</span>
                  <select
                    aria-label="Filter by content type"
                    value={contentType}
                    onChange={(event) => {
                      setContentType(event.target.value as ContentType | "");
                      setPageOffset(0);
                    }}
                  >
                    <option value="">All signals</option>
                    {Object.entries(CONTENT_TYPE_LABELS).map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {view === "article"
              ? articleDetail
              : view === "dashboard"
                ? dashboardView
                : view === "topics"
                  ? topicsView
                  : renderedFeed}

            <footer className="content-footer">
              <span>Independent insight for the infrastructure age.</span>
              <span>Built for the curious <span className="footer-spark">✳</span></span>
            </footer>
          </section>

          <aside className="insight-rail" aria-label="Industry insights">
            <div className="rail-date">
              <span className="rail-date-icon">
                <Icon name="globe" size={16} />
              </span>
              <span>
                <strong>THE INFRASTRUCTURE BRIEF</strong>
                <small>Signals behind the digital world</small>
              </span>
            </div>

            <div className="rail-stat-card">
              <div className="rail-stat-top">
                <span>Industry pulse</span>
                <span className="pulse-badge">
                  <span /> LIVE
                </span>
              </div>
              <strong>{total.toLocaleString()}</strong>
              <p>signals in your current briefing</p>
              <div className="pulse-rule">
                <span />
              </div>
              <div className="pulse-foot">
                <span><Icon name="zap" size={13} /> Curated for relevance</span>
                <span>NewsDC</span>
              </div>
            </div>

            {trendsPanel}

            <section className="right-rail-prompt">
              <span className="prompt-mark">
                <Icon name="leaf" size={16} />
              </span>
              <div>
                <span className="section-overline">THE BIGGER PICTURE</span>
                <p>
                  The world runs on infrastructure most people never see. We help
                  you see what’s next.
                </p>
              </div>
            </section>

            {assistantPanel}

            <div className="rail-footer">
              <span>Curiosity, with context.</span>
              <span>NewsDC © 2026</span>
            </div>
          </aside>
        </div>
      </main>

      {preferencesOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreferencesOpen(false);
          }}
        >
          <section
            className="preferences-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preferences-title"
          >
            <div className="modal-heading">
              <span className="modal-icon"><Icon name="sparkles" size={18} /></span>
              <button
                className="icon-button modal-close"
                onClick={() => setPreferencesOpen(false)}
                aria-label="Close interests"
              >
                <Icon name="close" />
              </button>
            </div>
            <span className="section-overline">YOUR PRIVATE BRIEFING</span>
            <h2 id="preferences-title">What are you curious about?</h2>
            <p className="modal-description">
              Choose the areas you care about. We’ll use them to shape your For You
              feed, right here in your browser profile.
            </p>
            <form onSubmit={(event) => void saveInterests(event)}>
              <div className="preference-groups">
                {CATEGORY_GROUPS.map((group) => (
                  <fieldset key={group.label} className="preference-group">
                    <legend>{group.label}</legend>
                    <div className="preference-options">
                      {group.topics.map((name) => {
                        const selected = draftCategories.includes(name);
                        return (
                          <button
                            className={`preference-pill ${selected ? "selected" : ""}`}
                            type="button"
                            key={name}
                            aria-pressed={selected}
                            onClick={() => toggleInterest(name)}
                          >
                            {selected ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
              <div className="modal-footer">
                <span>{draftCategories.length} interests selected</span>
                <button className="button button-primary" type="submit" disabled={savingPreferences}>
                  {savingPreferences ? "Saving…" : "Save my interests"}
                  {!savingPreferences && <Icon name="arrow-right" size={15} />}
                </button>
              </div>
            </form>
            <p className="privacy-note">
              <Icon name="check" size={13} /> No account. Your reading history stays private.
            </p>
          </section>
        </div>
      )}

      {toast && (
        <div className="toast-message" role="status">
          <span className="toast-check"><Icon name="check" size={14} /></span>
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="Dismiss notification">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
