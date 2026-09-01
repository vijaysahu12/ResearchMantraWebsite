import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminBlogService } from '../../services/admin-blog.service';

@Component({
  selector: 'app-admin-blog-editor',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-blog-editor.component.html',
  styleUrl: './admin-blog-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBlogEditorComponent {
  private readonly blogService = inject(AdminBlogService);
  private readonly router = inject(Router);

  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly selectedImage = signal<File | undefined>(undefined);
  readonly imagePreviewUrl = signal('');
  readonly slugEdited = signal(false);
  readonly canonicalUrl = computed(() =>
    this.form.controls.slug.value
      ? `https://researchmantra.in/${this.form.controls.slug.value}`
      : 'https://researchmantra.in/your-post-slug',
  );

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(180)] }),
    slug: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    }),
    shortDescription: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(320)],
    }),
    content: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    hashtag: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    investmentCapital: new FormControl('Educational content only', { nonNullable: true }),
    metaTitle: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(180)] }),
    metaDescription: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(320)],
    }),
    metaKeywords: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    enableComments: new FormControl(true, { nonNullable: true }),
    isPinned: new FormControl(false, { nonNullable: true }),
    isPublished: new FormControl(true, { nonNullable: true }),
  });

  onTitleInput(): void {
    if (this.slugEdited()) return;
    this.form.controls.slug.setValue(this.toSlug(this.form.controls.title.value));
  }

  onSlugInput(): void {
    this.slugEdited.set(true);
    this.form.controls.slug.setValue(this.toSlug(this.form.controls.slug.value), { emitEvent: false });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.errorMessage.set('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.errorMessage.set('Choose a PNG, JPEG, or WebP cover image.');
      input.value = '';
      return;
    }
    if (file.size > 1_490_000) {
      this.errorMessage.set('The cover image must be smaller than 1.49 MB.');
      input.value = '';
      return;
    }
    this.selectedImage.set(file);
    const reader = new FileReader();
    reader.addEventListener('load', () => this.imagePreviewUrl.set(String(reader.result ?? '')));
    reader.readAsDataURL(file);
  }

  publish(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving()) {
      if (this.form.invalid) this.errorMessage.set('Complete the required fields before publishing.');
      return;
    }

    const value = this.form.getRawValue();
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.blogService
      .savePost({
        ...value,
        canonicalUrl: this.canonicalUrl(),
        publishedOn: new Date().toISOString(),
        image: this.selectedImage(),
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (response) => {
          if (response.statusCode !== 200) {
            this.errorMessage.set(response.message || 'The post could not be saved.');
            return;
          }
          void this.router.navigate(['/blogs', value.slug]);
        },
        error: (error: { error?: { message?: string } }) => {
          this.errorMessage.set(error.error?.message || 'The post could not be saved. Please try again.');
        },
      });
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
