const crypto = require('crypto');

const ESTADOS_VALIDOS = new Set(['esperando', 'iniciada', 'finalizada']);
const ROLES_PARTICIPANTE = new Set(['jugador', 'espectador']);
const SLOTS_VALIDOS = new Set([1, 2]);

const generarCodigo = () => crypto.randomBytes(3).toString('hex');

const obtenerCodigoUnico = async (ctx) => {
  let codigo;
  let salaExistente;
  do {
    codigo = generarCodigo();
    salaExistente = await ctx.orm.Sala.findOne({ where: { codigo_invitacion: codigo } });
  } while (salaExistente);

  return codigo;
};

const validarEstado = (estado) => {
  if (!estado) {
    return null;
  }

  if (!ESTADOS_VALIDOS.has(estado)) {
    return 'El estado indicado no es válido.';
  }

  return null;
};

module.exports = {
  createSala: async (ctx) => {
    try {
      const { estado } = ctx.request.body;

      const errorEstado = validarEstado(estado);
      if (errorEstado) {
        ctx.status = 400;
        ctx.body = { error: errorEstado };
        return;
      }

      const codigo = await obtenerCodigoUnico(ctx);

      const nuevaSala = await ctx.orm.Sala.create({
        codigo_invitacion: codigo,
        estado: estado || 'esperando',
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
        order: [['createdAt', 'DESC']],
        include: [{ model: ctx.orm.SalaParticipante }],
      });

      ctx.status = 200;
      ctx.body = salas;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  getSalaById: async (ctx) => {
    try {
      const { id } = ctx.params;

      const sala = await ctx.orm.Sala.findByPk(id, {
        include: [
          { model: ctx.orm.Partida },
          { model: ctx.orm.SalaParticipante },
        ],
      });

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
  },

  getSalaByCodigo: async (ctx) => {
    try {
      const { codigo } = ctx.params;

      const sala = await ctx.orm.Sala.findOne({
        where: { codigo_invitacion: codigo },
        include: [
          { model: ctx.orm.Partida },
          { model: ctx.orm.SalaParticipante },
        ],
      });

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
  },

  updateSala: async (ctx) => {
    try {
      const { id } = ctx.params;
      const { estado } = ctx.request.body;

      if (!estado) {
        ctx.status = 400;
        ctx.body = { error: 'Debe especificar un estado.' };
        return;
      }

      const errorEstado = validarEstado(estado);
      if (errorEstado) {
        ctx.status = 400;
        ctx.body = { error: errorEstado };
        return;
      }

      const sala = await ctx.orm.Sala.findByPk(id);
      if (!sala) {
        ctx.status = 404;
        ctx.body = { error: 'Sala no encontrada.' };
        return;
      }

      await sala.update({ estado });

      ctx.status = 200;
      ctx.body = {
        message: 'Sala actualizada correctamente.',
        sala,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  deleteSala: async (ctx) => {
    try {
      const { id } = ctx.params;
      const sala = await ctx.orm.Sala.findByPk(id);

      if (!sala) {
        ctx.status = 404;
        ctx.body = { error: 'Sala no encontrada.' };
        return;
      }

      await sala.destroy();

      ctx.status = 204;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  listarParticipantes: async (ctx) => {
    try {
      const { id } = ctx.params;
      const sala = await ctx.orm.Sala.findByPk(id, {
        include: [{ model: ctx.orm.SalaParticipante }],
      });
      if (!sala) {
        ctx.status = 404;
        ctx.body = { error: 'Sala no encontrada.' };
        return;
      }

      ctx.status = 200;
      ctx.body = sala.SalaParticipante;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  unirseASala: async (ctx) => {
    const transaction = await ctx.orm.sequelize.transaction();
    try {
      const { id } = ctx.params;
      const { usuarioId, rol, slot } = ctx.request.body;

      if (!rol || !ROLES_PARTICIPANTE.has(rol)) {
        ctx.status = 400;
        ctx.body = { error: 'El rol debe ser "jugador" o "espectador".' };
        await transaction.rollback();
        return;
      }

      const sala = await ctx.orm.Sala.findByPk(id, {
        include: [{ model: ctx.orm.SalaParticipante }],
        lock: true,
        transaction,
      });

      if (!sala) {
        ctx.status = 404;
        ctx.body = { error: 'Sala no encontrada.' };
        await transaction.rollback();
        return;
      }

      if (sala.estado !== 'esperando' && rol === 'jugador') {
        ctx.status = 409;
        ctx.body = { error: 'La sala ya no acepta nuevos jugadores.' };
        await transaction.rollback();
        return;
      }

      const participantes = sala.SalaParticipante;
      const existente = participantes.find((participante) => (
        usuarioId && participante.id_usuario === Number(usuarioId)
      ));

      if (existente) {
        ctx.status = 200;
        ctx.body = { message: 'El usuario ya está registrado en la sala.', participante: existente };
        await transaction.commit();
        return;
      }

      if (rol === 'jugador') {
        const jugadores = participantes.filter((participante) => participante.rol === 'jugador');
        if (jugadores.length >= 2) {
          ctx.status = 409;
          ctx.body = { error: 'La sala ya cuenta con dos jugadores.' };
          await transaction.rollback();
          return;
        }

        let slotAsignado = slot ? Number(slot) : null;
        if (slotAsignado && !SLOTS_VALIDOS.has(slotAsignado)) {
          ctx.status = 400;
          ctx.body = { error: 'El slot debe ser 1 o 2.' };
          await transaction.rollback();
          return;
        }

        const slotsOcupados = new Set(jugadores.map((jugador) => jugador.slot));
        if (slotAsignado && slotsOcupados.has(slotAsignado)) {
          ctx.status = 409;
          ctx.body = { error: 'El slot indicado ya está ocupado.' };
          await transaction.rollback();
          return;
        }

        if (!slotAsignado) {
          slotAsignado = [...SLOTS_VALIDOS].find((valor) => !slotsOcupados.has(valor));
        }

        const participante = await ctx.orm.SalaParticipante.create({
          id_sala: sala.id,
          id_usuario: usuarioId || null,
          rol,
          slot: slotAsignado,
        }, { transaction });

        await transaction.commit();
        ctx.status = 201;
        ctx.body = { message: 'Jugador agregado a la sala.', participante };
        return;
      }

      const participante = await ctx.orm.SalaParticipante.create({
        id_sala: sala.id,
        id_usuario: usuarioId || null,
        rol,
        slot: null,
      }, { transaction });

      await transaction.commit();
      ctx.status = 201;
      ctx.body = { message: 'Espectador agregado a la sala.', participante };
    } catch (error) {
      await transaction.rollback();
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },

  abandonarSala: async (ctx) => {
    try {
      const { id, participanteId } = ctx.params;
      const participante = await ctx.orm.SalaParticipante.findByPk(participanteId);
      if (!participante || participante.id_sala !== Number(id)) {
        ctx.status = 404;
        ctx.body = { error: 'Participante no encontrado en la sala.' };
        return;
      }

      await participante.destroy();
      ctx.status = 204;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  },
};
