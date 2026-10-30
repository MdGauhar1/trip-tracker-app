

// import { CommonModule } from '@angular/common';
// import {
//   ChangeDetectorRef,
//   Component,
//   OnDestroy,
//   OnInit
// } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Client, IMessage } from '@stomp/stompjs';
// import * as L from 'leaflet';

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

// import { AuthService } from '../../core/auth.service';

// import {
//   GroupService,
//   GroupDetailsResponse,
//   GroupMemberResponse,
//   LocationResponse
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

//   sharingEnabled = false;
//   sharingBusy = false;
//   locationMessage = 'Loading location-sharing status...';
//   liveConnectionStatus = 'Connecting to live updates...';
//   sharedLocations: LocationResponse[] = [];

//   private destroyed = false;
//   private groupId: number | null = null;
//   private watchId: number | null = null;

//   private stompClient: Client | null = null;
//   private map: L.Map | null = null;
//   private mapInitialized = false;

//   private readonly markers = new Map<number, L.CircleMarker>();

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private groupService: GroupService,
//     private authService: AuthService,
//     private alertController: AlertController,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit(): void {
//     const id = this.route.snapshot.paramMap.get('id');
//     const groupId = Number(id);

//     if (
//       id === null ||
//       id.trim() === '' ||
//       !Number.isSafeInteger(groupId) ||
//       groupId <= 0
//     ) {
//       this.loading = false;
//       this.errorMessage = 'Invalid trip ID.';
//       return;
//     }

//     this.groupId = groupId;
//     void this.loadTrip(groupId);
//   }

//   async loadTrip(groupId: number): Promise<void> {
//     this.loading = true;
//     this.errorMessage = '';
//     this.trip = null;

//     try {
//       const details =
//         await this.groupService.getGroupDetails(groupId);

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

//       const currentUser = this.authService.getCurrentUser();

//       this.sharingEnabled = Boolean(
//         this.trip.members.find(
//           member => member.userId === currentUser?.userId
//         )?.sharingEnabled
//       );

//       this.locationMessage = this.sharingEnabled
//         ? 'Location sharing is enabled for this trip.'
//         : 'Your location is not currently being shared.';

//       this.cdr.detectChanges();

//       // The map element exists after Angular renders the trip details.
//       setTimeout(() => {
//         if (this.destroyed) {
//           return;
//         }

//         this.initializeMap();
//         this.connectToLiveUpdates();
//       }, 0);

//       if (this.sharingEnabled) {
//         this.startWatchingLocation();
//       }
//     } catch (error: unknown) {
//       if (this.destroyed) {
//         return;
//       }

//       console.error('[TripDetails] Failed to load trip:', error);

//       const httpError = error as {
//         status?: number;
//         message?: string;
//         error?: { message?: string; detail?: string };
//       };

//       if (httpError.status === 401) {
//         this.errorMessage =
//           'Your session has expired. Please log in again.';
//       } else if (httpError.status === 403) {
//         this.errorMessage =
//           'You are not a member of this trip.';
//       } else if (httpError.status === 404) {
//         this.errorMessage = 'This trip could not be found.';
//       } else {
//         this.errorMessage =
//           httpError.error?.detail ||
//           httpError.error?.message ||
//           httpError.message ||
//           'Unable to load trip details. Please try again.';
//       }
//     } finally {
//       if (!this.destroyed) {
//         this.loading = false;
//         this.cdr.detectChanges();
//       }
//     }
//   }

//   // ---------------- LOCATION SHARING ----------------

//   async toggleLocationSharing(): Promise<void> {
//     if (
//       !this.groupId ||
//       !this.trip ||
//       !this.trip.active ||
//       this.sharingBusy
//     ) {
//       return;
//     }

//     if (this.sharingEnabled) {
//       await this.stopSharing();
//     } else {
//       await this.startSharing();
//     }
//   }

//   private async startSharing(): Promise<void> {
//     if (!this.groupId) {
//       return;
//     }

//     if (!navigator.geolocation) {
//       await this.showMessage(
//         'This device or browser does not support geolocation.'
//       );
//       return;
//     }

//     this.sharingBusy = true;
//     this.locationMessage = 'Enabling location sharing...';
//     this.cdr.detectChanges();

//     try {
//       await this.groupService.setLocationSharing(
//         this.groupId,
//         true
//       );

//       if (this.destroyed) {
//         return;
//       }

//       this.sharingEnabled = true;
//       this.locationMessage =
//         'Sharing enabled. Waiting for your device location...';

//       this.updateCurrentMemberSharingStatus();
//       this.startWatchingLocation();
//     } catch (error: unknown) {
//       console.error('[Location] Unable to enable sharing:', error);

//       this.locationMessage = this.getLocationErrorMessage(error);

//       await this.showMessage(this.locationMessage);
//     } finally {
//       if (!this.destroyed) {
//         this.sharingBusy = false;
//         this.cdr.detectChanges();
//       }
//     }
//   }

//   private async stopSharing(): Promise<void> {
//     if (!this.groupId) {
//       return;
//     }

//     this.sharingBusy = true;
//     this.locationMessage = 'Disabling location sharing...';
//     this.cdr.detectChanges();

//     try {
//       await this.groupService.setLocationSharing(
//         this.groupId,
//         false
//       );

//       if (this.destroyed) {
//         return;
//       }

//       this.sharingEnabled = false;
//       this.stopWatchingLocation();

//       this.locationMessage =
//         'Location sharing is off. Other members will no longer see your location.';

//       // The backend excludes this member from future REST results.
//       // Remove the marker locally immediately.
//       const currentUser = this.authService.getCurrentUser();

//       if (currentUser) {
//         this.removeMarker(currentUser.userId);
//         this.sharedLocations = this.sharedLocations.filter(
//           location => location.userId !== currentUser.userId
//         );
//       }

//       this.updateCurrentMemberSharingStatus();
//     } catch (error: unknown) {
//       console.error('[Location] Unable to disable sharing:', error);

//       this.locationMessage = this.getLocationErrorMessage(error);

//       await this.showMessage(this.locationMessage);
//     } finally {
//       if (!this.destroyed) {
//         this.sharingBusy = false;
//         this.cdr.detectChanges();
//       }
//     }
//   }

//   private startWatchingLocation(): void {
//     if (
//       this.destroyed ||
//       !this.sharingEnabled ||
//       this.watchId !== null ||
//       !navigator.geolocation
//     ) {
//       return;
//     }

//     this.watchId = navigator.geolocation.watchPosition(
//       position => {
//         void this.handlePosition(position);
//       },
//       error => {
//         if (this.destroyed) {
//           return;
//         }

//         console.error('[Location] Geolocation error:', error);

//         if (error.code === error.PERMISSION_DENIED) {
//           this.locationMessage =
//             'Location permission was denied. Allow location access in your browser or device settings.';
//         } else if (error.code === error.POSITION_UNAVAILABLE) {
//           this.locationMessage =
//             'Your device could not determine its current location.';
//         } else {
//           this.locationMessage =
//             'Location request timed out. Try again in an area with better GPS reception.';
//         }

//         this.cdr.detectChanges();
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 5000,
//         timeout: 20000
//       }
//     );
//   }

//   private async handlePosition(
//     position: GeolocationPosition
//   ): Promise<void> {
//     const groupId = this.groupId;

//     if (
//       this.destroyed ||
//       !this.sharingEnabled ||
//       !groupId
//     ) {
//       return;
//     }

//     const request = {
//       latitude: position.coords.latitude,
//       longitude: position.coords.longitude,
//       accuracy: position.coords.accuracy ?? null
//     };

//     try {
//       const saved =
//         await this.groupService.updateMyLocation(
//           groupId,
//           request
//         );

//       if (this.destroyed || !this.sharingEnabled) {
//         return;
//       }

//       this.locationMessage =
//         `Your location was updated at ${this.formatDate(saved.recordedAt)}.`;

//       // The WebSocket normally delivers this update too.
//       // Upserting here gives the user immediate feedback.
//       this.upsertLocation(saved);
//       this.cdr.detectChanges();
//     } catch (error: unknown) {
//       if (this.destroyed) {
//         return;
//       }

//       console.error('[Location] Failed to update location:', error);

//       this.locationMessage = this.getLocationErrorMessage(error);
//       this.cdr.detectChanges();
//     }
//   }

//   // ---------------- MAP ----------------

//   private initializeMap(): void {
//     if (this.mapInitialized || !this.trip || this.destroyed) {
//       return;
//     }

//     const element = document.getElementById('trip-location-map');

//     if (!element) {
//       console.warn('[Location] Map element was not found.');
//       return;
//     }

//     this.map = L.map(element, {
//       zoomControl: true
//     }).setView([20, 0], 2);

//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       maxZoom: 19,
//       attribution: '&copy; OpenStreetMap contributors'
//     }).addTo(this.map);

//     this.mapInitialized = true;

//     // Correct the map dimensions after Ionic has rendered the page.
//     setTimeout(() => {
//       if (!this.destroyed && this.map) {
//         this.map.invalidateSize();
//       }
//     }, 100);
//   }

//   private upsertLocation(location: LocationResponse): void {
//     const latitude = Number(location.latitude);
//     const longitude = Number(location.longitude);

//     if (
//       !Number.isFinite(latitude) ||
//       !Number.isFinite(longitude) ||
//       latitude < -90 ||
//       latitude > 90 ||
//       longitude < -180 ||
//       longitude > 180
//     ) {
//       return;
//     }

//     const member = this.trip?.members.find(
//       item => item.userId === location.userId
//     );

//     // Do not display locations for members who have disabled sharing.
//     if (member && !member.sharingEnabled) {
//       this.removeMarker(location.userId);
//       return;
//     }

//     const existing = this.markers.get(location.userId);

//     if (existing) {
//       existing.setLatLng([latitude, longitude]);
//       existing.setPopupContent(
//         this.createPopupContent(location)
//       );
//     } else if (this.map) {
//       const marker = L.circleMarker([latitude, longitude], {
//         radius: 9,
//         color: '#ffffff',
//         weight: 2,
//         fillColor: '#465be0',
//         fillOpacity: 1
//       }).addTo(this.map);

//       marker.bindPopup(this.createPopupContent(location));

//       this.markers.set(location.userId, marker);
//     }

//     const index = this.sharedLocations.findIndex(
//       item => item.userId === location.userId
//     );

//     if (index >= 0) {
//       this.sharedLocations[index] = location;
//     } else {
//       this.sharedLocations = [...this.sharedLocations, location];
//     }

//     this.cdr.detectChanges();
//   }

//   private createPopupContent(location: LocationResponse): string {
//     // Escape server-provided names before placing them in HTML.
//     const safeName = this.escapeHtml(location.userName || 'Trip member');
//     const safeTime = this.escapeHtml(
//       this.formatDate(location.recordedAt)
//     );

//     return `<strong>${safeName}</strong><br>Updated: ${safeTime}`;
//   }

//   private escapeHtml(value: string): string {
//     return value.replace(/[&<>"']/g, character => {
//       const entities: Record<string, string> = {
//         '&': '&amp;',
//         '<': '&lt;',
//         '>': '&gt;',
//         '"': '&quot;',
//         "'": '&#39;'
//       };

//       return entities[character];
//     });
//   }

//   private removeMarker(userId: number): void {
//     const marker = this.markers.get(userId);

//     if (marker && this.map) {
//       marker.removeFrom(this.map);
//     }

//     this.markers.delete(userId);
//   }

//   private async loadSharedLocations(): Promise<void> {
//     if (!this.groupId) {
//       return;
//     }

//     try {
//       const locations =
//         await this.groupService.getSharedLocations(this.groupId);

//       if (this.destroyed) {
//         return;
//       }

//       for (const location of locations) {
//         this.upsertLocation(location);
//       }

//       this.liveConnectionStatus =
//         'Connected to live trip updates.';
//       this.cdr.detectChanges();
//     } catch (error: unknown) {
//       if (this.destroyed) {
//         return;
//       }

//       console.error('[Location] Unable to load shared locations:', error);

//       this.liveConnectionStatus =
//         'Unable to load shared locations. Check your connection.';
//       this.cdr.detectChanges();
//     }
//   }

//   // ---------------- WEBSOCKET ----------------

//   private async connectToLiveUpdates(): Promise<void> {
//     if (
//       this.destroyed ||
//       !this.groupId ||
//       this.stompClient
//     ) {
//       return;
//     }

//     try {
//       const token = await this.authService.getToken();

//       if (this.destroyed) {
//         return;
//       }

//       if (!token) {
//         this.liveConnectionStatus =
//           'Please log in again to receive live updates.';
//         this.cdr.detectChanges();
//         return;
//       }

//       const groupId = this.groupId;

//       const client = new Client({
//         brokerURL: 'ws://localhost:8801/ws',
//         connectHeaders: {
//           Authorization: `Bearer ${token}`
//         },
//         reconnectDelay: 5000,
//         heartbeatIncoming: 10000,
//         heartbeatOutgoing: 10000,
//         onConnect: () => {
//           if (this.destroyed || this.stompClient !== client) {
//             return;
//           }

//           this.liveConnectionStatus =
//             'Connected to live trip updates.';

//           client.subscribe(
//             `/topic/groups/${groupId}/locations`,
//             (message: IMessage) => {
//               this.handleLiveLocation(message);
//             }
//           );

//           // Fetch the existing locations after subscribing so updates
//           // that happen during the initial fetch are not easily missed.
//           void this.loadSharedLocations();
//           this.cdr.detectChanges();
//         },
//         onStompError: frame => {
//           console.error(
//             '[WebSocket] STOMP error:',
//             frame.headers['message'],
//             frame.body
//           );

//           this.liveConnectionStatus =
//             'Live updates encountered an error.';
//           this.cdr.detectChanges();
//         },
//         onWebSocketClose: () => {
//           if (!this.destroyed) {
//             this.liveConnectionStatus =
//               'Live connection lost. Reconnecting...';
//             this.cdr.detectChanges();
//           }
//         },
//         onWebSocketError: event => {
//           console.error('[WebSocket] Connection error:', event);

//           if (!this.destroyed) {
//             this.liveConnectionStatus =
//               'Cannot connect to live updates.';
//             this.cdr.detectChanges();
//           }
//         }
//       });

//       this.stompClient = client;
//       client.activate();
//     } catch (error: unknown) {
//       console.error('[WebSocket] Unable to connect:', error);

//       if (!this.destroyed) {
//         this.liveConnectionStatus =
//           'Unable to start live updates.';
//         this.cdr.detectChanges();
//       }
//     }
//   }

//   private handleLiveLocation(message: IMessage): void {
//     if (this.destroyed) {
//       return;
//     }

//     try {
//       const location =
//         JSON.parse(message.body) as LocationResponse;

//       if (
//         !location ||
//         typeof location.userId !== 'number' ||
//         typeof location.latitude !== 'number' ||
//         typeof location.longitude !== 'number'
//       ) {
//         console.warn('[WebSocket] Invalid location message:', message.body);
//         return;
//       }

//       this.upsertLocation(location);
//     } catch (error) {
//       console.error('[WebSocket] Could not parse location:', error);
//     }
//   }

//   private updateCurrentMemberSharingStatus(): void {
//     const currentUser = this.authService.getCurrentUser();

//     if (!currentUser || !this.trip) {
//       return;
//     }

//     this.trip = {
//       ...this.trip,
//       members: this.trip.members.map(member =>
//         member.userId === currentUser.userId
//           ? { ...member, sharingEnabled: this.sharingEnabled }
//           : member
//       )
//     };

//     this.cdr.detectChanges();
//   }

//   // ---------------- EXISTING TRIP FEATURES ----------------

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
//       await this.showMessage(`Your trip join code is: ${joinCode}`);
//     }
//   }

//   async leaveTrip(): Promise<void> {
//     const groupId = this.trip?.id;

//     if (!groupId || this.loading || this.sharingBusy) {
//       return;
//     }

//     const confirmation = await this.alertController.create({
//       header: 'Leave Trip?',
//       message:
//         'Are you sure you want to leave this trip? You will be removed from its member list.',
//       buttons: [
//         { text: 'Cancel', role: 'cancel' },
//         {
//           text: 'Leave Trip',
//           role: 'destructive',
//           handler: () => {
//             void this.confirmLeaveTrip(groupId);
//           }
//         }
//       ]
//     });

//     await confirmation.present();
//   }

//   private async confirmLeaveTrip(groupId: number): Promise<void> {
//     if (this.destroyed || this.loading || this.sharingBusy) {
//       return;
//     }

//     this.loading = true;
//     this.cdr.detectChanges();

//     try {
//       // Stop local tracking before leaving the group.
//       this.stopWatchingLocation();

//       await this.groupService.leaveGroup(groupId);

//       if (this.destroyed) {
//         return;
//       }

//       const alert = await this.alertController.create({
//         header: 'Trip Left',
//         message: 'You have successfully left the trip.',
//         backdropDismiss: false,
//         buttons: [{
//           text: 'OK',
//           handler: () => {
//             void this.router.navigate(['/home']);
//           }
//         }]
//       });

//       await alert.present();
//     } catch (error: unknown) {
//       if (this.destroyed) {
//         return;
//       }

//       console.error('[TripDetails] Failed to leave trip:', error);

//       const httpError = error as {
//         status?: number;
//         message?: string;
//         error?: { message?: string; detail?: string };
//       };

//       let message: string;

//       if (httpError.status === 401) {
//         message = 'Please log in again to leave this trip.';
//       } else if (httpError.status === 403) {
//         message = 'You are not a member of this trip.';
//       } else if (httpError.status === 404) {
//         message = 'This trip could not be found.';
//       } else if (httpError.status === 409) {
//         message =
//           httpError.error?.detail ||
//           httpError.error?.message ||
//           'The trip creator cannot leave before transferring ownership.';
//       } else {
//         message =
//           httpError.error?.detail ||
//           httpError.error?.message ||
//           httpError.message ||
//           'Unable to leave this trip. Please try again.';
//       }

//       await this.showMessage(message);
//     } finally {
//       if (!this.destroyed) {
//         this.loading = false;
//         this.cdr.detectChanges();
//       }
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

//   private getLocationErrorMessage(error: unknown): string {
//     const httpError = error as {
//       status?: number;
//       message?: string;
//       error?: { message?: string; detail?: string };
//     };

//     if (httpError.status === 401) {
//       return 'Your session has expired. Please log in again.';
//     }

//     if (httpError.status === 403) {
//       return 'You are not a member of this trip.';
//     }

//     if (httpError.status === 404) {
//       return 'This trip could not be found.';
//     }

//     if (httpError.status === 409) {
//       return httpError.error?.detail ||
//         httpError.error?.message ||
//         'This trip is inactive or location sharing must be enabled first.';
//     }

//     return httpError.error?.detail ||
//       httpError.error?.message ||
//       httpError.message ||
//       'Location sharing failed. Please try again.';
//   }

//   private async showMessage(message: string): Promise<void> {
//     const alert = await this.alertController.create({
//       message,
//       buttons: ['OK']
//     });

//     await alert.present();
//   }

//   private stopWatchingLocation(): void {
//     if (
//       this.watchId !== null &&
//       navigator.geolocation
//     ) {
//       navigator.geolocation.clearWatch(this.watchId);
//       this.watchId = null;
//     }
//   }

//   ngOnDestroy(): void {
//     this.destroyed = true;

//     this.stopWatchingLocation();

//     if (this.stompClient) {
//       const client = this.stompClient;
//       this.stompClient = null;
//       void client.deactivate();
//     }

//     if (this.map) {
//       this.map.remove();
//       this.map = null;
//     }

//     this.markers.clear();
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
import { Client, IMessage } from '@stomp/stompjs';
import * as L from 'leaflet';

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

import { AuthService } from '../../core/auth.service';

import {
  GroupService,
  GroupDetailsResponse,
  GroupMemberResponse,
  LocationResponse
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

  sharingEnabled = false;
  sharingBusy = false;
  locationMessage = 'Loading location-sharing status...';
  liveConnectionStatus = 'Connecting to live updates...';
  sharedLocations: LocationResponse[] = [];

  private destroyed = false;
  private groupId: number | null = null;
  private watchId: number | null = null;

  private stompClient: Client | null = null;
  private map: L.Map | null = null;
  private mapInitialized = false;
  private hasAutoZoomedToMyLocation = false;

  private readonly markers = new Map<number, L.CircleMarker>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private authService: AuthService,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const groupId = Number(id);

    if (
      id === null ||
      id.trim() === '' ||
      !Number.isSafeInteger(groupId) ||
      groupId <= 0
    ) {
      this.loading = false;
      this.errorMessage = 'Invalid trip ID.';
      return;
    }

    this.groupId = groupId;
    void this.loadTrip(groupId);
  }

  async loadTrip(groupId: number): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.trip = null;

    try {
      const details =
        await this.groupService.getGroupDetails(groupId);

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

      const currentUser = this.authService.getCurrentUser();

      this.sharingEnabled = Boolean(
        this.trip.members.find(
          member => member.userId === currentUser?.userId
        )?.sharingEnabled
      );

      this.locationMessage = this.sharingEnabled
        ? 'Location sharing is enabled for this trip.'
        : 'Your location is not currently being shared.';

      this.cdr.detectChanges();

      // The map element exists after Angular renders the trip details.
      setTimeout(() => {
        if (this.destroyed) {
          return;
        }

        this.initializeMap();
        this.connectToLiveUpdates();
      }, 0);

      if (this.sharingEnabled) {
        this.startWatchingLocation();
      }
    } catch (error: unknown) {
      if (this.destroyed) {
        return;
      }

      console.error('[TripDetails] Failed to load trip:', error);

      const httpError = error as {
        status?: number;
        message?: string;
        error?: { message?: string; detail?: string };
      };

      if (httpError.status === 401) {
        this.errorMessage =
          'Your session has expired. Please log in again.';
      } else if (httpError.status === 403) {
        this.errorMessage =
          'You are not a member of this trip.';
      } else if (httpError.status === 404) {
        this.errorMessage = 'This trip could not be found.';
      } else {
        this.errorMessage =
          httpError.error?.detail ||
          httpError.error?.message ||
          httpError.message ||
          'Unable to load trip details. Please try again.';
      }
    } finally {
      if (!this.destroyed) {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }

  // ---------------- LOCATION SHARING ----------------

  async toggleLocationSharing(): Promise<void> {
    if (
      !this.groupId ||
      !this.trip ||
      !this.trip.active ||
      this.sharingBusy
    ) {
      return;
    }

    if (this.sharingEnabled) {
      await this.stopSharing();
    } else {
      await this.startSharing();
    }
  }

  private async startSharing(): Promise<void> {
    if (!this.groupId) {
      return;
    }

    if (!navigator.geolocation) {
      await this.showMessage(
        'This device or browser does not support geolocation.'
      );
      return;
    }

    this.sharingBusy = true;
    this.locationMessage = 'Enabling location sharing...';
    this.cdr.detectChanges();

    try {
      await this.groupService.setLocationSharing(
        this.groupId,
        true
      );

      if (this.destroyed) {
        return;
      }

      this.sharingEnabled = true;
      this.locationMessage =
        'Sharing enabled. Waiting for your device location...';

      this.updateCurrentMemberSharingStatus();
      this.startWatchingLocation();
    } catch (error: unknown) {
      console.error('[Location] Unable to enable sharing:', error);

      this.locationMessage = this.getLocationErrorMessage(error);

      await this.showMessage(this.locationMessage);
    } finally {
      if (!this.destroyed) {
        this.sharingBusy = false;
        this.cdr.detectChanges();
      }
    }
  }

  private async stopSharing(): Promise<void> {
    if (!this.groupId) {
      return;
    }

    this.sharingBusy = true;
    this.locationMessage = 'Disabling location sharing...';
    this.cdr.detectChanges();

    try {
      await this.groupService.setLocationSharing(
        this.groupId,
        false
      );

      if (this.destroyed) {
        return;
      }

      this.sharingEnabled = false;
      this.stopWatchingLocation();

      this.locationMessage =
        'Location sharing is off. Other members will no longer see your location.';

      // The backend excludes this member from future REST results.
      // Remove the marker locally immediately.
      const currentUser = this.authService.getCurrentUser();

      if (currentUser) {
        this.removeMarker(currentUser.userId);
        this.sharedLocations = this.sharedLocations.filter(
          location => location.userId !== currentUser.userId
        );
      }

      this.updateCurrentMemberSharingStatus();
    } catch (error: unknown) {
      console.error('[Location] Unable to disable sharing:', error);

      this.locationMessage = this.getLocationErrorMessage(error);

      await this.showMessage(this.locationMessage);
    } finally {
      if (!this.destroyed) {
        this.sharingBusy = false;
        this.cdr.detectChanges();
      }
    }
  }

  private startWatchingLocation(): void {
    if (
      this.destroyed ||
      !this.sharingEnabled ||
      this.watchId !== null ||
      !navigator.geolocation
    ) {
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      position => {
        void this.handlePosition(position);
      },
      error => {
        if (this.destroyed) {
          return;
        }

        console.error('[Location] Geolocation error:', error);

        if (error.code === error.PERMISSION_DENIED) {
          this.locationMessage =
            'Location permission was denied. Allow location access in your browser or device settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          this.locationMessage =
            'Your device could not determine its current location.';
        } else {
          this.locationMessage =
            'Location request timed out. Try again in an area with better GPS reception.';
        }

        this.cdr.detectChanges();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000
      }
    );
  }

  private async handlePosition(
    position: GeolocationPosition
  ): Promise<void> {
    const groupId = this.groupId;

    if (
      this.destroyed ||
      !this.sharingEnabled ||
      !groupId
    ) {
      return;
    }

    const request = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null
    };

    try {
      const saved =
        await this.groupService.updateMyLocation(
          groupId,
          request
        );

      if (this.destroyed || !this.sharingEnabled) {
        return;
      }

      this.locationMessage =
        `Your location was updated at ${this.formatDate(saved.recordedAt)}.`;

      // The WebSocket normally delivers this update too.
      // Upserting here gives the user immediate feedback.
      this.upsertLocation(saved);
      this.cdr.detectChanges();
    } catch (error: unknown) {
      if (this.destroyed) {
        return;
      }

      console.error('[Location] Failed to update location:', error);

      this.locationMessage = this.getLocationErrorMessage(error);
      this.cdr.detectChanges();
    }
  }

  // ---------------- MAP ----------------

  private initializeMap(): void {
    if (this.mapInitialized || !this.trip || this.destroyed) {
      return;
    }

    const element = document.getElementById('trip-location-map');

    if (!element) {
      console.warn('[Location] Map element was not found.');
      return;
    }

    this.map = L.map(element, {
      zoomControl: true
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.mapInitialized = true;

    // Correct map dimensions after Ionic has rendered the page.
    setTimeout(() => {
      if (this.destroyed || !this.map) {
        return;
      }

      this.map.invalidateSize();

      // If the current user's location arrived before map initialization,
      // zoom to it now. The helper guarantees this happens only once.
      this.zoomToMyLocationIfAvailable();
    }, 150);
  }

  /**
   * Zooms to the signed-in user's location once, at street-level zoom.
   * It is also called when REST/WebSocket location data arrives.
   */
  private zoomToMyLocationIfAvailable(): void {
    if (
      this.destroyed ||
      !this.map ||
      this.hasAutoZoomedToMyLocation
    ) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return;
    }

    const myLocation = this.sharedLocations.find(
      location => location.userId === currentUser.userId
    );

    if (!myLocation) {
      return;
    }

    const latitude = Number(myLocation.latitude);
    const longitude = Number(myLocation.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return;
    }

    this.hasAutoZoomedToMyLocation = true;

    this.map.flyTo(
      [latitude, longitude],
      17,
      {
        animate: true,
        duration: 1.5
      }
    );
  }


  private upsertLocation(location: LocationResponse): void {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return;
  }

  const member = this.trip?.members.find(
    item => item.userId === location.userId
  );

  // Do not display locations for members who have disabled sharing.
  if (member && !member.sharingEnabled) {
    this.removeMarker(location.userId);
    return;
  }

  // Check whether this member is the trip admin.
  // Assumes GroupMemberResponse contains a role field.
  const isAdmin = member?.role?.toUpperCase() === 'ADMIN';

  const markerColor = isAdmin ? '#e53935' : '#465be0';

  const existing = this.markers.get(location.userId);

  if (existing) {
    existing.setLatLng([latitude, longitude]);

    existing.setStyle({
      color: '#ffffff',
      weight: 2,
      fillColor: markerColor,
      fillOpacity: 1
    });

    existing.setPopupContent(
      this.createPopupContent(location)
    );
  } else if (this.map) {
    const marker = L.circleMarker([latitude, longitude], {
      radius: 9,
      color: '#ffffff',
      weight: 2,
      fillColor: markerColor,
      fillOpacity: 1
    }).addTo(this.map);

    marker.bindPopup(this.createPopupContent(location));

    this.markers.set(location.userId, marker);
  }

  const index = this.sharedLocations.findIndex(
    item => item.userId === location.userId
  );

  if (index >= 0) {
    this.sharedLocations[index] = location;
  } else {
    this.sharedLocations = [...this.sharedLocations, location];
  }

  // Zoom to our location only once.
  this.zoomToMyLocationIfAvailable();

  this.cdr.detectChanges();
}





  // private upsertLocation(location: LocationResponse): void {
  //   const latitude = Number(location.latitude);
  //   const longitude = Number(location.longitude);

  //   if (
  //     !Number.isFinite(latitude) ||
  //     !Number.isFinite(longitude) ||
  //     latitude < -90 ||
  //     latitude > 90 ||
  //     longitude < -180 ||
  //     longitude > 180
  //   ) {
  //     return;
  //   }

  //   const member = this.trip?.members.find(
  //     item => item.userId === location.userId
  //   );

  //   // Do not display locations for members who have disabled sharing.
  //   if (member && !member.sharingEnabled) {
  //     this.removeMarker(location.userId);
  //     return;
  //   }

  //   const existing = this.markers.get(location.userId);

  //   if (existing) {
  //     existing.setLatLng([latitude, longitude]);
  //     existing.setPopupContent(
  //       this.createPopupContent(location)
  //     );
  //   } else if (this.map) {
  //     const marker = L.circleMarker([latitude, longitude], {
  //       radius: 9,
  //       color: '#ffffff',
  //       weight: 2,
  //       fillColor: '#465be0',
  //       fillOpacity: 1
  //     }).addTo(this.map);

  //     marker.bindPopup(this.createPopupContent(location));

  //     this.markers.set(location.userId, marker);
  //   }

  //   const index = this.sharedLocations.findIndex(
  //     item => item.userId === location.userId
  //   );

  //   if (index >= 0) {
  //     this.sharedLocations[index] = location;
  //   } else {
  //     this.sharedLocations = [...this.sharedLocations, location];
  //   }

  //   // When our own first location arrives, zoom in once. Do not re-center
  //   // on every GPS/WebSocket update, so users can freely move the map.
  //   this.zoomToMyLocationIfAvailable();

  //   this.cdr.detectChanges();
  // }

  private createPopupContent(location: LocationResponse): string {
    // Escape server-provided names before placing them in HTML.
    const safeName = this.escapeHtml(location.userName || 'Trip member');
    const safeTime = this.escapeHtml(
      this.formatDate(location.recordedAt)
    );

    return `<strong>${safeName}</strong><br>Updated: ${safeTime}`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };

      return entities[character];
    });
  }

  private removeMarker(userId: number): void {
    const marker = this.markers.get(userId);

    if (marker && this.map) {
      marker.removeFrom(this.map);
    }

    this.markers.delete(userId);
  }

  private async loadSharedLocations(): Promise<void> {
    if (!this.groupId) {
      return;
    }

    try {
      const locations =
        await this.groupService.getSharedLocations(this.groupId);

      if (this.destroyed) {
        return;
      }

      for (const location of locations) {
        this.upsertLocation(location);
      }

      this.liveConnectionStatus =
        'Connected to live trip updates.';
      this.cdr.detectChanges();
    } catch (error: unknown) {
      if (this.destroyed) {
        return;
      }

      console.error('[Location] Unable to load shared locations:', error);

      this.liveConnectionStatus =
        'Unable to load shared locations. Check your connection.';
      this.cdr.detectChanges();
    }
  }

  // ---------------- WEBSOCKET ----------------

  private async connectToLiveUpdates(): Promise<void> {
    if (
      this.destroyed ||
      !this.groupId ||
      this.stompClient
    ) {
      return;
    }

    try {
      const token = await this.authService.getToken();

      if (this.destroyed) {
        return;
      }

      if (!token) {
        this.liveConnectionStatus =
          'Please log in again to receive live updates.';
        this.cdr.detectChanges();
        return;
      }

      const groupId = this.groupId;

      const client = new Client({
        brokerURL: 'ws://localhost:8801/ws',
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          if (this.destroyed || this.stompClient !== client) {
            return;
          }

          this.liveConnectionStatus =
            'Connected to live trip updates.';

          client.subscribe(
            `/topic/groups/${groupId}/locations`,
            (message: IMessage) => {
              this.handleLiveLocation(message);
            }
          );

          // Fetch the existing locations after subscribing so updates
          // that happen during the initial fetch are not easily missed.
          void this.loadSharedLocations();
          this.cdr.detectChanges();
        },
        onStompError: frame => {
          console.error(
            '[WebSocket] STOMP error:',
            frame.headers['message'],
            frame.body
          );

          this.liveConnectionStatus =
            'Live updates encountered an error.';
          this.cdr.detectChanges();
        },
        onWebSocketClose: () => {
          if (!this.destroyed) {
            this.liveConnectionStatus =
              'Live connection lost. Reconnecting...';
            this.cdr.detectChanges();
          }
        },
        onWebSocketError: event => {
          console.error('[WebSocket] Connection error:', event);

          if (!this.destroyed) {
            this.liveConnectionStatus =
              'Cannot connect to live updates.';
            this.cdr.detectChanges();
          }
        }
      });

      this.stompClient = client;
      client.activate();
    } catch (error: unknown) {
      console.error('[WebSocket] Unable to connect:', error);

      if (!this.destroyed) {
        this.liveConnectionStatus =
          'Unable to start live updates.';
        this.cdr.detectChanges();
      }
    }
  }

  private handleLiveLocation(message: IMessage): void {
    if (this.destroyed) {
      return;
    }

    try {
      const location =
        JSON.parse(message.body) as LocationResponse;

      if (
        !location ||
        typeof location.userId !== 'number' ||
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number'
      ) {
        console.warn('[WebSocket] Invalid location message:', message.body);
        return;
      }

      this.upsertLocation(location);
    } catch (error) {
      console.error('[WebSocket] Could not parse location:', error);
    }
  }

  private updateCurrentMemberSharingStatus(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !this.trip) {
      return;
    }

    this.trip = {
      ...this.trip,
      members: this.trip.members.map(member =>
        member.userId === currentUser.userId
          ? { ...member, sharingEnabled: this.sharingEnabled }
          : member
      )
    };

    this.cdr.detectChanges();
  }

  // ---------------- EXISTING TRIP FEATURES ----------------

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
      await this.showMessage('Join code copied to clipboard.');
    } catch {
      await this.showMessage(`Your trip join code is: ${joinCode}`);
    }
  }

  async leaveTrip(): Promise<void> {
    const groupId = this.trip?.id;

    if (!groupId || this.loading || this.sharingBusy) {
      return;
    }

    const confirmation = await this.alertController.create({
      header: 'Leave Trip?',
      message:
        'Are you sure you want to leave this trip? You will be removed from its member list.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
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

  private async confirmLeaveTrip(groupId: number): Promise<void> {
    if (this.destroyed || this.loading || this.sharingBusy) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    try {
      // Stop local tracking before leaving the group.
      this.stopWatchingLocation();

      await this.groupService.leaveGroup(groupId);

      if (this.destroyed) {
        return;
      }

      const alert = await this.alertController.create({
        header: 'Trip Left',
        message: 'You have successfully left the trip.',
        backdropDismiss: false,
        buttons: [{
          text: 'OK',
          handler: () => {
            void this.router.navigate(['/home']);
          }
        }]
      });

      await alert.present();
    } catch (error: unknown) {
      if (this.destroyed) {
        return;
      }

      console.error('[TripDetails] Failed to leave trip:', error);

      const httpError = error as {
        status?: number;
        message?: string;
        error?: { message?: string; detail?: string };
      };

      let message: string;

      if (httpError.status === 401) {
        message = 'Please log in again to leave this trip.';
      } else if (httpError.status === 403) {
        message = 'You are not a member of this trip.';
      } else if (httpError.status === 404) {
        message = 'This trip could not be found.';
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

      await this.showMessage(message);
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

  private getLocationErrorMessage(error: unknown): string {
    const httpError = error as {
      status?: number;
      message?: string;
      error?: { message?: string; detail?: string };
    };

    if (httpError.status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (httpError.status === 403) {
      return 'You are not a member of this trip.';
    }

    if (httpError.status === 404) {
      return 'This trip could not be found.';
    }

    if (httpError.status === 409) {
      return httpError.error?.detail ||
        httpError.error?.message ||
        'This trip is inactive or location sharing must be enabled first.';
    }

    return httpError.error?.detail ||
      httpError.error?.message ||
      httpError.message ||
      'Location sharing failed. Please try again.';
  }

  private async showMessage(message: string): Promise<void> {
    const alert = await this.alertController.create({
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

  private stopWatchingLocation(): void {
    if (
      this.watchId !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    this.stopWatchingLocation();

    if (this.stompClient) {
      const client = this.stompClient;
      this.stompClient = null;
      void client.deactivate();
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.markers.clear();
  }
}