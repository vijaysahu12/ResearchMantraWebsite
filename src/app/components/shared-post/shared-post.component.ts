import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SharedPost } from '../../models/research.models';
import { ResearchService } from '../../services/research.service';

@Component({
  selector: 'app-shared-post',
  imports: [RouterLink],
  templateUrl: './shared-post.component.html',
  styleUrl: './shared-post.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedPostComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly research = inject(ResearchService);

  readonly post = signal<SharedPost | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly researchPlanQuery = signal({ productId: 155, returnUrl: '/research' });

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    if (!postId) {
      this.loading.set(false);
      this.errorMessage.set('This shared link is invalid.');
      return;
    }
    this.researchPlanQuery.set({
      productId: 155,
      returnUrl: `/share/post/${encodeURIComponent(postId)}`,
    });

    this.research.getSharedPost(postId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (post) => this.post.set(post),
        error: (error: unknown) => this.errorMessage.set(
          error instanceof Error ? error.message : 'This post could not be opened.',
        ),
      });
  }
}
