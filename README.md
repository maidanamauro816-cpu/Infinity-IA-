# SixSeven Music

Aplicación móvil nativa para crear canciones originales con IA y producir interpretaciones con la voz autorizada del usuario.

## Visión

Una experiencia de estudio musical móvil inspirada en las capacidades de creación de Suno, con identidad propia. No es un WebView: la aplicación se construirá con Expo, React Native y TypeScript para Android.

## Funciones objetivo

- Grabar una muestra inicial de voz de hasta 60 segundos o importar audio.
- Crear un perfil vocal privado, con consentimiento explícito y controles de borrado.
- Generar canciones completas desde una descripción o una letra.
- Generar letras asistidas por IA.
- Elegir género, ritmo, idioma, instrumentos, ambiente y estructura.
- Crear instrumentales, versiones alternativas y continuaciones.
- Extender o modificar secciones cuando el motor musical lo permita.
- Convertir la voz guía a la voz autorizada del usuario mediante un motor especializado de singing voice conversion.
- Biblioteca personal, reproductor, descarga y compartir.

## Flujo de audio

La generación musical y la conversión de identidad vocal son etapas diferentes:

1. Un motor musical genera la composición y una voz guía o pistas separadas.
2. Un servicio especializado convierte la interpretación a la voz autorizada del usuario.
3. El backend mezcla la voz procesada con el instrumental y entrega el archivo final.

Una muestra de 60 segundos sirve como captura inicial, pero no garantiza por sí sola una clonación vocal de calidad. La cantidad de audio requerida y la calidad dependen del motor elegido.

## Arquitectura

- **Android:** Expo + React Native + TypeScript; sin WebView.
- **Backend:** API segura para gestionar usuarios, tareas de generación y proveedores.
- **Proveedores:** adaptadores intercambiables para generación musical y conversión vocal.
- **Audio:** almacenamiento privado, URLs firmadas y permisos por usuario.
- **Procesamiento:** trabajos asíncronos con estados pendiente, procesando, completado y error.
- **Seguridad:** claves API solo en backend; nunca dentro de la app.

## Pantallas

1. Inicio / Crear canción.
2. Grabar voz.
3. Perfil vocal y consentimiento.
4. Letra y descripción musical.
5. Género y parámetros.
6. Generación y progreso.
7. Reproductor / edición.
8. Biblioteca / Mis canciones.
9. Privacidad y ajustes.

## Diseño visual

Estudio musical oscuro, elegante, con detalles violetas luminosos, controles claros y formas de onda. Marca: **SixSeven Music**.

## Seguridad y derechos

Solo se habilitarán perfiles de voz propios o autorizados. El consentimiento para almacenar muestras y para crear un perfil vocal será explícito y separado. Se permitirá revocar permisos y solicitar el borrado de grabaciones y perfiles. El usuario deberá contar con derechos sobre letras, pistas y audios que aporte.

## Estado

Inicio del proyecto: documentación y arquitectura base. La integración real de generación requiere elegir y configurar proveedores compatibles, verificar sus licencias, disponibilidad, costes y requisitos de acceso.