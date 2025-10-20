'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Casillas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_tablero: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tableros',
          key: 'id'
        }
      },
      coordenada_x: {
        type: Sequelize.INTEGER
      },
      coordenada_y: {
        type: Sequelize.INTEGER
      },
      estado_destruida: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('Casillas');
  }
};