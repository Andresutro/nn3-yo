const gameService = require('../services/gameService');

const parseCoordenada = (coordenada) => {
  if (!coordenada) {
    return null;
  }
  const { x, y } = coordenada;
  if (typeof x !== 'number' || typeof y !== 'number') {
    return null;
  }
  return { x, y };
};

module.exports = {
  createFromSala: async (ctx) => {
    try {
      const { salaId } = ctx.params;
      if (!salaId) {
        ctx.status = 400;
        ctx.body = { error: 'Debe indicar el identificador de la sala' };
        return;
      }

      const resultado = await gameService.crearPartidaDesdeSala(ctx.orm, salaId);
      ctx.status = 201;
      ctx.body = {
        message: 'Partida creada correctamente a partir de la sala',
        ...resultado,
      };
    } catch (error) {
      ctx.status = error.message.includes('no encontrada') ? 404 : 400;
      ctx.body = { error: error.message };
    }
  },

  getEstado: async (ctx) => {
    try {
      const { id } = ctx.params;
      if (!id) {
        ctx.status = 400;
        ctx.body = { error: 'Debe indicar el identificador de la partida' };
        return;
      }

      const partida = await gameService.obtenerEstadoPartida(ctx.orm, id);
      ctx.status = 200;
      ctx.body = partida;
    } catch (error) {
      ctx.status = 404;
      ctx.body = { error: error.message };
    }
  },

  desplegarCampamento: async (ctx) => {
    try {
      const { partidaId } = ctx.params;
      const { jugadorId, tipo, coordenada } = ctx.request.body;

      if (!jugadorId || !tipo) {
        ctx.status = 400;
        ctx.body = { error: 'Debe indicar jugadorId y tipo de campamento' };
        return;
      }

      const posicion = parseCoordenada(coordenada);
      if (!posicion) {
        ctx.status = 400;
        ctx.body = { error: 'Debe indicar una coordenada válida (x, y)' };
        return;
      }

      const campamento = await gameService.desplegarCampamento(ctx.orm, {
        partidaId,
        jugadorId,
        tipo,
        coordenada: posicion,
      });

      ctx.status = 201;
      ctx.body = {
        message: 'Campamento desplegado correctamente',
        campamento,
      };
    } catch (error) {
      ctx.status = error.message.includes('no encontrada') ? 404 : 400;
      ctx.body = { error: error.message };
    }
  },

  ejecutarTurno: async (ctx) => {
    try {
      const { partidaId } = ctx.params;
      const {
        jugadorId,
        tipoAccion,
        municion,
        objetivo,
        orientacion,
        autoPasar,
      } = ctx.request.body;

      if (!jugadorId || !tipoAccion) {
        ctx.status = 400;
        ctx.body = { error: 'Debe indicar jugadorId y tipoAccion' };
        return;
      }

      const objetivoNormalizado = objetivo ? parseCoordenada(objetivo) : null;

      const resultado = await gameService.ejecutarTurno(ctx.orm, {
        partidaId,
        jugadorId,
        tipoAccion,
        municion,
        objetivo: objetivoNormalizado,
        orientacion,
        autoPasar: Boolean(autoPasar),
      });

      ctx.status = 200;
      ctx.body = resultado;
    } catch (error) {
      const mensaje = error.message || 'Error al ejecutar el turno';
      ctx.status = mensaje.includes('no encontrada') ? 404 : 400;
      ctx.body = { error: mensaje };
    }
  },

  solicitarSuministro: async (ctx) => {
    try {
      const { partidaId } = ctx.params;
      const {
        jugadorId,
        preferencia,
        domo,
        reloc,
        forceSuccess,
        forceOutcome,
      } = ctx.request.body;

      if (!jugadorId) {
        ctx.status = 400;
        ctx.body = { error: 'Debe indicar jugadorId' };
        return;
      }

      const resultado = await gameService.aplicarSuministro(
        ctx.orm,
        {
          partidaId,
          jugadorId,
          preferencia,
          domo,
          reloc,
        },
        {
          forceSuccess,
          forceOutcome,
        },
      );

      ctx.status = 200;
      ctx.body = resultado;
    } catch (error) {
      ctx.status = error.message.includes('no encontrada') ? 404 : 400;
      ctx.body = { error: error.message };
    }
  },
};
