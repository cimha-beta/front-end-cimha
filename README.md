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
5. [Problemas conocidos / notas de mantenimiento](#5-problemas-conocidos--notas-de-mantenimiento)

---

## 1. Flujo de pantallas

El recorrido normal de un usuario pasa por estas pantallas, en este orden:

1. **`index.html`** (`js/index.js`) — Splash/bienvenida con el logo animado. Redirige a `consulta-geografica.html`.
2. **`consulta-geografica.html`** (`js/consulta-geografica.js`) — El usuario elige departamento/municipio. Al confirmar, guarda la selección en `localStorage` bajo la clave `selected_location` como `{ dept, muni }`. Redirige a `principal.html`.
3. **`principal.html`** (`js/principal.js`) — Pantalla principal / home. Desde aquí el usuario navega a `consulta.html` para elegir qué tipo de pronóstico quiere.
4. **`consulta.html`** (`js/consulta.js`) — El usuario elige el tipo de pronóstico: **hoy**, **mañana** o **semana**. La función `enviarConsulta(tipoPronostico)`:
   - Lee `selected_location` de `localStorage`.
   - Arma el payload `{ departamento, municipio, consulta, fecha }`.
   - Lo guarda en `sessionStorage` bajo la clave `consultaPendiente`.
   - Redirige **inmediatamente** a `carga-pronostico.html` (sin esperar respuesta del backend).
5. **`carga-pronostico.html`** (`js/carga-pronostico.js`) — Pantalla de carga con animación de progreso. Aquí ocurre la petición real:
   - Lee `consultaPendiente` de `sessionStorage`.
   - Hace `POST` al backend (`BACKEND_URL`, ver sección 2).
   - Si la respuesta es exitosa, guarda el resultado en `sessionStorage` bajo la clave `datosPronostico`.
   - Al terminar la animación (y la petición, lo que tarde más), redirige a `resultado-del-dia.html`.
6. **`resultado-del-dia.html`** (`js/resultado-del-dia.js`) — Lee `datosPronostico` de `sessionStorage` y renderiza el reporte (clima, estaciones del río, Urrá). **No vuelve a llamar al backend** — solo consume lo que ya dejó `carga-pronostico.js`.

Otras páginas independientes de este flujo: `acerca-de-nosotros.html`, `fuentes-de-datos.html`, `reportes.html` (formulario de PQRS ciudadano, que sí llama a un endpoint distinto del backend: `/webhook/correo-reportes`).

---

## 2. Conexión con el backend

La URL del backend está **hardcodeada** (no hay variables de entorno en este proyecto, al ser estático) en dos archivos:

- `js/carga-pronostico.js` → `BACKEND_URL` (la que realmente se usa en el flujo normal)
- `js/resultado-del-dia.js` → `BACKEND_URL` (solo la usa la función `cargarDatosBackend()`, que **no está conectada a ningún flujo activo** — ver sección 5)

Ambas apuntan a:
```
https://back-end-cimha-production.up.railway.app/webhook/consulta-coordenadas
```

Si el backend cambia de URL (por ejemplo, se recrea el servicio en Railway), hay que actualizar **ambos** archivos.

**Requisito del lado del backend:** la variable `ALLOWED_ORIGINS` en Railway debe incluir exactamente `https://front-end-cimha.cimha-app.workers.dev` (sin `/` al final) para que el CORS no bloquee las peticiones. Ver `arquitectura.md` del backend, sección 6 y 8.

---

## 3. Estructura del proyecto

```
├── index.html, principal.html, consulta.html, consulta-geografica.html,
│   carga-pronostico.html, resultado-del-dia.html, resultado.html,
│   reportes.html, fuentes-de-datos.html, acerca-de-nosotros.html
├── css/          → un archivo .css por pantalla + tailwind.css
├── js/           → un archivo .js por pantalla (mismo nombre que el .html)
└── assets/       → imágenes (iconos, logo) y videos cortos de UI
```

Tailwind se carga vía CDN (`cdn.tailwindcss.com`) con los plugins `forms` y `container-queries` — **no está pensado para producción tal cual** (el propio CDN lo advierte en consola), pero es aceptable para el tamaño actual del proyecto. Si el sitio crece, considerar migrar a Tailwind CLI/PostCSS.

---

## 4. Cómo correrlo en local

Al no tener build step, basta con servir los archivos estáticos. Por ejemplo, con la extensión **Live Server** de VS Code (por eso el backend tiene `http://localhost:5500`, `http://127.0.0.1:5500` y `http://127.0.0.1:5501` en su `ALLOWED_ORIGINS` — son los puertos por defecto de Live Server).

Para probar contra el backend real, no hace falta nada adicional: `BACKEND_URL` ya apunta a producción (Railway). Si se quiere probar contra un backend corriendo en local, hay que cambiar manualmente `BACKEND_URL` en `js/carga-pronostico.js` a `http://localhost:3000/webhook/consulta-coordenadas` (o el puerto que use el backend) y asegurarse de que ese origen esté en `ALLOWED_ORIGINS` del backend local.

---

## 5. Problemas conocidos / notas de mantenimiento

- **`cargarDatosBackend()` en `js/resultado-del-dia.js` es código muerto.** Es una versión anterior que hacía el `fetch` directamente en esta pantalla (leyendo `selected_location` de `localStorage`). Ya no se usa: la función activa es `cargarDatos()`, que solo lee `sessionStorage`. Se dejó sin borrar por si se necesita como referencia, pero puede eliminarse con seguridad.
- **Si `resultado-del-dia.html` se abre directamente** (sin pasar por `consulta.html` → `carga-pronostico.html`), no habrá nada en `sessionStorage` y la consola mostrará `⚠️ No hay datos en sessionStorage`. Esto es esperado — no es un bug, es una validación de flujo.
- **La URL del backend está hardcodeada en dos archivos** (ver sección 2). Si en el futuro se agrega un proceso de build, conviene centralizarla en un solo archivo de configuración (`config.js`) importado por ambos.