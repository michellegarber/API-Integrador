const express = require('express');
const cors = require('cors');
const rutasAutenticacion = require('./rutas/autenticacionRutas');
const rutasEvento = require('./rutas/eventoRutas');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json());

// Rutas
app.use('/api/usuario', rutasAutenticacion);
app.use('/api/evento', rutasEvento);

module.exports = app;
