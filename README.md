# CIMHA — Frontend

**CIMHA** (Centro de Inteligencia Meteorológica, Hidrológica y Ambiental) es la interfaz web que permite a un ciudadano consultar el pronóstico del clima y el estado del río de su municipio, generado por el [backend de CIMHA](https://github.com/cimha-beta/back-end-cimha).

Frontend estático (HTML + JS + Tailwind vía CDN), sin framework ni build step. Desplegado en **Cloudflare Workers**:
`https://front-end-cimha.cimha-app.workers.dev/`

---

## Índice

1. [Flujo de pantallas](#1-flujo-de-pantallas)
2. [Conexión con el backend](#2-conexión-con-el-backend)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Cómo correrlo en local](#4-cómo-correrlo-en-local)
5. [Datos que maneja el frontend](#5-datos-que-maneja-el-frontend)
6. [Política de privacidad](#6-política-de-privacidad)
7. [Convenciones del código](#7-convenciones-del-código)
8. [Problemas conocidos / notas de mantenimiento](#8-problemas-conocidos--notas-de-mantenimiento)

---

## 1. Flujo de pantallas

El recorrido normal de un usuario pasa por estas pantallas, en este orden:

1. **`index.html`** (`js/index.js`) — Splash/bienvenida con el logo animado. Redirige a `consulta-geografica.html`.
2. **`consulta-geografica.html`** (`js/consulta-geografica.js`) — El usuario elige departamento/municipio. Al confirmar, guarda la selección en `localStorage` bajo la clave `selected_location` como `{ dept, muni }`. Redirige a `principal.html`.
3. **`principal.html`** (`js/principal.js`) — Pantalla principal / home. Desde aquí el usuario navega a `consulta.html` para elegir qué tipo de pronóstico quiere, o a las pantallas de "Más información" (reportes, acerca de nosotros, fuentes de datos).
4. **`consulta.html`** (`js/consulta.js`) — El usuario elige el tipo de pronóstico: **hoy**, **mañana** o **semana**. La función `enviarConsulta(tipoPronostico)`:
   - Lee `selected_location` de `localStorage`.
   - Arma el payload `{ departamento, municipio, consulta, fecha }`.
   - Lo guarda en `sessionStorage` bajo la clave `consultaPendiente`.
   - Redirige **inmediatamente** a `carga-pronostico.html` (sin esperar respuesta del backend).
5. **`carga-pronostico.html`** (`js/carga-pronostico.js`) — Pantalla de carga con animación de progreso. Aquí ocurre la petición real:
   - Lee `consultaPendiente` de `sessionStorage`.
   - Hace `POST` al backend (`BACKEND_URL`, ver sección 2).
   - Si la respuesta es exitosa, guarda el resultado en `sessionStorage` bajo la clave `datosPronostico` y el tipo elegido bajo `tipoPronostico`.
   - Al terminar la animación (y la petición, lo que tarde más), redirige a la pantalla de resultado según `tipoPronostico`.
6. **Pantalla de resultado** — Solo leen `datosPronostico` de `sessionStorage`; **no vuelven a llamar al backend**:

   | `tipoPronostico` | Pantalla | JS | CSS |
   |---|---|---|---|
   | `mañana` | `resultado-manana.html` | `js/resultado-manana.js` | `css/resultado-manana.css` |
   | `semana` | `resultado-semana.html` | `js/resultado-semana.js` | `css/resultado-semana.css` |
   | cualquier otro (hoy) | `resultado-del-dia.html` | `js/resultado-manana.js` | `css/resultado-manana.css` |

   `resultado-del-dia.html` y `resultado-manana.html` comparten el mismo JS y CSS.

Otras pantallas independientes de este flujo:

- **`acerca-de-nosotros.html`** (`js/acerca-de-nosotros.js`) — Información del proyecto. Redirige a `reportes.html` (Contactar soporte) y a `politica-de-privacidad.html`.
- **`fuentes-de-datos.html`** (`js/fuentes-de-datos.js`) — Fuentes de datos usadas (Open-Meteo, IDEAM, Hidroeléctrica Urrá).
- **`reportes.html`** (`js/reportes.js`) — Formulario de PQRS ciudadano. Llama a un endpoint distinto del backend: `/webhook/correo-reportes`. El botón **Enviar** solo se activa si todos los campos son válidos **y** la casilla "Acepto la política de privacidad" está marcada.
- **`politica-de-privacidad.html`** (`js/politica-de-privacidad.js`) — Política de privacidad. Ver sección 6.

---

## 2. Conexión con el backend

La URL del backend está **hardcodeada** (no hay variables de entorno en este proyecto, al ser estático). En el flujo activo aparece en:

- `js/carga-pronostico.js` → `BACKEND_URL` (consulta del pronóstico):
  ```
  https://back-end-cimha-production.up.railway.app/webhook/consulta-coordenadas
  ```
- `js/reportes.js` → dentro del `fetch` del envío (reportes):
  ```
  https://back-end-cimha-production.up.railway.app/webhook/correo-reportes
  ```

`js/resultado-del-dia.js` también tiene una `BACKEND_URL`, pero ese archivo no está enlazado desde ninguna pantalla (ver sección 8).

Si el backend cambia de URL (por ejemplo, se recrea el servicio en Railway), hay que actualizar **ambos** archivos del flujo activo.

**Requisito del lado del backend:** la variable `ALLOWED_ORIGINS` en Railway debe incluir exactamente `https://front-end-cimha.cimha-app.workers.dev` (sin `/` al final) para que el CORS no bloquee las peticiones. Ver `arquitectura.md` del backend, sección 6 y 8.

---

## 3. Estructura del proyecto

```
├── index.html, consulta-geografica.html, principal.html, consulta.html,
│   carga-pronostico.html, resultado-del-dia.html, resultado-manana.html,
│   resultado-semana.html, reportes.html, fuentes-de-datos.html,
│   acerca-de-nosotros.html, politica-de-privacidad.html
├── css/          → un archivo .css por pantalla (ver excepciones abajo)
├── js/           → un archivo .js por pantalla (ver excepciones abajo)
│                   + politica-de-privacidad-contenido.js (texto legal)
└── assets/       → imágenes (iconos, logo, favicon) y videos cortos de UI
```

Excepciones al "un archivo por pantalla":

- `resultado-del-dia.html` usa `css/resultado-manana.css` y `js/resultado-manana.js`.
- `politica-de-privacidad.html` usa además `js/politica-de-privacidad-contenido.js`.

Tailwind se carga vía CDN (`cdn.tailwindcss.com`) con los plugins `forms` y `container-queries` — **no está pensado para producción tal cual** (el propio CDN lo advierte en consola), pero es aceptable para el tamaño actual del proyecto. Si el sitio crece, considerar migrar a Tailwind CLI/PostCSS.

---

## 4. Cómo correrlo en local

Al no tener build step, basta con servir los archivos estáticos. Por ejemplo, con la extensión **Live Server** de VS Code (por eso el backend tiene `http://localhost:5500`, `http://127.0.0.1:5500` y `http://127.0.0.1:5501` en su `ALLOWED_ORIGINS` — son los puertos por defecto de Live Server).

Para probar contra el backend real, no hace falta nada adicional: `BACKEND_URL` ya apunta a producción (Railway). Si se quiere probar contra un backend corriendo en local, hay que cambiar manualmente `BACKEND_URL` en `js/carga-pronostico.js` a `http://localhost:3000/webhook/consulta-coordenadas` (o el puerto que use el backend) y asegurarse de que ese origen esté en `ALLOWED_ORIGINS` del backend local.

---

## 5. Datos que maneja el frontend

Resumen útil para mantener la política de privacidad al día.

**Guardados en el navegador del usuario**

| Dónde | Clave | Contenido |
|---|---|---|
| `localStorage` | `selected_location` | `{ dept, muni }` elegido en Consulta Geográfica |
| `sessionStorage` | `consultaPendiente` | Payload de la consulta (se borra al usarlo) |
| `sessionStorage` | `datosPronostico` | Resultado del backend para pintar la pantalla |
| `sessionStorage` | `tipoPronostico` | `hoy`, `mañana` o `semana` |

**Enviados al backend**

- Consulta: `{ departamento, municipio, consulta, fecha }`.
- Reporte: `{ tipo, departamento, municipio, email, asunto, descripcion, fecha }`.

**Servicios de terceros que se cargan desde el navegador**

- Google Fonts (Inter y Material Symbols).
- Tailwind CDN (`cdn.tailwindcss.com`).

---

## 6. Política de privacidad

La pantalla está lista pero **el texto legal está pendiente**. Todo el contenido vive en un solo archivo:

`js/politica-de-privacidad-contenido.js`

- `publicada: false` muestra un aviso de borrador; al publicar se cambia a `true`.
- `version` y `ultimaActualizacion` (formato `'AAAA-MM-DD'`) se muestran en la cabecera.
- Cada sección tiene `id`, `icono`, `titulo`, `parrafos` y, opcionalmente, `items`. Los textos que contienen `[PENDIENTE` se resaltan en amarillo para que no se publiquen por error.
- Para agregar o quitar una sección basta con copiar o borrar un bloque del arreglo `secciones`.

El HTML, el CSS y la lógica no se tocan al llenar el contenido.

---

## 7. Convenciones del código

- Un `.html`, un `.css` y un `.js` por pantalla, con el mismo nombre.
- Los `id` del HTML existentes **no se renombran**; si el diseño cambia, solo pueden cambiar de posición.
- Las reglas de los `.js` existentes se conservan; las nuevas se agregan sin eliminar las anteriores.
- JS y CSS organizados en secciones separadas por comentarios cortos (máximo 5 palabras), solo como títulos de sección o para acciones importantes.
- Tipografía **Inter** en todas las pantallas.
- Título de pestaña con el formato `Nombre de la pantalla - CIMHA`.
- Todo texto que venga del backend y se inserte con `innerHTML` debe pasar por `escaparHTML()` (ver `js/resultado-manana.js` y `js/resultado-semana.js`).
- Favicon y apple-touch-icon declarados en el `<head>` de cada pantalla (`assets/favicon-32.png`, `assets/apple-touch-icon.png`).

---

## 8. Problemas conocidos / notas de mantenimiento

- **`js/resultado-del-dia.js` y `css/resultado-del-dia.css` no están enlazados desde ninguna página.** `resultado-del-dia.html` usa `js/resultado-manana.js` y `css/resultado-manana.css`. Son versiones anteriores: dentro de `js/resultado-del-dia.js` está `cargarDatosBackend()`, que hacía el `fetch` directamente en esa pantalla. Pueden eliminarse con seguridad. Si algún día se vuelve a enlazar ese JS, hay que escapar con `escaparHTML()` los textos del backend que inserta con `innerHTML`.
- **`resultado.html` no está referenciado por ninguna página.** Es una versión anterior de la pantalla de resultado.
- **`css/tailwind.css` solo se enlaza desde `consulta-geografica.html`.** Contiene directivas `@tailwind` y `@apply`, que necesitan un paso de compilación; sin build, el navegador no las interpreta. Verificar antes de eliminarlo.
- **Si una pantalla de resultado se abre directamente** (sin pasar por `consulta.html` → `carga-pronostico.html`), no habrá nada en `sessionStorage` y la pantalla mostrará un mensaje de que no hay datos. Esto es esperado — no es un bug, es una validación de flujo.
- **La URL del backend está hardcodeada** (ver sección 2). Si en el futuro se agrega un proceso de build, conviene centralizarla en un solo archivo de configuración (`config.js`) importado por los archivos que la usan.
