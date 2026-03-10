import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService, BlogPost } from '../../services/blog.service';
import { SeoService } from '../../services/seo.service';
import { AdminBlogService } from '../../services/admin-blog.service';

@Component({
  selector: 'app-admin-blog-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-blog-details.html',
  styleUrl: './admin-blog-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBlogDetails implements OnInit {
    private route = inject(ActivatedRoute);
    private blogService = inject(AdminBlogService);
    private sanitizer = inject(DomSanitizer);
    private seoService = inject(SeoService);

    blog = signal<BlogPost | undefined>(undefined);
    sanitizedContent = computed(() => {
        const content = this.blog()?.content;
        return content ? this.sanitizer.bypassSecurityTrustHtml(content) : '';
    });

ngOnInit() {
  const slugValue = this.route.snapshot.paramMap.get('slug');

  if (slugValue) {

    this.blogService.getBlogDetails(slugValue).subscribe((res: any) => {

      const blog = {
        ...res.data,
        content: this.blogService['processBlogContent'](res.data.content)
      };

      this.blog.set(blog);

      if (blog) {
        this.updateSeoTags(blog);
      }

      window.scrollTo(0, 0);

    });
  }
}

    private updateSeoTags(blog: BlogPost) {
        const pageTitle = blog.metaTitle || blog.title;
        const description = blog.metaDescription || blog.excerpt;

        this.seoService.setMetaTags({
            title: pageTitle,
            description: description,
            keywords: blog.keywords,
            image: blog.image,
            type: 'article'
        });
    }
}
