# SixSeven Music backend

Backend HTTP para el proyecto Expo. Incluye procesamiento DSP real de archivos mediante FFmpeg para una primera cadena de estudio y generación musical por prompt mediante ElevenLabs Music cuando se configure una clave.

## Ejecutar
Requiere Docker. Copiar `.env.example` a `.env`, completar claves del proveedor y ejecutar:

```sh
docker compose up --build
```

El volumen `/data` conserva archivos y resultados. En producción debe montarse un volumen persistente, usar HTTPS, autenticación por usuario, cuotas, borrado programado y almacenamiento privado con enlaces firmados.

## Efectos FFmpeg disponibles
Afinación/pitch shift Rubber Band (si el build FFmpeg incluye librubberband), EQ, compresión, compresión multibanda, de-esser, gate, reverbs algorítmicas de sala/placa/hall/catedral, slapback, ping-pong, delay estéreo, chorus, flanger, phaser, saturación, distorsión, exciter, reducción de ruido, limitador y stereo widening.

Los presets son cadenas DSP originales. Las reverbs de esta primera versión son reverberación algorítmica multi-eco, no convolución con impulsos de salas reales. Vocoder y armonizador todavía requieren motores especializados; no se simulan como si funcionaran.

## Rutas
- `GET /health`
- `POST /v1/studio/tracks` multipart `audio`
- `POST /v1/studio/vocal-effects` JSON `{trackId,effects,preset}`
- `GET /v1/jobs/:id`
- `GET /v1/jobs/:id/download`
- `POST /v1/songs` prompt/lyrics/genre/language; requiere `ELEVENLABS_API_KEY`
- `GET /v1/songs/:id/download`
- `POST /v1/studio/separate` permanece desactivado hasta instalar un proveedor y almacenamiento público privado.

## Seguridad
Esta plantilla es un punto de partida, no una instalación pública lista para producción. Antes de exponerla a internet: autenticar todas las rutas, asociar cada archivo al usuario, restringir CORS, limitar frecuencia y tamaño, eliminar archivos temporales, y no guardar perfiles vocales sin consentimiento explícito.
