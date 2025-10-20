'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Casilla extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Tablero, {
        foreignKey: 'id_tablero'
      });
      this.hasOne(models.Campamento, {
        foreignKey: 'id_casilla'
      });
    }
  }
  Casilla.init({
    coordenada_x: DataTypes.INTEGER,
    coordenada_y: DataTypes.INTEGER,
    estado_destruida: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Casilla',
  });
  return Casilla;
};