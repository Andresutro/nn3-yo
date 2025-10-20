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
      this.belongsTo(models.Jugador, {
        as: 'JugadorEnTurno',
        foreignKey: 'id_jugador_en_turno'
      });
      this.belongsTo(models.Jugador, {
        as: 'JugadorPendienteRespuesta',
        foreignKey: 'id_jugador_pendiente_respuesta'
      });
      this.belongsTo(models.Jugador, {
        as: 'JugadorGanador',
        foreignKey: 'ganador_id'
      });
    }
  }
  Partida.init({
    estado: DataTypes.STRING,
    turno_actual: DataTypes.INTEGER,
    estado_subfase: DataTypes.STRING,
    respuesta_activa: DataTypes.BOOLEAN,
    empate: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Partida',
  });
  return Partida;
};