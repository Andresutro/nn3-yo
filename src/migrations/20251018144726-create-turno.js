'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Turnos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_partida: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Partidas',
          key: 'id'
        }
      },
      id_jugador: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Jugadores',
          key: 'id'
        }
      },
      numero_turno: {
        type: Sequelize.INTEGER
      },
      tiempo_restante: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Turnos');
  }
};