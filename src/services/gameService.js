const { Op } = require('sequelize');

const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 10;
const HALF_WIDTH = BOARD_WIDTH / 2;
const TOTAL_HALF_CELLS = HALF_WIDTH * BOARD_HEIGHT;

const CAMPAMENTO_TYPES = {
  C1: { polvora: 1 },
  C2: { polvora: 2 },
  C3: { polvora: 3 },
};

const MUNITION_DEFINITIONS = {
  PUNTO: {
    coste: 5,
    orientaciones: null,
    generarPatron: ({ x, y }) => [{ x, y }],
  },
  L: {
    coste: 10,
    orientaciones: ['NE', 'NW', 'SE', 'SW'],
    generarPatron: ({ x, y }, orientacion) => {
      switch (orientacion) {
        case 'NE':
          return [
            { x, y },
            { x: x + 1, y },
            { x, y: y - 1 },
          ];
        case 'NW':
          return [
            { x, y },
            { x: x - 1, y },
            { x, y: y - 1 },
          ];
        case 'SE':
          return [
            { x, y },
            { x: x + 1, y },
            { x, y: y + 1 },
          ];
        case 'SW':
          return [
            { x, y },
            { x: x - 1, y },
            { x, y: y + 1 },
          ];
        default:
          throw new Error('Orientación inválida para munición L');
      }
    },
  },
  CUADRADO: {
    coste: 12,
    orientaciones: null,
    generarPatron: ({ x, y }) => [
      { x, y },
      { x: x + 1, y },
      { x, y: y + 1 },
      { x: x + 1, y: y + 1 },
    ],
  },
  LINEA: {
    coste: 9,
    orientaciones: ['N', 'S', 'E', 'W'],
    generarPatron: ({ x, y }, orientacion) => {
      const delta = {
        N: { dx: 0, dy: -1 },
        S: { dx: 0, dy: 1 },
        E: { dx: 1, dy: 0 },
        W: { dx: -1, dy: 0 },
      }[orientacion];
      if (!delta) {
        throw new Error('Orientación inválida para munición Línea');
      }
      return Array.from({ length: 4 }, (_, index) => ({
        x: x + delta.dx * index,
        y: y + delta.dy * index,
      }));
    },
  },
  PERFORANTE: {
    coste: 20,
    orientaciones: ['N', 'S', 'E', 'W'],
    generarPatron: ({ x, y }, orientacion) => {
      const delta = {
        N: { dx: 0, dy: -1 },
        S: { dx: 0, dy: 1 },
        E: { dx: 1, dy: 0 },
        W: { dx: -1, dy: 0 },
      }[orientacion];
      if (!delta) {
        throw new Error('Orientación inválida para munición Perforante');
      }
      return Array.from({ length: 6 }, (_, index) => ({
        x: x + delta.dx * index,
        y: y + delta.dy * index,
      }));
    },
  },
};

const SUMINISTRO_PROBABILIDAD = 0.35;
const SUMINISTRO_MAX_USOS = 3;
const SUMINISTRO_COOLDOWN = 3;

const DOMO_RADIO = 1;

const orientacionValida = (tipo, orientacion) => {
  const definicion = MUNITION_DEFINITIONS[tipo];
  if (!definicion) {
    return false;
  }
  if (!definicion.orientaciones) {
    return true;
  }
  return definicion.orientaciones.includes(orientacion);
};

const esCoordenadaValida = ({ x, y }) => (
  Number.isInteger(x)
  && Number.isInteger(y)
  && x >= 0
  && x < BOARD_WIDTH
  && y >= 0
  && y < BOARD_HEIGHT
);

const estaEnMitadEnemiga = (coordenada, ladoJugador) => {
  if (ladoJugador === 'LEFT') {
    return coordenada.x >= HALF_WIDTH;
  }
  return coordenada.x < HALF_WIDTH;
};

const obtenerMitadPropia = (ladoJugador) => {
  if (ladoJugador === 'LEFT') {
    return { [Op.lt]: HALF_WIDTH };
  }
  return { [Op.gte]: HALF_WIDTH };
};

const obtenerMitadEnemiga = (ladoJugador) => {
  if (ladoJugador === 'LEFT') {
    return { [Op.gte]: HALF_WIDTH };
  }
  return { [Op.lt]: HALF_WIDTH };
};

const calcularPatron = (tipo, objetivo, orientacion) => {
  const definicion = MUNITION_DEFINITIONS[tipo];
  if (!definicion) {
    throw new Error('Tipo de munición inválido');
  }
  if (definicion.orientaciones && !definicion.orientaciones.includes(orientacion)) {
    throw new Error('Orientación inválida para la munición seleccionada');
  }
  return definicion.generarPatron(objetivo, orientacion).filter(esCoordenadaValida);
};

const casillasEnDomo = (jugador) => {
  if (!jugador.domo_activo) {
    return [];
  }
  const { domo_centro_x: centroX, domo_centro_y: centroY } = jugador;
  const coords = [];
  for (let dx = -DOMO_RADIO; dx <= DOMO_RADIO; dx += 1) {
    for (let dy = -DOMO_RADIO; dy <= DOMO_RADIO; dy += 1) {
      const x = centroX + dx;
      const y = centroY + dy;
      if (esCoordenadaValida({ x, y })) {
        coords.push({ x, y });
      }
    }
  }
  return coords;
};

const elegirAleatorio = (elementos) => {
  const indice = Math.floor(Math.random() * elementos.length);
  return elementos[indice];
};

const withTransaction = async (sequelize, callback) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const contarCasillasDestruidas = async (orm, tableroId, mitad, transaction) => (
  orm.Casilla.count({
    where: {
      id_tablero: tableroId,
      estado_destruida: true,
      coordenada_x: mitad,
    },
    transaction,
  })
);

const obtenerCampamentosVivos = async (orm, jugadorId, transaction) => (
  orm.Campamento.findAll({
    where: { id_jugador: jugadorId },
    include: [{
      model: orm.Casilla,
      required: true,
    }],
    transaction,
  })
);

const campsActivos = (campamentos) => campamentos.filter((campamento) => !campamento.Casilla.estado_destruida);

const calcularGananciaPolvora = (campamentos) => (
  campsActivos(campamentos).reduce((acum, campamento) => {
    const datos = CAMPAMENTO_TYPES[campamento.tipo];
    return acum + (datos ? datos.polvora : 0);
  }, 0)
);

const validarCampamentoUnico = async (orm, jugadorId, tipo, transaction) => {
  const existente = await orm.Campamento.findOne({
    where: {
      id_jugador: jugadorId,
      tipo,
    },
    transaction,
  });
  if (existente) {
    throw new Error(`El campamento ${tipo} ya fue desplegado por este jugador`);
  }
};

const obtenerCasilla = async (orm, tableroId, coordenadas, transaction) => {
  const casilla = await orm.Casilla.findOne({
    where: {
      id_tablero: tableroId,
      coordenada_x: coordenadas.x,
      coordenada_y: coordenadas.y,
    },
    transaction,
  });
  if (!casilla) {
    throw new Error('La casilla indicada no existe en el tablero');
  }
  return casilla;
};

const validarCasillaLibre = async (orm, casillaId, transaction) => {
  const ocupada = await orm.Campamento.findOne({
    where: { id_casilla: casillaId },
    transaction,
  });
  if (ocupada) {
    throw new Error('La casilla indicada ya contiene un campamento');
  }
};

const validarCoordenadaEnMitad = (coordenada, lado) => {
  if (lado === 'LEFT') {
    if (coordenada.x < 0 || coordenada.x >= HALF_WIDTH) {
      throw new Error('La coordenada seleccionada no pertenece a tu mitad del tablero');
    }
  } else if (coordenada.x < HALF_WIDTH || coordenada.x >= BOARD_WIDTH) {
    throw new Error('La coordenada seleccionada no pertenece a tu mitad del tablero');
  }
};

const prepararTablero = async (orm, partida, transaction) => {
  const tablero = await orm.Tablero.create({
    id_partida: partida.id,
    largo_x: BOARD_WIDTH,
    largo_y: BOARD_HEIGHT,
  }, { transaction });

  const casillas = [];
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      casillas.push({
        id_tablero: tablero.id,
        coordenada_x: x,
        coordenada_y: y,
        estado_destruida: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  await orm.Casilla.bulkCreate(casillas, { transaction });
  return tablero;
};

const verificarInicioPartida = async (orm, partida, transaction) => {
  if (partida.estado !== 'DESPLIEGUE') {
    return;
  }
  const jugadores = await orm.Jugador.findAll({
    where: { id_partida: partida.id },
    include: [{ model: orm.Campamento }],
    transaction,
  });
  const todosListos = jugadores.every((jugador) => jugador.Campamentos.length === 3);
  if (!todosListos) {
    return;
  }

  partida.estado = 'PARTIDA';
  partida.turno_actual = 1;
  partida.estado_subfase = 'NORMAL';
  partida.id_jugador_en_turno = partida.id_jugador_iniciador;
  await partida.save({ transaction });

  await Promise.all(jugadores.map(async (jugador) => {
    jugador.polvora = jugador.polvora || 0;
    jugador.se_usos_restantes = 3;
    jugador.se_cooldown_turnos = 0;
    jugador.se_usos_totales = 0;
    jugador.destruidas_propias = 0;
    jugador.destruidas_reportadas = 0;
    jugador.inactividad_turnos = 0;
    jugador.domo_activo = false;
    jugador.domo_centro_x = null;
    jugador.domo_centro_y = null;
    jugador.domo_turno_activacion = null;
    jugador.ultimo_turno_inicio_procesado = null;
    jugador.ultimo_turno_jugado = null;
    await jugador.save({ transaction });
  }));
};

const procesarInicioTurno = async (orm, partida, jugador, transaction) => {
  if (partida.estado !== 'PARTIDA') {
    return { polvoraGenerada: 0, campamentosActivos: [] };
  }
  if (partida.id_jugador_en_turno !== jugador.id) {
    return { polvoraGenerada: 0, campamentosActivos: [] };
  }
  if (jugador.ultimo_turno_inicio_procesado === partida.turno_actual) {
    return { polvoraGenerada: 0, campamentosActivos: [] };
  }

  const campamentos = await obtenerCampamentosVivos(orm, jugador.id, transaction);
  const campamentosVivos = campsActivos(campamentos);
  const polvoraGanada = calcularGananciaPolvora(campamentos);

  jugador.polvora += polvoraGanada;
  if (jugador.se_cooldown_turnos > 0) {
    jugador.se_cooldown_turnos -= 1;
  }
  jugador.ultimo_turno_inicio_procesado = partida.turno_actual;
  await jugador.save({ transaction });

  return {
    polvoraGenerada: polvoraGanada,
    campamentosActivos: campamentosVivos.map((campamento) => ({
      id: campamento.id,
      tipo: campamento.tipo,
      posicion: {
        x: campamento.Casilla.coordenada_x,
        y: campamento.Casilla.coordenada_y,
      },
    })),
  };
};

const prepararRespuesta = async (partida, defensorId, transaction) => {
  partida.respuesta_activa = true;
  partida.id_jugador_pendiente_respuesta = defensorId;
  partida.estado_subfase = 'RESPUESTA';
  partida.id_jugador_en_turno = defensorId;
  await partida.save({ transaction });
};

const finalizarPartida = async (orm, partida, resultado, transaction) => {
  partida.estado = 'FINALIZADA';
  partida.estado_subfase = null;
  partida.id_jugador_en_turno = null;
  partida.respuesta_activa = false;
  partida.id_jugador_pendiente_respuesta = null;
  partida.ganador_id = resultado.ganadorId || null;
  partida.empate = Boolean(resultado.empate);
  await partida.save({ transaction });

  if (partida.id_sala) {
    const sala = await orm.Sala.findByPk(partida.id_sala, { transaction });
    if (sala) {
      sala.estado = 'finalizada';
      await sala.save({ transaction });
    }
  }
};

const actualizarMarcadores = async (orm, partida, atacante, defensor, transaction) => {
  const tablero = await orm.Tablero.findOne({
    where: { id_partida: partida.id },
    transaction,
  });
  const destruidasAtacante = await contarCasillasDestruidas(
    orm,
    tablero.id,
    obtenerMitadEnemiga(atacante.lado),
    transaction,
  );
  const destruidasDefensor = await contarCasillasDestruidas(
    orm,
    tablero.id,
    obtenerMitadPropia(defensor.lado),
    transaction,
  );

  atacante.destruidas_reportadas = destruidasAtacante;
  defensor.destruidas_propias = destruidasDefensor;

  await atacante.save({ transaction });
  await defensor.save({ transaction });

  return { destruidasAtacante, destruidasDefensor };
};

const resolverDisparo = async (orm, {
  partida,
  atacante,
  defensor,
  municion,
  objetivo,
  orientacion,
  transaction,
}) => {
  const tablero = await orm.Tablero.findOne({
    where: { id_partida: partida.id },
    transaction,
  });

  const patron = calcularPatron(municion, objetivo, orientacion);
  if (!patron.length) {
    throw new Error('La munición seleccionada no afecta a ninguna casilla válida');
  }

  patron.forEach((coordenada) => {
    if (!estaEnMitadEnemiga(coordenada, atacante.lado)) {
      throw new Error('El disparo debe realizarse únicamente sobre la mitad enemiga');
    }
  });

  const domoCoordenadas = casillasEnDomo(defensor);
  let disparoBloqueadoPorDomo = false;
  if (domoCoordenadas.length > 0) {
    const interseccion = patron.some((coordenada) => (
      domoCoordenadas.some((domo) => domo.x === coordenada.x && domo.y === coordenada.y)
    ));
    if (interseccion) {
      disparoBloqueadoPorDomo = true;
      defensor.domo_activo = false;
      defensor.domo_centro_x = null;
      defensor.domo_centro_y = null;
      defensor.domo_turno_activacion = null;
      await defensor.save({ transaction });
      return {
        patron,
        impactos: [],
        domoBloqueo: true,
        campamentosDestruidos: [],
      };
    }
  }

  const impactos = [];
  const campamentosDestruidos = [];
  for (const coordenada of patron) {
    const casilla = await obtenerCasilla(orm, tablero.id, coordenada, transaction);
    if (!casilla.estado_destruida) {
      casilla.estado_destruida = true;
      await casilla.save({ transaction });
      impactos.push({ x: coordenada.x, y: coordenada.y });

      const campamento = await orm.Campamento.findOne({
        where: { id_casilla: casilla.id },
        transaction,
      });
      if (campamento) {
        campamentosDestruidos.push({
          id: campamento.id,
          tipo: campamento.tipo,
          posicion: { x: coordenada.x, y: coordenada.y },
        });
        await campamento.destroy({ transaction });
      }
    }
  }

  return {
    patron,
    impactos,
    domoBloqueo: disparoBloqueadoPorDomo,
    campamentosDestruidos,
  };
};

const verificarVictorias = async (orm, partida, atacante, defensor, transaction) => {
  const tablero = await orm.Tablero.findOne({
    where: { id_partida: partida.id },
    transaction,
  });
  const destruidasEnemigas = await contarCasillasDestruidas(
    orm,
    tablero.id,
    obtenerMitadEnemiga(atacante.lado),
    transaction,
  );

  const mitadDefensiva = await contarCasillasDestruidas(
    orm,
    tablero.id,
    obtenerMitadPropia(atacante.lado),
    transaction,
  );

  const todoEnemigoDestruido = destruidasEnemigas >= TOTAL_HALF_CELLS;
  const todoAtacanteDestruido = mitadDefensiva >= TOTAL_HALF_CELLS;

  if (!todoEnemigoDestruido) {
    return { estado: 'CONTINUA' };
  }

  if (atacante.id === partida.id_jugador_iniciador) {
    await prepararRespuesta(partida, defensor.id, transaction);
    return { estado: 'RESPUESTA', esperando: defensor.id };
  }

    await finalizarPartida(orm, partida, { ganadorId: atacante.id }, transaction);
    return { estado: 'FINALIZADA', ganador: atacante.id };
  };

const resolverPostRespuesta = async (orm, partida, jugador, transaction) => {
  const tablero = await orm.Tablero.findOne({
    where: { id_partida: partida.id },
    transaction,
  });

  const destruidoJugador = await contarCasillasDestruidas(
    orm,
    tablero.id,
    obtenerMitadEnemiga(jugador.lado),
    transaction,
  );

  const rival = await orm.Jugador.findOne({
    where: {
      id_partida: partida.id,
      id: { [Op.ne]: jugador.id },
    },
    transaction,
  });

  const destruidoRival = await contarCasillasDestruidas(
    orm,
    tablero.id,
    obtenerMitadPropia(jugador.lado),
    transaction,
  );

  if (destruidoJugador >= TOTAL_HALF_CELLS && destruidoRival >= TOTAL_HALF_CELLS) {
    await finalizarPartida(orm, partida, { empate: true }, transaction);
    return { estado: 'FINALIZADA', empate: true };
  }

  await finalizarPartida(orm, partida, { ganadorId: partida.id_jugador_iniciador }, transaction);
  return { estado: 'FINALIZADA', ganador: partida.id_jugador_iniciador };
};

const avanzarTurno = async (orm, partida, jugadorActual, transaction) => {
  if (partida.estado === 'FINALIZADA') {
    return;
  }

  partida.turno_actual += 1;
  if (partida.respuesta_activa) {
    const proximo = await orm.Jugador.findByPk(partida.id_jugador_pendiente_respuesta, { transaction });
    if (proximo) {
      partida.id_jugador_en_turno = proximo.id;
    }
  } else {
    const rival = await orm.Jugador.findOne({
      where: {
        id_partida: partida.id,
        id: { [Op.ne]: jugadorActual.id },
      },
      transaction,
    });
    if (rival) {
      partida.id_jugador_en_turno = rival.id;
    }
  }
  await partida.save({ transaction });
};

const ejecutarTurno = async (orm, parametros, opciones = {}) => withTransaction(
  orm.sequelize,
  async (transaction) => {
    const {
      partidaId,
      jugadorId,
      tipoAccion,
      municion,
      objetivo,
      orientacion,
      autoPasar,
    } = parametros;

    const partida = await orm.Partida.findByPk(partidaId, { transaction });
    if (!partida) {
      throw new Error('Partida no encontrada');
    }
    if (partida.estado !== 'PARTIDA') {
      throw new Error('La partida no está en curso');
    }

    const jugador = await orm.Jugador.findByPk(jugadorId, { transaction });
    if (!jugador || jugador.id_partida !== partida.id) {
      throw new Error('El jugador indicado no pertenece a la partida');
    }

    if (partida.id_jugador_en_turno !== jugador.id) {
      throw new Error('No es el turno de este jugador');
    }

    const rival = await orm.Jugador.findOne({
      where: {
        id_partida: partida.id,
        id: { [Op.ne]: jugador.id },
      },
      transaction,
    });
    if (!rival) {
      throw new Error('No se encontró al jugador rival en la partida');
    }

    const inicioTurno = await procesarInicioTurno(orm, partida, jugador, transaction);

    const turno = await orm.Turno.create({
      id_partida: partida.id,
      id_jugador: jugador.id,
      numero_turno: partida.turno_actual,
      tiempo_restante: 0,
      tipo_accion: tipoAccion,
    }, { transaction });

    const resultado = {
      inicioTurno,
      accion: tipoAccion,
      disparo: null,
      estadoPartida: null,
    };

    if (tipoAccion === 'PASAR') {
      jugador.inactividad_turnos = autoPasar ? jugador.inactividad_turnos + 1 : 0;
      resultado.estadoPartida = { estado: 'CONTINUA' };
    } else if (tipoAccion === 'DISPARAR') {
      if (!municion) {
        throw new Error('Debe indicar la munición a fabricar');
      }
      const definicionMunicion = MUNITION_DEFINITIONS[municion];
      if (!definicionMunicion) {
        throw new Error('Munición inválida');
      }
      if (jugador.polvora < definicionMunicion.coste) {
        throw new Error('No dispone de pólvora suficiente');
      }
      if (!objetivo || typeof objetivo.x !== 'number' || typeof objetivo.y !== 'number') {
        throw new Error('Debe indicar la coordenada objetivo');
      }
      if (!esCoordenadaValida(objetivo)) {
        throw new Error('La coordenada objetivo está fuera del tablero');
      }
      if (!orientacionValida(municion, orientacion)) {
        throw new Error('La orientación indicada no es válida para la munición');
      }

      jugador.polvora -= definicionMunicion.coste;
      jugador.inactividad_turnos = 0;

      const disparo = await resolverDisparo(orm, {
        partida,
        atacante: jugador,
        defensor: rival,
        municion,
        objetivo,
        orientacion,
        transaction,
      });

      await orm.Municion.create({
        id_turno: turno.id,
        tipo: municion,
        coste: definicionMunicion.coste,
        objetivo_x: objetivo.x,
        objetivo_y: objetivo.y,
        orientacion,
      }, { transaction });

      const marcadores = await actualizarMarcadores(orm, partida, jugador, rival, transaction);

      const estado = partida.respuesta_activa
        ? await resolverPostRespuesta(orm, partida, jugador, transaction)
        : await verificarVictorias(orm, partida, jugador, rival, transaction);

      resultado.disparo = {
        ...disparo,
        coste: definicionMunicion.coste,
        marcadores,
      };
      resultado.estadoPartida = estado;

      if (estado.estado === 'FINALIZADA') {
        turno.resultado = estado;
      }
    } else {
      throw new Error('Tipo de acción inválido. Use PASAR o DISPARAR');
    }

    if (jugador.inactividad_turnos >= 3) {
      await finalizarPartida(orm, partida, { ganadorId: rival.id }, transaction);
      resultado.estadoPartida = { estado: 'FINALIZADA', ganador: rival.id, motivo: 'inactividad' };
      turno.resultado = resultado.estadoPartida;
    }

    if (tipoAccion === 'PASAR' && partida.respuesta_activa) {
      const estadoRespuesta = await resolverPostRespuesta(orm, partida, jugador, transaction);
      resultado.estadoPartida = estadoRespuesta;
      if (estadoRespuesta.estado === 'FINALIZADA') {
        turno.resultado = estadoRespuesta;
      }
    }

    jugador.ultimo_turno_jugado = partida.turno_actual;
    await jugador.save({ transaction });

    await avanzarTurno(orm, partida, jugador, transaction);
    turno.resultado = turno.resultado || resultado;
    await turno.save({ transaction });

    return {
      turno: turno.toJSON(),
      resultado,
      partida: partida.toJSON(),
    };
  },
);

const crearPartidaDesdeSala = async (orm, salaId) => withTransaction(
  orm.sequelize,
  async (transaction) => {
      const sala = await orm.Sala.findByPk(salaId, {
        include: [{ model: orm.SalaParticipante }],
        transaction,
        lock: true,
      });
    if (!sala) {
      throw new Error('Sala no encontrada');
    }
    if (sala.estado !== 'esperando') {
      throw new Error('La sala debe estar esperando jugadores para iniciar una partida');
    }

    const jugadoresSala = sala.SalaParticipantes
      .filter((participante) => participante.rol === 'jugador')
      .sort((a, b) => (a.slot || 0) - (b.slot || 0));

    if (jugadoresSala.length !== 2) {
      throw new Error('Se requieren exactamente dos jugadores para iniciar la partida');
    }

    const partida = await orm.Partida.create({
      id_sala: sala.id,
      estado: 'DESPLIEGUE',
      turno_actual: 0,
    }, { transaction });

    await prepararTablero(orm, partida, transaction);

    const jugadores = [];
    for (let index = 0; index < jugadoresSala.length; index += 1) {
      const participante = jugadoresSala[index];
      const lado = index === 0 ? 'LEFT' : 'RIGHT';
      const jugador = await orm.Jugador.create({
        id_partida: partida.id,
        id_usuario: participante.id_usuario,
        polvora: 0,
        lado,
        se_usos_restantes: 3,
        se_cooldown_turnos: 0,
        destruidas_propias: 0,
        destruidas_reportadas: 0,
        se_usos_totales: 0,
        inactividad_turnos: 0,
      }, { transaction });
      jugadores.push(jugador);
    }

    const iniciador = elegirAleatorio(jugadores);
    partida.id_jugador_iniciador = iniciador.id;
    await partida.save({ transaction });

    sala.estado = 'iniciada';
    await sala.save({ transaction });

    return {
      partida: partida.toJSON(),
      jugadores: jugadores.map((j) => j.toJSON()),
    };
  },
);

const desplegarCampamento = async (orm, parametros) => withTransaction(
  orm.sequelize,
  async (transaction) => {
    const {
      partidaId,
      jugadorId,
      tipo,
      coordenada,
    } = parametros;

    if (!CAMPAMENTO_TYPES[tipo]) {
      throw new Error('Tipo de campamento inválido');
    }

    const partida = await orm.Partida.findByPk(partidaId, { transaction });
    if (!partida) {
      throw new Error('Partida no encontrada');
    }
    if (partida.estado !== 'DESPLIEGUE') {
      throw new Error('La partida no está en fase de despliegue');
    }

    const jugador = await orm.Jugador.findByPk(jugadorId, { transaction });
    if (!jugador || jugador.id_partida !== partida.id) {
      throw new Error('El jugador indicado no pertenece a la partida');
    }

    if (!coordenada || typeof coordenada.x !== 'number' || typeof coordenada.y !== 'number') {
      throw new Error('Debe indicar una coordenada válida');
    }
    if (!esCoordenadaValida(coordenada)) {
      throw new Error('La coordenada seleccionada está fuera del tablero');
    }

    validarCoordenadaEnMitad(coordenada, jugador.lado);
    await validarCampamentoUnico(orm, jugador.id, tipo, transaction);

    const tablero = await orm.Tablero.findOne({
      where: { id_partida: partida.id },
      transaction,
    });
    const casilla = await obtenerCasilla(orm, tablero.id, coordenada, transaction);
    if (casilla.estado_destruida) {
      throw new Error('No se puede desplegar un campamento en una casilla destruida');
    }
    await validarCasillaLibre(orm, casilla.id, transaction);

    const campamento = await orm.Campamento.create({
      id_jugador: jugador.id,
      id_casilla: casilla.id,
      tipo,
    }, { transaction });

    await verificarInicioPartida(orm, partida, transaction);

    return campamento.toJSON();
  },
);

const puedeSolicitarSE = async (orm, partida, jugador, transaction) => {
  if (partida.estado !== 'PARTIDA') {
    return false;
  }
  if (jugador.se_usos_totales >= SUMINISTRO_MAX_USOS) {
    return false;
  }
  if (jugador.se_cooldown_turnos > 0) {
    return false;
  }

  const tablero = await orm.Tablero.findOne({
    where: { id_partida: partida.id },
    transaction,
  });

  const destruidasPropias = await contarCasillasDestruidas(
    orm,
    tablero.id,
    obtenerMitadPropia(jugador.lado),
    transaction,
  );

  const rival = await orm.Jugador.findOne({
    where: {
      id_partida: partida.id,
      id: { [Op.ne]: jugador.id },
    },
    transaction,
  });

  const destruidasRival = await contarCasillasDestruidas(
    orm,
    tablero.id,
    obtenerMitadPropia(rival.lado),
    transaction,
  );

  const diferencia = destruidasRival - destruidasPropias;

  const campamentos = await obtenerCampamentosVivos(orm, jugador.id, transaction);
  const campamentosActivos = campsActivos(campamentos);

  const perdidasCampamentos = Math.max(0, 3 - campamentosActivos.length);

  return diferencia >= 8 || perdidasCampamentos >= 2;
};

const aplicarSuministro = async (orm, parametros, opciones = {}) => withTransaction(
  orm.sequelize,
  async (transaction) => {
    const {
      partidaId,
      jugadorId,
      preferencia,
      domo,
      reloc,
    } = parametros;

    const partida = await orm.Partida.findByPk(partidaId, { transaction });
    if (!partida) {
      throw new Error('Partida no encontrada');
    }

    const jugador = await orm.Jugador.findByPk(jugadorId, { transaction });
    if (!jugador || jugador.id_partida !== partida.id) {
      throw new Error('El jugador indicado no pertenece a la partida');
    }

    const elegible = await puedeSolicitarSE(orm, partida, jugador, transaction);
    if (!elegible) {
      throw new Error('El jugador no cumple las condiciones para solicitar Suministro de Emergencia');
    }

    const exito = opciones.forceSuccess === true
      || Math.random() <= SUMINISTRO_PROBABILIDAD;

    const resultado = {
      exito,
      efecto: null,
    };

    jugador.se_cooldown_turnos = SUMINISTRO_COOLDOWN;

    if (!exito) {
      await jugador.save({ transaction });
      return resultado;
    }

    const efectos = ['BOOST', 'DOME', 'RELOC'];
    const efecto = opciones.forceOutcome || (preferencia && efectos.includes(preferencia) ? preferencia : elegirAleatorio(efectos));
    resultado.efecto = efecto;

    if (efecto === 'BOOST') {
      jugador.polvora += 4;
    } else if (efecto === 'DOME') {
      if (!domo || typeof domo.centroX !== 'number' || typeof domo.centroY !== 'number') {
        throw new Error('Debe indicar la posición del domo (centroX, centroY)');
      }
      const coordenada = { x: domo.centroX, y: domo.centroY };
      if (!esCoordenadaValida(coordenada)) {
        throw new Error('La posición del domo es inválida');
      }
      validarCoordenadaEnMitad(coordenada, jugador.lado);
      jugador.domo_activo = true;
      jugador.domo_centro_x = coordenada.x;
      jugador.domo_centro_y = coordenada.y;
      jugador.domo_turno_activacion = partida.turno_actual;
    } else if (efecto === 'RELOC') {
      if (!reloc || !reloc.campamentoId || !reloc.destino) {
        throw new Error('Debe indicar campamentoId y destino para reubicar');
      }
      const campamento = await orm.Campamento.findByPk(reloc.campamentoId, {
        include: [{ model: orm.Casilla }],
        transaction,
      });
      if (!campamento || campamento.id_jugador !== jugador.id) {
        throw new Error('El campamento indicado no pertenece al jugador');
      }
      if (campamento.ultimo_turno_reloc && campamento.ultimo_turno_reloc === partida.turno_actual - 1) {
        throw new Error('No puedes reubicar el mismo campamento en turnos consecutivos');
      }
      const destino = { x: reloc.destino.x, y: reloc.destino.y };
      if (!esCoordenadaValida(destino)) {
        throw new Error('La casilla de destino es inválida');
      }
      validarCoordenadaEnMitad(destino, jugador.lado);

      const tablero = await orm.Tablero.findOne({
        where: { id_partida: partida.id },
        transaction,
      });
      const casillaDestino = await obtenerCasilla(orm, tablero.id, destino, transaction);
      if (casillaDestino.estado_destruida) {
        throw new Error('No se puede reubicar a una casilla destruida');
      }
      await validarCasillaLibre(orm, casillaDestino.id, transaction);

      const deltaX = Math.abs(campamento.Casilla.coordenada_x - destino.x);
      const deltaY = Math.abs(campamento.Casilla.coordenada_y - destino.y);
      if ((deltaX + deltaY) !== 1) {
        throw new Error('Solo puedes mover el campamento a una casilla ortogonal adyacente');
      }

      campamento.id_casilla = casillaDestino.id;
      campamento.ultimo_turno_reloc = partida.turno_actual;
      await campamento.save({ transaction });
    }

    jugador.se_usos_totales += 1;
    if (typeof jugador.se_usos_restantes === 'number') {
      jugador.se_usos_restantes = Math.max(jugador.se_usos_restantes - 1, 0);
    }
    await jugador.save({ transaction });

    return resultado;
  },
);

const obtenerEstadoPartida = async (orm, partidaId) => {
  const partida = await orm.Partida.findByPk(partidaId, {
    include: [
      {
        model: orm.Jugador,
        include: [
          { model: orm.Campamento, include: [orm.Casilla] },
          { model: orm.Usuario },
        ],
      },
      {
        model: orm.Tablero,
        include: [orm.Casilla],
      },
    ],
  });
  if (!partida) {
    throw new Error('Partida no encontrada');
  }
  return partida.toJSON();
};

module.exports = {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  HALF_WIDTH,
  CAMPAMENTO_TYPES,
  MUNITION_DEFINITIONS,
  crearPartidaDesdeSala,
  desplegarCampamento,
  ejecutarTurno,
  aplicarSuministro,
  obtenerEstadoPartida,
};
