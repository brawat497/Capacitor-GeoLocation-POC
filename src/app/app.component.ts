import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, of, Subscription } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  locations: any[] = []; // To store locations with timestamps
  locationSubscription: Subscription | null = null;
  errors: any[] = [];
  logs: any[] = [];
  private locationSubject = new BehaviorSubject<any[]>([]); // Store an array of locations with timestamps
  public location$ = this.locationSubject.asObservable(); // Observable to expose location updates

  positionOptions : PositionOptions = {
    enableHighAccuracy: true
  }

  constructor(private httpClient: HttpClient) {}

  // https://ionicframework.com/docs/native/geolocation

  ngOnInit() {
    this.startWatchingLocation();    
  }

  startWatchingLocation(){
    // Start watching the live location when the component is initialized
    this.watchLocation();

    // Subscribe to location updates
    this.locationSubscription = this.location$.subscribe(
      (locationData) => {
        this.locations = locationData; // Update the location
      }
    );
  }

  // Watch location for updates
  watchLocation() {
    this.logs.push("location watching started");
    Geolocation.watchPosition(this.positionOptions, (position: any, error: any) => {
      if (error) {
        // code: 1: PERMISSION_DENIED – The user has denied the request for geolocation access.
        // code: 2: POSITION_UNAVAILABLE – The device is unable to retrieve the location (this can happen if the GPS is disabled,
        //                                 the device is indoors with no GPS signal, or the network cannot fetch the location).
        // code: 3: TIMEOUT – The request to fetch the location took too long, and it timed out.
        console.error('Error watching location', error);
        this.errors.push(error);
        return;
      }
      if (position?.coords) {
        // const timestamp = new Date().toLocaleString(); // Current timestamp
        const locationData = {
          coords: position.coords
        };

        console.log('Live Location:', locationData);

        // Emit updated location array (push new location with timestamp)
        const currentLocations = this.locationSubject.value;
        this.locationSubject.next([...currentLocations, locationData]);
        // this.locations.push(locationData);

        // Send the location to API
        this.sendLocationToAPI(
          position.coords.latitude,
          position.coords.longitude
        );
      } else {
        alert('Position object or coordinates are null');
      }
    });
  }

  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks when the component is destroyed
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }

  // Send location to API
  private sendLocationToAPI(latitude: number, longitude: number) {
    // console.log('Sending location to API:', latitude, longitude);
    this.httpClient
      .post('https://38498e897118.ngrok-free.app/send-data', {
        latitude,
        longitude,
      })
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
}
