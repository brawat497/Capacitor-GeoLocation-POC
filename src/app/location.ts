import { Injectable } from '@angular/core';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private locationSubject = new BehaviorSubject<any[]>([]); // Store an array of locations with timestamps
  public location$ = this.locationSubject.asObservable(); // Observable to expose location updates

  constructor(private httpClient: HttpClient) {}

  // async checkAndRequestLocationPermission() {
  //   const permissions = await Geolocation.requestPermissions();
  //   return permissions;
  // }

  /**
   * Checks the status of location permissions.
   * @returns A promise with the current permission status.
   */
  //  async checkLocationPermissions(): Promise<PermissionStatus> {
  //   const permissions = await Geolocation.checkPermissions();
  //   return permissions;
  // }

  /**
   * Requests location permissions from the user.
   * @returns A promise with the new permission status.
   */
  // async requestLocationPermissions(): Promise<PermissionStatus> {
  //   const permissions = await Geolocation.requestPermissions();
  //   return permissions;
  // }

  /**
   * Gets the current position of the device.
   * Automatically handles permission checks and requests.
   * @returns A promise that resolves with the Position or rejects on error.
   */
  // async getCurrentPosition(): Promise<any> {
  //   try {
  //     const permissions = await this.checkLocationPermissions();
  //     if (permissions.location === 'granted') {
  //       // Permission is already granted, get position directly
  //       this.watchLocation();
  //     } else if (permissions.location === 'prompt' || permissions.location === 'prompt-with-rationale') {
  //       // Permission needs to be requested or re-requested
  //       const newPermissions = await this.requestLocationPermissions();
  //       if (newPermissions.location === 'granted') {
  //         this.watchLocation();
  //       } else {
  //         alert('Location permission was denied.');
  //       }
  //     } else {
  //       // Permission is permanently denied
  //       alert('Location permission is permanently denied. Please enable it in your device settings.');
  //     }
  //   } catch (error) {
  //     alert('Error getting location:'+ error);
  //     throw error;
  //   }
  // }

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
        this.sendLocationToAPI(position.coords.latitude, position.coords.longitude);
      } else {
        alert('Position object or coordinates are null');
      }
    });
  }

  // Send location to API
  private sendLocationToAPI(latitude: number, longitude: number) {
    console.log('Sending location to API:', latitude, longitude);
    // Example: Replace with your actual API endpoint
    this.httpClient
      .post('https://3c047cad03b8.ngrok-free.app/rides/geo-location/', { latitude, longitude })
      .subscribe((response) => {
        console.log('API Response:', response);
      });
  }
}
