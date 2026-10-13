// ============================================ //
// POLITICA-DE-PRIVACIDAD-CONTENIDO.JS          //
// ============================================ //
// Único archivo a editar para el texto legal.
// Cada texto "[PENDIENTE: ...]" se resalta en pantalla.

const POLITICA_PRIVACIDAD = {

    // Estado de publicación
    // false = muestra aviso de borrador
    publicada: false,

    // Versión y fecha
    version: '0.1',
    ultimaActualizacion: null, // 'AAAA-MM-DD' al publicar

    // Introducción
    introduccion: '[PENDIENTE: resumen corto de la política]',

    // Secciones
    // icono: nombre de Material Symbols
    // parrafos: texto normal
    // items: lista con viñetas (opcional)
    secciones: [
        {
            id: 'responsable',
            icono: 'badge',
            titulo: 'Quiénes somos',
            parrafos: ['[PENDIENTE: responsable del tratamiento de datos]']
        },
        {
            id: 'datos-recopilados',
            icono: 'database',
            titulo: 'Qué datos recopilamos',
            parrafos: ['[PENDIENTE: describir datos recopilados]'],
            items: []
        },
        {
            id: 'uso-datos',
            icono: 'target',
            titulo: 'Para qué usamos tus datos',
            parrafos: ['[PENDIENTE: finalidades del tratamiento]'],
            items: []
        },
        {
            id: 'terceros',
            icono: 'share',
            titulo: 'Con quién los compartimos',
            parrafos: ['[PENDIENTE: servicios y fuentes de terceros]'],
            items: []
        },
        {
            id: 'conservacion',
            icono: 'schedule',
            titulo: 'Cuánto tiempo los conservamos',
            parrafos: ['[PENDIENTE: tiempos de conservación]']
        },
        {
            id: 'derechos',
            icono: 'verified_user',
            titulo: 'Tus derechos',
            parrafos: ['[PENDIENTE: acceso, corrección y eliminación]'],
            items: []
        },
        {
            id: 'seguridad',
            icono: 'lock',
            titulo: 'Seguridad de la información',
            parrafos: ['[PENDIENTE: medidas de seguridad]']
        },
        {
            id: 'almacenamiento-local',
            icono: 'cookie',
            titulo: 'Almacenamiento en tu dispositivo',
            parrafos: ['[PENDIENTE: datos guardados en el navegador]']
        },
        {
            id: 'cambios',
            icono: 'update',
            titulo: 'Cambios a esta política',
            parrafos: ['[PENDIENTE: cómo se avisa de cambios]']
        },
        {
            id: 'contacto',
            icono: 'mail',
            titulo: 'Contacto',
            parrafos: ['[PENDIENTE: medio de contacto para solicitudes]']
        }
    ]
};
