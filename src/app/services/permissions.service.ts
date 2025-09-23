import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  async requestNotificationPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const { display } = await LocalNotifications.checkPermissions();

      if (display !== 'granted') {
        const { display: newDisplay } = await LocalNotifications.requestPermissions();
        return newDisplay === 'granted';
      }
      return display === 'granted';
    }
    return true; // Assume granted for web
  }
}
