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

  /**
   * All signed-in pages share the same application
   * header and mobile navigation drawer.
   */
  {
    path: '',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import(
        './layout/pages/authenticated-shell/authenticated-shell.component'
      ).then(
        module =>
          module.AuthenticatedShellComponent
      ),

    children: [
      {
        path: '',

        pathMatch: 'full',

        loadComponent: () =>
          import(
            './features/home/pages/home-page/home-page.component'
          ).then(
            module =>
              module.HomePageComponent
          )
      },

      {
        path: 'stories',

        loadComponent: () =>
          import(
            './features/stories/pages/stories-page/stories-page.component'
          ).then(
            module =>
              module.StoriesPageComponent
          )
      },

      {
        path: 'discover',

        loadComponent: () =>
          import(
            './features/discover/pages/discover-page/discover-page.component'
          ).then(
            module =>
              module.DiscoverPageComponent
          )
      },

      {
        path: 'profile',

        loadComponent: () =>
          import(
            './features/profile/pages/profile-page/profile-page.component'
          ).then(
            module =>
              module.ProfilePageComponent
          )
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];