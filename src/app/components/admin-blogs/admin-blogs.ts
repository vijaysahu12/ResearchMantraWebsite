import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
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
  // Define state variable
public activeCommentBlogId: string | number | null = null;

  // signal from service
  blogs = this.blogService.getBlogs();

  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);
  private searchTimeout: any;

  // 🟢 Track current image index per blog
  imageIndexes: { [key: string]: number } = {};
  userId: any = '00000000-0000-0000-0000-000000000000'; // Replace with actual user ID logic

  constructor(
    private adminBlogService: AdminBlogService,
  ) {}

  ngOnInit() {
   if (!this.blogs() || this.blogs().length === 0) {
    this.blogService.loadBlogs();
  }
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

  // 🟢 Get current image for blog
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

    this.imageIndexes = {
      ...this.imageIndexes,
      [blog.id]: next,
    };
  }

  prevImage(blog: any, event: Event) {
    event.stopPropagation();

    const total = blog.images.length;
    const current = this.imageIndexes[blog.id] || 0;

    const prev = (current - 1 + total) % total;

    this.imageIndexes = {
      ...this.imageIndexes,
      [blog.id]: prev,
    };
  }
  navigateToBlog(slug: string) {
    this.router.navigate(['/admin/blog-details', slug]);
  }

toggleComments(blog: any, event: Event) {
  event.stopPropagation(); // Stop routerLink from firing

  if (this.activeCommentBlogId === blog.id) {
    this.activeCommentBlogId = null;
  } else {
    this.activeCommentBlogId = blog.id;
    // Only fetch if comments aren't already loaded
    if (!blog.comments || blog.comments.length === 0) {
      this.loadCommentsForBlog(blog);
    }
  }
}
loadCommentsForBlog(blog: any) {
  this.blogService.getComments(blog.id).subscribe({
    next: (res: any) => {
      if (res.statusCode === 200) {

        const updatedBlogs = this.blogs().map(b =>
          b.id === blog.id ? { ...b, comments: res.data } : b
        );

        this.blogs.set(updatedBlogs);
      }
    },
    error: (err) => {
      console.error("Could not load comments", err);
    }
  });
}

  submitComment(blog: any, text: string) {
    if (!text.trim()) return;

    const request = {
      blogId: blog.id,
      comment: text,
      parentCommentId: null,
    };

    // The backend API takes Guid userId.
    // If "known by IP", you might pass a specific 'Guest' Guid
    // or let the backend extract IP from HttpContext.
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
    }
  });
}
}
