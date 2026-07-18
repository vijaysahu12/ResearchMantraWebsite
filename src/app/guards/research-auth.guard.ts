import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ResearchAuthService } from '../services/research-auth.service';

export const researchAuthGuard: CanActivateFn = (_route, state) => {
  const auth = inject(ResearchAuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
