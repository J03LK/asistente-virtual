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
  menuAbierto = false;
  pregunta = '';

  mensajes: {
    tipo: 'usuario' | 'asistente',
    contenido: string,
    formato?: 'texto' | 'imagen' | 'audio' | 'documento'
  }[] = [];

  clasificacionActiva = false;
  deteccionActiva = false;
  vozActiva = false;

  openAiApiKey = 'TU_API_KEY';
  cloudFunctionClasificacionUrl = 'URL_DE_TU_CLOUD_FUNCTION_CLASIFICACION';
  cloudFunctionDeteccionUrl = 'URL_DE_TU_CLOUD_FUNCTION_DETECCION';

  toggleChat() {
    this.chatAbierto = !this.chatAbierto;
    this.menuAbierto = false;
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  async enviarPregunta() {
    if (!this.pregunta.trim()) return;

    this.mensajes.push({
      tipo: 'usuario',
      contenido: this.pregunta,
      formato: 'texto'
    });

    const respuesta = await this.enviarTextoOpenAI(this.pregunta);

    this.mensajes.push({
      tipo: 'asistente',
      contenido: respuesta,
      formato: 'texto'
    });

    if (this.vozActiva) {
      this.convertirTextoAVoz(respuesta);
    }

    this.pregunta = '';
  }

  async enviarTextoOpenAI(texto: string): Promise<string> {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: texto }]
        })
      });
      const data = await resp.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error(err);
      return 'Error al conectar con OpenAI.';
    }
  }

  async subirArchivo(event: any, tipo: string) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const urlArchivo = URL.createObjectURL(archivo);

    if (tipo === 'imagen') {
      this.mensajes.push({
        tipo: 'usuario',
        contenido: urlArchivo,
        formato: 'imagen'
      });
    } else if (tipo === 'audio') {
      this.mensajes.push({
        tipo: 'usuario',
        contenido: urlArchivo,
        formato: 'audio'
      });
    } else if (tipo === 'documento') {
      this.mensajes.push({
        tipo: 'usuario',
        contenido: urlArchivo,
        formato: 'documento'
      });
    }

    // Procesar si es imagen con IA
    if (tipo === 'imagen') {
      if (this.clasificacionActiva) {
        const resultado = await this.enviarImagenAClasificacion(archivo);
        this.mensajes.push({
          tipo: 'asistente',
          contenido: `Etiqueta: ${resultado}`,
          formato: 'texto'
        });
      } else if (this.deteccionActiva) {
        const resultado = await this.enviarImagenADeteccion(archivo);
        this.mensajes.push({
          tipo: 'asistente',
          contenido: `Objetos detectados: ${resultado}`,
          formato: 'texto'
        });
      }
    }

    this.menuAbierto = false;
  }

  async enviarImagenAClasificacion(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(this.cloudFunctionClasificacionUrl, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.label || JSON.stringify(data);
    } catch (err) {
      console.error(err);
      return 'Error al conectar con la API de clasificación.';
    }
  }

  async enviarImagenADeteccion(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(this.cloudFunctionDeteccionUrl, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.objects ? data.objects.join(', ') : JSON.stringify(data);
    } catch (err) {
      console.error(err);
      return 'Error al conectar con la API de detección.';
    }
  }

  convertirTextoAVoz(texto: string) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    synth.speak(utterance);
  }

  opcionesAudioAbiertas = false;
  grabando = false;
  mediaRecorder: MediaRecorder | null = null;
  chunks: BlobPart[] = [];

  abrirOpcionesAudio() {
    this.opcionesAudioAbiertas = !this.opcionesAudioAbiertas;
  }

  seleccionarArchivoAudio() {
    const input = document.querySelector<HTMLInputElement>('#inputAudio');
    if (input) {
      input.click();
    }
  }

  async iniciarGrabacion() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
        const archivo = new File([audioBlob], 'grabacion.webm', { type: 'audio/webm' });
        this.subirArchivo({ target: { files: [archivo] } }, 'audio');
      };

      this.mediaRecorder.start();
      this.grabando = true;

      setTimeout(() => this.detenerGrabacion(), 10000);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
    }
  }

  detenerGrabacion() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.grabando = false;
    }
  }
  esArchivoEmbebible(url: string): boolean {
  const ext = url.toLowerCase();
  return ext.endsWith('.pdf') || ext.endsWith('.doc') || ext.endsWith('.docx') || ext.endsWith('.xls') || ext.endsWith('.xlsx');
}

obtenerUrlVisor(url: string): string {
  const ext = url.toLowerCase();
  if (ext.endsWith('.pdf')) {
    return url;
  } else {
    // Word y Excel embebidos con Office Online
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
}


}
