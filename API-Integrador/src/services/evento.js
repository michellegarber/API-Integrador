import AdministradorEventos from '../repos/evento.js';

const repo = new AdministradorEventos();

const getEvents = async () => {
    return await repo.obtenerEventos();
};

const getEventParameters = async (id, nombre, fecha_inicio, tag) => {
    if (id) {
        return await repo.obtenerEventoPorParametros(parseInt(id, 10), null, null, null);
    }
    return await repo.obtenerEventoPorParametros(null, nombre, fecha_inicio, tag);
};

const getOnlyEventParameters = async (id) => {
    return await repo.obtenerEventoPorId(id);
};

const getEventLocationsParameters = async (id) => {
    return await repo.obtenerUbicacionesDelEvento(id);
};

const createEvent = async (eventData) => {
    return await repo.crearEvento(eventData);
};

const updateEvent = async (eventData) => {
    return await repo.actualizarEvento(eventData);
};

const deleteEvent = async (id) => {
    return await repo.eliminarEvento(id);
};

const checkEnrollmentEvent = async (id_event) => {
    return await repo.verificarInscripcionEvento(id_event);
};

const enrollmentEvent = async (eventData) => {
    return await repo.inscribirseEnEvento(eventData);
};

const getEnrollment = async (id_user) => {
    return await repo.obtenerInscripciones(id_user);
};

const deleteEnrollment = async (id_event, id_user) => {
    return await repo.eliminarInscripcion(id_event, id_user);
};

export default {
    getEvents,
    getEventParameters,
    getOnlyEventParameters,
    getEventLocationsParameters,
    createEvent,
    updateEvent,
    deleteEvent,
    checkEnrollmentEvent,
    enrollmentEvent,
    getEnrollment,
    deleteEnrollment,
};
