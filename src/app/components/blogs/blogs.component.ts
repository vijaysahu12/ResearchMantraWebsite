import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { LeadService } from '../../services/lead.service';
import { BlogLikeService } from '../../services/blog-like.service';
import { LeadCaptureModalComponent } from '../lead-capture-modal/lead-capture-modal.component';
import { ShareModalComponent } from '../share-modal/share-modal.component';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, LeadCaptureModalComponent, ShareModalComponent],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogsComponent implements OnInit {
  private blogService = inject(BlogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private leadService = inject(LeadService);
  private likeService = inject(BlogLikeService);

  public activeCommentBlogId: string | number | null = null;

  blogs = this.blogService.getBlogs();

  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);
  private searchTimeout: any;

  imageIndexes: { [key: string]: number } = {};
  /** Stable per-visitor id, so one reader's like cannot cancel another's. */
  get userId() { return this.likeService.userId; }

  // Category tabs
  readonly categories = ['ALL', 'Nifty', 'Options', 'F&O', 'Stocks', 'Investment', 'Portfolio', 'Market', 'Sector', 'Levels', 'Education', 'Others'];
  selectedCategory = signal<string>('ALL');

  // Date filter state
  activeDateParam = signal<string>('');
  activeDateLabel = signal<string>('');
  dateBlogs = signal<any[]>([]);
  isLoadingDate = signal<boolean>(false);

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

  ngOnInit() {
    this.blogService.getBlogs();

    this.route.queryParams.subscribe(params => {
      const date = params['date'] ?? '';
      this.activeDateParam.set(date);
      if (date) {
        this.activeDateLabel.set(this.formatDateLabel(date));
        this.loadBlogsByDate(date);
      } else {
        this.dateBlogs.set([]);
        this.isLoadingDate.set(false);
      }
    });
  }

  private formatDateLabel(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const year = parseInt(parts[0], 10);
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }

  /**
   * Posts for the date picked in an article's calendar. This is the blogs
   * section, so it lists the blog posts only — the admin-published market
   * analysis posts have their own dated listing on
   * /stock-market-analysis-and-nifty-updates. They resolve synchronously, so
   * the view is populated during SSR and without the API.
   */
  private loadBlogsByDate(date: string) {
    const parts = date.split('-');
    const blogs = parts.length === 3
      ? this.blogService.getBlogsOnDate(+parts[0], +parts[1], +parts[2])
      : [];
    this.dateBlogs.set(blogs);
    this.isLoadingDate.set(false);
  }

  clearDateFilter() {
    this.router.navigate(['/blogs']);
  }

  filteredBlogs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    let blogs = this.blogs();

    if (category && category !== 'ALL') {
      if (category === 'Others') {
        // Anything whose category matches none of the named chips lands here, so
        // no post is unreachable through the filters.
        const known = this.categories
          .filter((c) => c !== 'ALL' && c !== 'Others')
          .map((c) => c.toLowerCase());
        blogs = blogs.filter((blog) => {
          const cat = blog.category?.toLowerCase() ?? '';
          return !known.some((keyword) => cat.includes(keyword));
        });
      } else {
        // Partial match, because `category` is a comma-separated list
        // ("Investing, Stocks") that getCategories() splits for the badges.
        const keyword = category.toLowerCase();
        blogs = blogs.filter((blog) => blog.category?.toLowerCase().includes(keyword));
      }
    }

    if (!query) return blogs;

    return blogs.filter(
      (blog) =>
        blog.title?.toLowerCase().includes(query) || blog.slug?.toLowerCase().includes(query),
    );
  });

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.isSearching.set(true);
      setTimeout(() => {
        this.searchQuery.set(value);
        this.isSearching.set(false);
      }, 300);
    }, 400);
  }

  clearSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.isSearching.set(true);
    setTimeout(() => {
      this.searchQuery.set('');
      // Reset the chip too: clearing from an empty result should return the full
      // list, not leave the user stuck on the filter that produced no matches.
      this.selectedCategory.set('ALL');
      this.isSearching.set(false);
    }, 300);
  }

  getCurrentImage(blog: any) {
    if (!blog.images || blog.images.length === 0) return blog.image;
    const index = this.imageIndexes[blog.id] || 0;
    return blog.images[index]?.url;
  }

  nextImage(blog: any, event: Event) {
    event.stopPropagation();
    const total = blog.images.length;
    const current = this.imageIndexes[blog.id] || 0;
    this.imageIndexes = { ...this.imageIndexes, [blog.id]: (current + 1) % total };
  }

  prevImage(blog: any, event: Event) {
    event.stopPropagation();
    const total = blog.images.length;
    const current = this.imageIndexes[blog.id] || 0;
    this.imageIndexes = { ...this.imageIndexes, [blog.id]: (current - 1 + total) % total };
  }

  onCardClick(slug: string, event: Event) {
    event.preventDefault();
    if (this.leadService.hasLeadData()) {
      this.router.navigate(['/', slug]);
    } else {
      this.pendingSlug.set(slug);
      this.showLeadModal.set(true);
    }
  }

  onLeadSubmitted(data: { name: string; mobile: string }) {
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

  toggleComments(blog: any, event: Event) {
    event.stopPropagation();
    if (this.activeCommentBlogId === blog.id) {
      this.activeCommentBlogId = null;
    } else {
      this.activeCommentBlogId = blog.id;
      if (!blog.comments || blog.comments.length === 0) {
        this.loadCommentsForBlog(blog);
      }
    }
  }

  loadCommentsForBlog(blog: any) {
    this.blogService.getComments(blog.id).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          const updatedBlogs = this.blogs().map((b) =>
            b.id === blog.id ? { ...b, comments: res.data } : b,
          );
          this.blogs.set(updatedBlogs);
        }
      },
      error: (err) => console.error('Could not load comments', err),
    });
  }

  submitComment(blog: any, text: string) {
    if (!text.trim()) return;
    const request = {
      blogId: blog.id,
      comment: text,
      parentCommentId: null,
    };
    this.blogService.addComment(request).subscribe((res: any) => {
      if (res.statusCode === 200) {
        blog.comments.unshift(res.data);
        blog.commentsCount++;
      }
    });
  }

  toggleLike(blog: any, event: Event) {
    event.stopPropagation();
    this.blogService.toggleLike(blog.id, this.userId).subscribe({
      next: (res) => {
        blog.isLiked = res.data.isLiked;
        blog.likesCount = res.data.totalLikes;
        this.likeService.remember(blog.id, res.data.isLiked);
      },
    });
  }
}
