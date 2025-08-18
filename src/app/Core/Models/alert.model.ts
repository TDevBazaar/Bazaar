export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  timestamp: Date;
}

export enum AlertType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface AlertOptions {
  type: AlertType;
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
}
