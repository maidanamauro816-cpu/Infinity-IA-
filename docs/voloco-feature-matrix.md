# Funciones de referencia para SixSeven Music

Consulta: 29-10-2026. Este mapa resume capacidades públicas de Voloco y su adaptación original. No se reutilizan código, interfaz, recursos gráficos, sonidos ni presets propietarios.

## Estudio vocal
- Grabación vocal con monitorización y efectos.
- Proyecto multipista: voz principal, dobles, armonías y ad-libs (objetivo de hasta 8 pistas).
- Edición por clips, recorte, fundidos, solo/mute, etiquetas y reproducción en bucle.
- Importación de audio y video; extracción de audio.
- Exportación WAV/AAC/MP3.

## Tratamiento de voz
- Corrección de tono automática con tonalidad, escala y velocidad.
- Armonizador y doblador vocal.
- Vocoder y transformación creativa de voz.
- Reducción de ruido, EQ correctiva, compresión, reverb, delay, chorus, saturación y control de sibilancia.
- Presets originales por estilos, vista previa y guardado de presets propios.

## Separación, mezcla y master
- Separación en voz e instrumental; stems adicionales si el motor lo admite.
- Auto Mix para balancear voz e instrumental.
- Auto Master para loudness, claridad y balance.
- Escucha aislada de pistas y fundidos entre clips.

## Generación musical SixSeven
- Modo prompt: género, ambiente, tempo, duración, idioma, instrumentos y estructura.
- Modo letra: letra propia o generada, con verso/estribillo/puente.
- Modo instrumental.
- Modo voz propia: grabar/importar voz autorizada y procesarla con un motor específico de singing voice conversion.
- La composición musical y la conversión de una interpretación a la voz propia son procesos distintos. Generar música por prompt no garantiza que el resultado use la identidad vocal del usuario.

## Límites de integración
La API oficial de ElevenLabs Music genera por prompt o plan de composición, permite duración/modelo e instrumental. Su documentación no afirma que el endpoint Music convierta automáticamente una canción generada a la voz cantada del usuario. Esa etapa requiere un servicio compatible de singing voice conversion con consentimiento y licencia adecuados.

## Fuentes públicas
- https://voloco.com/vocal-effects.html
- https://voloco.com/auto-mix.html
- https://play.google.com/store/apps/details?id=com.jazarimusic.voloco
- https://elevenlabs.io/docs/api-reference/music/compose
- https://docs.expo.dev/versions/latest/sdk/audio/

La disponibilidad de funciones gratuitas/Premium puede variar por región, versión y suscripción. SixSeven implementa herramientas equivalentes de forma original, no reproduce los paquetes propietarios.
