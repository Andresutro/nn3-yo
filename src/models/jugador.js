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
      allowNull: true,
    },
    se_usos_restantes: DataTypes.INTEGER,
    se_cooldown_turnos: DataTypes.INTEGER,
    destruidas_reportadas: DataTypes.INTEGER,
    destruidas_propias: DataTypes.INTEGER,
    se_usos_totales: DataTypes.INTEGER,
    inactividad_turnos: DataTypes.INTEGER,
    ultimo_turno_inicio_procesado: DataTypes.INTEGER,
    ultimo_turno_jugado: DataTypes.INTEGER,
    domo_activo: DataTypes.BOOLEAN,
    domo_centro_x: DataTypes.INTEGER,
    domo_centro_y: DataTypes.INTEGER,
    domo_turno_activacion: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Jugador',
  });
  return Jugador;
};