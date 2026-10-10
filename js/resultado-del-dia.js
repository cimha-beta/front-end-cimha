// ============================================ //
// RESULTADO-DEL-DIA.JS - JAVASCRIPT            //
// ============================================ //

// ✅ URL correcta: dominio de producción del backend en Railway
const BACKEND_URL = 'https://back-end-cimha-production.up.railway.app/webhook/consulta-coordenadas';

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Resultado del Día - Pantalla cargada');

    aplicarTransicionEntrada();
    initInteracciones();
    // Inicializar el botón "Cancelar" del modal de temperatura alta
    initModalTemperatura();

    // Obtener datos
    cargarDatos();
});

function aplicarTransicionEntrada() {
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);
}

function initInteracciones() {
    const btnRio = document.getElementById('btn-rio');
    const btnClima = document.getElementById('btn-clima');
    const btnSalirPronostico = document.getElementById('salir-pronostico');
    const botonesToggle = [btnRio, btnClima];

    if (btnSalirPronostico) {
        btnSalirPronostico.addEventListener('click', function () {
            window.location.href = 'principal.html';
        });
    }

    function seleccionarCategoria(botonActivo) {
        botonesToggle.forEach(b => {
            if (!b) return;
            if (b === botonActivo) {
                b.classList.remove('toggle-btn-inactive');
                b.classList.add('toggle-btn-active');
            } else {
                b.classList.remove('toggle-btn-active');
                b.classList.add('toggle-btn-inactive');
            }
        });
    }

    if (btnRio) btnRio.addEventListener('click', () => seleccionarCategoria(btnRio));
    if (btnClima) btnClima.addEventListener('click', () => seleccionarCategoria(btnClima));
}

// ============================================ //
// LECTURA Y RENDERIZADO DE DATOS               //
// ============================================ //

async function cargarDatos() {
    // 1. Intentar leer los datos guardados en la pantalla de carga
    const cachedData = sessionStorage.getItem('datosPronostico');

    if (cachedData) {
        const rawData = JSON.parse(cachedData);
        const resultado = Array.isArray(rawData) ? rawData[0] : rawData;
        poblarInterfaz(resultado);
    } else {
        // (Sin fetch adicional: la consulta principal ya la hizo enviarConsulta en js/consulta.js)
        console.warn('⚠️ No hay datos en sessionStorage. Realiza la consulta desde la pantalla principal.');
    }
}

async function cargarDatosBackend() {
    try {
        // La pantalla de consulta-geografica.js guarda la selección en
        // localStorage bajo la clave 'selected_location' con { dept, muni }
        const ubicacionGuardada = localStorage.getItem('selected_location');

        if (!ubicacionGuardada) {
            throw new Error('No hay ubicación seleccionada. Vuelve a la pantalla de consulta geográfica.');
        }

        const { dept, muni } = JSON.parse(ubicacionGuardada);

        const departamento = dept;
        const municipio = muni;
        const consulta = 'hoy'; // 'hoy' | 'mañana' | 'semana'

        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ departamento, municipio, consulta })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const rawData = await response.json();

        // ⚠️ Tu backend responde { ok: true, reporte: {...} },
        // no un array ni el objeto de datos directo.
        if (!rawData.ok) {
            throw new Error(rawData.mensaje || 'El backend respondió con un error.');
        }

        const resultado = rawData.reporte;

        poblarInterfaz(resultado);
        console.log('✅ Datos cargados desde el backend directamente');

    } catch (error) {
        console.error('❌ Error cargando los datos:', error);
    }
}

function poblarInterfaz(resultado) {
    if (!resultado) return;

    // 1. Ubicación y Fecha
    if (resultado.fecha) document.getElementById('fecha').textContent = resultado.fecha;
    if (resultado.hora) document.getElementById('hora').textContent = resultado.hora;
    if (resultado.ubicacion) {
        document.getElementById('ubicacion').textContent = `${resultado.ubicacion.municipio}, ${resultado.ubicacion.departamento}`;
    }

    // 2. Bloque Clima
    if (resultado.clima) {
        const tempActual = Number(resultado.clima.temperatura_actual);
        document.getElementById('temp-actual').textContent = resultado.clima.temperatura_actual ?? '--';
        const estadoCielo = resultado.clima.estado_cielo ?? '--';
        document.getElementById('estado-cielo').textContent = estadoCielo;
        // 🎬 Actualizar el video del estado del cielo
        actualizarVideoClima(estadoCielo);
        document.getElementById('temp-max').textContent = `${resultado.clima.temperatura_maxima ?? '--'}°`;
        document.getElementById('temp-min').textContent = `${resultado.clima.temperatura_minima ?? '--'}°`;
        const sensacionTermica = resultado.clima.posible_sensacion_termica ?? resultado.clima.sensacion_termica;
        document.getElementById('sensacion-termica').textContent = `${sensacionTermica ?? '--'}°`;
        document.getElementById('prob-lluvia').textContent = `${resultado.clima.probabilidad_lluvia ?? '--'}%`;
        document.getElementById('velocidad-viento').textContent = resultado.clima.velocidad_viento ?? '--';
        document.getElementById('interpretacion').textContent =
            resultado.interpretacion ?? resultado.clima.interpretacion ?? 'Sin información.';

        // Modal de temperatura alta: se muestra SOLO si temp actual >= 30°C
        if (!isNaN(tempActual) && tempActual >= 30) {
            mostrarModalTemperaturaAlta(tempActual);
        }
    }

    // 3. Bloque Estaciones
    if (resultado.estaciones) {
        renderizarEstaciones(resultado.estaciones);
        document.getElementById('interpretacion-estaciones').textContent = resultado.estaciones.interpretacion ?? 'Sin información.';
    }

    // 4. Bloque Urrá I
    if (resultado.urra) {
        document.getElementById('hora-reporte-urra').textContent = resultado.urra.hora_reporte ?? '--';
        document.getElementById('urra-nivel').textContent = resultado.urra.nivel_embalse ?? '--';
        document.getElementById('urra-entrante').textContent = resultado.urra.caudal_entrante ?? '--';
        document.getElementById('urra-turbinas').textContent = resultado.urra.caudal_turbinas ?? '--';
        document.getElementById('urra-rebosadero').textContent = resultado.urra.caudal_rebosadero ?? '--';
        document.getElementById('urra-interpretacion').textContent = resultado.urra.interpretacion ?? 'Sin información.';
    }
}

// Generador dinámico para `estacion_n_...`
function renderizarEstaciones(estacionesData) {
    const contenedor = document.getElementById('contenedor-estaciones');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    const cantidad = estacionesData.cantidad || 0;

    if (cantidad === 0) {
        contenedor.innerHTML = '<p class="estaciones-vacio">No hay estaciones disponibles.</p>';
        return;
    }

    // Íconos de tendencia (SVG)
    const ICONOS = {
        aumento: '<path d="M6 15l6-7 6 7"></path>',
        descenso: '<path d="M6 9l6 7 6-7"></path>',
        estable: '<path d="M6 12h12"></path>'
    };

    for (let i = 1; i <= cantidad; i++) {
        const nombre = estacionesData[`estacion_${i}_nombre`] || `Estación ${i}`;
        const municipio = estacionesData[`estacion_${i}_municipio`] || '';
        const nivel = estacionesData[`estacion_${i}_nivel_actual`] ?? 'N/A';
        const precip = estacionesData[`estacion_${i}_precipitacion_actual`];
        const tendencia = estacionesData[`estacion_${i}_tendencia_actual`] ||
            estacionesData[`estacion_${i}_tendencia`] || 'Estable';

        const t = tendencia.toLowerCase();
        const esEstable = t.includes('estable') || t.includes('sin cambio');
        const esAscenso = t.includes('ascenso') || t.includes('aumento');
        const esDescenso = t.includes('descenso') || t.includes('disminución');

        // Estado según la tendencia
        let estado = 'descenso';
        let etiqueta = tendencia;

        if (esAscenso) {
            estado = 'aumento';
            etiqueta = 'En aumento';
        } else if (esDescenso) {
            estado = 'descenso';
            etiqueta = 'En descenso';
        } else if (esEstable) {
            estado = 'estable';
            etiqueta = 'Estable';
        }

        // Precipitación: valor o guion si no hay dato
        const hayPrecip = precip !== undefined && precip !== null;
        const precipHTML = hayPrecip
            ? `<span class="precip-valor">${precip}</span><span class="precip-unidad">mm</span>`
            : '<span class="precip-vacio">—</span>';

        // Nombre de estación solo si es distinto al municipio
        const subtitulo = (municipio && nombre !== municipio)
            ? `<p class="estacion-sub">${nombre}</p>`
            : '';

        const fila = document.createElement('article');
        fila.className = 'estacion-card';
        fila.innerHTML = `
            <div class="estacion-info">
                <h3 class="estacion-nombre">${municipio || nombre}</h3>
                ${subtitulo}
                <span class="estacion-nivel ${estado}">${nivel} m</span>
                <span class="estacion-estado ${estado}">
                    <svg viewBox="0 0 24 24">${ICONOS[estado]}</svg>${etiqueta}
                </span>
            </div>
            <div class="estacion-precip">
                <span class="precip-label">Precipitación</span>
                <div class="precip-dato">
                    <svg class="precip-gota" viewBox="0 0 24 24"><path d="M12 2.5c3.3 4.2 6 7.4 6 11a6 6 0 11-12 0c0-3.6 2.7-6.8 6-11z"></path></svg>
                    ${precipHTML}
                </div>
            </div>`;
        contenedor.appendChild(fila);
    }
}

// ============================================ //
// MODAL DE TEMPERATURA ALTA                    //
// ============================================ //

/**
 * Muestra el modal de "Temperaturas Altas" al cargar la pantalla.
 * Se muestra únicamente si la temperatura actual es >= 30°C.
 * El botón "Cancelar" elimina el modal de la pantalla.
 */
function mostrarModalTemperaturaAlta(tempActual) {
    const modal = document.getElementById('modal-temp-alta');
    if (!modal) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const valorEl = document.getElementById('modal-temp-alta-valor');
    if (valorEl) valorEl.textContent = tempActual;

    // Quitar la clase "hidden" para mostrarlo
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

// Botón "Cancelar": elimina el modal por completo de la pantalla
function initModalTemperatura() {
    const btnCerrar = document.getElementById('modal-temp-alta-cerrar');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function () {
            const modal = document.getElementById('modal-temp-alta');
            const previousScrollY = window.scrollY;

            if (modal) {
                modal.classList.add('hidden');
            }
            document.body.classList.remove('modal-open');
            window.scrollTo({ top: previousScrollY, left: 0, behavior: 'instant' });
        });
    }
}

// ============================================ */
// VIDEO DEL ESTADO DEL CIELO                   */
// ============================================ */

function actualizarVideoClima(estadoCielo) {
    const videoContainer = document.getElementById('video-estado-cielo');
    const video = document.getElementById('video-clima');
    const videoSource = document.getElementById('video-source');

    console.log('📌 Estado recibido:', estadoCielo);

    if (!videoContainer || !video || !videoSource) {
        console.warn('⚠️ No se encontraron los elementos del video en el DOM.');
        return;
    }

    // Si no hay estado válido, ocultar el video
    if (!estadoCielo || estadoCielo === '--' || estadoCielo === 'Cargando información...') {
        videoContainer.classList.remove('visible');
        video.pause();
        videoSource.src = '';
        return;
    }

    // Lista de estados que tienen video (nombre exacto del archivo)
    const estadosConVideo = [
        'Despejado',
        'Parcialmente nublado',
        'Nublado',
        'Lluvia ligera',
        'Tormenta eléctrica',
        'Lluvia intensa'
    ];

    // Normaliza un texto: minúsculas, sin tildes y con espacios simples.
    // Permite que coincidan variantes del backend (ej. "Parcialmente soleado")
    // con los nombres exactos de los archivos.
    function normalizar(texto) {
        return String(texto)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Buscar primero coincidencia EXACTA y, si no, coincidencia normalizada
    const estadoCoincidente = estadosConVideo.find(
        estado => estado === estadoCielo || normalizar(estado) === normalizar(estadoCielo)
    );

    const tieneVideo = !!estadoCoincidente;
    console.log('📌 Tiene video:', tieneVideo);

    if (tieneVideo) {
        // Codificar los espacios para evitar 404 en el servidor
        const rutaVideo = `assets/${estadoCoincidente.replace(/ /g, '%20')}.mp4`;
        console.log('📌 Ruta:', rutaVideo);

        videoSource.src = rutaVideo;
        video.load();
        videoContainer.classList.add('visible');

        video.play().catch(err => {
            console.log('⚠️ No se pudo reproducir:', err);
            videoContainer.classList.remove('visible');
        });

        console.log('📌 Video cargado:', videoSource.src);
    } else {
        console.log(`📹 Sin video para: "${estadoCielo}"`);
        videoContainer.classList.remove('visible');
        video.pause();
        videoSource.src = '';
    }
}