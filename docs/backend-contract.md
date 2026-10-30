# Contrato del backend — SixSeven Music

Todos los endpoints deben usar HTTPS y autenticación por usuario. Las credenciales de los proveedores de IA y audio se guardan únicamente en el servidor.

## Rutas móviles

| Método y ruta | Entrada | Resultado esperado |
|---|---|---|
| POST /v1/voice-samples | multipart: audio | id de muestra |
| POST /v1/songs | prompt, lyrics, genre, language, voiceSampleAvailable | id, title, status, audioUrl opcional |
| POST /v1/studio/tracks | multipart: audio | id de pista |
| POST /v1/studio/separate | trackId, stems: vocals/instrumental | id y status del trabajo |
| POST /v1/studio/vocal-effects | trackId, effect, preset | id y status del trabajo |

## Procesamiento de estudio

- Separación de stems: integrar un proveedor real de separación de fuentes, entregar pista vocal e instrumental como archivos separados.
- Corrección de tono: integrar un procesador de pitch correction/autotune con control de tonalidad y escala.
- Efectos: cadena DSP configurable de EQ, compresor, reverb, delay, chorus, saturación/distorsión y reducción de ruido.
- Presets: son configuraciones de parámetros de la cadena, no archivos de audio ni efectos ejecutados en el teléfono.
- Los trabajos pueden ser asíncronos. El backend debe exponer un endpoint de consulta de estado y URLs temporales de salida para que la app pueda mostrar y reproducir resultados.

## Seguridad y privacidad

- Validar tipo MIME, tamaño, duración y usuario propietario de cada archivo.
- No aceptar ni guardar muestras vocales sin consentimiento explícito.
- Restringir el uso del perfil vocal a la cuenta que lo creó y a la voz propia o autorizada.
- Proveer revocación del consentimiento y eliminación de muestra, perfil y derivados.
- Usar URLs firmadas de corta duración para descargar archivos.
- No incluir API keys en Expo, variables EXPO_PUBLIC ni APK.
