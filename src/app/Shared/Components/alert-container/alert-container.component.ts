import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { AlertService } from '../../../Core/Services/alert.service';
import { Alert, AlertType } from '../../../Core/Models/alert.model';

@Component({
  selector: 'app-alert-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-container.component.html',
  styleUrls: ['./alert-container.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class AlertContainerComponent implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.subscription = this.alertService.alerts$.subscribe(
      alerts => this.alerts = alerts
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeAlert(alertId: string): void {
    this.alertService.removeAlert(alertId);
  }

  getAlertIcon(type: AlertType): string {
    switch (type) {
      case AlertType.SUCCESS:
        return 'bi-check-circle-fill';
      case AlertType.ERROR:
        return 'bi-x-circle-fill';
      case AlertType.WARNING:
        return 'bi-exclamation-triangle-fill';
      case AlertType.INFO:
        return 'bi-info-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  }

  getAlertClass(type: AlertType): string {
    switch (type) {
      case AlertType.SUCCESS:
        return 'alert-success';
      case AlertType.ERROR:
        return 'alert-danger';
      case AlertType.WARNING:
        return 'alert-warning';
      case AlertType.INFO:
        return 'alert-info';
      default:
        return 'alert-info';
    }
  }

  getAlertIconClass(type: AlertType): string {
    switch (type) {
      case AlertType.SUCCESS:
        return 'text-success';
      case AlertType.ERROR:
        return 'text-danger';
      case AlertType.WARNING:
        return 'text-warning';
      case AlertType.INFO:
        return 'text-info';
      default:
        return 'text-info';
    }
  }
}
