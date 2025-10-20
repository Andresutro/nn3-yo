'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Campamento extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Jugador, {
        foreignKey: 'id_jugador'
      });
      this.belongsTo(models.Casilla, {
        foreignKey: 'id_casilla'
      });
    }
  }
  Campamento.init({
    tipo: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Campamento',
  });
  return Campamento;
};