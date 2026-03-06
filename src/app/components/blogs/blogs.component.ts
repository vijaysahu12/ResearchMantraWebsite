import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';

@Component({
    selector: 'app-blogs',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './blogs.component.html',
    styleUrl: './blogs.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogsComponent implements OnInit {

    private blogService = inject(BlogService);
    private router = inject(Router);

    // signal from service
    blogs = this.blogService.getBlogs();

    searchQuery = signal<string>('');
    isSearching = signal<boolean>(false);
    private searchTimeout: any;

    ngOnInit() {
        // 🔥 call API
        this.blogService.loadBlogs();
    }

filteredBlogs = computed(() => {

    const query = this.searchQuery().toLowerCase().trim();
    const blogs = this.blogs();   // ✅ read signal value

    if (!query) return blogs;

    return blogs.filter(blog =>
        blog.title?.toLowerCase().includes(query) ||
        blog.slug?.toLowerCase().includes(query)
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

     navigateToBlog(id: any) {
    this.router.navigate(['/blog', id]); // open details page
  }

}
