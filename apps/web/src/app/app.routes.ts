import {
    Routes
  } from '@angular/router';
  
  import {
    authGuard
  } from './core/guards/auth.guard';
  
  export const routes: Routes = [
    {
      path: 'login',
  
      loadComponent: () =>
        import(
          './features/auth/pages/login-page/login-page.component'
        ).then(
          module =>
            module.LoginPageComponent
        )
    },
  
    {
      path: '',
      pathMatch: 'full',
      canActivate: [
        authGuard
      ],
  
      loadComponent: () =>
        import(
          './features/home/pages/home-page/home-page.component'
        ).then(
          module =>
            module.HomePageComponent
        )
    },
  
    {
      path: 'profile',
      canActivate: [
        authGuard
      ],
  
      loadComponent: () =>
        import(
          './features/profile/pages/profile-page/profile-page.component'
        ).then(
          module =>
            module.ProfilePageComponent
        )
    },
  
    {
      path: '**',
      redirectTo: ''
    }
  ];