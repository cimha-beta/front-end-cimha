const BACKEND_URL = 'https://back-end-cimha-production.up.railway.app/webhook/consulta-coordenadas';

const statusSteps = [
    "Localizando Ubicación",
    "Consultando Clima",
    "Buscando Estaciones",
    "Estaciones Encontradas",
    "Obteniendo Información",
    "Triangulando Información",
    "Integrando IA",
    "Preparando Formato",
    "¡Listo!"
];

// Porcentaje que se muestra al llegar a cada paso (mismo orden que statusSteps).
// Edita estos números libremente; no tienen que ser parejos ni consecutivos.
const porcentajePorPaso = [12, 21, 35, 43, 62, 72, 84, 96, 100];

let currentStep = 0;
let isCancelled = false;
let timeoutId = null;
let consultaPromise = null;
const timePerPhase = 1500;

const cancelButton = document.getElementById('cancel-button');
const cancelModal = document.getElementById('cancel-modal');
const modalOkBtn = document.getElementById('modal-ok-btn');
const cancelVideo = document.getElementById('cancel-video');

if (cancelVideo) {
    cancelVideo.addEventListener('ended', () => {
        cancelVideo.pause();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    aplicarTransicionEntrada();
    inicializarOdometro();
    inicializarMapaDeProgreso();

    setTimeout(() => {
        iniciarCarga();
    }, 500);

    initInteracciones();
});

function aplicarTransicionEntrada() {
    const main = document.querySelector('main');
    if (main) {
        requestAnimationFrame(() => {
            main.classList.add('loaded');
        });
    }
}

// ============================================ //
// ODÓMETRO DE PORCENTAJE                       //
// ============================================ //

const DIGIT_HEIGHT = 24; // debe coincidir con el font-size/height en el CSS

let odometerEl = null;
let columnasOdometro = [];

function crearColumnaOdometro() {
    const col = document.createElement('div');
    col.className = 'odometer-col';
    const strip = document.createElement('div');
    strip.className = 'odometer-strip';
    for (let d = 0; d <= 9; d++) {
        const span = document.createElement('span');
        span.textContent = d;
        strip.appendChild(span);
    }
    col.appendChild(strip);
    return { col, strip };
}

function asegurarColumnasOdometro(cantidad) {
    while (columnasOdometro.length < cantidad) {
        const nueva = crearColumnaOdometro();
        odometerEl.insertBefore(nueva.col, odometerEl.firstChild);
        columnasOdometro.unshift(nueva);
    }
}

function inicializarOdometro() {
    odometerEl = document.getElementById('odometer');
    if (!odometerEl) return;
    columnasOdometro = [];
    setPorcentajeOdometro(0);
}

function setPorcentajeOdometro(valor) {
    if (!odometerEl) return;
    const str = String(valor);
    asegurarColumnasOdometro(str.length);

    // Alinear los dígitos a la derecha (como un número real)
    const offset = columnasOdometro.length - str.length;

    columnasOdometro.forEach((colObj, i) => {
        const esVisible = i >= offset;
        colObj.col.classList.toggle('active', esVisible);
        if (esVisible) {
            const digito = parseInt(str[i - offset], 10);
            colObj.strip.style.transform = `translateY(-${digito * DIGIT_HEIGHT}px)`;
        }
    });
}

// ============================================ //
// MAPA DE PROGRESO (puntos + etiqueta)         //
// ============================================ //

const W = 330, H = 320, PAD = 30;
const totalPasos = statusSteps.length;

let puntos = [];
let nodeEls = [];
let label = null;
let pathBg = null;
let pathProgress = null;
let totalLength = 0;

function generarPuntos() {
    const pts = [];
    const amplitude = 95;
    const centerX = W / 2;
    const angleStep = (Math.PI * 1.4) / (totalPasos - 1);
    for (let i = 0; i < totalPasos; i++) {
        const y = PAD + (i * (H - PAD * 2)) / (totalPasos - 1);
        const x = centerX + amplitude * Math.sin(i * angleStep);
        pts.push({ x, y });
    }
    return pts;
}

function puntosToPath(pts) {
    return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
}

function inicializarMapaDeProgreso() {
    const mapWrapper = document.getElementById('map-wrapper');
    pathBg = document.getElementById('path-bg');
    pathProgress = document.getElementById('path-progress');

    if (!mapWrapper || !pathBg || !pathProgress) return;

    puntos = generarPuntos();
    const fullPathD = puntosToPath(puntos);
    pathBg.setAttribute('d', fullPathD);
    pathProgress.setAttribute('d', fullPathD);

    // Preparar el "dibujado" progresivo de la línea verde
    totalLength = pathProgress.getTotalLength();
    pathProgress.style.strokeDasharray = totalLength;
    pathProgress.style.strokeDashoffset = totalLength;

    // Crear nodos
    nodeEls = [];
    puntos.forEach((p) => {
        const node = document.createElement('div');
        node.className = 'node pending';
        node.style.left = (p.x / W * 100) + '%';
        node.style.top = (p.y / H * 100) + '%';
        mapWrapper.appendChild(node);
        nodeEls.push(node);
    });

    // Crear etiqueta reutilizable
    label = document.createElement('div');
    label.className = 'step-label';
    mapWrapper.appendChild(label);
}

function mostrarEtiqueta(index) {
    if (!label) return;
    const p = puntos[index];
    label.textContent = statusSteps[index];
    label.style.left = (p.x / W * 100) + '%';
    label.style.top = (p.y / H * 100) + '%';
    requestAnimationFrame(() => label.classList.add('visible'));
}

function ocultarEtiqueta() {
    if (label) label.classList.remove('visible');
}

function activarPaso(index) {
    // Marcar el paso anterior como completado
    if (index > 0 && nodeEls[index - 1]) {
        nodeEls[index - 1].classList.remove('active');
        nodeEls[index - 1].classList.add('done');
    }

    // Activar el paso actual
    if (nodeEls[index]) {
        nodeEls[index].classList.remove('pending');
        nodeEls[index].classList.add('active');
    }

    ocultarEtiqueta();
    setTimeout(() => mostrarEtiqueta(index), 200);

    // Línea de progreso dibujándose suavemente hasta el punto actual
    if (pathProgress) {
        const fraction = index / (totalPasos - 1);
        pathProgress.style.strokeDashoffset = totalLength - totalLength * fraction;
    }

    // Odómetro: porcentaje girando dígito por dígito (según porcentajePorPaso)
    const pct = porcentajePorPaso[index] ?? Math.round(((index + 1) / totalPasos) * 100);
    setPorcentajeOdometro(pct);
}

function finalizarUltimoPaso() {
    const ultimo = nodeEls[totalPasos - 1];
    if (ultimo) {
        ultimo.classList.remove('active');
        ultimo.classList.add('done');
    }
    ocultarEtiqueta();
}

// ============================================ //
// CICLO DE CARGA                               //
// ============================================ //

async function iniciarCarga() {
    if (isCancelled) return;

    // Disparar la consulta al backend (POST) en paralelo con la animación
    if (currentStep === 0) {
        consultaPromise = consultarBackendYGuardar();
    }

    if (isCancelled) return;

    if (currentStep < statusSteps.length) {
        activarPaso(currentStep);
        currentStep++;

        if (currentStep < statusSteps.length) {
            timeoutId = setTimeout(iniciarCarga, timePerPhase);
        } else {
            // Asegurar que el backend ya respondió antes de ir al resultado
            if (consultaPromise) {
                try { await consultaPromise; } catch (err) { console.error('❌ Error al obtener los datos:', err); }
            }
            if (isCancelled) return;

            // Se redirige únicamente cuando el mapa termina Y los datos ya están guardados
            setTimeout(() => {
                if (!isCancelled) {
                    finalizarUltimoPaso();
                    setTimeout(() => {
                        if (!isCancelled) {
                            const tipoPronostico = sessionStorage.getItem('tipoPronostico');
                            const pantallaResultado = tipoPronostico === 'mañana'
                                ? 'resultado-manana.html'
                                : 'resultado-del-dia.html';
                            navegarConTransicion(pantallaResultado);
                        }
                    }, 400);
                }
            }, 600);
        }
    }
}

async function consultarBackendYGuardar() {
    // Leer la consulta que dejó preparada enviarConsulta (js/consulta.js)
    const pendiente = sessionStorage.getItem('consultaPendiente');
    if (!pendiente) {
        console.warn('⚠️ No hay consulta pendiente en sessionStorage (consultaPendiente).');
        return null;
    }
    sessionStorage.removeItem('consultaPendiente');

    try {
        const payload = JSON.parse(pendiente);
        console.log('📡 Enviando petición al backend...', payload);

        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // El backend responde { ok: true, reporte: {...} } o el reporte directo
        console.log('✅ DATOS RECIBIDOS DEL BACKEND:', data);

        sessionStorage.setItem('datosPronostico', JSON.stringify(data.reporte || data));
        sessionStorage.setItem('tipoPronostico', payload.consulta || 'hoy');
        return data;
    } catch (err) {
        console.error('❌ Error de red o CORS al conectar con el backend:', err);
        return null;
    }
}

// ============================================ //
// CANCELACIÓN - Se mantiene igual que antes    //
// ============================================ //

function cancelarProceso() {
    isCancelled = true;
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    if (cancelModal) {
        cancelModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cancelModal.classList.add('modal-active');
            });
        });
    }
}

function initInteracciones() {
    if (cancelButton) {
        cancelButton.addEventListener('click', function (e) {
            e.preventDefault();
            cancelarProceso();
        });
    }

    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', function () {
            navegarConTransicion('principal.html');
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (cancelModal && !cancelModal.classList.contains('hidden')) {
                navegarConTransicion('principal.html');
            } else {
                cancelarProceso();
            }
        }
    });
}

// (Eliminada: cargarDatos() era una copia en desuso de resultado-del-dia.js y
//  referenciaba cargarDatosBackend()/poblarInterfaz(), inexistentes en este archivo.
//  La pantalla de carga solo anima el progreso; los datos llegan vía sessionStorage.)

function navegarConTransicion(destino) {
    const main = document.querySelector('main');
    if (main) {
        main.classList.remove('loaded');
        main.classList.add('fade-out-back');
    }

    if (cancelModal && !cancelModal.classList.contains('hidden')) {
        cancelModal.classList.remove('modal-active');
        cancelModal.classList.add('modal-exit');
    }

    setTimeout(() => {
        // Redirección del navegador
        window.location.href = destino;
    }, 400);
}