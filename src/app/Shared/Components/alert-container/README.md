# Sistema de Alertas

Este sistema proporciona una forma elegante y fácil de mostrar alertas en tu aplicación Angular.

## Características

- ✅ **Alertas de éxito** - Para operaciones exitosas
- ❌ **Alertas de error** - Para errores y fallos
- ⚠️ **Alertas de advertencia** - Para advertencias
- ℹ️ **Alertas informativas** - Para información general
- 🎨 **Diseño moderno** - Con gradientes y sombras
- 📱 **Responsive** - Se adapta a diferentes tamaños de pantalla
- 🌙 **Soporte para modo oscuro** - Se adapta automáticamente
- ⏱️ **Auto-dismiss** - Se cierran automáticamente
- 🎭 **Animaciones suaves** - Entrada y salida con transiciones
- 🔄 **Progress bar** - Muestra el tiempo restante

## Instalación

1. **Importar el servicio** en tu componente:

```typescript
import { AlertService } from "../../../Core/Services/alert.service";
```

2. **Inyectar el servicio** en el constructor:

```typescript
constructor(private alertService: AlertService) {}
```

3. **Agregar el componente** al template:

```html
<app-alert-container></app-alert-container>
```

4. **Importar el componente** en tu componente:

```typescript
import { AlertContainerComponent } from '../../../Shared/Components/alert-container/alert-container.component';

@Component({
  imports: [AlertContainerComponent]
})
```

## Uso Básico

### Alertas Simples

```typescript
// Alerta de éxito
this.alertService.showSuccess("Operación completada exitosamente");

// Alerta de error
this.alertService.showError("Ha ocurrido un error");

// Alerta de advertencia
this.alertService.showWarning("Ten cuidado con esto");

// Alerta informativa
this.alertService.showInfo("Información importante");
```

### Alertas con Título Personalizado

```typescript
this.alertService.showSuccess("Tu ticket ha sido creado exitosamente", "¡Ticket Creado!");
```

### Alertas Personalizadas

```typescript
this.alertService.showAlert({
  type: AlertType.SUCCESS,
  message: "Mensaje personalizado",
  title: "Título personalizado",
  duration: 10000, // 10 segundos
  dismissible: true,
});
```

## Configuración

### Duración por Defecto

- **Éxito**: 5 segundos
- **Error**: 8 segundos
- **Advertencia**: 6 segundos
- **Información**: 5 segundos

### Personalización

```typescript
// Alerta que no se cierra automáticamente
this.alertService.showAlert({
  type: AlertType.INFO,
  message: "Mensaje importante",
  duration: 0, // No se cierra automáticamente
});

// Alerta que no se puede cerrar manualmente
this.alertService.showAlert({
  type: AlertType.WARNING,
  message: "Mensaje de advertencia",
  dismissible: false,
});
```

## Métodos del Servicio

### Mostrar Alertas

- `showSuccess(message, title?, duration?)`
- `showError(message, title?, duration?)`
- `showWarning(message, title?, duration?)`
- `showInfo(message, title?, duration?)`
- `showAlert(options: AlertOptions)`

### Gestión de Alertas

- `removeAlert(alertId: string)` - Elimina una alerta específica
- `clearAll()` - Elimina todas las alertas
- `clearByType(type: AlertType)` - Elimina alertas por tipo
- `getAlerts()` - Obtiene el array actual de alertas

## Ejemplo de Integración

```typescript
onSubmit(): void {
  if (this.form.valid) {
    this.service.createItem(this.form.value).subscribe({
      next: (response) => {
        this.alertService.showSuccess(
          'Item creado exitosamente',
          '¡Éxito!'
        );
        this.resetForm();
      },
      error: (error) => {
        this.alertService.showError(
          'Error al crear el item. Intenta nuevamente.',
          'Error'
        );
      }
    });
  } else {
    this.alertService.showWarning(
      'Por favor, completa todos los campos requeridos.',
      'Formulario Incompleto'
    );
  }
}
```

## Estilos CSS

El sistema incluye estilos modernos con:

- Gradientes de color
- Sombras suaves
- Bordes redondeados
- Transiciones suaves
- Soporte para modo oscuro
- Diseño responsive

## Dependencias

- `@angular/animations` - Para las transiciones
- `bootstrap-icons` - Para los iconos
- `uuid` - Para generar IDs únicos

## Notas

- Las alertas se muestran en la esquina superior derecha por defecto
- En dispositivos móviles, se expanden para ocupar todo el ancho
- El sistema es completamente standalone y no interfiere con otros componentes
- Las alertas se apilan verticalmente si hay múltiples activas
