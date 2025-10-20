const bcrypt = require('bcrypt');

module.exports = {
    getAllUsuarios: async (ctx) => {
        try {
            // Buscar usuario
            const usuarios = await ctx.orm.Usuario.findAll({
                include: [{ model: ctx.orm.Perfil, as: 'perfil'}]
            });
            // Si no hay usuarios
            if (!usuarios) {
                ctx.status = 404;
                ctx.body = { error: 'No hay usuarios en la base de datos aún' };
                return;
            }
            // Encontrado  
            // CODIGOS DE API: 200 OK, 201 CREATED, 202 ACCEPTED, 203 NON AUTHORITATIVE INFORMATION 204 NO CONTENT
            // 400 BAD REQUEST 401 UNAUTHORIZED 403 FORBIDDEN 404 NOT FOUND 409 CONFLICT
            ctx.status = 200;
            ctx.body = usuarios;
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    },

    getUsuarioById: async (ctx) => {
        try {
            // Sacamos el id
            const id = ctx.params.id;
            // Buscamos el usuario
            const usuario = await ctx.orm.Usuario.findByPk(id, {
                include: [{ model: ctx.orm.Perfil, as: 'perfil'}]
            });
            // Si no existe
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
            const { username, email, password, role } = ctx.request.body;
            // Su no ingreso uno
            if (!username || !email || !password ) {
                ctx.status = 400;
                ctx.body = { error: 'Ingrese todos los campos, por favor.' };
                return;
            }

            console.log("Buscando usuario con email:", email);

            const usuario_existente_email = await ctx.orm.Usuario.findOne({ where: { email }})
            const usuario_existente_username = await ctx.orm.Usuario.findOne({ where: { username }})
            
            // Si ya hay un mail igual
            if (usuario_existente_email) {
                // Conflict segun lo que vi
                ctx.status = 409;
                ctx.body = { error: 'El correo ya está registrado' };
                return;
            }
            // Si ya hay un username igual
            if (usuario_existente_username) {
                ctx.status = 409;
                ctx.body = { error: 'El username ya está en uso. Por favor, ingrese uno distinto.' };
                return;
            }
            // Hasheamos la contraseña
            const hashed = await bcrypt.hash(password, 10)
            // Creamos el nuevo usuario
            const nuevoUsuario = await ctx.orm.Usuario.create({
                username, 
                email,
                password: hashed,
                role: role || 'Jugador'
            });
            // Le hacemos el perfil por defecto
            await ctx.orm.Perfil.create({
                id_usuario: nuevoUsuario.id,
                descripcion: '¡Aqui puedes poner tu información!',
                victorias: 0,
                derrotas: 0,
                tiempo_partida_rapida: 0,
                tiempo_partida_larga: 0,
                fecha_union: new Date()
                });

            await ctx.orm.Jugador.create({
                id_usuario: nuevoUsuario.id,
                polvora: 100,                        
                se_usos_restantes: 3,
                se_cooldown_turnos: 0,
            });

            ctx.status = 201;
            ctx.body = {
            message: 'Usuario creado correctamente',
            usuario: {
                id: nuevoUsuario.id,
                username: nuevoUsuario.username,
                email: nuevoUsuario.email,
                role: 'jugador',
                },
            };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    },

    updateUsuario: async (ctx) => {
    try {
        const id = ctx.params.id;
        const { username, email } = ctx.request.body;
        
        // Mnadamos ambos parametros
        if (!username || !email) {
        ctx.status = 400;
        ctx.body = { error: 'Debe proporcionar ambos parametros para actualizar.' };
        return;
        }

        const usuario = await ctx.orm.Usuario.findByPk(id);
        if (!usuario) {
        ctx.status = 404;
        ctx.body = { error: 'Usuario no encontrado.' };
        return;
        }

        await usuario.update({ username, email });

        ctx.status = 200;
        ctx.body = {
        message: 'Usuario actualizado correctamente.',
        usuario: {
            id: usuario.id,
            username: usuario.username,
            email: usuario.email,
        },
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Error interno del servidor.', detalle: error.message };
    }
    },

    deleteUsuario: async (ctx) => {
        try {
            const id = ctx.params.id;
            const usuario = await ctx.orm.Usuario.findByPk(id);

            if (!usuario) {
                ctx.status = 404;
                ctx.body = { error: 'Usuario no encontrado'};
                return;
            }

            await usuario.destroy();

            ctx.status = 204;
    } catch (error) {
        ctx.status = 500
        ctx.body = { error: error.message };
    }
}}