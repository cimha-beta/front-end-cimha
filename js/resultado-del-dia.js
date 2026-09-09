// ============================================ //
// RESULTADO-DEL-DIA.JS - JAVASCRIPT            //
// ============================================ //

// ✅ URL correcta: puerto 3000 (tu server.js), prefijo /webhook definido en app.use()
const BACKEND_URL = 'http://localhost:3000/webhook/consulta-coordenadas';

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
    const botonesToggle = [btnRio, btnClima];

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
        document.getElementById('sensacion-termica').textContent = `${resultado.clima.sensacion_termica ?? '--'}°`;
        document.getElementById('prob-lluvia').textContent = `${resultado.clima.probabilidad_lluvia ?? '--'}%`;
        document.getElementById('velocidad-viento').textContent = `${resultado.clima.velocidad_viento ?? '--'} Km/h`;
        document.getElementById('interpretacion').textContent = resultado.clima.interpretacion ?? 'Sin información.';

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
        document.getElementById('hora-reporte-urra').textContent = `Reporte de las ${resultado.urra.hora_reporte ?? '--'}`;
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
        contenedor.innerHTML = '<p class="text-slate-400 text-sm px-2">No hay estaciones disponibles.</p>';
        return;
    }

    // Función para convertir color hex a filtro
    function getFilterColor(hex) {
        const colors = {
            '#10B981': 'invert(54%) sepia(73%) saturate(438%) hue-rotate(98deg) brightness(95%) contrast(89%)',
            '#EF4444': 'invert(35%) sepia(93%) saturate(2525%) hue-rotate(346deg) brightness(95%) contrast(88%)',
            '#6B7280': 'invert(39%) sepia(8%) saturate(687%) hue-rotate(179deg) brightness(90%) contrast(90%)',
            '#3B82F6': 'invert(51%) sepia(58%) saturate(2420%) hue-rotate(210deg) brightness(99%) contrast(86%)'
        };
        return colors[hex] || colors['#3B82F6'];
    }

    for (let i = 1; i <= cantidad; i++) {
        const nombre = estacionesData[`estacion_${i}_nombre`] || `Estación ${i}`;
        const municipio = estacionesData[`estacion_${i}_municipio`] || '';
        const nivel = estacionesData[`estacion_${i}_nivel_actual`] ?? 'N/A';
        const precip = estacionesData[`estacion_${i}_precipitacion_actual`];
        const tendencia = estacionesData[`estacion_${i}_tendencia`] || 'Estable';
        // (Cuando no hay dato de precipitación se muestra una línea gris "-".)

        const esEstable = tendencia.toLowerCase() === 'estable' ||
            tendencia.toLowerCase().includes('estable') ||
            tendencia.toLowerCase() === 'sin cambio' ||
            tendencia.toLowerCase().includes('sin cambio');

        const esAscenso = tendencia.toLowerCase().includes('ascenso') ||
            tendencia.toLowerCase().includes('aumento');

        const esDescenso = tendencia.toLowerCase().includes('descenso') ||
            tendencia.toLowerCase().includes('disminución');

        let colorClase = '#3B82F6';
        let iconTrend = '';
        let textoColor = '#0F172A';

        if (esAscenso) {
            colorClase = '#10B981';
            iconTrend = 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/trending-up.svg';
            textoColor = '#10B981';
        } else if (esDescenso) {
            colorClase = '#EF4444';
            iconTrend = 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/trending-down.svg';
            textoColor = '#EF4444';
        } else if (esEstable) {
            colorClase = '#6B7280';
            iconTrend = 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/minus.svg';
            textoColor = '#6B7280';
        } else {
            colorClase = '#EF4444';
            iconTrend = 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/trending-down.svg';
            textoColor = '#EF4444';
        }

        // ============================================ */
        // PRECIPITACIÓN / DATO NO DISPONIBLE           */
        // ============================================ */
        // Si hay dato de precipitación → se muestra SOLO ese dato.
        // Si NO hay dato → se muestra una línea gris "-"
        // (sin texto, sin gotas y sin "mm").
        let iconoGotas = '';
        let precipHTML;
        if (precip !== undefined && precip !== null) {
            iconoGotas = `<img src="https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/droplets.svg" alt="Precipitación" style="width: 28px; height: 32px; margin-bottom: 2px; opacity: 0.7;" />`;
            precipHTML = `<div class="flex items-baseline gap-0.5">
                   <span style="font-size: 18px; font-weight: 700; color: ${colorClase};">${precip}</span>
                   <span style="font-size: 11px; font-weight: 500; color: ${colorClase};">mm</span>
               </div>`;
        } else {
            // No hay dato → se muestra una línea gris "-"
            precipHTML = `<p style="margin: 0; font-size: 24px; font-weight: 300; color: #9CA3AF; line-height: 1; text-align: center;">-</p>`;
        }

        const article = document.createElement('article');
        article.className = "bg-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex items-stretch border border-[#E5E7EB] estacion-card";
        article.innerHTML = `
            <div class="absolute left-0 top-0 bottom-0 w-1" style="background-color: ${colorClase};"></div>
            <div class="flex flex-1 items-center gap-3">
                <div class="flex-1 pr-3 border-r border-gray-100">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #0F172A;">${municipio || nombre}</h3>
                    <p style="margin: 2px 0; font-size: 10px; font-weight: 500; color: #9CA3AF; text-transform: uppercase;">${nombre}</p>
                    <div class="flex items-baseline gap-1">
                        <span style="font-size: 24px; font-weight: 700; color: ${colorClase};">${nivel}</span>
                        <span style="font-size: 14px; font-weight: 600; color: ${colorClase};">m</span>
                    </div>
                    <div class="flex items-center gap-1 mt-0.5">
                        <img src="${iconTrend}" alt="Tendencia" style="width: 12px; height: 12px; filter: brightness(0) saturate(100%) ${getFilterColor(colorClase)};" />
                        <span style="font-size: 12px; font-weight: 500; color: ${textoColor};">${tendencia}</span>
                    </div>
                </div>
                <!-- ============================================ -->
                <!-- SECCIÓN DE PRECIPITACIÓN - MODIFICADA       -->
                <!-- ============================================ -->
                <div class="shrink-0 flex flex-col justify-center items-center text-center" style="width: 110px; padding-left: 8px;">
                    ${iconoGotas}
                    ${precipHTML}
                </div>
            </div>
        `;
        contenedor.appendChild(article);
    }

    initEstacionesInteracciones();
}

function initEstacionesInteracciones() {
    const estaciones = document.querySelectorAll('.estacion-card');
    estaciones.forEach(estacion => {
        estacion.addEventListener('mouseenter', function () {
            this.style.cursor = 'pointer';
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.2s ease';
        });
        estacion.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });
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

    const valorEl = document.getElementById('modal-temp-alta-valor');
    if (valorEl) valorEl.textContent = tempActual;

    // Quitar la clase "hidden" para mostrarlo
    modal.classList.remove('hidden');
}

// Botón "Cancelar": elimina el modal por completo de la pantalla
function initModalTemperatura() {
    const btnCerrar = document.getElementById('modal-temp-alta-cerrar');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function () {
            const modal = document.getElementById('modal-temp-alta');
            if (modal) {
                // Eliminarlo del DOM
                modal.remove();
            }
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