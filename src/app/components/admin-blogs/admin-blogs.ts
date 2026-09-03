import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AdminBlogService } from '../../services/admin-blog.service';
import { BlogService } from '../../services/blog.service';
import { LeadService } from '../../services/lead.service';
import { BlogLikeService } from '../../services/blog-like.service';
import { LeadCaptureModalComponent } from '../lead-capture-modal/lead-capture-modal.component';
import { ShareModalComponent } from '../share-modal/share-modal.component';
import { SeoService } from '../../services/seo.service';
import { EnquiryStateService } from '../../services/enquiry-state.service';

@Component({
  selector: 'app-admin-blogs',
  standalone: true,
  imports: [CommonModule, RouterLink, LeadCaptureModalComponent, ShareModalComponent],
  templateUrl: './admin-blogs.html',
  styleUrl: './admin-blogs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBlogs implements OnInit {
  private blogService = inject(AdminBlogService);
  private staticBlogService = inject(BlogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private leadService = inject(LeadService);
  private likeService = inject(BlogLikeService);
  private seoService = inject(SeoService);
  private enquiryState = inject(EnquiryStateService);
  private platformId = inject(PLATFORM_ID);
  private get isBrowser() { return isPlatformBrowser(this.platformId); }

  /** Brief skeleton while a search or category change re-filters the list. */
  private isFiltering = signal<boolean>(false);

  /**
   * Drives the grid's skeleton off the request itself, so it stays up until the
   * blogs actually arrive. This used to start `false` and be cleared by an
   * effect watching the blogs signal — which fires on the empty array the
   * request starts with, so "No insights found" flashed for the whole fetch.
   */
  isLoadingInitial = computed(() => this.blogService.blogsLoading() || this.isFiltering());

  public activeCommentBlogId: string | number | null = null;

  blogs = this.blogService.getBlogs();

  searchQuery = signal<string>('');
  // isSearching = signal<boolean>(false);
  private searchTimeout: any;

  // 🟢 Track current image index per blog
  imageIndexes: { [key: string]: number } = {};
  /** Stable per-visitor id, so one reader's like cannot cancel another's. */
  get userId() { return this.likeService.userId; }

  // Category tabs
  readonly categories = ['ALL', 'Nifty', 'Options', 'F&O', 'Stocks', 'Investment', 'Portfolio', 'Market', 'Sector', 'Levels', 'Education', 'Others'];
  selectedCategory = signal<string>('ALL');

  // ── Date-filter view ──────────────────────────────────────
  activeDateParam  = signal<string>('');
  activeDateLabel  = signal<string>('');
  dateBlogs        = signal<any[]>([]);
  isLoadingDate    = signal<boolean>(false);

  private readonly monthNames = ['January','February','March','April','May','June',
                                 'July','August','September','October','November','December'];

  clearDateFilter() {
    this.router.navigate(['/stock-market-analysis-and-nifty-updates']);
  }

  /** Built-in posts published on an ISO yyyy-MM-dd date. */
  private localBlogsOn(date: string): any[] {
    const parts = date.split('-');
    if (parts.length !== 3) return [];
    return this.staticBlogService.getBlogsOnDate(+parts[0], +parts[1], +parts[2]);
  }

  private loadBlogsByDate(date: string) {
    // Built-in posts resolve synchronously, so the date view is populated during
    // SSR and stays correct when the API is unreachable.
    const local = this.localBlogsOn(date);
    this.dateBlogs.set(local);
    if (!this.isBrowser) return;

    this.isLoadingDate.set(true);
    this.blogService.getBlogsByDate(date).subscribe({
      next: (res: any) => {
        const apiBlogs: any[] = this.likeService.applyRemembered(res?.data ?? []);
        const seen = new Set(local.map(b => b.slug));
        this.dateBlogs.set([...local, ...apiBlogs.filter(b => !seen.has(b?.slug))]);
        this.isLoadingDate.set(false);
      },
      error: () => {
        this.dateBlogs.set(local);
        this.isLoadingDate.set(false);
      }
    });
  }

  private parseDateLabel(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${this.monthNames[+parts[1] - 1]} ${+parts[2]}, ${parts[0]}`;
  }
  // ─────────────────────────────────────────────────────────

  getCategories(category: string): string[] {
    if (!category) return [];
    return category.split(',').map(c => c.trim()).filter(c => c.length > 0);
  }

  onCategorySelect(category: string) {
    if (this.selectedCategory() === category) return;
    this.selectedCategory.set(category);
    this.searchQuery.set('');
  }

  // Lead capture modal
  showLeadModal = signal(false);
  private pendingSlug = signal<string | null>(null);

  // Share modal
  shareModalBlog = signal<{ url: string; title: string } | null>(null);

  openShare(blog: any, event: Event) {
    event.stopPropagation();
    this.shareModalBlog.set({
      url: `https://researchmantra.in/${blog.slug}`,
      title: blog.title,
    });
  }

  closeShare() {
    this.shareModalBlog.set(null);
  }

  ngOnInit(): void {
    this.seoService.setMetaTags({
      title: 'Stock Market Analysis & Nifty Updates 2026 | Insights',
      description: 'Get the latest stock market analysis, nifty updates, support & resistance levels and trading strategies. Stay ahead with expert insights and smarter decisions.',
      keywords: 'stock market analysis, nifty analysis, nifty updates, nifty support resistance, trading strategies india, stock market tips, nifty outlook, intraday trading tips, stock market india',
    });
    this.seoService.updateCanonicalUrl('https://researchmantra.in/stock-market-analysis-and-nifty-updates');

    if (!this.isBrowser) return;

    // Handle ?date= query param (calendar date-filter view)
    this.route.queryParams.subscribe(params => {
      const date = params['date'] ?? '';
      this.activeDateParam.set(date);

      if (date) {
        this.activeDateLabel.set(this.parseDateLabel(date));
        this.loadBlogsByDate(date);
      } else {
        this.dateBlogs.set([]);
        this.refreshBlogs();
      }
    });
  }

  private refreshBlogs(): void {
    // Load all blogs without server-side category filter; filtering is done client-side
    this.blogService.loadBlogs(1, 100);
  }

  filteredBlogs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    let blogs = this.blogs();

    // Client-side category filter — partial case-insensitive match
    if (category && category !== 'ALL') {
      if (category === 'Others') {
        const knownKeywords = this.categories
          .filter(c => c !== 'ALL' && c !== 'Others')
          .map(c => c.toLowerCase());
        blogs = blogs.filter(blog => {
          const cat = blog.category?.toLowerCase() || '';
          return !knownKeywords.some(kw => cat.includes(kw));
        });
      } else {
        const keyword = category.toLowerCase();
        blogs = blogs.filter(blog =>
          blog.category?.toLowerCase().includes(keyword)
        );
      }
    }

    // Search filter
    if (query) {
      blogs = blogs.filter(blog =>
        blog.title?.toLowerCase().includes(query) || blog.slug?.toLowerCase().includes(query)
      );
    }

    return blogs;
  });


  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.isFiltering.set(true);
      setTimeout(() => {
        this.searchQuery.set(value);
        this.isFiltering.set(false);
      }, 300);
    }, 400);
  }

  clearSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    this.isFiltering.set(true);
    setTimeout(() => {
      this.searchQuery.set('');
      // Reset the chip too: clearing from an empty result should return the full
      // list, not leave the user stuck on the filter that produced no matches.
      this.selectedCategory.set('ALL');
      this.isFiltering.set(false);
    }, 300);
  }

  // Image navigation methods (unchanged)
  getCurrentImage(blog: any) {
    if (!blog.images || blog.images.length === 0) {
      return blog.image;
    }
    const index = this.imageIndexes[blog.id] || 0;
    return blog.images[index]?.url;
  }

  nextImage(blog: any, event: Event) {
    event.stopPropagation();
    const total = blog.images.length;
    const current = this.imageIndexes[blog.id] || 0;
    const next = (current + 1) % total;
    this.imageIndexes = { ...this.imageIndexes, [blog.id]: next };
  }

  prevImage(blog: any, event: Event) {
    event.stopPropagation();
    const total = blog.images.length;
    const current = this.imageIndexes[blog.id] || 0;
    const prev = (current - 1 + total) % total;
    this.imageIndexes = { ...this.imageIndexes, [blog.id]: prev };
  }

  navigateToBlog(slug: string) {
    if (this.leadService.hasLeadData()) {
      this.router.navigate(['/', slug]);
    } else {
      this.pendingSlug.set(slug);
      this.showLeadModal.set(true);
    }
  }

  onLeadSubmitted(_data: { name: string; mobile: string }) {
    this.showLeadModal.set(false);
    const slug = this.pendingSlug();
    if (slug) {
      this.pendingSlug.set(null);
      this.router.navigate(['/', slug]);
    }
  }

  onModalClosed() {
    this.showLeadModal.set(false);
    this.pendingSlug.set(null);
  }

  /**
   * Ids with a like request in flight. A signal rather than a plain Set because
   * the template reads it through isBlogSyncing() and this component is OnPush.
   */
  private readonly processingLikes = signal<ReadonlySet<string>>(new Set());

  private setLikeProcessing(id: string, processing: boolean): void {
    this.processingLikes.update((current) => {
      const next = new Set(current);
      if (processing) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  /**
   * Write a blog's like state back into the signal by replacing the object.
   * Mutating the existing object in place leaves the signal's reference
   * unchanged, so an OnPush template never re-renders and the heart/count appear
   * frozen even though the click was handled.
   */
  private patchLike(id: string, isLiked: boolean, likesCount: number): void {
    this.blogs.update((blogs) =>
      blogs.map((b) => (b.id === id ? { ...b, isLiked, likesCount: Math.max(0, likesCount) } : b)),
    );
  }

  private rememberLike(id: string, isLiked: boolean): void {
    this.likeService.remember(id, isLiked);
  }

  toggleLike(blog: any, event: Event) {
    event.stopPropagation();

    // Ignore repeat clicks while this blog's request is still in flight.
    if (this.processingLikes().has(blog.id)) return;
    this.setLikeProcessing(blog.id, true);

    // Optimistic update. `likesCount` is absent on some payloads, and
    // `undefined + 1` is NaN — which the template rendered as 0, so the count
    // appeared not to move at all.
    const wasLiked = !!blog.isLiked;
    const previousCount = Number(blog.likesCount) || 0;
    const optimisticCount = wasLiked ? Math.max(0, previousCount - 1) : previousCount + 1;

    this.patchLike(blog.id, !wasLiked, optimisticCount);
    this.rememberLike(blog.id, !wasLiked);

    this.blogService.toggleLike(blog.id, this.userId).subscribe({
      next: (res: any) => {
        // Trust the server's tally when it sends one; otherwise keep the
        // optimistic values rather than resetting the count to 0.
        const serverLiked = res?.data?.isLiked;
        const serverCount = res?.data?.totalLikes;
        const isLiked = typeof serverLiked === 'boolean' ? serverLiked : !wasLiked;
        const count = Number.isFinite(Number(serverCount)) && serverCount !== null
          ? Number(serverCount)
          : optimisticCount;

        this.patchLike(blog.id, isLiked, count);
        this.rememberLike(blog.id, isLiked);
        this.setLikeProcessing(blog.id, false);
      },
      error: () => {
        // Roll back to exactly what we captured before the click.
        this.patchLike(blog.id, wasLiked, previousCount);
        this.rememberLike(blog.id, wasLiked);
        this.setLikeProcessing(blog.id, false);
      },
    });
  }

  isBlogSyncing(id: string): boolean {
    return this.processingLikes().has(id);
  }

  openEnquiry() {
    this.router.navigate(['/']);
    this.enquiryState.open();
  }
}
