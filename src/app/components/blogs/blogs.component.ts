import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
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
export class BlogsComponent {
    private blogService = inject(BlogService);
    private router = inject(Router);

    blogs = this.blogService.getBlogs();
    searchQuery = signal<string>('');
    isSearching = signal<boolean>(false);
    private searchTimeout: any;

    filteredBlogs = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        if (!query) return this.blogs();

        return this.blogs().filter(blog =>
            blog.title.toLowerCase().includes(query) ||
            blog.excerpt.toLowerCase().includes(query) ||
            blog.category.toLowerCase().includes(query) ||
            blog.keywords?.toLowerCase().includes(query)
        );
    });

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value;

        // Clear existing timeout to debounce
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Only show loader and update if there's a significant change or pause
        this.searchTimeout = setTimeout(() => {
            this.isSearching.set(true);

            // Short delay to show the "Search" actually happening
            setTimeout(() => {
                this.searchQuery.set(value);
                this.isSearching.set(false);
            }, 300);
        }, 400); // 400ms debounce
    }

    clearSearch() {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.isSearching.set(true);
        setTimeout(() => {
            this.searchQuery.set('');
            this.isSearching.set(false);
        }, 300);
    }

    navigateToBlog(slug: string) {
        this.router.navigate(['/', slug]);
    }
}
