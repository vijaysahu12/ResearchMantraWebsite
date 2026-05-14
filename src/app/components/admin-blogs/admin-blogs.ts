import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { AdminBlogService } from '../../services/admin-blog.service';
import { SeoService } from '../../services/seo.service';
import { EnquiryStateService } from '../../services/enquiry-state.service';

@Component({
  selector: 'app-admin-blogs',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-blogs.html',
  styleUrl: './admin-blogs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBlogs implements OnInit {
  private blogService = inject(AdminBlogService);
  private router = inject(Router);
  private seoService = inject(SeoService);
  private enquiryState = inject(EnquiryStateService);
  private platformId = inject(PLATFORM_ID);
  private get isBrowser() { return isPlatformBrowser(this.platformId); }

  isLoadingInitial = signal<boolean>(false);

  public activeCommentBlogId: string | number | null = null;

  blogs = this.blogService.getBlogs();

  searchQuery = signal<string>('');
  // isSearching = signal<boolean>(false);
  private searchTimeout: any;

  // 🟢 Track current image index per blog
  imageIndexes: { [key: string]: number } = {};
  userId: any = '00000000-0000-0000-0000-000000000000'; // Replace with actual user ID logic

  constructor(private adminBlogService: AdminBlogService) {
    // ✅ FIXED EFFECT: Hide loader when blogs load
    effect(() => {
      const blogs = this.blogs();
      if (blogs !== undefined && blogs !== null) {
        this.isLoadingInitial.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.seoService.setMetaTags({
      title: 'Stock Market Analysis & Nifty Updates 2026 | Insights',
      description: 'Get the latest stock market analysis, nifty updates, support & resistance levels and trading strategies. Stay ahead with expert insights and smarter decisions.',
      keywords: 'stock market analysis, nifty analysis, nifty updates, nifty support resistance, trading strategies india, stock market tips, nifty outlook, intraday trading tips, stock market india',
    });
    this.seoService.updateCanonicalUrl('https://researchmantra.in/stock-market-analysis-and-nifty-updates');

    if (!this.isBrowser) return;

    this.isLoadingInitial.set(true);
    this.refreshBlogs();
  }

  private refreshBlogs(): void {
    this.blogService.loadBlogs();
  }

  filteredBlogs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const blogs = this.blogs();

    if (!query) return blogs;

    return blogs.filter(
      (blog) =>
        blog.title?.toLowerCase().includes(query) || blog.slug?.toLowerCase().includes(query),
    );
  });


  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.isLoadingInitial.set(true);
      setTimeout(() => {
        this.searchQuery.set(value);
        this.isLoadingInitial.set(false);
      }, 300);
    }, 400);
  }

  clearSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    this.isLoadingInitial.set(true);
    setTimeout(() => {
      this.searchQuery.set('');
      this.isLoadingInitial.set(false);
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
    this.router.navigate(['/', slug]);
  }

  // Add a local tracking set
  private processingLikes = new Set<string>();

  toggleLike(blog: any, event: Event) {
    event.stopPropagation();

    // 1. If we are already waiting for a response for THIS blog, ignore new clicks
    if (this.processingLikes.has(blog.id)) {
      console.log('⏳ Still processing previous click, ignoring...');
      return;
    }

    // 2. Mark as processing
    this.processingLikes.add(blog.id);

    // 3. Optimistic Update
    const wasLiked = blog.isLiked;
    blog.isLiked = !blog.isLiked;
    blog.likesCount = blog.isLiked ? blog.likesCount + 1 : Math.max(0, blog.likesCount - 1);

    if (this.isBrowser) {
      if (blog.isLiked) {
        localStorage.setItem(`blog_liked_${blog.id}`, 'true');
      } else {
        localStorage.removeItem(`blog_liked_${blog.id}`);
      }
    }

    this.blogService.toggleLike(blog.id, this.userId).subscribe({
      next: (res: any) => {
        const updatedBlogs = this.blogs().map((b) =>
          b.id === blog.id
            ? { ...b, isLiked: res.data.isLiked, likesCount: res.data.totalLikes }
            : b,
        );
        this.blogs.set(updatedBlogs);

        if (this.isBrowser) {
          if (res.data.isLiked) {
            localStorage.setItem(`blog_liked_${blog.id}`, 'true');
          } else {
            localStorage.removeItem(`blog_liked_${blog.id}`);
          }
        }

        this.processingLikes.delete(blog.id);
      },
      error: (err) => {
        blog.isLiked = wasLiked;
        blog.likesCount = blog.isLiked ? blog.likesCount + 1 : blog.likesCount - 1;

        if (this.isBrowser) {
          if (wasLiked) {
            localStorage.setItem(`blog_liked_${blog.id}`, 'true');
          } else {
            localStorage.removeItem(`blog_liked_${blog.id}`);
          }
        }

        this.processingLikes.delete(blog.id);
      },
    });
  }

  isBlogSyncing(id: string): boolean {
    return this.processingLikes.has(id);
  }

  openEnquiry() {
    this.router.navigate(['/']);
    this.enquiryState.open();
  }
}
