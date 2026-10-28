
// import {
//   Component,
//   OnInit,
//   OnDestroy,
//   ChangeDetectorRef,
//   NgZone
// } from '@angular/core';

// import { CommonModule } from '@angular/common';
// import { Router, RouterLink } from '@angular/router';
// import { Subscription } from 'rxjs';

// import {
//   AlertController,
//   IonContent,
//   IonHeader,
//   IonToolbar,
//   IonTitle,
//   IonButtons,
//   IonButton,
//   IonIcon,
//   IonCard,
//   IonCardContent,
//   IonBadge,
//   IonAvatar,
//   IonLabel,
//   IonGrid,
//   IonRow,
//   IonCol
// } from '@ionic/angular';

// import { addIcons } from 'ionicons';

// import {
//   locationOutline,
//   peopleOutline,
//   addOutline,
//   enterOutline,
//   shieldCheckmarkOutline,
//   timeOutline,
//   chevronForwardOutline,
//   compassOutline,
//   navigateOutline,
//   mapOutline,
//   personCircleOutline,
//   notificationsOutline,
//   arrowForwardOutline,
//   pinOutline,
//   personAddOutline,
//   homeOutline
// } from 'ionicons/icons';

// import { AuthService, AuthUser } from '../core/auth.service';
// import { GroupService, TripGroup } from '../core/group.service';

// @Component({
//   selector: 'app-home',
//   templateUrl: './home.page.html',
//   styleUrls: ['./home.page.scss'],
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterLink,
//     IonContent,
//     IonHeader,
//     IonToolbar,
//     IonTitle,
//     IonButtons,
//     IonButton,
//     IonIcon,
//     IonCard,
//     IonCardContent,
//     IonBadge,
//     IonAvatar,
//     IonLabel,
//     IonGrid,
//     IonRow,
//     IonCol
//   ]
// })
// export class HomePage implements OnInit, OnDestroy {
//   currentYear = new Date().getFullYear();

//   userName = '';
//   isLoggedIn = false;
//   sessionReady = false;

//   trips: TripGroup[] = [];
//   tripsLoading = false;

//   private userSubscription?: Subscription;
//   private sessionSubscription?: Subscription;

//   constructor(
//     private alertController: AlertController,
//     private router: Router,
//     private authService: AuthService,
//     private groupService: GroupService,
//     private cdr: ChangeDetectorRef,
//     private zone: NgZone
//   ) {
//     addIcons({
//       locationOutline,
//       peopleOutline,
//       addOutline,
//       enterOutline,
//       shieldCheckmarkOutline,
//       timeOutline,
//       chevronForwardOutline,
//       compassOutline,
//       navigateOutline,
//       mapOutline,
//       personCircleOutline,
//       notificationsOutline,
//       arrowForwardOutline,
//       pinOutline,
//       personAddOutline,
//       homeOutline
//     });
//   }

//   ngOnInit(): void {
//     this.userSubscription =
//       this.authService.currentUser$.subscribe({
//         next: (user: AuthUser | null) => {
//           this.zone.run(() => {
//             this.userName = user?.name ?? '';
//             this.isLoggedIn = user !== null;

//             if (this.sessionReady && this.isLoggedIn) {
//               void this.loadMyTrips();
//             } else if (!this.isLoggedIn) {
//               this.trips = [];
//             }

//             this.cdr.detectChanges();
//           });
//         },
//         error: error => {
//           console.error('[HomePage] User subscription error:', error);

//           this.zone.run(() => {
//             this.userName = '';
//             this.isLoggedIn = false;
//             this.trips = [];
//             this.cdr.detectChanges();
//           });
//         }
//       });

//     this.sessionSubscription =
//       this.authService.sessionReady$.subscribe({
//         next: (ready: boolean) => {
//           this.zone.run(() => {
//             this.sessionReady = ready;

//             if (ready && this.isLoggedIn) {
//               void this.loadMyTrips();
//             }

//             this.cdr.detectChanges();
//           });
//         },
//         error: error => {
//           console.error(
//             '[HomePage] Session subscription error:',
//             error
//           );

//           this.zone.run(() => {
//             this.sessionReady = true;
//             this.cdr.detectChanges();
//           });
//         }
//       });
//   }

//   ngOnDestroy(): void {
//     this.userSubscription?.unsubscribe();
//     this.sessionSubscription?.unsubscribe();
//   }

//   goToRegister(): void {
//     void this.router.navigate(['/register']);
//   }

//   goToLogin(): void {
//     void this.router.navigate(['/login']);
//   }

//   async logout(): Promise<void> {
//     try {
//       await this.authService.logout();
//       this.trips = [];
//       await this.router.navigate(['/home']);
//     } catch (error) {
//       console.error('[HomePage] Logout failed:', error);

//       await this.showAlert(
//         'Logout failed',
//         'Unable to log out. Please try again.'
//       );
//     }
//   }

//   async loadMyTrips(): Promise<void> {
//     if (!this.isLoggedIn || this.tripsLoading) {
//       return;
//     }

//     this.tripsLoading = true;

//     try {
//       const groups = await this.groupService.getMyGroups();

//       this.zone.run(() => {
//         this.trips = Array.isArray(groups) ? groups : [];
//         this.cdr.detectChanges();
//       });
//     } catch (error) {
//       console.error('[HomePage] Failed to load trips:', error);

//       this.zone.run(() => {
//         this.trips = [];
//         this.cdr.detectChanges();
//       });

//       await this.showAlert(
//         'Unable to load trips',
//         this.getErrorMessage(error)
//       );
//     } finally {
//       this.tripsLoading = false;
//       this.cdr.detectChanges();
//     }
//   }

//   async createTrip(): Promise<void> {
//     if (!this.isLoggedIn) {
//       await this.showAlert(
//         'Login required',
//         'Please log in before creating a trip.',
//         [
//           {
//             text: 'Cancel',
//             role: 'cancel'
//           },
//           {
//             text: 'Login',
//             handler: () => {
//               void this.goToLogin();
//             }
//           }
//         ]
//       );
//       return;
//     }

//     const alert = await this.alertController.create({
//       header: 'Create a Trip',
//       message: 'Give your trip a name to get started.',
//       inputs: [
//         {
//           name: 'tripName',
//           type: 'text',
//           placeholder: 'e.g. Goa Weekend Trip',
//           attributes: {
//             maxlength: 100
//           }
//         }
//       ],
//       buttons: [
//         {
//           text: 'Cancel',
//           role: 'cancel'
//         },
//         {
//           text: 'Create Trip',
//           role: 'confirm'
//         }
//       ]
//     });

//     await alert.present();

//     const result = await alert.onDidDismiss();

//     if (result.role !== 'confirm') {
//       return;
//     }

//     const name = String(
//       result.data?.values?.tripName ?? ''
//     ).trim();

//     if (!name) {
//       await this.showAlert(
//         'Trip name required',
//         'Please enter a name for your trip.'
//       );
//       return;
//     }

//     try {
//       const group = await this.groupService.createGroup(name);

//       await this.loadMyTrips();

//       await this.showAlert(
//         'Trip created successfully',
//         `Your trip "${group.name}" is ready.\n\nJoin code: ${group.joinCode}\n\nShare this code with your friends.`
//       );
//     } catch (error) {
//       console.error('[HomePage] Create trip failed:', error);

//       await this.showAlert(
//         'Could not create trip',
//         this.getErrorMessage(error)
//       );
//     }
//   }

//   async joinTrip(): Promise<void> {
//     if (!this.isLoggedIn) {
//       await this.showAlert(
//         'Login required',
//         'Please log in before joining a trip.',
//         [
//           {
//             text: 'Cancel',
//             role: 'cancel'
//           },
//           {
//             text: 'Login',
//             handler: () => {
//               void this.goToLogin();
//             }
//           }
//         ]
//       );
//       return;
//     }

//     const alert = await this.alertController.create({
//       header: 'Join a Trip',
//       message: 'Enter the join code shared by your friend.',
//       inputs: [
//         {
//           name: 'joinCode',
//           type: 'text',
//           placeholder: 'Enter your trip code',
//           attributes: {
//             maxlength: 12,
//             autocapitalize: 'characters'
//           }
//         }
//       ],
//       buttons: [
//         {
//           text: 'Cancel',
//           role: 'cancel'
//         },
//         {
//           text: 'Join Trip',
//           role: 'confirm'
//         }
//       ]
//     });

//     await alert.present();

//     const result = await alert.onDidDismiss();

//     if (result.role !== 'confirm') {
//       return;
//     }

//     const joinCode = String(
//       result.data?.values?.joinCode ?? ''
//     ).trim().toUpperCase();

//     if (!joinCode) {
//       await this.showAlert(
//         'Join code required',
//         'Please enter a valid trip code.'
//       );
//       return;
//     }

//     try {
//       const group = await this.groupService.joinGroup(joinCode);

//       await this.loadMyTrips();

//       await this.showAlert(
//         'Successfully joined',
//         `You have joined "${group.name}".`
//       );
//     } catch (error) {
//       console.error('[HomePage] Join trip failed:', error);

//       await this.showAlert(
//         'Could not join trip',
//         this.getErrorMessage(error)
//       );
//     }
//   }

  
// openTripDetails(groupId: number): void {
//   void this.router.navigate(['/trip-details', groupId]);
// }











//   private async showAlert(
//     header: string,
//     message: string,
//     buttons: any[] = ['OK']
//   ): Promise<void> {
//     const alert = await this.alertController.create({
//       header,
//       message,
//       buttons
//     });

//     await alert.present();
//   }

//   private getErrorMessage(error: any): string {
//     const serverMessage =
//       error?.error?.message ??
//       error?.error?.error;

//     if (serverMessage) {
//       return String(serverMessage);
//     }

//     if (error?.status === 401 || error?.status === 403) {
//       return 'Your session may have expired, or you do not have permission to perform this action. Please log in again.';
//     }

//     if (error?.status === 0) {
//       return 'Cannot connect to the backend. Check that your Spring Boot server is running and the API URL is correct.';
//     }

//     return error?.message ??
//       'Something went wrong. Please try again.';
//   }
// }












import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  AlertController,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonBadge,
  IonAvatar,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  locationOutline,
  peopleOutline,
  addOutline,
  enterOutline,
  shieldCheckmarkOutline,
  timeOutline,
  chevronForwardOutline,
  compassOutline,
  navigateOutline,
  mapOutline,
  personCircleOutline,
  notificationsOutline,
  arrowForwardOutline,
  pinOutline,
  personAddOutline,
  homeOutline
} from 'ionicons/icons';

import { AuthService, AuthUser } from '../core/auth.service';
import { GroupService, TripGroup } from '../core/group.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonBadge,
    IonAvatar,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class HomePage implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();

  userName = '';
  isLoggedIn = false;
  sessionReady = false;

  trips: TripGroup[] = [];
  tripsLoading = false;

  private userSubscription?: Subscription;
  private sessionSubscription?: Subscription;

  private destroyed = false;
  private loadRequestId = 0;

  constructor(
    private alertController: AlertController,
    private router: Router,
    private authService: AuthService,
    private groupService: GroupService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    addIcons({
      locationOutline,
      peopleOutline,
      addOutline,
      enterOutline,
      shieldCheckmarkOutline,
      timeOutline,
      chevronForwardOutline,
      compassOutline,
      navigateOutline,
      mapOutline,
      personCircleOutline,
      notificationsOutline,
      arrowForwardOutline,
      pinOutline,
      personAddOutline,
      homeOutline
    });
  }

  ngOnInit(): void {
    this.userSubscription =
      this.authService.currentUser$.subscribe({
        next: (user: AuthUser | null) => {
          this.zone.run(() => {
            this.userName = user?.name ?? '';
            this.isLoggedIn = user !== null;

            if (this.sessionReady && this.isLoggedIn) {
              void this.loadMyTrips();
            } else if (!this.isLoggedIn) {
              this.loadRequestId++;
              this.trips = [];
              this.tripsLoading = false;
            }

            this.cdr.detectChanges();
          });
        },
        error: (error: unknown) => {
          console.error(
            '[HomePage] User subscription error:',
            error
          );

          this.zone.run(() => {
            this.userName = '';
            this.isLoggedIn = false;
            this.loadRequestId++;
            this.trips = [];
            this.tripsLoading = false;
            this.cdr.detectChanges();
          });
        }
      });

    this.sessionSubscription =
      this.authService.sessionReady$.subscribe({
        next: (ready: boolean) => {
          this.zone.run(() => {
            this.sessionReady = ready;

            if (ready && this.isLoggedIn) {
              void this.loadMyTrips();
            }

            this.cdr.detectChanges();
          });
        },
        error: (error: unknown) => {
          console.error(
            '[HomePage] Session subscription error:',
            error
          );

          this.zone.run(() => {
            this.sessionReady = true;
            this.cdr.detectChanges();
          });
        }
      });
  }

  /**
   * Ionic calls this whenever the Home page becomes active.
   * This refreshes the trip list after returning from Trip Details.
   */
  ionViewWillEnter(): void {
    if (this.sessionReady && this.isLoggedIn) {
      void this.loadMyTrips();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.loadRequestId++;

    this.userSubscription?.unsubscribe();
    this.sessionSubscription?.unsubscribe();
  }

  goToRegister(): void {
    void this.router.navigate(['/register']);
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();

      this.zone.run(() => {
        this.loadRequestId++;
        this.trips = [];
        this.tripsLoading = false;
        this.cdr.detectChanges();
      });

      await this.router.navigate(['/home']);
    } catch (error: unknown) {
      console.error('[HomePage] Logout failed:', error);

      await this.showAlert(
        'Logout failed',
        'Unable to log out. Please try again.'
      );
    }
  }

  async loadMyTrips(): Promise<void> {
    if (
      this.destroyed ||
      !this.sessionReady ||
      !this.isLoggedIn
    ) {
      return;
    }

    // A new request supersedes any earlier request.
    const requestId = ++this.loadRequestId;

    this.zone.run(() => {
      this.tripsLoading = true;
      this.cdr.detectChanges();
    });

    try {
      const groups = await this.groupService.getMyGroups();

      if (
        this.destroyed ||
        requestId !== this.loadRequestId
      ) {
        return;
      }

      this.zone.run(() => {
        this.trips = Array.isArray(groups) ? groups : [];
        this.cdr.detectChanges();
      });
    } catch (error: unknown) {
      console.error(
        '[HomePage] Failed to load trips:',
        error
      );

      if (
        this.destroyed ||
        requestId !== this.loadRequestId
      ) {
        return;
      }

      this.zone.run(() => {
        this.trips = [];
        this.cdr.detectChanges();
      });

      await this.showAlert(
        'Unable to load trips',
        this.getErrorMessage(error)
      );
    } finally {
      if (
        !this.destroyed &&
        requestId === this.loadRequestId
      ) {
        this.zone.run(() => {
          this.tripsLoading = false;
          this.cdr.detectChanges();
        });
      }
    }
  }

  async createTrip(): Promise<void> {
    if (!this.isLoggedIn) {
      await this.showAlert(
        'Login required',
        'Please log in before creating a trip.',
        [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Login',
            handler: () => {
              void this.goToLogin();
            }
          }
        ]
      );

      return;
    }

    const alert = await this.alertController.create({
      header: 'Create a Trip',
      message: 'Give your trip a name to get started.',
      inputs: [
        {
          name: 'tripName',
          type: 'text',
          placeholder: 'e.g. Goa Weekend Trip',
          attributes: {
            maxlength: 100
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create Trip',
          role: 'confirm'
        }
      ]
    });

    await alert.present();

    const result = await alert.onDidDismiss();

    if (result.role !== 'confirm') {
      return;
    }

    const name = String(
      result.data?.values?.tripName ?? ''
    ).trim();

    if (!name) {
      await this.showAlert(
        'Trip name required',
        'Please enter a name for your trip.'
      );

      return;
    }

    try {
      const group = await this.groupService.createGroup(name);

      await this.loadMyTrips();

      await this.showAlert(
        'Trip created successfully',
        `Your trip "${group.name}" is ready.\n\n` +
        `Join code: ${group.joinCode}\n\n` +
        'Share this code with your friends.'
      );
    } catch (error: unknown) {
      console.error(
        '[HomePage] Create trip failed:',
        error
      );

      await this.showAlert(
        'Could not create trip',
        this.getErrorMessage(error)
      );
    }
  }

  async joinTrip(): Promise<void> {
    if (!this.isLoggedIn) {
      await this.showAlert(
        'Login required',
        'Please log in before joining a trip.',
        [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Login',
            handler: () => {
              void this.goToLogin();
            }
          }
        ]
      );

      return;
    }

    const alert = await this.alertController.create({
      header: 'Join a Trip',
      message: 'Enter the join code shared by your friend.',
      inputs: [
        {
          name: 'joinCode',
          type: 'text',
          placeholder: 'Enter your trip code',
          attributes: {
            maxlength: 12,
            autocapitalize: 'characters'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Join Trip',
          role: 'confirm'
        }
      ]
    });

    await alert.present();

    const result = await alert.onDidDismiss();

    if (result.role !== 'confirm') {
      return;
    }

    const joinCode = String(
      result.data?.values?.joinCode ?? ''
    ).trim().toUpperCase();

    if (!joinCode) {
      await this.showAlert(
        'Join code required',
        'Please enter a valid trip code.'
      );

      return;
    }

    try {
      const group = await this.groupService.joinGroup(joinCode);

      await this.loadMyTrips();

      await this.showAlert(
        'Successfully joined',
        `You have joined "${group.name}".`
      );
    } catch (error: unknown) {
      console.error(
        '[HomePage] Join trip failed:',
        error
      );

      await this.showAlert(
        'Could not join trip',
        this.getErrorMessage(error)
      );
    }
  }

  openTripDetails(groupId: number): void {
    if (!Number.isSafeInteger(groupId) || groupId <= 0) {
      return;
    }

    void this.router.navigate(['/trip-details', groupId]);
  }

  private async showAlert(
    header: string,
    message: string,
    buttons: any[] = ['OK']
  ): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons
    });

    await alert.present();
  }

  private getErrorMessage(error: any): string {
    const serverMessage =
      error?.error?.message ??
      error?.error?.error;

    if (serverMessage) {
      return String(serverMessage);
    }

    if (error?.status === 401) {
      return 'Your session may have expired. Please log in again.';
    }

    if (error?.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error?.status === 404) {
      return 'The requested trip could not be found.';
    }

    if (error?.status === 409) {
      return (
        serverMessage ??
        'This action cannot be completed because of the trip’s current state.'
      );
    }

    if (error?.status === 0) {
      return (
        'Cannot connect to the backend. Check that your ' +
        'Spring Boot server is running and the API URL is correct.'
      );
    }

    return error?.message ??
      'Something went wrong. Please try again.';
  }
}










































