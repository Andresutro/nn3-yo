
module.exports = {

        createSala: async (ctx) => {
            try {
                const { id_usuario } = ctx.request.body;

                const usuario = await ctx.orm.Usuario.findByPk(id_usuario);

                const nuevaSala = await ctx.orm.Sala.create({
                    nombre: `Sala de espera de ${usuario.username}`,
                    estado: 'esperando',
                });
                
                ctx.status = 201;
                ctx.body = {
                    message: 'Sala creada correctamente.',
                    sala: nuevaSala,
                };
                } catch (error) {
                ctx.status = 500;
                ctx.body = { error: error.message };
                }
            },

        getAllSalas: async (ctx) => {
            try {
            const salas = await ctx.orm.Sala.findAll({
                order: [['createdAt', 'DESC']]
            });

            ctx.status = 200;
            ctx.body = salas;
            } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
            }
        },

        // No se si le metamos el tema de codigo de invitacion o solo por id
        // En caso de modificamos esto por el parametro id unioco que va a generar
        // El codigo de la sala
        getSalaById: async (ctx) => {
            try {
                const { id } = ctx.params

                const sala = await ctx.orm.Sala.findByPk(id);

                    if (!sala) {
                        ctx.status = 404;
                        ctx.body = { error: 'Sala no encontrada.' };
                        return;
                    }

                    ctx.status = 200;
                    ctx.body = sala;
                    } catch (error) {
                    ctx.status = 500;
                    ctx.body = { error: error.message };
                    }
                }
};
