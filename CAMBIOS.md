# Cambios al terminar PitLane

El diseño se conservó: misma estructura de diez páginas, barra lateral numerada, colores, tipografías, imágenes y textos. Estos son los cambios y por qué se hicieron.

## Bugs corregidos

- **En celular no había navegación.** `css/responsive.css` ocultaba la barra lateral y el menú del encabezado (`display: none`) sin poner nada en su lugar. Ahora hay un botón "Menú" que abre la barra lateral como panel, con la sección actual marcada (`css/menu-movil.css`, `js/menu.js`).
- **Nueve de diez páginas no tenían `<h1>`.** El título principal de cada página pasó a ser `<h1>` conservando su aspecto.
- **Formularios que no hacían nada.** "Club de fans" y "Resumen del GP" tenían `action="#"` y al enviarlos solo recargaban la página. "Preferencias" tenía los campos sueltos, sin `<form>`. Ahora los tres validan, guardan y muestran el resultado (ver abajo).
- **Faltaba `<main>`** en todas las páginas.
- **Voseo** pasado a español neutro.

## Funcionalidades nuevas (JavaScript)

- **Validación** (`js/validacion.js`): los errores aparecen debajo de cada campo, en el momento y con un texto que dice qué corregir. Nada de `alert()`. El primer campo con error recibe el foco.
- **Club de fans** (`js/club.js`): el registro se guarda en el navegador y la página muestra una confirmación con opción de editar. Si ya estás registrado, abre directamente en la confirmación y precarga la escudería de tus preferencias.
- **Preferencias** (`js/preferencias.js`, `js/favoritos.js`): piloto y escudería favoritos, nombre, foto (se reduce a 128 × 128 px para que quepa en el navegador) y color de acento. Se aplican en todo el sitio: tus favoritos se resaltan con una etiqueta "Tu piloto" / "Tu escudería" (no solo con color) y la barra lateral muestra un saludo. Hay un botón para borrar todo. La contraseña nunca se guarda.
- **Predicción del podio** (`js/prediccion.js`): el porcentaje de confianza se actualiza mientras mueves el deslizador, valida que elijas un piloto y recuerda tu predicción.
- **Tabla ordenable** (`js/tabla-ordenable.js`) en Clasificación: por posición, piloto o puntos, con teclado y con `aria-sort`. En los empates de puntos se respeta la posición original.
- **Ventanas emergentes** (`js/modales.js`): ya abrían solo con CSS (`:target`); ahora el foco pasa a la ventana y vuelve al enlace que la abrió, Escape la cierra, Tab no se sale y el fondo no se desplaza.
- **Almacenamiento seguro** (`js/almacen.js`): todo acceso a `localStorage` está protegido. Si el navegador lo bloquea, los formularios funcionan igual y avisan que no se pudo guardar.

## Accesibilidad

- Enlace "Saltar al contenido" y foco visible en todos los controles (el reset de CSS quitaba el contorno de los campos). Sobre fondos oscuros el anillo de foco es blanco para que se vea (`css/accesibilidad.css`).
- Página actual marcada con `aria-current="page"` en la barra lateral y en el encabezado.
- Errores de formulario conectados a su campo con `aria-describedby` y `aria-invalid`, así que el lector de pantalla los lee al llegar al campo.
- Movimiento reducido: el panel del menú se desvanece en lugar de deslizarse.

## Rendimiento

- **Imágenes en WebP y al tamaño en que se muestran.** Las fotos de pilotos eran PNG de 300 a 900 KB y se mostraban mucho más pequeñas. Las imágenes del proyecto pasaron de 7,1 MB a 0,8 MB, y lo que descargan las diez páginas juntas bajó de unos 14 MB a unos 2,4 MB.
- `width` y `height` en las imágenes para evitar saltos de contenido, y carga diferida en las que no se ven al abrir.
- Se quitó de Google Fonts lo que no se usaba (Playfair Display y pesos de Orbitron sin uso), sin cambiar cómo se ve.

## Contenido y metadatos

- `meta description` y Open Graph en cada página.
- Favicon (`favicon.svg`).

## Tarjetas de pilotos

- El recuadro con el nombre quedaba centrado sobre la foto y tapaba la cara del piloto. Ahora va al pie de la tarjeta, la tarjeta es un poco más alta (340 px en lugar de 220 px) y la foto se encuadra hacia arriba, así que se ven las seis caras completas.

## Seguridad para publicar

- `netlify.toml` con cabeceras de seguridad: política de contenido (`Content-Security-Policy`) que solo permite los recursos que el sitio usa, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HTTPS obligatorio. Se probó en Chromium con esas cabeceras: todas las páginas cargan sin violaciones y pasan las mismas pruebas de antes.
- Caché del navegador: 30 días para imágenes y 1 hora para CSS y JS, para que quien vuelve no descargue todo otra vez.
- `.gitignore` para no subir por error archivos `.env`, la carpeta `.netlify/`, `node_modules/` ni archivos del editor o del sistema.
