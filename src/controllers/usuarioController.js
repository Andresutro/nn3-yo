const bcrypt = require('bcrypt');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(['Administrador', 'Jugador']);

const sanitizeRole = (rawRole) => {
  if (!rawRole) {
    return 'Jugador';
  }

  if (!VALID_ROLES.has(rawRole)) {
    return null;
  }

  return rawRole;
};

module.exports = {
  getAllUsuarios: async (ctx) => {
    try {
      const usuarios = await ctx.orm.Usuario.findAll({
        include: [{ model: ctx.orm.Perfil, as: 'perfil' }],
        order: [['id', 'ASC']],
      });

      ctx.status = 200;
      ctx.body = usuarios;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  getUsuarioById: async (ctx) => {
    try {
      const { id } = ctx.params;
      const usuario = await ctx.orm.Usuario.findByPk(id, {
        include: [{ model: ctx.orm.Perfil, as: 'perfil' }],
      });

      if (!usuario) {
        ctx.status = 404;
        ctx.body = { error: 'No se ha encontrado ese usuario' };
        return;
      }

      ctx.status = 200;
      ctx.body = usuario;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  createUsuario: async (ctx) => {
    try {
      const normalizeToString = (value) => {
        if (Array.isArray(value)) {
          return value.length > 0 ? String(value[0]) : '';
        }

        if (value === undefined || value === null) {
          return '';
        }

        return String(value);
      };

      const extractValue = (key) => {
        const body = ctx.request.body || {};
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          return normalizeToString(body[key]);
        }

        if (body && typeof body === 'object' && body.body && Object.prototype.hasOwnProperty.call(body.body, key)) {
          return normalizeToString(body.body[key]);
        }

        if (body && typeof body === 'object' && body.fields && Object.prototype.hasOwnProperty.call(body.fields, key)) {
          return normalizeToString(body.fields[key]);
        }

        if (ctx.request.query && Object.prototype.hasOwnProperty.call(ctx.request.query, key)) {
          return normalizeToString(ctx.request.query[key]);
        }

        return '';
      };

      const rawUsername = extractValue('username').trim();
      const rawEmail = extractValue('email').trim();
      const rawPassword = extractValue('password').trim();
      const { role } = ctx.request.body;

      if (!rawUsername || !rawEmail || !rawPassword) {
        ctx.status = 400;
        ctx.body = { error: 'Ingrese username, email y password.' };
        return;
      }

      if (!EMAIL_REGEX.test(rawEmail)) {
        ctx.status = 400;
        ctx.body = { error: 'El formato de correo electrónico no es válido.' };
        return;
      }

      if (rawPassword.length < 8) {
        ctx.status = 400;
        ctx.body = { error: 'La contraseña debe tener al menos 8 caracteres.' };
        return;
      }

      const sanitizedRole = sanitizeRole(role);
      if (!sanitizedRole) {
        ctx.status = 400;
        ctx.body = { error: 'El rol especificado no es válido.' };
        return;
      }

      const usuarioExistente = await ctx.orm.Usuario.findOne({
        where: { email: rawEmail },
      });

      if (usuarioExistente) {
        ctx.status = 409;
        ctx.body = { error: 'El correo ya está registrado' };
        return;
      }

      const usuarioExistenteUsername = await ctx.orm.Usuario.findOne({
        where: { username: rawUsername },
      });

      if (usuarioExistenteUsername) {
        ctx.status = 409;
        ctx.body = { error: 'El username ya está en uso. Por favor, ingrese uno distinto.' };
        return;
      }

      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const nuevoUsuario = await ctx.orm.Usuario.create({
        username: rawUsername,
        email: rawEmail,
        password: hashedPassword,
        role: sanitizedRole,
      });

      const perfil = await ctx.orm.Perfil.create({
        id_usuario: nuevoUsuario.id,
        descripcion: '¡Aqui puedes poner tu información!',
        victorias: 0,
        derrotas: 0,
        tiempo_partida_rapida: 0,
        tiempo_partida_larga: 0,
        fecha_union: new Date(),
      });

      ctx.status = 201;
      ctx.body = {
        message: 'Usuario creado correctamente',
        usuario: {
          id: nuevoUsuario.id,
          username: nuevoUsuario.username,
          email: nuevoUsuario.email,
          role: nuevoUsuario.role,
          perfil,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  updateUsuario: async (ctx) => {
    try {
      const { id } = ctx.params;
      const { username, email } = ctx.request.body;

      if (!username && !email) {
        ctx.status = 400;
        ctx.body = { error: 'Debe proporcionar al menos un campo para actualizar.' };
        return;
      }

      if (email && !EMAIL_REGEX.test(email)) {
        ctx.status = 400;
        ctx.body = { error: 'El formato de correo electrónico no es válido.' };
        return;
      }

      const usuario = await ctx.orm.Usuario.findByPk(id);
      if (!usuario) {
        ctx.status = 404;
        ctx.body = { error: 'Usuario no encontrado.' };
        return;
      }

      if (email && email !== usuario.email) {
        const emailOcupado = await ctx.orm.Usuario.findOne({ where: { email } });
        if (emailOcupado) {
          ctx.status = 409;
          ctx.body = { error: 'El correo ya está registrado por otro usuario.' };
          return;
        }
      }

      if (username && username !== usuario.username) {
        const usernameOcupado = await ctx.orm.Usuario.findOne({ where: { username } });
        if (usernameOcupado) {
          ctx.status = 409;
          ctx.body = { error: 'El username ya está en uso por otro usuario.' };
          return;
        }
      }

      await usuario.update({
        username: username ?? usuario.username,
        email: email ?? usuario.email,
      });

      ctx.status = 200;
      ctx.body = {
        message: 'Usuario actualizado correctamente.',
        usuario: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          role: usuario.role,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: 'Error interno del servidor.', detalle: error.message };
    }
  },

  deleteUsuario: async (ctx) => {
    try {
      const { id } = ctx.params;
      const usuario = await ctx.orm.Usuario.findByPk(id);

      if (!usuario) {
        ctx.status = 404;
        ctx.body = { error: 'Usuario no encontrado' };
        return;
      }

      await usuario.destroy();

      ctx.status = 204;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },
};
