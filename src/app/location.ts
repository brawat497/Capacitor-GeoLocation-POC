import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private locationSubject = new BehaviorSubject<any[]>([]); // Store an array of locations with timestamps
  public location$ = this.locationSubject.asObservable(); // Observable to expose location updates

  constructor(private httpClient: HttpClient) {}

  // Watch location for updates
  watchLocation() {
    Geolocation.watchPosition({}, (position, error) => {
      if (error) {
        // code: 1: PERMISSION_DENIED – The user has denied the request for geolocation access.
        // code: 2: POSITION_UNAVAILABLE – The device is unable to retrieve the location (this can happen if the GPS is disabled, 
        //                                 the device is indoors with no GPS signal, or the network cannot fetch the location).
        // code: 3: TIMEOUT – The request to fetch the location took too long, and it timed out.
        console.error('Error watching location', error);
        return;
      }
      if (position?.coords) {
        const timestamp = new Date().toLocaleString(); // Current timestamp
        const locationData = {
          coords: position.coords,
          timestamp,
        };

        console.log('Live Location:', locationData);
        
        // Emit updated location array (push new location with timestamp)
        const currentLocations = this.locationSubject.value;
        this.locationSubject.next([...currentLocations, locationData]);

        // Send the location to API
        // this.sendLocationToAPI(position.coords.latitude, position.coords.longitude);
      } else {
        console.error('Position object or coordinates are null');
      }
    });
  }

  // Send location to API
  private sendLocationToAPI(latitude: number, longitude: number) {
    console.log('Sending location to API:', latitude, longitude);
    // Example: Replace with your actual API endpoint
    this.httpClient
      .post('YOUR_API_URL', { latitude, longitude })
      .subscribe((response) => {
        console.log('API Response:', response);
      });
  }
}
