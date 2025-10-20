'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Partidas', 'id_jugador_iniciador', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Jugadores',
        key: 'id'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Partidas', 'id_jugador_iniciador');
  }
};
