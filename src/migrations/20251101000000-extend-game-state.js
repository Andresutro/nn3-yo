'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Jugadores', 'destruidas_reportadas', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Jugadores', 'destruidas_propias', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Jugadores', 'se_usos_totales', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Jugadores', 'inactividad_turnos', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Jugadores', 'ultimo_turno_inicio_procesado', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Jugadores', 'ultimo_turno_jugado', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Jugadores', 'domo_activo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Jugadores', 'domo_centro_x', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Jugadores', 'domo_centro_y', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Jugadores', 'domo_turno_activacion', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Campamentos', 'ultimo_turno_reloc', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Partidas', 'id_jugador_en_turno', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Jugadores',
        key: 'id',
      },
    });
    await queryInterface.addColumn('Partidas', 'estado_subfase', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Partidas', 'respuesta_activa', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Partidas', 'id_jugador_pendiente_respuesta', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Jugadores',
        key: 'id',
      },
    });
    await queryInterface.addColumn('Partidas', 'ganador_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Jugadores',
        key: 'id',
      },
    });
    await queryInterface.addColumn('Partidas', 'empate', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Turnos', 'tipo_accion', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Turnos', 'resultado', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Jugadores', 'destruidas_reportadas');
    await queryInterface.removeColumn('Jugadores', 'destruidas_propias');
    await queryInterface.removeColumn('Jugadores', 'se_usos_totales');
    await queryInterface.removeColumn('Jugadores', 'inactividad_turnos');
    await queryInterface.removeColumn('Jugadores', 'ultimo_turno_inicio_procesado');
    await queryInterface.removeColumn('Jugadores', 'ultimo_turno_jugado');
    await queryInterface.removeColumn('Jugadores', 'domo_activo');
    await queryInterface.removeColumn('Jugadores', 'domo_centro_x');
    await queryInterface.removeColumn('Jugadores', 'domo_centro_y');
    await queryInterface.removeColumn('Jugadores', 'domo_turno_activacion');

    await queryInterface.removeColumn('Campamentos', 'ultimo_turno_reloc');

    await queryInterface.removeColumn('Partidas', 'id_jugador_en_turno');
    await queryInterface.removeColumn('Partidas', 'estado_subfase');
    await queryInterface.removeColumn('Partidas', 'respuesta_activa');
    await queryInterface.removeColumn('Partidas', 'id_jugador_pendiente_respuesta');
    await queryInterface.removeColumn('Partidas', 'ganador_id');
    await queryInterface.removeColumn('Partidas', 'empate');

    await queryInterface.removeColumn('Turnos', 'tipo_accion');
    await queryInterface.removeColumn('Turnos', 'resultado');
  },
};
