# SixSeven Music

Aplicación Android nativa con Expo + React Native + TypeScript. No utiliza WebView.

## Incluido en esta primera versión funcional

- Interfaz oscura de estudio musical con acentos violetas.
- Pantalla Crear: descripción, género, idioma y letra.
- Pantalla Mi voz: permiso de micrófono y grabación real de hasta 60 segundos.
- La muestra queda local en el dispositivo hasta que el usuario pulsa enviar.
- Pantalla Estudio: importar audio del dispositivo, solicitar separación de voz/instrumental y seleccionar efectos/presets vocales.
- Pantalla Biblioteca para mostrar solicitudes recibidas por el backend.
- Cliente API preparado para enviar muestras y solicitudes de canciones.
- Claves de proveedores reservadas para backend; nunca se guardan en la APK.

## Ejecutar

1. Instalar dependencias: `npm install`.
2. Configurar `EXPO_PUBLIC_API_URL` con la URL HTTPS del backend.
3. Iniciar: `npx expo start`.

Para compilar Android se puede usar EAS Build o `npx expo run:android` en un entorno Android adecuado.

## Contrato del backend

- `POST /v1/voice-samples`: recibe multipart `audio`; debe exigir autenticación, consentimiento y propiedad de la muestra.
- `POST /v1/songs`: recibe JSON con `prompt`, `lyrics`, `genre`, `language` y `voiceSampleAvailable`; devuelve `id`, `title`, `status` y opcionalmente `audioUrl`.
- `POST /v1/studio/tracks`: recibe multipart `audio`; devuelve `id` de pista.
- `POST /v1/studio/separate`: recibe `trackId` y `stems: [vocals, instrumental]`; devuelve el estado del trabajo.
- `POST /v1/studio/vocal-effects`: recibe `trackId`, `effect` y `preset`; devuelve el estado del procesamiento.

## Lo que aún requiere configuración externa

La app móvil ya implementa la captura de audio y la interfaz de creación. Para producir canciones reales todavía hay que desplegar el backend, configurar credenciales de un proveedor de generación musical y un servicio de conversión vocal autorizado, y conectar el procesamiento/mezcla. No se simula una generación si esos servicios no están disponibles.

La generación musical y la conversión de voz son etapas diferentes: el proveedor musical crea composición y voz guía; un motor de singing-voice-conversion autorizado transforma la interpretación a la voz del usuario. La calidad y el tiempo dependen de los proveedores elegidos.

## Privacidad

La grabación se conserva localmente hasta que el usuario decide enviarla. Solo se deben crear perfiles con la voz propia o con autorización verificable. El backend debe permitir revocar el consentimiento y borrar muestras y modelos asociados.