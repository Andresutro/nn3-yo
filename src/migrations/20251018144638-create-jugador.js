'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Jugadores', {
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
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id'
        }
      },
      polvora: {
        type: Sequelize.INTEGER
      },
      lado: {
        type: Sequelize.STRING
      },
      se_usos_restantes: {
        type: Sequelize.INTEGER
      },
      se_cooldown_turnos: {
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
    await queryInterface.dropTable('Jugadors');
  }
};