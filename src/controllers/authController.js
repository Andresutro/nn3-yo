const bcrypt = require('bcrypt');

module.exports = {

  signup: async (ctx) => {
    try {
      const { username, email, password, role } = ctx.request.body;

      // Validamos que esten todos los parametros
      if (!username || !email || !password) {
        ctx.status = 400;
        ctx.body = { error: 'Debe ingresar username, email y password' };
        return;
      }

      // Verificamos si ya existe usuario con ese email
      const existeUsuario = await ctx.orm.Usuario.findOne({ where: { email } });
      if (existeUsuario) {
        ctx.status = 409; 
        ctx.body = { error: 'El correo ya está registrado' };
        return;
      }

      // Hasheamos la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Creamos el nuevo usuario
      const nuevoUsuario = await ctx.orm.Usuario.create({
        username,
        email,
        password: hashedPassword,
        role: role || 'PLAYER',
      });

      // Creamos el perfil vacio para el nuevo usuario
      await ctx.orm.Perfil.create({
        descripcion: 'Nuevo jugador',
        victorias: 0,
        derrotas: 0,
        tiempo_partida_rapida: 0,
        tiempo_partida_larga: 0,
        id_usuario: nuevoUsuario.id,
      });

      ctx.status = 201;
      ctx.body = {
        message: 'Usuario registrado correctamente',
        usuario: {
          id: nuevoUsuario.id,
          username: nuevoUsuario.username,
          email: nuevoUsuario.email,
          role: nuevoUsuario.role,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  login: async (ctx) => {
    try {
      const { email, password } = ctx.request.body;
    // Si no tiene email ni password
      if (!email || !password) {
        ctx.status = 400;
        ctx.body = { error: 'Debe ingresar email y contraseña' };
        return;
      }

      // buscvamos el usuario
      const usuario = await ctx.orm.Usuario.findOne({ where: { email } });

      if (!usuario) {
        ctx.status = 401;
        ctx.body = { error: 'Usuario inválido' };
        return;
      }

      // comparacion del hash
      const valid = await bcrypt.compare(password, usuario.password);
      if (!valid) {
        ctx.status = 401;
        ctx.body = { error: 'Contraseña inválida' };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        message: 'Inicio de sesión exitoso',
        usuario: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          role: usuario.role,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },
};
