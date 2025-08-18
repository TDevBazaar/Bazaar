import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    private meta: Meta,
    private title: Title
  ) { }

  updateTitle(title: string): void {
    this.title.setTitle(title);
  }

  updateMetaTags(tags: { [key: string]: string }): void {
    Object.keys(tags).forEach(key => {
      this.meta.updateTag({ name: key, content: tags[key] });
    });
  }

  updateOpenGraphTags(tags: { [key: string]: string }): void {
    Object.keys(tags).forEach(key => {
      this.meta.updateTag({ property: `og:${key}`, content: tags[key] });
    });
  }

  updateTwitterTags(tags: { [key: string]: string }): void {
    Object.keys(tags).forEach(key => {
      this.meta.updateTag({ property: `twitter:${key}`, content: tags[key] });
    });
  }

  setPageSEO(pageData: {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
  }): void {
    // Actualizar título
    this.updateTitle(pageData.title);

    // Actualizar meta tags básicos
    this.updateMetaTags({
      'description': pageData.description,
      'keywords': pageData.keywords || 'desarrollo web, e-commerce, soluciones digitales',
      'author': 'DevBazaar'
    });

    // Actualizar Open Graph
    this.updateOpenGraphTags({
      'title': pageData.title,
      'description': pageData.description,
      'image': pageData.image || 'https://tdevbazaar.github.io/Bazaar/assets/img/og-image.jpg',
      'url': pageData.url || 'https://tdevbazaar.github.io/Bazaar/'
    });

    // Actualizar Twitter Cards
    this.updateTwitterTags({
      'title': pageData.title,
      'description': pageData.description,
      'image': pageData.image || 'https://tdevbazaar.github.io/Bazaar/assets/img/twitter-image.jpg'
    });
  }
}
