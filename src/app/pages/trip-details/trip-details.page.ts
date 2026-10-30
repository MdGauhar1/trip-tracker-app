


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
//   private hasAutoZoomedToMyLocation = false;

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

//     // Correct map dimensions after Ionic has rendered the page.
//     setTimeout(() => {
//       if (this.destroyed || !this.map) {
//         return;
//       }

//       this.map.invalidateSize();

//       // If the current user's location arrived before map initialization,
//       // zoom to it now. The helper guarantees this happens only once.
//       this.zoomToMyLocationIfAvailable();
//     }, 150);
//   }

//   /**
//    * Zooms to the signed-in user's location once, at street-level zoom.
//    * It is also called when REST/WebSocket location data arrives.
//    */
//   private zoomToMyLocationIfAvailable(): void {
//     if (
//       this.destroyed ||
//       !this.map ||
//       this.hasAutoZoomedToMyLocation
//     ) {
//       return;
//     }

//     const currentUser = this.authService.getCurrentUser();

//     if (!currentUser) {
//       return;
//     }

//     const myLocation = this.sharedLocations.find(
//       location => location.userId === currentUser.userId
//     );

//     if (!myLocation) {
//       return;
//     }

//     const latitude = Number(myLocation.latitude);
//     const longitude = Number(myLocation.longitude);

//     if (
//       !Number.isFinite(latitude) ||
//       !Number.isFinite(longitude) ||
//       latitude < -90 || latitude > 90 ||
//       longitude < -180 || longitude > 180
//     ) {
//       return;
//     }

//     this.hasAutoZoomedToMyLocation = true;

//     this.map.flyTo(
//       [latitude, longitude],
//       17,
//       {
//         animate: true,
//         duration: 1.5
//       }
//     );
//   }


//   private upsertLocation(location: LocationResponse): void {
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

//   // Check whether this member is the trip admin.
//   // Assumes GroupMemberResponse contains a role field.
//   const isAdmin = member?.role?.toUpperCase() === 'ADMIN';

//   const markerColor = isAdmin ? '#e53935' : '#465be0';

//   const existing = this.markers.get(location.userId);

//   if (existing) {
//     existing.setLatLng([latitude, longitude]);

//     existing.setStyle({
//       color: '#ffffff',
//       weight: 2,
//       fillColor: markerColor,
//       fillOpacity: 1
//     });

//     existing.setPopupContent(
//       this.createPopupContent(location)
//     );
//   } else if (this.map) {
//     const marker = L.circleMarker([latitude, longitude], {
//       radius: 9,
//       color: '#ffffff',
//       weight: 2,
//       fillColor: markerColor,
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

//   // Zoom to our location only once.
//   this.zoomToMyLocationIfAvailable();

//   this.cdr.detectChanges();
// }





//   // private upsertLocation(location: LocationResponse): void {
//   //   const latitude = Number(location.latitude);
//   //   const longitude = Number(location.longitude);

//   //   if (
//   //     !Number.isFinite(latitude) ||
//   //     !Number.isFinite(longitude) ||
//   //     latitude < -90 ||
//   //     latitude > 90 ||
//   //     longitude < -180 ||
//   //     longitude > 180
//   //   ) {
//   //     return;
//   //   }

//   //   const member = this.trip?.members.find(
//   //     item => item.userId === location.userId
//   //   );

//   //   // Do not display locations for members who have disabled sharing.
//   //   if (member && !member.sharingEnabled) {
//   //     this.removeMarker(location.userId);
//   //     return;
//   //   }

//   //   const existing = this.markers.get(location.userId);

//   //   if (existing) {
//   //     existing.setLatLng([latitude, longitude]);
//   //     existing.setPopupContent(
//   //       this.createPopupContent(location)
//   //     );
//   //   } else if (this.map) {
//   //     const marker = L.circleMarker([latitude, longitude], {
//   //       radius: 9,
//   //       color: '#ffffff',
//   //       weight: 2,
//   //       fillColor: '#465be0',
//   //       fillOpacity: 1
//   //     }).addTo(this.map);

//   //     marker.bindPopup(this.createPopupContent(location));

//   //     this.markers.set(location.userId, marker);
//   //   }

//   //   const index = this.sharedLocations.findIndex(
//   //     item => item.userId === location.userId
//   //   );

//   //   if (index >= 0) {
//   //     this.sharedLocations[index] = location;
//   //   } else {
//   //     this.sharedLocations = [...this.sharedLocations, location];
//   //   }

//   //   // When our own first location arrives, zoom in once. Do not re-center
//   //   // on every GPS/WebSocket update, so users can freely move the map.
//   //   this.zoomToMyLocationIfAvailable();

//   //   this.cdr.detectChanges();
//   // }

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
//   private hasAutoZoomedToMyLocation = false;

//   private readonly markers = new Map<number, L.CircleMarker>();
//   // One line per non-admin member, connecting that member to the admin.
//   private readonly memberLines = new Map<number, L.Polyline>();

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

//     // Correct map dimensions after Ionic has rendered the page.
//     setTimeout(() => {
//       if (this.destroyed || !this.map) {
//         return;
//       }

//       this.map.invalidateSize();

//       // If the current user's location arrived before map initialization,
//       // zoom to it now. The helper guarantees this happens only once.
//       this.zoomToMyLocationIfAvailable();
//     }, 150);
//   }

//   /**
//    * Zooms to the signed-in user's location once, at street-level zoom.
//    * It is also called when REST/WebSocket location data arrives.
//    */
//   private zoomToMyLocationIfAvailable(): void {
//     if (
//       this.destroyed ||
//       !this.map ||
//       this.hasAutoZoomedToMyLocation
//     ) {
//       return;
//     }

//     const currentUser = this.authService.getCurrentUser();

//     if (!currentUser) {
//       return;
//     }

//     const myLocation = this.sharedLocations.find(
//       location => location.userId === currentUser.userId
//     );

//     if (!myLocation) {
//       return;
//     }

//     const latitude = Number(myLocation.latitude);
//     const longitude = Number(myLocation.longitude);

//     if (
//       !Number.isFinite(latitude) ||
//       !Number.isFinite(longitude) ||
//       latitude < -90 || latitude > 90 ||
//       longitude < -180 || longitude > 180
//     ) {
//       return;
//     }

//     this.hasAutoZoomedToMyLocation = true;

//     this.map.flyTo(
//       [latitude, longitude],
//       17,
//       {
//         animate: true,
//         duration: 1.5
//       }
//     );
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
//       this.removeMemberLine(location.userId);

//       this.sharedLocations = this.sharedLocations.filter(
//         item => item.userId !== location.userId
//       );

//       this.refreshMemberConnections();
//       this.cdr.detectChanges();
//       return;
//     }

//     // Admin markers are red; all other member markers are blue.
//     const isAdmin = member?.role?.toUpperCase() === 'ADMIN';
//     const markerColor = isAdmin ? '#e53935' : '#465be0';

//     const existing = this.markers.get(location.userId);

//     if (existing) {
//       existing.setLatLng([latitude, longitude]);
//       existing.setStyle({
//         color: '#ffffff',
//         weight: 2,
//         fillColor: markerColor,
//         fillOpacity: 1
//       });
//       existing.setPopupContent(this.createPopupContent(location));
//     } else if (this.map) {
//       const marker = L.circleMarker([latitude, longitude], {
//         radius: 9,
//         color: '#ffffff',
//         weight: 2,
//         fillColor: markerColor,
//         fillOpacity: 1
//       }).addTo(this.map);

//       marker.bindPopup(this.createPopupContent(location));
//       this.markers.set(location.userId, marker);
//     }

//     // Insert or replace this member's latest location.
//     const index = this.sharedLocations.findIndex(
//       item => item.userId === location.userId
//     );

//     if (index >= 0) {
//       this.sharedLocations[index] = location;
//     } else {
//       this.sharedLocations = [...this.sharedLocations, location];
//     }

//     // Recalculate admin-to-member lines after every location update.
//     this.refreshMemberConnections();

//     // Zoom to our location only once.
//     this.zoomToMyLocationIfAvailable();

//     this.cdr.detectChanges();
//   }

//   /**
//    * Draws exactly one line from the admin to each other member
//    * who has enabled location sharing and has a known location.
//    * No member-to-member lines are created.
//    */
//   private refreshMemberConnections(): void {
//     if (!this.map || !this.trip) {
//       return;
//     }

//     const admin = this.trip.members.find(
//       member => member.role?.toUpperCase() === 'ADMIN'
//     );

//     if (!admin || !admin.sharingEnabled) {
//       this.clearMemberConnections();
//       return;
//     }

//     const adminLocation = this.sharedLocations.find(
//       location => location.userId === admin.userId
//     );

//     if (!adminLocation) {
//       this.clearMemberConnections();
//       return;
//     }

//     for (const member of this.trip.members) {
//       // Never draw a line from the admin to themselves.
//       if (member.userId === admin.userId) {
//         continue;
//       }

//       if (!member.sharingEnabled) {
//         this.removeMemberLine(member.userId);
//         continue;
//       }

//       const memberLocation = this.sharedLocations.find(
//         location => location.userId === member.userId
//       );

//       if (!memberLocation) {
//         this.removeMemberLine(member.userId);
//         continue;
//       }

//       const positions: L.LatLngExpression[] = [
//         [adminLocation.latitude, adminLocation.longitude],
//         [memberLocation.latitude, memberLocation.longitude]
//       ];

//       const existingLine = this.memberLines.get(member.userId);

//       if (existingLine) {
//         existingLine.setLatLngs(positions);
//       } else {
//         const line = L.polyline(positions, {
//           color: '#64748b',
//           weight: 3,
//           opacity: 0.8,
//           dashArray: '8, 8'
//         }).addTo(this.map);

//         line.bringToBack();
//         this.memberLines.set(member.userId, line);
//       }
//     }

//     // Remove any line whose member is no longer eligible.
//     const validMemberIds = new Set(
//       this.trip.members
//         .filter(member =>
//           member.userId !== admin.userId &&
//           member.sharingEnabled &&
//           this.sharedLocations.some(
//             location => location.userId === member.userId
//           )
//         )
//         .map(member => member.userId)
//     );

//     this.memberLines.forEach((line, userId) => {
//       if (!validMemberIds.has(userId)) {
//         line.removeFrom(this.map!);
//         this.memberLines.delete(userId);
//       }
//     });
//   }

//   private removeMemberLine(userId: number): void {
//     const line = this.memberLines.get(userId);

//     if (line && this.map) {
//       line.removeFrom(this.map);
//     }

//     this.memberLines.delete(userId);
//   }

//   private clearMemberConnections(): void {
//     this.memberLines.forEach(line => {
//       if (this.map) {
//         line.removeFrom(this.map);
//       }
//     });

//     this.memberLines.clear();
//   }



//   // private upsertLocation(location: LocationResponse): void {
//   //   const latitude = Number(location.latitude);
//   //   const longitude = Number(location.longitude);

//   //   if (
//   //     !Number.isFinite(latitude) ||
//   //     !Number.isFinite(longitude) ||
//   //     latitude < -90 ||
//   //     latitude > 90 ||
//   //     longitude < -180 ||
//   //     longitude > 180
//   //   ) {
//   //     return;
//   //   }

//   //   const member = this.trip?.members.find(
//   //     item => item.userId === location.userId
//   //   );

//   //   // Do not display locations for members who have disabled sharing.
//   //   if (member && !member.sharingEnabled) {
//   //     this.removeMarker(location.userId);
//   //     return;
//   //   }

//   //   const existing = this.markers.get(location.userId);

//   //   if (existing) {
//   //     existing.setLatLng([latitude, longitude]);
//   //     existing.setPopupContent(
//   //       this.createPopupContent(location)
//   //     );
//   //   } else if (this.map) {
//   //     const marker = L.circleMarker([latitude, longitude], {
//   //       radius: 9,
//   //       color: '#ffffff',
//   //       weight: 2,
//   //       fillColor: '#465be0',
//   //       fillOpacity: 1
//   //     }).addTo(this.map);

//   //     marker.bindPopup(this.createPopupContent(location));

//   //     this.markers.set(location.userId, marker);
//   //   }

//   //   const index = this.sharedLocations.findIndex(
//   //     item => item.userId === location.userId
//   //   );

//   //   if (index >= 0) {
//   //     this.sharedLocations[index] = location;
//   //   } else {
//   //     this.sharedLocations = [...this.sharedLocations, location];
//   //   }

//   //   // When our own first location arrives, zoom in once. Do not re-center
//   //   // on every GPS/WebSocket update, so users can freely move the map.
//   //   this.zoomToMyLocationIfAvailable();

//   //   this.cdr.detectChanges();
//   // }

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

//     this.refreshMemberConnections();
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
//     this.memberLines.clear();
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
  // One line per non-admin member, connecting that member to the admin.
  private readonly memberLines = new Map<number, L.Polyline>();
  private readonly memberRoutes = new Map<number, L.Polyline>();
  private readonly routeControllers = new Map<number, AbortController>();
  private readonly routeEndpoints = new Map<number, {
    adminLat: number; adminLng: number; memberLat: number; memberLng: number;
  }>();

  // Previous behavior is the default. The page toggle switches to road routes.
  connectionMode: 'direct' | 'road' = 'direct';

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
      this.removeMemberLine(location.userId);

      this.sharedLocations = this.sharedLocations.filter(
        item => item.userId !== location.userId
      );

      this.refreshMemberConnections();
      this.cdr.detectChanges();
      return;
    }

    // Admin markers are red; all other member markers are blue.
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
      existing.setPopupContent(this.createPopupContent(location));
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

    // Insert or replace this member's latest location.
    const index = this.sharedLocations.findIndex(
      item => item.userId === location.userId
    );

    if (index >= 0) {
      this.sharedLocations[index] = location;
    } else {
      this.sharedLocations = [...this.sharedLocations, location];
    }

    // Recalculate admin-to-member lines after every location update.
    this.refreshMemberConnections();

    // Zoom to our location only once.
    this.zoomToMyLocationIfAvailable();

    this.cdr.detectChanges();
  }

  /**
   * Draws exactly one line from the admin to each other member
   * who has enabled location sharing and has a known location.
   * No member-to-member lines are created.
   */
  private refreshMemberConnections(): void {
    if (!this.map || !this.trip) {
      return;
    }

    const admin = this.trip.members.find(
      member => member.role?.toUpperCase() === 'ADMIN'
    );

    if (!admin || !admin.sharingEnabled) {
      this.clearMemberConnections();
      this.clearMemberRoutes();
      return;
    }

    const adminLocation = this.sharedLocations.find(
      location => location.userId === admin.userId
    );

    if (!adminLocation) {
      this.clearMemberConnections();
      this.clearMemberRoutes();
      return;
    }

    if (this.connectionMode === 'direct') {
      this.clearMemberRoutes();
      this.refreshDirectMemberConnections(admin.userId, adminLocation);
    } else {
      this.clearMemberConnections();
      this.refreshRoadMemberConnections(admin.userId, adminLocation);
    }
  }

  /** Previous mode: one straight line from each sharing member to the admin. */
  private refreshDirectMemberConnections(
    adminUserId: number,
    adminLocation: LocationResponse
  ): void {
    if (!this.map || !this.trip) return;

    for (const member of this.trip.members) {
      if (member.userId === adminUserId || !member.sharingEnabled) {
        this.removeMemberLine(member.userId);
        continue;
      }

      const location = this.sharedLocations.find(
        item => item.userId === member.userId
      );
      if (!location) {
        this.removeMemberLine(member.userId);
        continue;
      }

      const positions: L.LatLngExpression[] = [
        [Number(adminLocation.latitude), Number(adminLocation.longitude)],
        [Number(location.latitude), Number(location.longitude)]
      ];
      const existing = this.memberLines.get(member.userId);
      if (existing) {
        existing.setLatLngs(positions);
      } else {
        const line = L.polyline(positions, {
          color: '#64748b', weight: 3, opacity: 0.8, dashArray: '8, 8'
        }).addTo(this.map);
        line.bringToBack();
        this.memberLines.set(member.userId, line);
      }
    }

    const validIds = new Set(this.trip.members
      .filter(member => member.userId !== adminUserId && member.sharingEnabled &&
        this.sharedLocations.some(location => location.userId === member.userId))
      .map(member => member.userId));
    this.memberLines.forEach((line, userId) => {
      if (!validIds.has(userId)) this.removeMemberLine(userId);
    });
  }

  /** New mode: request an individual road route from each member to the admin. */
  private refreshRoadMemberConnections(
    adminUserId: number,
    adminLocation: LocationResponse
  ): void {
    if (!this.trip) return;

    const validIds = new Set<number>();
    for (const member of this.trip.members) {
      if (member.userId === adminUserId || !member.sharingEnabled) continue;
      const location = this.sharedLocations.find(
        item => item.userId === member.userId
      );
      if (!location) continue;
      validIds.add(member.userId);
      void this.updateRoadRoute(member.userId, adminLocation, location);
    }

    this.memberRoutes.forEach((route, userId) => {
      if (!validIds.has(userId)) this.removeMemberRoute(userId);
    });
    this.routeControllers.forEach((_controller, userId) => {
      if (!validIds.has(userId)) this.removeMemberRoute(userId);
    });
  }

  private async updateRoadRoute(
    userId: number,
    admin: LocationResponse,
    member: LocationResponse
  ): Promise<void> {
    if (!this.map || this.connectionMode !== 'road') return;

    const adminLat = Number(admin.latitude);
    const adminLng = Number(admin.longitude);
    const memberLat = Number(member.latitude);
    const memberLng = Number(member.longitude);
    const previous = this.routeEndpoints.get(userId);

    // Avoid repeated routing calls for tiny GPS movements (30 metres).
    if (previous && this.distanceMetres(previous.adminLat, previous.adminLng, adminLat, adminLng) < 30 &&
        this.distanceMetres(previous.memberLat, previous.memberLng, memberLat, memberLng) < 30 &&
        this.memberRoutes.has(userId)) return;

    this.routeControllers.get(userId)?.abort();
    const controller = new AbortController();
    this.routeControllers.set(userId, controller);

    try {
      // OSRM expects longitude,latitude coordinates.
      const url = `https://router.project-osrm.org/route/v1/driving/${adminLng},${adminLat};${memberLng},${memberLat}?overview=full&geometries=geojson`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`OSRM returned ${response.status}`);
      const data = await response.json();
      if (controller.signal.aborted || this.destroyed || this.connectionMode !== 'road') return;
      const coordinates = data?.routes?.[0]?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        throw new Error('No road route was found.');
      }

      const latLngs: L.LatLngExpression[] = coordinates.map(
        (point: [number, number]) => [point[1], point[0]]
      );
      let route = this.memberRoutes.get(userId);
      if (route) {
        route.setLatLngs(latLngs);
      } else if (this.map) {
        route = L.polyline(latLngs, {
          color: '#1683e8', weight: 5, opacity: 0.9
        }).addTo(this.map);
        route.bringToBack();
        this.memberRoutes.set(userId, route);
      }
      this.routeEndpoints.set(userId, { adminLat, adminLng, memberLat, memberLng });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.warn(`[Routing] Could not calculate route for member ${userId}:`, error);
        // Keep the member visible; fall back to a straight connector if OSRM is unavailable.
        if (this.map && this.connectionMode === 'road') {
          const fallback = L.polyline(
            [[adminLat, adminLng], [memberLat, memberLng]],
            { color: '#94a3b8', weight: 3, dashArray: '5, 7', opacity: 0.8 }
          ).addTo(this.map);
          const old = this.memberRoutes.get(userId);
          if (old) old.removeFrom(this.map);
          this.memberRoutes.set(userId, fallback);
        }
      }
    } finally {
      if (this.routeControllers.get(userId) === controller) {
        this.routeControllers.delete(userId);
      }
    }
  }

  private distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const rad = (value: number) => value * Math.PI / 180;
    const dLat = rad(lat2 - lat1);
    const dLng = rad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Called by the UI toggle. */
  setConnectionMode(mode: 'direct' | 'road'): void {
    if (this.connectionMode === mode) return;
    this.connectionMode = mode;
    this.clearMemberConnections();
    this.clearMemberRoutes();
    this.routeEndpoints.clear();
    this.refreshMemberConnections();
    this.cdr.detectChanges();
  }

  private removeMemberRoute(userId: number): void {
    this.routeControllers.get(userId)?.abort();
    this.routeControllers.delete(userId);
    const route = this.memberRoutes.get(userId);
    if (route && this.map) route.removeFrom(this.map);
    this.memberRoutes.delete(userId);
    this.routeEndpoints.delete(userId);
  }

  private clearMemberRoutes(): void {
    Array.from(this.routeControllers.keys()).forEach(id => this.removeMemberRoute(id));
    this.memberRoutes.forEach(route => { if (this.map) route.removeFrom(this.map); });
    this.memberRoutes.clear();
    this.routeEndpoints.clear();
  }

  private removeMemberLine(userId: number): void {
    const line = this.memberLines.get(userId);

    if (line && this.map) {
      line.removeFrom(this.map);
    }

    this.memberLines.delete(userId);
  }

  private clearMemberConnections(): void {
    this.memberLines.forEach(line => {
      if (this.map) {
        line.removeFrom(this.map);
      }
    });

    this.memberLines.clear();
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

    this.refreshMemberConnections();
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
    this.memberLines.clear();
    this.clearMemberRoutes();
  }
}