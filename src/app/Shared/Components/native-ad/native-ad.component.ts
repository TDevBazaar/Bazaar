import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-native-ad',
  standalone: true,
  template: `
    <div class="native-ad" *ngIf="showAd">
      <div class="ad-sponsor">Contenido Patrocinado</div>
      <div class="ad-content">
        <img [src]="adData.image" [alt]="adData.title" class="ad-image">
        <div class="ad-text">
          <h4>{{ adData.title }}</h4>
          <p>{{ adData.description }}</p>
          <a [href]="adData.link" target="_blank" class="ad-cta">{{ adData.cta }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .native-ad {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      font-family: inherit;
    }
    
    .ad-sponsor {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    
    .ad-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .ad-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
    }
    
    .ad-text {
      flex: 1;
    }
    
    .ad-text h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #212529;
    }
    
    .ad-text p {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #6c757d;
      line-height: 1.4;
    }
    
    .ad-cta {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.3s;
    }
    
    .ad-cta:hover {
      background: #0056b3;
      color: white;
    }
    
    @media (max-width: 768px) {
      .ad-content {
        flex-direction: column;
        text-align: center;
      }
      
      .ad-image {
        width: 120px;
        height: 120px;
      }
    }
  `]
})
export class NativeAdComponent {
  @Input() showAd: boolean = true;
  
  adData = {
    title: 'Herramientas de Desarrollo Premium',
    description: 'Accede a las mejores herramientas para desarrolladores. Licencias completas con soporte técnico.',
    image: 'assets/img/ad-tools.webp',
    link: 'https://ejemplo.com/herramientas',
    cta: 'Ver Ofertas'
  };
} 