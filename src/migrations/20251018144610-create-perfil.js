'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Perfils', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Usuarios',
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      descripcion: {
        type: Sequelize.STRING
      },
      victorias: {
        type: Sequelize.INTEGER
      },
      derrotas: {
        type: Sequelize.INTEGER
      },
      tiempo_partida_rapida: {
        type: Sequelize.INTEGER
      },
      tiempo_partida_larga: {
        type: Sequelize.INTEGER
      },
      fecha_union: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('Perfils');
  }
};