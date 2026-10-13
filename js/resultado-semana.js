// ============================================ //
// RESULTADO-SEMANA.JS                          //
// ============================================ //

// ============================================ //
// 1. CONSTANTES                                //
// ============================================ //

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Desde este porcentaje se considera un día de lluvia probable
const UMBRAL_LLUVIA = 70;

// ============================================ //
// 2. FUNCIONES DE AYUDA (DATOS)                //
// ============================================ //

function numero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : null;
}

// "2026-10-05" -> fecha local (sin desfase de zona horaria)
function parseFecha(texto) {
    const [a, m, d] = String(texto).split('-').map(Number);
    const fecha = new Date(a, (m || 1) - 1, d || 1);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function esHoy(fecha) {
    const hoy = new Date();
    return fecha.getFullYear() === hoy.getFullYear()
        && fecha.getMonth() === hoy.getMonth()
        && fecha.getDate() === hoy.getDate();
}

// Lista en lenguaje natural: "el lunes, el martes y el jueves"
function listaNatural(elementos) {
    if (elementos.length <= 1) return elementos.join('');
    return `${elementos.slice(0, -1).join(', ')} y ${elementos[elementos.length - 1]}`;
}

function formatoRango(primera, ultima) {
    if (!primera || !ultima) return '--';
    if (primera.getMonth() === ultima.getMonth()) {
        return `${primera.getDate()} – ${ultima.getDate()} de ${MESES_LARGO[ultima.getMonth()]}`;
    }
    return `${primera.getDate()} de ${MESES_LARGO[primera.getMonth()]} – ${ultima.getDate()} de ${MESES_LARGO[ultima.getMonth()]}`;
}

// Resumen de la semana a partir del arreglo de días
function resumirSemana(dias) {
    const minimas = dias.map(d => numero(d.temperatura_minima)).filter(v => v !== null);
    const maximas = dias.map(d => numero(d.temperatura_maxima)).filter(v => v !== null);
    const vientos = dias.map(d => numero(d.velocidad_viento)).filter(v => v !== null);

    // Estado del cielo más frecuente
    const conteo = {};
    dias.forEach(d => {
        if (d.estado_cielo) conteo[d.estado_cielo] = (conteo[d.estado_cielo] || 0) + 1;
    });
    const cielo = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a])[0] || 'Sin dato';

    // Día más cálido y día más lluvioso
    let diaCalido = null;
    let diaLluvioso = null;
    dias.forEach(d => {
        const tmax = numero(d.temperatura_maxima);
        const lluvia = numero(d.probabilidad_lluvia);
        if (tmax !== null && (!diaCalido || tmax > diaCalido.valor)) diaCalido = { valor: tmax, fecha: d.fecha };
        if (lluvia !== null && (!diaLluvioso || lluvia > diaLluvioso.valor)) diaLluvioso = { valor: lluvia, fecha: d.fecha };
    });

    const diasLluvia = dias
        .filter(d => numero(d.probabilidad_lluvia) !== null && numero(d.probabilidad_lluvia) >= UMBRAL_LLUVIA)
        .map(d => d.fecha);

    return {
        tempMin: minimas.length ? Math.min(...minimas) : null,
        tempMax: maximas.length ? Math.max(...maximas) : null,
        cielo,
        diaCalido,
        diaLluvioso,
        diasLluvia,
        vientoPromedio: vientos.length ? vientos.reduce((a, b) => a + b, 0) / vientos.length : null
    };
}

// ============================================ //
// 3. FUNCIONES DE AYUDA (TEXTO Y DOM)          //
// ============================================ //

function establecerTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = (valor === null || valor === undefined || valor === '') ? '--' : valor;
}

function escaparHTML(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function mostrarMensaje(texto) {
    const lista = document.getElementById('lista-dias');
    const estaciones = document.getElementById('contenedor-estaciones');
    if (lista) lista.innerHTML = `<p class="empty-state">${escaparHTML(texto)}</p>`;
    if (estaciones) estaciones.innerHTML = '';
    establecerTexto('interpretacion', texto);
}

// Ícono según el estado del cielo
function iconoClima(estado) {
    const t = String(estado || '').toLowerCase();
    if (t.includes('tormenta')) return 'assets/clima-tormenta.svg';
    if (t.includes('lluvia') || t.includes('llovizna') || t.includes('chubasco')) return 'assets/clima-lluvia.svg';
    if (t.includes('neblina')) return 'assets/clima-neblina.svg';
    if (t.includes('parcialmente')) return 'assets/clima-parcial.svg';
    if (t.includes('despejado')) return 'assets/clima-despejado.svg';
    return 'assets/clima-nublado.svg';
}

const GOTA = '<svg viewBox="0 0 24 24"><path d="M12 3c3 4 6 7 6 11a6 6 0 11-12 0c0-4 3-7 6-11z"></path></svg>';

// ============================================ //
// 4. PINTAR ENCABEZADO Y RESUMEN               //
// ============================================ //

function pintarEncabezado(reporte, dias, resumen) {
    const ubicacion = reporte.ubicacion || {};
    const lugar = [ubicacion.municipio, ubicacion.departamento].filter(Boolean).join(', ');
    establecerTexto('ubicacion', lugar || 'Ubicación no disponible');

    const primera = parseFecha(dias[0].fecha);
    const ultima = parseFecha(dias[dias.length - 1].fecha);
    establecerTexto('fecha', formatoRango(primera, ultima));
    establecerTexto('dias-pill', `${dias.length} días`);

    // Rango de temperatura de la semana
    const rango = (resumen.tempMin !== null && resumen.tempMax !== null)
        ? `${Math.round(resumen.tempMin)}° – ${Math.round(resumen.tempMax)}°`
        : '--°';
    establecerTexto('temp-rango', rango);

    establecerTexto('estado-cielo', resumen.cielo);

    // Días con lluvia probable
    const nombres = resumen.diasLluvia.map(f => {
        const fecha = parseFecha(f);
        return fecha ? `el ${DIAS_LARGO[fecha.getDay()].toLowerCase()}` : null;
    }).filter(Boolean);
    establecerTexto('estado-detalle', nombres.length
        ? `con lluvias ${listaNatural(nombres)}`
        : 'sin lluvias fuertes esperadas');
}

function pintarResumen(resumen) {
    // Día más cálido
    if (resumen.diaCalido) {
        establecerTexto('dia-calido-valor', `${Math.round(resumen.diaCalido.valor)}°`);
        const f = parseFecha(resumen.diaCalido.fecha);
        establecerTexto('dia-calido-dia', f ? DIAS_LARGO[f.getDay()] : '--');
    }

    // Día más lluvioso
    if (resumen.diaLluvioso) {
        establecerTexto('dia-lluvioso-valor', `${Math.round(resumen.diaLluvioso.valor)}%`);
        const f = parseFecha(resumen.diaLluvioso.fecha);
        establecerTexto('dia-lluvioso-dia', (f && resumen.diaLluvioso.valor > 0) ? DIAS_LARGO[f.getDay()] : 'Sin lluvia');
    }

    // Viento promedio (promedio de los máximos diarios)
    establecerTexto('viento-promedio', resumen.vientoPromedio !== null ? resumen.vientoPromedio.toFixed(1) : '--');
}

// ============================================ //
// 5. DÍA POR DÍA                               //
// ============================================ //

function pintarDias(dias, resumen) {
    const contenedor = document.getElementById('lista-dias');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const encabezado = document.createElement('div');
    encabezado.className = 'day-header';
    encabezado.setAttribute('role', 'row');
    encabezado.innerHTML = `
        <span role="columnheader">Día</span>
        <span role="columnheader">Clima</span>
        <span role="columnheader">Mín</span>
        <span role="columnheader">Rango</span>
        <span role="columnheader">Máx</span>
    `;
    contenedor.appendChild(encabezado);

    const base = resumen.tempMin;
    const rango = (resumen.tempMax - resumen.tempMin) || 1;

    dias.forEach(dia => {
        const fecha = parseFecha(dia.fecha);
        const hoy = fecha ? esHoy(fecha) : false;
        const nombre = hoy ? 'Hoy' : (fecha ? DIAS_CORTO[fecha.getDay()] : '--');
        const detalle = fecha ? `${fecha.getDate()} ${MESES_CORTO[fecha.getMonth()]}` : '';
        const nombreLargo = fecha ? DIAS_LARGO[fecha.getDay()] : nombre;
        const detalleLargo = fecha
            ? `${fecha.getDate()} de ${MESES_LARGO[fecha.getMonth()]}`
            : detalle;

        const tmin = numero(dia.temperatura_minima);
        const tmax = numero(dia.temperatura_maxima);
        const lluvia = numero(dia.probabilidad_lluvia);
        const lluvioso = lluvia !== null && lluvia >= UMBRAL_LLUVIA;

        // Posición de la barra dentro del rango de la semana
        let izquierda = 0;
        let ancho = 100;
        if (tmin !== null && tmax !== null) {
            izquierda = ((tmin - base) / rango) * 100;
            ancho = Math.max(((tmax - tmin) / rango) * 100, 14);
            if (izquierda + ancho > 100) izquierda = 100 - ancho;
        }

        const fila = document.createElement('article');
        fila.className = 'day-row';
        fila.setAttribute('role', 'button');
        fila.setAttribute('tabindex', '0');
        fila.setAttribute('aria-expanded', 'false');
        fila.setAttribute('aria-label', `${nombreLargo}, ${detalleLargo}. Mostrar información del clima.`);
        const estadoCielo = escaparHTML(dia.estado_cielo || 'Clima no disponible');
        const probabilidadLluvia = lluvia !== null ? `${Math.round(lluvia)}%` : 'Sin dato';
        const icono = iconoClima(dia.estado_cielo);
        const temperaturaMaxima = tmax !== null ? `${Math.round(tmax)}°` : '--';
        const temperaturaMinima = tmin !== null ? `${Math.round(tmin)}°` : '--';
        fila.innerHTML = `
            <div>
                <span class="day-name${hoy ? ' today' : ''}">${nombre}</span>
                <span class="day-date">${detalle}</span>
            </div>
            <div class="day-sky">
                <img src="${iconoClima(dia.estado_cielo)}" alt="${escaparHTML(dia.estado_cielo || '')}" />
                <span class="day-rain${lluvioso ? ' wet' : ''}">${GOTA}${lluvia !== null ? Math.round(lluvia) : '--'}%</span>
            </div>
            <span class="day-min">${tmin !== null ? Math.round(tmin) : '--'}°</span>
            <div class="temp-track"><span class="temp-fill" style="left:${izquierda.toFixed(1)}%;width:${ancho.toFixed(1)}%"></span></div>
            <span class="day-max">${tmax !== null ? Math.round(tmax) : '--'}°</span>
            <div class="day-detail-overlay" aria-hidden="true">
                <div class="day-overlay-date">
                    <span>${nombreLargo}</span>
                    <small>${detalleLargo}</small>
                </div>
                <div class="day-overlay-weather">
                    <img class="day-overlay-icon" src="${icono}" alt="" />
                    <div>
                        <span>${estadoCielo}</span>
                        <span>Lluvia <strong>${probabilidadLluvia}</strong></span>
                    </div>
                </div>
                <div class="day-overlay-temperatures">
                    <div><span>Temp. máx.</span><strong>${temperaturaMaxima}</strong></div>
                    <div><span>Temp. mín.</span><strong>${temperaturaMinima}</strong></div>
                </div>
            </div>
        `;

        const alternarDetalle = () => {
            const expandida = fila.classList.toggle('is-expanded');
            fila.setAttribute('aria-expanded', String(expandida));
            fila.setAttribute(
                'aria-label',
                `${nombreLargo}, ${detalleLargo}. ${expandida ? 'Ocultar' : 'Mostrar'} información del clima.`
            );
            fila.querySelector('.day-detail-overlay').setAttribute('aria-hidden', String(!expandida));
        };

        fila.addEventListener('click', alternarDetalle);
        fila.addEventListener('keydown', evento => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                alternarDetalle();
            }
        });

        contenedor.appendChild(fila);
    });
}

// ============================================ //
// 6. ESTACIONES DEL RÍO                        //
// ============================================ //

// Estado según la tendencia actual
function clasificarTendencia(tendencia) {
    const t = String(tendencia).toLowerCase();

    if (t.includes('ascenso') || t.includes('aumento')) {
        return { estado: 'aumento', etiqueta: 'En aumento' };
    }
    if (t.includes('descenso') || t.includes('disminución')) {
        return { estado: 'descenso', etiqueta: 'En descenso' };
    }
    if (t.includes('estable') || t.includes('sin cambio')) {
        return { estado: 'estable', etiqueta: 'Estable' };
    }
    // Sin dato reconocido: estilo neutro con el texto original
    return { estado: 'estable', etiqueta: tendencia };
}

// Predicción y magnitud en una sola frase (ej.: "Descenso leve")
function textoPrediccion(prediccion, magnitud) {
    const vacio = (v) => !v || ['sin dato', 'n/d', 'ninguna', 'ninguno', '-']
        .includes(String(v).trim().toLowerCase());

    if (vacio(prediccion)) return 'Sin dato';
    if (vacio(magnitud)) return String(prediccion);

    const base = String(prediccion);
    const extra = String(magnitud).trim().toLowerCase();
    return base.toLowerCase().includes(extra) ? base : `${base} ${extra}`;
}

function renderizarEstaciones(estaciones) {
    const contenedor = document.getElementById('contenedor-estaciones');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    const cantidad = Number(estaciones?.cantidad || 0);
    if (!cantidad) {
        contenedor.innerHTML = '<p class="empty-state">No hay estaciones disponibles.</p>';
        return;
    }

    // Íconos de tendencia (SVG)
    const ICONOS = {
        aumento: '<path d="M6 15l6-7 6 7"></path>',
        descenso: '<path d="M6 9l6 7 6-7"></path>',
        estable: '<path d="M6 12h12"></path>'
    };

    for (let indice = 1; indice <= cantidad; indice += 1) {
        const nombre = estaciones[`estacion_${indice}_nombre`] || `Estación ${indice}`;
        const municipio = estaciones[`estacion_${indice}_municipio`] || '';
        const nivel = estaciones[`estacion_${indice}_nivel_actual`] ?? 'N/D';
        const tendencia = estaciones[`estacion_${indice}_tendencia_actual`] || 'Sin dato';
        const prediccion = estaciones[`estacion_${indice}_prediccion_12h`];
        const magnitud = estaciones[`estacion_${indice}_magnitud_prediccion`];

        const { estado, etiqueta } = clasificarTendencia(tendencia);

        // Nombre de estación solo si es distinto al municipio
        const subtitulo = (municipio && nombre !== municipio)
            ? `<p class="station-sub">${escaparHTML(nombre)}</p>`
            : '';

        const tarjeta = document.createElement('article');
        tarjeta.className = 'station-item';
        tarjeta.innerHTML = `
            <div class="station-main">
                <h3 class="station-name">${escaparHTML(municipio || nombre)}</h3>
                ${subtitulo}
                <span class="station-level ${estado}">${escaparHTML(nivel)} m</span>
                <span class="station-trend ${estado}">
                    <svg viewBox="0 0 24 24">${ICONOS[estado]}</svg>${escaparHTML(etiqueta)}
                </span>
            </div>
            <div class="station-forecast">
                <span class="forecast-label">Predicción 12 h</span>
                <strong class="forecast-value">${escaparHTML(textoPrediccion(prediccion, magnitud))}</strong>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    }
}

// ============================================ //
// 7. CARGA DEL REPORTE                         //
// ============================================ //

function pintarReporte(reporte) {
    const dias = Array.isArray(reporte.clima) ? reporte.clima : [];
    if (!dias.length) {
        mostrarMensaje('No hay pronóstico disponible para esta semana.');
        return;
    }

    const resumen = resumirSemana(dias);
    pintarEncabezado(reporte, dias, resumen);
    pintarResumen(resumen);
    pintarDias(dias, resumen);
    establecerTexto('interpretacion', reporte.interpretacion || 'Sin información suficiente');
    renderizarEstaciones(reporte.estaciones);
}

function cargarReporte() {
    const crudo = sessionStorage.getItem('datosPronostico');
    if (!crudo) {
        mostrarMensaje('No hay datos para mostrar. Vuelve a realizar la consulta.');
        return;
    }

    try {
        pintarReporte(JSON.parse(crudo));
    } catch (error) {
        console.error('❌ No se pudo leer el reporte de la semana:', error);
        mostrarMensaje('No se pudo leer el pronóstico. Vuelve a realizar la consulta.');
    }
}

// ============================================ //
// 8. INICIALIZACIÓN                            //
// ============================================ //

document.addEventListener('DOMContentLoaded', () => {
    cargarReporte();

    requestAnimationFrame(() => document.body.classList.add('loaded'));

    // Salir con fade
    const salir = document.getElementById('salir-pronostico');
    if (salir) {
        salir.addEventListener('click', () => {
            document.body.classList.remove('loaded');
            setTimeout(() => {
                window.location.href = 'principal.html';
            }, 400);
        });
    }
});
