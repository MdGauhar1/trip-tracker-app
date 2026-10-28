import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page')
        .then(m => m.HomePage)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page')
        .then(m => m.LoginPage)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page')
        .then(m => m.RegisterPage)
  },


  
{
  path: 'trip-details/:id',
  loadComponent: () =>
    import('./pages/trip-details/trip-details.page')
      .then(m => m.TripDetailsPage)
},


  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'home'
  },
  {
    path: 'trip-details',
    loadComponent: () => import('./pages/trip-details/trip-details.page').then( m => m.TripDetailsPage)
  }

];











// import { Routes } from '@angular/router';

// import { authGuard } from './core/auth.guard';

// export const routes: Routes = [

//   // Login page
//   {
//     path: 'login',
//     loadComponent: () =>
//       import('./pages/login/login.page')
//         .then(m => m.LoginPage),
//   },

//   // Register page
//   {
//     path: 'register',
//     loadComponent: () =>
//       import('./pages/register/register.page')
//         .then(m => m.RegisterPage),
//   },

//   // Protected Home page
//   {
//     path: 'home',
//     canActivate: [authGuard],
//     loadComponent: () =>
//       import('./home/home.page')
//         .then(m => m.HomePage),
//   },

//   // Default route
//   {
//     path: '',
//     redirectTo: 'home',
//     pathMatch: 'full',
//   },

//   // Unknown routes
//   {
//     path: '**',
//     redirectTo: 'home',
//   },
//   {
//     path: 'login',
//     loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
//   }

// ];






