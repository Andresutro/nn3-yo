'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Jugador extends Model {
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
      this.belongsTo(models.Usuario, {
        foreignKey: 'id_usuario'
      });
      this.hasMany(models.Campamento, {
        foreignKey: 'id_jugador'
      });
      this.hasMany(models.Turno, {
        foreignKey: 'id_jugador'
      });
      this.hasMany(models.Partida, {
        as: 'PartidasIniciadas',
        foreignKey: 'id_jugador_iniciador'
      });
    }
  }
  Jugador.init({
    polvora: DataTypes.INTEGER,
    lado: {
      type: DataTypes.STRING,
      // hay que ponerle esto para que no se decida su lado hasta que inicie una partida
      allowNull: true,
    },
    se_usos_restantes: DataTypes.INTEGER,
    se_cooldown_turnos: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Jugador',
  });
  return Jugador;
};