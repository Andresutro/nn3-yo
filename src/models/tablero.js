'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tablero extends Model {
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
      this.hasMany(models.Casilla, {
        foreignKey: 'id_tablero'
      });
    }
  }
  Tablero.init({
    largo_x: DataTypes.INTEGER,
    largo_y: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Tablero',
  });
  return Tablero;
};