const LADOS_VALIDOS = new Map([
  ['izquierda', 'LEFT'],
  ['derecha', 'RIGHT'],
  ['left', 'LEFT'],
  ['right', 'RIGHT'],
  ['LEFT', 'LEFT'],
  ['RIGHT', 'RIGHT'],
]);

const normalizarLado = (lado) => {
  if (lado === undefined || lado === null || lado === '') {
    return { valor: null, error: null };
  }

  const clave = typeof lado === 'string' ? lado : String(lado);
  const valor = LADOS_VALIDOS.get(clave);

  if (!valor) {
    return { valor: null, error: 'El lado debe ser izquierda/derecha o LEFT/RIGHT.' };
  }

  return { valor, error: null };
};

const validarNumericoNoNegativo = (valor, nombreCampo) => {
  if (valor === undefined || valor === null) {
    return null;
  }

  if (Number.isNaN(Number(valor)) || Number(valor) < 0) {
    return `${nombreCampo} debe ser un número mayor o igual a cero.`;
  }

  return null;
};

module.exports = {
  getAllJugadores: async (ctx) => {
    try {
      const jugadores = await ctx.orm.Jugador.findAll({
        include: [
          { model: ctx.orm.Usuario },
          { model: ctx.orm.Partida },
        ],
        order: [['id', 'ASC']],
      });

      ctx.status = 200;
      ctx.body = jugadores;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  getJugadorById: async (ctx) => {
    try {
      const { id } = ctx.params;
      const jugador = await ctx.orm.Jugador.findByPk(id, {
        include: [
          { model: ctx.orm.Usuario },
          { model: ctx.orm.Partida },
        ],
      });

      if (!jugador) {
        ctx.status = 404;
        ctx.body = { error: 'Jugador no encontrado.' };
        return;
      }

      ctx.status = 200;
      ctx.body = jugador;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  createJugador: async (ctx) => {
    try {
      const {
        id_usuario,
        id_partida,
        polvora = 0,
        lado = null,
        se_usos_restantes = 3,
        se_cooldown_turnos = 0,
      } = ctx.request.body;

      if (!id_usuario || !id_partida) {
        ctx.status = 400;
        ctx.body = { error: 'Se requieren id_usuario e id_partida para crear un jugador.' };
        return;
      }

      const usuario = await ctx.orm.Usuario.findByPk(id_usuario);
      if (!usuario) {
        ctx.status = 404;
        ctx.body = { error: 'El usuario indicado no existe.' };
        return;
      }

      const partida = await ctx.orm.Partida.findByPk(id_partida);
      if (!partida) {
        ctx.status = 404;
        ctx.body = { error: 'La partida indicada no existe.' };
        return;
      }

      const { valor: ladoNormalizado, error: errorLado } = normalizarLado(lado);
      if (errorLado) {
        ctx.status = 400;
        ctx.body = { error: errorLado };
        return;
      }

      const erroresNumericos = [
        validarNumericoNoNegativo(polvora, 'polvora'),
        validarNumericoNoNegativo(se_usos_restantes, 'se_usos_restantes'),
        validarNumericoNoNegativo(se_cooldown_turnos, 'se_cooldown_turnos'),
      ].filter(Boolean);

      if (erroresNumericos.length > 0) {
        ctx.status = 400;
        ctx.body = { error: erroresNumericos[0] };
        return;
      }

      const jugador = await ctx.orm.Jugador.create({
        id_usuario,
        id_partida,
        polvora,
        lado: ladoNormalizado,
        se_usos_restantes,
        se_cooldown_turnos,
      });

      ctx.status = 201;
      ctx.body = {
        message: 'Jugador creado correctamente.',
        jugador,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  updateJugador: async (ctx) => {
    try {
      const { id } = ctx.params;
      const {
        polvora,
        lado,
        se_usos_restantes,
        se_cooldown_turnos,
      } = ctx.request.body;

      if (
        polvora === undefined &&
        lado === undefined &&
        se_usos_restantes === undefined &&
        se_cooldown_turnos === undefined
      ) {
        ctx.status = 400;
        ctx.body = { error: 'Debe entregar al menos un campo para actualizar.' };
        return;
      }

      const jugador = await ctx.orm.Jugador.findByPk(id);

      if (!jugador) {
        ctx.status = 404;
        ctx.body = { error: 'Jugador no encontrado.' };
        return;
      }

      const { valor: ladoNormalizado, error: errorLado } = normalizarLado(lado);
      if (errorLado) {
        ctx.status = 400;
        ctx.body = { error: errorLado };
        return;
      }

      const erroresNumericos = [
        validarNumericoNoNegativo(polvora, 'polvora'),
        validarNumericoNoNegativo(se_usos_restantes, 'se_usos_restantes'),
        validarNumericoNoNegativo(se_cooldown_turnos, 'se_cooldown_turnos'),
      ].filter(Boolean);

      if (erroresNumericos.length > 0) {
        ctx.status = 400;
        ctx.body = { error: erroresNumericos[0] };
        return;
      }

      await jugador.update({
        polvora: polvora ?? jugador.polvora,
        lado: lado !== undefined ? ladoNormalizado : jugador.lado,
        se_usos_restantes: se_usos_restantes ?? jugador.se_usos_restantes,
        se_cooldown_turnos: se_cooldown_turnos ?? jugador.se_cooldown_turnos,
      });

      ctx.status = 200;
      ctx.body = {
        message: 'Jugador actualizado correctamente.',
        jugador,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  deleteJugador: async (ctx) => {
    try {
      const { id } = ctx.params;
      const jugador = await ctx.orm.Jugador.findByPk(id);

      if (!jugador) {
        ctx.status = 404;
        ctx.body = { error: 'Jugador no encontrado.' };
        return;
      }

      await jugador.destroy();

      ctx.status = 204;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },
};
