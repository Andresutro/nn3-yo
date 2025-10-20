'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Turno extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Partida, {
        foreignKey: 'id_partida'
      });
      this.belongsTo(models.Jugador, {
        foreignKey: 'id_jugador'
      });
      this.hasOne(models.Municion, {
        foreignKey: 'id_turno'
      });
      this.hasOne(models.Suministro, {
        foreignKey: 'id_turno'
      });
    }
  }
  Turno.init({
    numero_turno: DataTypes.INTEGER,
    tiempo_restante: DataTypes.INTEGER,
    tipo_accion: DataTypes.STRING,
    resultado: DataTypes.JSONB
  }, {
    sequelize,
    modelName: 'Turno',
  });
  return Turno;
};