import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: 'research',
    renderMode: RenderMode.Client
  },
  {
    path: 'research/report',
    renderMode: RenderMode.Client
  },
  {
    path: 'research/plans',
    renderMode: RenderMode.Client
  },
  {
    path: 'research/purchases',
    renderMode: RenderMode.Client
  },
  {
    path: 'share/research',
    renderMode: RenderMode.Client
  },
  {
    path: 'share/post/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: ':slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/blog-details/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
