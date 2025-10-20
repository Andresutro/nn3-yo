'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Partida extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Sala, {
        foreignKey: 'id_sala'
      });
      this.hasMany(models.Jugador, {
        foreignKey: 'id_partida'
      });
      this.hasOne(models.Tablero, {
        foreignKey: 'id_partida'
      });
      this.hasMany(models.Turno, {
        foreignKey: 'id_partida'
      });
      this.belongsTo(models.Jugador, {
        as: 'JugadorIniciador',
        foreignKey: 'id_jugador_iniciador'
      });
    }
  }
  Partida.init({
    estado: DataTypes.STRING,
    turno_actual: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Partida',
  });
  return Partida;
};