import { Injectable } from '@angular/core';

export interface AdConfig {
  id: string;
  type: 'banner' | 'sidebar' | 'mobile' | 'responsive';
  position: 'header' | 'sidebar' | 'content' | 'footer';
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdsService {
  
  private adsConfig: AdConfig[] = [
    {
      id: 'header-banner',
      type: 'banner',
      position: 'header',
      enabled: true
    },
    {
      id: 'sidebar-ad',
      type: 'sidebar',
      position: 'sidebar',
      enabled: true
    },
    {
      id: 'content-ad',
      type: 'responsive',
      position: 'content',
      enabled: true
    },
    {
      id: 'footer-banner',
      type: 'banner',
      position: 'footer',
      enabled: true
    }
  ];

  constructor() { }

  getAdsConfig(): AdConfig[] {
    return this.adsConfig;
  }

  getAdsByPosition(position: string): AdConfig[] {
    return this.adsConfig.filter(ad => ad.position === position && ad.enabled);
  }

  toggleAd(adId: string): void {
    const ad = this.adsConfig.find(a => a.id === adId);
    if (ad) {
      ad.enabled = !ad.enabled;
    }
  }

  // Método para verificar si el usuario ha bloqueado anuncios
  isAdBlockerActive(): boolean {
    return !(window as any).adsbygoogle;
  }

  // Método para mostrar mensaje cuando hay bloqueador de anuncios
  showAdBlockerMessage(): void {
    if (this.isAdBlockerActive()) {
      console.log('Por favor, considera desactivar tu bloqueador de anuncios para apoyar nuestro contenido');
    }
  }
} 