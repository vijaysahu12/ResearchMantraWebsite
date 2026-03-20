import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { AdminBlogService } from '../../services/admin-blog.service';

@Component({
  selector: 'app-admin-blogs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-blogs.html',
  styleUrl: './admin-blogs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBlogs implements OnInit {
  private blogService = inject(AdminBlogService);
  private router = inject(Router);

  // ✅ FIXED: Loader starts TRUE, becomes FALSE when data loads
  isLoadingInitial = signal<boolean>(false); // ← START WITH TRUE
  // pageLoading = signal<boolean>(true);

  // Define state variable
  public activeCommentBlogId: string | number | null = null;

  // signal from service
  blogs = this.blogService.getBlogs();

  searchQuery = signal<string>('');
  // isSearching = signal<boolean>(false);
  private searchTimeout: any;

  // 🟢 Track current image index per blog
  imageIndexes: { [key: string]: number } = {};
  userId: any = '00000000-0000-0000-0000-000000000000'; // Replace with actual user ID logic

  constructor(private adminBlogService: AdminBlogService) {
    // ✅ FIXED EFFECT: Hide loader when blogs load
    effect(
      () => {
        const blogs = this.blogs();

        console.log('Effect triggered. Blogs:', blogs);

        // Stop loader whenever blogs signal updates
        if (blogs !== undefined && blogs !== null) {
          this.isLoadingInitial.set(false);
          console.log('🟢 Loader hidden');
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    console.log('🟢 [Component] ngOnInit: Forcing fresh data fetch.');
    this.isLoadingInitial.set(true);
    this.refreshBlogs();
  }

  private refreshBlogs(): void {
    // We don't check if (blogs.length > 0) here anymore.
    // We ALWAYS call the service.
    console.log('🚀 [Action] Calling service.loadBlogs() now...');

    this.blogService.loadBlogs();

    // If you are using the 'effect' we previously set up,
    // it will detect when the Signal updates and set isLoadingInitial(false).
    // Otherwise, you can add a manual timeout for safety:
    /*
  setTimeout(() => {
     if (this.isLoadingInitial()) this.isLoadingInitial.set(false);
  }, 5000); // Safety fallback
  */
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

    // Sync UI optimistic state with local storage so detail page doesn't revert
    if (blog.isLiked) {
      localStorage.setItem(`blog_liked_${blog.id}`, 'true');
    } else {
      localStorage.removeItem(`blog_liked_${blog.id}`);
    }

    this.blogService.toggleLike(blog.id, this.userId).subscribe({
      next: (res: any) => {
        // 4. Update with server data
        const updatedBlogs = this.blogs().map((b) =>
          b.id === blog.id
            ? { ...b, isLiked: res.data.isLiked, likesCount: res.data.totalLikes }
            : b,
        );
        this.blogs.set(updatedBlogs);

        // Optional: Keep storage matched with final server source of truth
        if (res.data.isLiked) {
          localStorage.setItem(`blog_liked_${blog.id}`, 'true');
        } else {
          localStorage.removeItem(`blog_liked_${blog.id}`);
        }

        // 5. Release the lock
        this.processingLikes.delete(blog.id);
      },
      error: (err) => {
        // Revert on error and release lock
        blog.isLiked = wasLiked;
        blog.likesCount = blog.isLiked ? blog.likesCount + 1 : blog.likesCount - 1;
        
        // Revert local storage
        if (wasLiked) {
          localStorage.setItem(`blog_liked_${blog.id}`, 'true');
        } else {
          localStorage.removeItem(`blog_liked_${blog.id}`);
        }
        
        this.processingLikes.delete(blog.id);
      },
    });
  }

  // Add a helper for the HTML
  isBlogSyncing(id: string): boolean {
    return this.processingLikes.has(id);
  }
}
