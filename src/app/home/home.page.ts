import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocationService } from '../location';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  locations: any[] = []; // To store locations with timestamps
  locationSubscription: Subscription | null = null;

  constructor(private locationService: LocationService) {}

  ngOnInit() {
    // Start watching the live location when the component is initialized
    this.locationService.watchLocation();

    // Subscribe to location updates
    this.locationSubscription = this.locationService.location$.subscribe(
      (locationData) => {
        this.locations = locationData; // Update the location
      }
    );
  }

  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks when the component is destroyed
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }

}
