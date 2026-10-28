import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonSpinner
} from '@ionic/angular';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonIcon,
    IonSpinner
  ]
})
export class LoginPage {

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.loading = true;

    this.authService.login({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },

      error: (error) => {
        this.loading = false;

        if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Invalid email or password.';
        } else if (error.status === 0) {
          this.errorMessage =
            'Unable to connect to the server. Please check that the backend is running.';
        } else {
          this.errorMessage =
            error.error?.message || 'Login failed. Please try again.';
        }
      }
    });
  }
}