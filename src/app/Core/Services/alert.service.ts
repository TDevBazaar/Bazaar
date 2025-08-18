import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertType, AlertOptions } from '../Models/alert.model';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  constructor() {}

  /**
   * Muestra una alerta de éxito
   */
  showSuccess(message: string, title?: string, duration?: number): void {
    this.showAlert({
      type: AlertType.SUCCESS,
      message,
      title: title || '¡Éxito!',
      duration: duration || 5000
    });
  }

  /**
   * Muestra una alerta de error
   */
  showError(message: string, title?: string, duration?: number): void {
    this.showAlert({
      type: AlertType.ERROR,
      message,
      title: title || 'Error',
      duration: duration || 8000
    });
  }

  /**
   * Muestra una alerta de advertencia
   */
  showWarning(message: string, title?: string, duration?: number): void {
    this.showAlert({
      type: AlertType.WARNING,
      message,
      title: title || 'Advertencia',
      duration: duration || 6000
    });
  }

  /**
   * Muestra una alerta informativa
   */
  showInfo(message: string, title?: string, duration?: number): void {
    this.showAlert({
      type: AlertType.INFO,
      message,
      title: title || 'Información',
      duration: duration || 5000
    });
  }

  /**
   * Muestra una alerta personalizada
   */
  showAlert(options: AlertOptions): void {
    const alert: Alert = {
      id: uuidv4(),
      type: options.type,
      message: options.message,
      title: options.title,
      duration: options.duration,
      dismissible: options.dismissible !== false,
      timestamp: new Date()
    };

    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next([...currentAlerts, alert]);

    // Auto-remove alert after duration
    if (alert.duration && alert.duration > 0) {
      setTimeout(() => {
        this.removeAlert(alert.id);
      }, alert.duration);
    }
  }

  /**
   * Elimina una alerta específica
   */
  removeAlert(alertId: string): void {
    const currentAlerts = this.alertsSubject.value;
    const filteredAlerts = currentAlerts.filter(alert => alert.id !== alertId);
    this.alertsSubject.next(filteredAlerts);
  }

  /**
   * Elimina todas las alertas
   */
  clearAll(): void {
    this.alertsSubject.next([]);
  }

  /**
   * Elimina alertas por tipo
   */
  clearByType(type: AlertType): void {
    const currentAlerts = this.alertsSubject.value;
    const filteredAlerts = currentAlerts.filter(alert => alert.type !== type);
    this.alertsSubject.next(filteredAlerts);
  }

  /**
   * Obtiene el array actual de alertas
   */
  getAlerts(): Alert[] {
    return this.alertsSubject.value;
  }
}
