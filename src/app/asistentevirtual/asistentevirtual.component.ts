import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asistentevirtual',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './asistentevirtual.component.html',
  styleUrls: ['./asistentevirtual.component.css']
})
export class AsistenteVirtualComponent {
  chatAbierto = false;
  pregunta = '';
  mensajes: { texto: string, tipo: 'usuario' | 'asistente' }[] = [];

  toggleChat() {
    this.chatAbierto = !this.chatAbierto;
  }

  enviarPregunta() {
    if (!this.pregunta.trim()) return;

    this.mensajes.push({ texto: this.pregunta, tipo: 'usuario' });

    const respuesta = this.generarRespuesta(this.pregunta);
    this.mensajes.push({ texto: respuesta, tipo: 'asistente' });

    this.pregunta = '';
  }

  generarRespuesta(pregunta: string): string {
    const p = pregunta.toLowerCase();

    if (p.includes('hola')) return '¡Hola! ¿Cómo puedo ayudarte hoy?';
    if (p.includes('carreras')) return 'Ofrecemos Desarrollo de Software, Enfermería y más.';
    if (p.includes('contacto')) return 'Escríbenos al +593 96 974 2253 o info@itsqmet.edu.ec';
    if (p.includes('ubicación')) return 'Nuestra sede está en Carán N3-195 y Calle B (Nueva Tola).';

    return 'Lo siento, aún estoy aprendiendo. Intenta otra pregunta.';
  }
}
