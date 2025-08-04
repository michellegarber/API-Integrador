import config from './../config/config.js';
import pkg from "pg";

const { Pool } = pkg;
const pool = new Pool(config);

export default class AdministradorEventos {
    obtenerEventos = async () => {
        try {
            const result = await pool.query(`
                SELECT 
                    e.id AS id,
                    e.name AS evento_nombre,
                    e.description,
                    e.start_date,
                    e.id_creator_user,
                    u.last_name,
                    u.first_name,
                    u.username,
                    el.id AS ubicacion_id,
                    el.name AS ubicacion_nombre,
                    el.latitude,
                    el.longitude
                FROM events e
                INNER JOIN users u ON u.id = e.id_creator_user
                INNER JOIN event_locations el ON el.id = e.id_event_location
                ORDER BY e.id
            `);
            return result.rows;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    obtenerEventoPorParametros = async (id, nombreUsuario, fechaInicio, tag) => {
        try {
            const query = `
                SELECT 
                    e.id AS id,
                    e.name AS evento_nombre,
                    e.description,
                    e.start_date,
                    e.id_creator_user,
                    u.last_name,
                    u.first_name,
                    u.username,
                    el.id AS ubicacion_id,
                    el.name AS ubicacion_nombre,
                    el.latitude,
                    el.longitude,
                    array_agg(t.name) AS tags
                FROM events e
                INNER JOIN users u ON u.id = e.id_creator_user
                LEFT JOIN event_locations el ON el.id = e.id_event_location
                LEFT JOIN event_tags et ON et.id_event = e.id
                LEFT JOIN tags t ON t.id = et.id_tag
                WHERE
                    (
                        $4::integer IS NOT NULL
                        AND e.id = $4
                    )
                    OR
                    (
                        $4::integer IS NULL
                        AND ($1::varchar IS NULL OR u.first_name = $1)
                        AND ($2::date IS NULL OR e.start_date = $2)
                        AND ($3::varchar IS NULL OR t.name = $3)
                    )
                GROUP BY e.id, e.name, e.description, e.start_date, e.id_creator_user, u.last_name, u.first_name, u.username, el.id, el.name, el.latitude, el.longitude
                ORDER BY e.id
            `;
            const result = await pool.query(query, [nombreUsuario, fechaInicio, tag, id]);
            return result.rows;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    obtenerEventoPorId = async (id) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM events
                WHERE id = $1
            `, [id]);
            return result.rows[0];
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    obtenerUbicacionesDelEvento = async (id) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM event_locations
                WHERE id = $1
                ORDER BY id
            `, [id]);
            return result.rows;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    crearEvento = async (datosEvento) => {
        try {
            const query = `
                INSERT INTO events (name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `;
            const result = await pool.query(query, datosEvento);
            return result.rows[0];
        } catch (err) {
            console.error(err);
            throw new Error('Error al crear evento');
        }
    }

    actualizarEvento = async (datosEvento) => {
        try {
            const [
                nombre,
                descripcion,
                id_categoria,
                id_ubicacion,
                fecha_inicio,
                duracion_minutos,
                precio,
                habilitado_para_inscripcion,
                max_asistentes,
                id
            ] = datosEvento;

            const habilitado = (habilitado_para_inscripcion === true || habilitado_para_inscripcion === 1 || habilitado_para_inscripcion === '1') ? 1 : 0;

            const query = `
                UPDATE events
                SET
                    name = COALESCE($1, name),
                    description = COALESCE($2, description),
                    id_event_category = COALESCE($3, id_event_category),
                    id_event_location = COALESCE($4, id_event_location),
                    start_date = COALESCE($5::timestamp, start_date),
                    duration_in_minutes = COALESCE($6, duration_in_minutes),
                    price = COALESCE($7, price),
                    enabled_for_enrollment = $8,
                    max_assistance = COALESCE($9, max_assistance)
                WHERE id = $10
                RETURNING *
            `;
            const datosNormalizados = [
                nombre,
                descripcion,
                id_categoria,
                id_ubicacion,
                fecha_inicio,
                duracion_minutos,
                precio,
                habilitado,
                max_asistentes,
                id
            ];

            const result = await pool.query(query, datosNormalizados);
            return {
                message: 'Evento actualizado correctamente',
                evento: result.rows[0]
            };
        } catch (err) {
            console.error('Error en actualizarEvento:', err);
            throw new Error('Error actualizando evento: ' + err.message);
        }
    }

    eliminarEvento = async (id) => {
        try {
            const query = `
                DELETE FROM events
                WHERE id = $1
            `;
            await pool.query(query, [id]);
            return { message: 'Evento eliminado correctamente' };
        } catch (err) {
            console.error(err);
            throw new Error('Error eliminando evento');
        }
    }

    verificarInscripcionEvento = async (id_event) => {
        try {
            const query = `
                SELECT COUNT(*) as cantidad_inscripciones
                FROM event_enrollments
                WHERE id_event = $1
            `;
            const result = await pool.query(query, [id_event]);
            return parseInt(result.rows[0].cantidad_inscripciones, 10);
        } catch (err) {
            console.error('Error verificando inscripciones:', err);
            throw new Error('Error verificando inscripciones');
        }
    }

    inscribirseEnEvento = async (datosInscripcion) => {
        try {
            const query = `
                INSERT INTO event_enrollments (id_event, id_user, description, registration_date_time, attended, observations, rating)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const result = await pool.query(query, datosInscripcion);
            return result.rows[0];
        } catch (err) {
            console.error('Error inscribiéndose en evento:', err);
            throw new Error('Error inscribiéndose en evento: ' + err.message);
        }
    }

    eliminarInscripcion = async (id_event, id_user) => {
        try {
            const query = `
                DELETE FROM event_enrollments
                WHERE id_event = $1 AND id_user = $2
            `;
            await pool.query(query, [id_event, id_user]);
            return { message: 'Inscripción eliminada correctamente' };
        } catch (err) {
            console.error(err);
            throw new Error('Error eliminando inscripción');
        }
    }

    obtenerInscripciones = async (id_user) => {
        try {
            const query = `
                SELECT *
                FROM event_enrollments
                WHERE id_user = $1
            `;
            const result = await pool.query(query, [id_user]);
            return result.rows;
        } catch (err) {
            console.error(err);
            throw new Error('Error obteniendo inscripciones');
        }
    }
}
