const express = require('express');
const { obtenerEventos, obtenerEventoPorId, crearEvento, actualizarEvento, eliminarEvento } = require('../controladores/eventoControlador');
const { autenticar } = require('../middlewares/autenticacionMiddleware');
const router = express.Router();

router.get('/', obtenerEventos);
router.get('/:id', obtenerEventoPorId);
router.post('/', autenticar, crearEvento);
router.put('/', autenticar, actualizarEvento);
router.delete('/:id', autenticar, eliminarEvento);

module.exports = router;
