
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonSpinner
} from '@ionic/angular';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonIcon,
    IonBackButton,
    IonButtons,
    IonSpinner
  ]
})
export class RegisterPage {

  name = '';
  email = '';
  password = '';

  loading = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register(): void {

    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Prevent empty fields
    if (
      !this.name.trim() ||
      !this.email.trim() ||
      !this.password
    ) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(this.email.trim())) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Validate password length
    if (this.password.length < 8) {
      this.errorMessage =
        'Password must contain at least 8 characters.';
      return;
    }

    // Start loading
    this.loading = true;

    // Prepare registration data
    const registrationData = {
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password
    };

    // Register user and automatically log in
    this.authService.register(registrationData).subscribe({

      next: (response) => {

        this.loading = false;

        // AuthService.register() has already:
        // 1. Saved the JWT token in Capacitor Preferences
        // 2. Saved the user details in Capacitor Preferences
        // 3. Updated currentUser$ with the registered user

        this.successMessage =
          `Registration successful! Welcome, ${response.name}!`;

        // Clear registration form
        this.name = '';
        this.email = '';
        this.password = '';

        // Navigate to Home
        this.router.navigate(['/home']);

      },

      error: (error) => {

        this.loading = false;

        if (error.status === 409) {

          this.errorMessage =
            'This email is already registered.';

        } else if (error.status === 400) {

          this.errorMessage =
            error.error?.detail ||
            error.error?.message ||
            'Please check your registration details.';

        } else if (error.status === 0) {

          this.errorMessage =
            'Cannot connect to the server. Please check your backend.';

        } else {

          this.errorMessage =
            error.error?.detail ||
            error.error?.message ||
            'Registration failed. Please try again.';

        }

      }

    });

  }

}
