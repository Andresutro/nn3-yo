'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sala extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.Partida, {
        foreignKey: 'id_sala'
      });
      this.hasMany(models.SalaParticipante, {
        foreignKey: 'id_sala'
      });
    }
  }
  Sala.init({
    codigo_invitacion: DataTypes.STRING,
    estado: {
      type: DataTypes.ENUM('esperando', 'iniciada', 'finalizada'),
      allowNull: false,
      defaultValue: 'esperando'}
  }, {
    sequelize,
    modelName: 'Sala',
  });
  return Sala;
};