'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Municions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_turno: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Turnos',
          key: 'id'
        }
      },
      tipo: {
        type: Sequelize.STRING
      },
      coste: {
        type: Sequelize.INTEGER
      },
      objetivo_x: {
        type: Sequelize.INTEGER
      },
      objetivo_y: {
        type: Sequelize.INTEGER
      },
      orientacion: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('Municions');
  }
};