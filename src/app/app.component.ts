import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, of } from 'rxjs';
import { Geolocation, Position } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';

import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { PermissionsService } from './services/permissions.service';
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  'BackgroundGeolocation'
);

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  positionOptions: PositionOptions = {
    enableHighAccuracy: true,
  };
  watcherID: string = '';
  isNativePlatform = Capacitor.isNativePlatform();

  constructor(
    private platform: Platform,
    private permissions: PermissionsService,
    private httpClient: HttpClient
  ) {}

  // https://ionicframework.com/docs/cli/commands/build
  // https://ionicframework.com/docs/native/geolocation
  // https://www.npmjs.com/package/@capacitor-community/background-geolocation?activeTab=readme

  ngOnInit() {
    this.initializeLocationTracking();
  }

  initializeLocationTracking() {
    if (Capacitor.isNativePlatform()) {
      this.handleBackgroundGeoLocation();
    } else {
      this.watchLocation();
    }
  }

  async handleBackgroundGeoLocation() {
    // Wait for the platform to be ready
    await this.platform.ready();

    // Request notification permission on Android 13+
    const notificationPermissionGranted =
      await this.permissions.requestNotificationPermission();

    if (!notificationPermissionGranted) {
      alert('User denied notification permissions. Background geolocation may not work correctly.');
      // Handle the case where the user denies permission
      return;
    }
    this.startWatchingBackgroundGeoLocation();
  }

  startWatchingBackgroundGeoLocation() {
    BackgroundGeolocation.addWatcher(
      {
        // If the "backgroundMessage" option is defined, the watcher will
        // provide location updates whether the app is in the background or the
        // foreground. If it is not defined, location updates are only
        // guaranteed in the foreground. This is true on both platforms.

        // On Android, a notification must be shown to continue receiving
        // location updates in the background. This option specifies the text of
        // that notification.
        backgroundMessage: 'Cancel to prevent battery drain.',

        // The title of the notification mentioned above. Defaults to "Using
        // your location".
        backgroundTitle: 'Tracking You.',

        // Whether permissions should be requested from the user automatically,
        // if they are not already granted. Defaults to "true".
        requestPermissions: true,

        // If "true", stale locations may be delivered while the device
        // obtains a GPS fix. You are responsible for checking the "time"
        // property. If "false", locations are guaranteed to be up to date.
        // Defaults to "false".
        stale: false,

        // The minimum number of metres between subsequent locations. Defaults
        // to 0.
        distanceFilter: 50,
      },
      (location, error) => {
        if (error) {
          if (error.code === 'NOT_AUTHORIZED') {
            if (
              window.confirm(
                'This app needs your location, ' +
                  'but does not have permission.\n\n' +
                  'Open settings now?'
              )
            ) {
              // It can be useful to direct the user to their device's
              // settings when location permissions have been denied. The
              // plugin provides the 'openSettings' method to do exactly
              // this.
              BackgroundGeolocation.openSettings();
            }
          }
          return console.error(error);
        }
        this.sendLocationToAPI(location);
      }
    ).then((watcher_id) => {
      // When a watcher is no longer needed, it should be removed by calling
      // 'removeWatcher' with an object containing its ID.
      this.watcherID = watcher_id;
    });
  }

  startBackgroundLocationTracking() {
    this.handleBackgroundGeoLocation();
  }

  stopBackgroundLocationTracking() {
    // When a watcher is no longer needed, it should be removed by calling
    // 'removeWatcher' with an object containing its ID.
    BackgroundGeolocation.removeWatcher({
      id: this.watcherID,
    });
    this.watcherID = '';
    alert('Location tracking stopped');
  }

  watchLocation() {
    // Start watching the live location when the component is initialized
    Geolocation.watchPosition(
      this.positionOptions,
      (position: Position | null, error: any) => {
        if (error) {
          // code: 1: PERMISSION_DENIED – The user has denied the request for geolocation access.
          // code: 2: POSITION_UNAVAILABLE – The device is unable to retrieve the location (this can happen if the GPS is disabled,
          //                                 the device is indoors with no GPS signal, or the network cannot fetch the location).
          // code: 3: TIMEOUT – The request to fetch the location took too long, and it timed out.
          console.error('Error watching location', error);
          return;
        }
        if (position?.coords) {
          const locationData = position.coords;
          console.log('Live Location:', locationData);

          // Send the location to API
          this.sendLocationToAPI(locationData);
        } else {
          alert('Position object or coordinates are null');
        }
      }
    );
  }

  // Send location to API
  private sendLocationToAPI(location: any) {
    this.httpClient
      .post('https://6f2fa5db34e4.ngrok-free.app/send-data', location)
      .pipe(
        catchError((error) => {
          // Handle the error
          console.error('Error occurred:', error);

          // Optionally, you can display a user-friendly message or log the error
          let errorMessage =
            'An error occurred while processing your request. Please try again later.';

          if (error.status === 0) {
            // Network error (e.g., no internet, server not reachable)
            errorMessage =
              'Unable to connect to the server. Please check your internet connection.';
          } else if (error.status >= 500) {
            // Server errors (500-599)
            errorMessage = 'Server error. Please try again later.';
          } else if (error.status === 400) {
            // Bad request error (400-499)
            errorMessage =
              'There was an issue with the request. Please check the data and try again.';
          }

          alert(errorMessage);

          // Return an observable with a user-friendly error message
          return of({ error: true, message: errorMessage });
        })
      )
      .subscribe(
        (response) => {
          // Handle successful response
          // console.log('API Response:', response);
        },
        (error) => {
          // Handle any errors that were thrown in the subscription
          console.error('API Error:', error);
        }
      );
  }

  ngOnDestroy(): void {
    if (this.watcherID) {
      BackgroundGeolocation.removeWatcher({ id: this.watcherID });
    }
  }
}
