exports.validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
exports.validarContrasena = (pass) => pass && pass.length >= 3;
exports.validarNombre = (nombre) => nombre && nombre.length >= 3;
