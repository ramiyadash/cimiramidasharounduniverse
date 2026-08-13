import {
  Routes
} from '@angular/router';

export const routes: Routes = [
  /**
   * Home page.
   *
   * The empty path represents:
   * http://localhost:4200/
   */
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

  /**
   * Traveler profile and My Universe.
   *
   * This represents:
   * http://localhost:4200/profile
   */
  {
    path: 'profile',

    loadComponent: () =>
      import(
        './features/profile/pages/profile-page/profile-page.component'
      ).then(
        module =>
          module.ProfilePageComponent
      )
  },

  /**
   * Unknown URLs return to Home.
   *
   * This must remain the final route because Angular
   * evaluates the routes from top to bottom.
   */
  {
    path: '**',

    redirectTo: ''
  }
];