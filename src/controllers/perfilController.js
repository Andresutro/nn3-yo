module.exports = {
  getPerfilById: async (ctx) => {
    try {
      const id = ctx.params.id;

      // Buscamos el perfil por su ID, incluyendo el usuario asociado si existe
      const perfil = await ctx.orm.Perfil.findByPk(id, {
        include: [{ model: ctx.orm.Usuario, as: 'usuario'}]
      });

      if (!perfil) {
        ctx.status = 404;
        ctx.body = { error: 'El perfil no ha sido encontrado' };
        return;
      }

      ctx.status = 200;
      ctx.body = perfil;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },
};
