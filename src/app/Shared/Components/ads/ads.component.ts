import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-ads',
  standalone: true,
  template: `
    <div class="ad-container" [class]="adClass">
      <div class="ad-label">Publicidad</div>
      <div [id]="adId" class="ad-unit"></div>
    </div>
  `,
  styles: [`
    .ad-container {
      text-align: center;
      margin: 20px 0;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }
    
    .ad-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .ad-unit {
      min-height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .ad-banner {
      width: 100%;
      max-width: 728px;
      height: 90px;
    }
    
    .ad-sidebar {
      width: 300px;
      height: 250px;
    }
    
    .ad-mobile {
      width: 100%;
      max-width: 320px;
      height: 100px;
    }
  `]
})
export class AdsComponent implements OnInit {
  @Input() adId: string = 'ad-unit';
  @Input() adClass: string = 'ad-banner';
  @Input() adType: 'banner' | 'sidebar' | 'mobile' = 'banner';

  ngOnInit() {
    this.loadAd();
  }

  private loadAd() {
    // Código de Google AdSense
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      console.log('AdSense not loaded');
    }
  }
} 