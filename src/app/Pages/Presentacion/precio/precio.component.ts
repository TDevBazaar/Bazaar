import { Component } from '@angular/core';

@Component({
  selector: 'app-precio',
  standalone: true,
  imports: [],
  templateUrl: './precio.component.html',
  styleUrl: './precio.component.css'
})
export class PrecioComponent {

  numero:string='+5352529615';
  mensaje:string='Me interesan tus servicios'
  enviarWhatsApp() {
    const url = `https://wa.me/${this.numero}?text=${encodeURIComponent(this.mensaje)}`;
    window.open(url, '_blank');
  }
}
