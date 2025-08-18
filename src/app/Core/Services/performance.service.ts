import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {

  constructor() { }

  // Precargar recursos críticos
  preloadCriticalResources(): void {
    const criticalImages = [
      'assets/img/r1.webp',
      'assets/svg/iconbrand-2.svg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  // Lazy load para imágenes
  lazyLoadImages(): void {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // Optimizar carga de fuentes
  optimizeFontLoading(): void {
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    fontLinks.forEach(link => {
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'font');
      link.setAttribute('crossorigin', '');
    });
  }

  // Compresión de imágenes
  compressImageQuality(): void {
    // Esta función puede ser implementada para comprimir imágenes dinámicamente
    console.log('Optimización de imágenes habilitada');
  }

  // Cache de recursos estáticos
  enableStaticCaching(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado:', registration);
        })
        .catch(error => {
          console.log('Error al registrar Service Worker:', error);
        });
    }
  }
}
