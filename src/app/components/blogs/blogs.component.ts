import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';

@Component({
    selector: 'app-blogs',
    imports: [CommonModule, RouterLink],
    templateUrl: './blogs.component.html',
    styleUrl: './blogs.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogsComponent {
    private blogService = inject(BlogService);
    private router = inject(Router);
    blogs = this.blogService.getBlogs();

    constructor() {
        console.log('BlogsComponent initialized');
    }

    navigateToBlog(slug: string) {
        console.log('Navigating to blog:', slug);
        this.router.navigate(['/', slug]);
    }
}
