const jwt = require('jsonwebtoken');
const { validarEmail, validarContrasena, validarNombre } = require('../utils/validacion');
const usuarioModelo = require('../modelos/usuarioModelo');

exports.registrar = async (req, res) => {
  const { nombre, apellido, username, password } = req.body;
  if (!validarNombre(nombre) || !validarNombre(apellido)) {
    return res.status(400).json({ success: false, message: "Nombre o apellido inválido", token: "" });
  }
  if (!validarEmail(username)) {
    return res.status(400).json({ success: false, message: "El email es inválido.", token: "" });
  }
  if (!validarContrasena(password)) {
    return res.status(400).json({ success: false, message: "Contraseña inválida", token: "" });
  }
  // Lógica para crear usuario...
  res.status(201).json({ success: true, message: "Usuario creado" });
};

exports.iniciarSesion = async (req, res) => {
  const { username, password } = req.body;
  if (!validarEmail(username)) {
    return res.status(400).json({ success: false, message: "El email es inválido.", token: "" });
  }
  // Lógica para autenticar usuario...
  res.status(401).json({ success: false, message: "Usuario o clave inválida.", token: "" });
};
