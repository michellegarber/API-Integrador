const { Pool } = require('pg');

const pool = new Pool();

// Obtener eventos paginados y filtrados
exports.obtenerEventos = async (req, res) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limit) || 10;
    const filtroNombre = req.query.name || '';
    const filtroDescripcion = req.query.description || '';

    const offset = (pagina - 1) * limite;

    // Consulta para obtener eventos filtrados y paginados
    const consultaEventos = `
      SELECT * FROM events
      WHERE name ILIKE $1 AND description ILIKE $2
      ORDER BY date ASC
      LIMIT $3 OFFSET $4
    `;
    const valores = [`%${filtroNombre}%`, `%${filtroDescripcion}%`, limite, offset];

    const resultadoEventos = await pool.query(consultaEventos, valores);

    // Consulta para contar total de eventos filtrados
    const consultaConteo = `
      SELECT COUNT(*) FROM events
      WHERE name ILIKE $1 AND description ILIKE $2
    `;
    const resultadoConteo = await pool.query(consultaConteo, [`%${filtroNombre}%`, `%${filtroDescripcion}%`]);

    const total = parseInt(resultadoConteo.rows[0].count);

    res.json({
      success: true,
      collection: resultadoEventos.rows,
      paginacion: {
        pagina,
        limite,
        total,
        paginasTotales: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener eventos', error: error.message });
  }
};

// Obtener detalle de un evento por ID
exports.obtenerEventoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const consulta = 'SELECT * FROM events WHERE id = $1';
    const resultado = await pool.query(consulta, [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    res.json({ success: true, evento: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener evento', error: error.message });
  }
};

// Crear un nuevo evento
exports.crearEvento = async (req, res) => {
  try {
    const { name, description, date } = req.body;
    const user_id = req.usuario.id;

    if (!name || name.length < 3) {
      return res.status(400).json({ success: false, message: 'El nombre del evento es obligatorio y debe tener al menos 3 caracteres' });
    }

    const consulta = `
      INSERT INTO events (name, description, date, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const valores = [name, description, date, user_id];
    const resultado = await pool.query(consulta, valores);

    res.status(201).json({ success: true, message: 'Evento creado', evento: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear evento', error: error.message });
  }
};

// Actualizar un evento existente
exports.actualizarEvento = async (req, res) => {
  try {
    const { id, name, description, date } = req.body;
    const user_id = req.usuario.id;

    if (!id) {
      return res.status(400).json({ success: false, message: 'El ID del evento es obligatorio' });
    }

    // Verificar que el evento existe y pertenece al usuario
    const consultaVerificacion = 'SELECT * FROM events WHERE id = $1';
    const resultadoVerificacion = await pool.query(consultaVerificacion, [id]);

    if (resultadoVerificacion.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    if (resultadoVerificacion.rows[0].user_id !== user_id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para modificar este evento' });
    }

    const consultaActualizar = `
      UPDATE events SET name = $1, description = $2, date = $3
      WHERE id = $4
      RETURNING *
    `;
    const valores = [name, description, date, id];
    const resultadoActualizar = await pool.query(consultaActualizar, valores);

    res.json({ success: true, message: 'Evento actualizado', evento: resultadoActualizar.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar evento', error: error.message });
  }
};

// Eliminar un evento
exports.eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.usuario.id;

    // Verificar que el evento existe y pertenece al usuario
    const consultaVerificacion = 'SELECT * FROM events WHERE id = $1';
    const resultadoVerificacion = await pool.query(consultaVerificacion, [id]);

    if (resultadoVerificacion.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    if (resultadoVerificacion.rows[0].user_id !== user_id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este evento' });
    }

    const consultaEliminar = 'DELETE FROM events WHERE id = $1';
    await pool.query(consultaEliminar, [id]);

    res.json({ success: true, message: 'Evento eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar evento', error: error.message });
  }
};
