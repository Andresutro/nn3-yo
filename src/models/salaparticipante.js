'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SalaParticipante extends Model {
    static associate(models) {
      this.belongsTo(models.Sala, {
        foreignKey: 'id_sala'
      });
      this.belongsTo(models.Usuario, {
        foreignKey: 'id_usuario'
      });
    }
  }
  SalaParticipante.init({
    rol: DataTypes.ENUM('jugador', 'espectador'),
    slot: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SalaParticipante',
  });
  return SalaParticipante;
};
