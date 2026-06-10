import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { LeadService } from '../../services/lead.service';
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
  private leadService = inject(LeadService);

  public activeCommentBlogId: string | number | null = null;

  blogs = this.blogService.getBlogs();

  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);
  private searchTimeout: any;

  imageIndexes: { [key: string]: number } = {};
  userId: any = '00000000-0000-0000-0000-000000000000';

  // Category tabs
  readonly categories = ['ALL', 'Nifty', 'Options', 'F&O', 'Stocks', 'Investment', 'Portfolio', 'Market', 'Sector', 'Levels', 'Education', 'Others'];
  selectedCategory = signal<string>('ALL');

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
  }

  filteredBlogs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    let blogs = this.blogs();

    if (category && category !== 'ALL') {
      blogs = blogs.filter(
        (b) => b.category?.toLowerCase() === category.toLowerCase(),
      );
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
      },
    });
  }
}
