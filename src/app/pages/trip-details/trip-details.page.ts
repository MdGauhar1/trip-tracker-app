
// import { CommonModule } from '@angular/common';
// import {
//   ChangeDetectorRef,
//   Component,
//   OnDestroy,
//   OnInit
// } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';

// import {
//   AlertController,
//   IonBackButton,
//   IonButton,
//   IonButtons,
//   IonCard,
//   IonCardContent,
//   IonCardHeader,
//   IonCardTitle,
//   IonContent,
//   IonHeader,
//   IonItem,
//   IonLabel,
//   IonList,
//   IonSpinner,
//   IonText,
//   IonTitle,
//   IonToolbar
// } from '@ionic/angular';

// import {
//   GroupService,
//   GroupDetailsResponse,
//   GroupMemberResponse
// } from '../../core/group.service';

// @Component({
//   selector: 'app-trip-details',
//   templateUrl: './trip-details.page.html',
//   styleUrls: ['./trip-details.page.scss'],
//   standalone: true,
//   imports: [
//     CommonModule,
//     IonHeader,
//     IonToolbar,
//     IonTitle,
//     IonButtons,
//     IonBackButton,
//     IonContent,
//     IonCard,
//     IonCardHeader,
//     IonCardTitle,
//     IonCardContent,
//     IonItem,
//     IonLabel,
//     IonList,
//     IonButton,
//     IonSpinner,
//     IonText
//   ]
// })
// export class TripDetailsPage implements OnInit, OnDestroy {
//   trip: GroupDetailsResponse | null = null;
//   loading = true;
//   errorMessage = '';

//   private destroyed = false;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private groupService: GroupService,
//     private alertController: AlertController,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit(): void {
//     const id = this.route.snapshot.paramMap.get('id');
//     const groupId = Number(id);

//     console.log('[TripDetails] Route ID:', id);

//     if (
//       id === null ||
//       id.trim() === '' ||
//       !Number.isSafeInteger(groupId) ||
//       groupId <= 0
//     ) {
//       this.loading = false;
//       this.errorMessage = 'Invalid trip ID.';
//       this.cdr.detectChanges();
//       return;
//     }

//     void this.loadTrip(groupId);
//   }

//   async loadTrip(groupId: number): Promise<void> {
//     this.loading = true;
//     this.errorMessage = '';
//     this.trip = null;
//     this.cdr.detectChanges();

//     console.log('[TripDetails] Request started:', groupId);

//     try {
//       const details =
//         await this.groupService.getGroupDetails(groupId);

//       console.log('[TripDetails] Response received:', details);

//       if (this.destroyed) {
//         return;
//       }

//       if (!details || typeof details !== 'object') {
//         throw new Error('The server returned an invalid response.');
//       }

//       this.trip = {
//         ...details,
//         members: Array.isArray(details.members)
//           ? details.members
//           : []
//       };

//       console.log('[TripDetails] Trip assigned:', this.trip.name);
//       console.log(
//         '[TripDetails] Members:',
//         this.trip.members.length
//       );

//     } catch (error: unknown) {
//       console.error('[TripDetails] Request failed:', error);

//       if (this.destroyed) {
//         return;
//       }

//       const httpError = error as {
//         status?: number;
//         message?: string;
//         error?: { message?: string };
//       };

//       if (httpError.status === 401) {
//         this.errorMessage =
//           'Your session has expired. Please log in again.';
//       } else if (httpError.status === 403) {
//         this.errorMessage =
//           'You are not a member of this trip.';
//       } else if (httpError.status === 404) {
//         this.errorMessage =
//           'This trip could not be found.';
//       } else {
//         this.errorMessage =
//           httpError.error?.message ||
//           httpError.message ||
//           'Unable to load trip details. Please try again.';
//       }

//     } finally {
//       if (!this.destroyed) {
//         this.loading = false;

//         console.log(
//           '[TripDetails] Loading finished:',
//           this.loading
//         );

//         // Explicitly refresh the UI.
//         this.cdr.detectChanges();
//       }
//     }
//   }

//   async copyJoinCode(): Promise<void> {
//     const joinCode = this.trip?.joinCode;

//     if (!joinCode) {
//       return;
//     }

//     try {
//       if (!navigator.clipboard) {
//         throw new Error('Clipboard unavailable');
//       }

//       await navigator.clipboard.writeText(joinCode);
//       await this.showMessage('Join code copied to clipboard.');

//     } catch {
//       await this.showMessage(
//         `Your trip join code is: ${joinCode}`
//       );
//     }
//   }

//   formatDate(value: string | null | undefined): string {
//     if (!value) {
//       return 'Not available';
//     }

//     const date = new Date(value);

//     return Number.isNaN(date.getTime())
//       ? 'Not available'
//       : date.toLocaleString();
//   }

//   trackMember(
//     _index: number,
//     member: GroupMemberResponse
//   ): number {
//     return member.userId;
//   }

//   goHome(): void {
//     void this.router.navigate(['/home']);
//   }

//   private async showMessage(message: string): Promise<void> {
//     const alert = await this.alertController.create({
//       message,
//       buttons: ['OK']
//     });

//     await alert.present();
//   }

//   ngOnDestroy(): void {
//     this.destroyed = true;
//   }
// }





import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular';

import {
  GroupService,
  GroupDetailsResponse,
  GroupMemberResponse
} from '../../core/group.service';

@Component({
  selector: 'app-trip-details',
  templateUrl: './trip-details.page.html',
  styleUrls: ['./trip-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList,
    IonButton,
    IonSpinner,
    IonText
  ]
})
export class TripDetailsPage implements OnInit, OnDestroy {
  trip: GroupDetailsResponse | null = null;
  loading = true;
  errorMessage = '';

  private destroyed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const groupId = Number(id);

    console.log('[TripDetails] Route ID:', id);

    if (
      id === null ||
      id.trim() === '' ||
      !Number.isSafeInteger(groupId) ||
      groupId <= 0
    ) {
      this.loading = false;
      this.errorMessage = 'Invalid trip ID.';
      this.cdr.detectChanges();
      return;
    }

    void this.loadTrip(groupId);
  }

  async loadTrip(groupId: number): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.trip = null;
    this.cdr.detectChanges();

    console.log('[TripDetails] Request started:', groupId);

    try {
      const details =
        await this.groupService.getGroupDetails(groupId);

      console.log('[TripDetails] Response received:', details);

      if (this.destroyed) {
        return;
      }

      if (!details || typeof details !== 'object') {
        throw new Error('The server returned an invalid response.');
      }

      this.trip = {
        ...details,
        members: Array.isArray(details.members)
          ? details.members
          : []
      };

      console.log('[TripDetails] Trip assigned:', this.trip.name);
      console.log(
        '[TripDetails] Members:',
        this.trip.members.length
      );

    } catch (error: unknown) {
      console.error('[TripDetails] Request failed:', error);

      if (this.destroyed) {
        return;
      }

      const httpError = error as {
        status?: number;
        message?: string;
        error?: { message?: string };
      };

      if (httpError.status === 401) {
        this.errorMessage =
          'Your session has expired. Please log in again.';
      } else if (httpError.status === 403) {
        this.errorMessage =
          'You are not a member of this trip.';
      } else if (httpError.status === 404) {
        this.errorMessage =
          'This trip could not be found.';
      } else {
        this.errorMessage =
          httpError.error?.message ||
          httpError.message ||
          'Unable to load trip details. Please try again.';
      }

    } finally {
      if (!this.destroyed) {
        this.loading = false;
        this.cdr.detectChanges();

        console.log(
          '[TripDetails] Loading finished:',
          this.loading
        );
      }
    }
  }

  // Copy the trip join code.
  async copyJoinCode(): Promise<void> {
    const joinCode = this.trip?.joinCode;

    if (!joinCode) {
      return;
    }

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(joinCode);

      await this.showMessage(
        'Join code copied to clipboard.'
      );

    } catch {
      await this.showMessage(
        `Your trip join code is: ${joinCode}`
      );
    }
  }

  // Ask for confirmation before leaving the trip.
  async leaveTrip(): Promise<void> {
    const groupId = this.trip?.id;

    if (!groupId || this.loading) {
      return;
    }

    const confirmation = await this.alertController.create({
      header: 'Leave Trip?',
      message:
        'Are you sure you want to leave this trip? You will be removed from its member list.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Leave Trip',
          role: 'destructive',
          handler: () => {
            void this.confirmLeaveTrip(groupId);
          }
        }
      ]
    });

    await confirmation.present();
  }

  // Call the backend DELETE endpoint.
  private async confirmLeaveTrip(
    groupId: number
  ): Promise<void> {
    if (this.destroyed || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      await this.groupService.leaveGroup(groupId);

      if (this.destroyed) {
        return;
      }

      const successAlert =
        await this.alertController.create({
          header: 'Trip Left',
          message: 'You have successfully left the trip.',
          backdropDismiss: false,
          buttons: [
            {
              text: 'OK',
              handler: () => {
                void this.router.navigate(['/home']);
              }
            }
          ]
        });

      await successAlert.present();

    } catch (error: unknown) {
      console.error('[TripDetails] Failed to leave trip:', error);

      if (this.destroyed) {
        return;
      }

      const httpError = error as {
        status?: number;
        message?: string;
        error?: {
          message?: string;
          detail?: string;
          title?: string;
        };
      };

      let message: string;

      if (httpError.status === 401) {
        message =
          'Please log in again to leave this trip.';
      } else if (httpError.status === 403) {
        message =
          'You are not a member of this trip.';
      } else if (httpError.status === 404) {
        message =
          'This trip could not be found.';
      } else if (httpError.status === 409) {
        message =
          httpError.error?.detail ||
          httpError.error?.message ||
          'The trip creator cannot leave before transferring ownership.';
      } else {
        message =
          httpError.error?.detail ||
          httpError.error?.message ||
          httpError.message ||
          'Unable to leave this trip. Please try again.';
      }

      const errorAlert =
        await this.alertController.create({
          header: 'Unable to Leave Trip',
          message,
          buttons: ['OK']
        });

      await errorAlert.present();

    } finally {
      if (!this.destroyed) {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? 'Not available'
      : date.toLocaleString();
  }

  trackMember(
    _index: number,
    member: GroupMemberResponse
  ): number {
    return member.userId;
  }

  goHome(): void {
    void this.router.navigate(['/home']);
  }

  private async showMessage(message: string): Promise<void> {
    const alert = await this.alertController.create({
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }
}
