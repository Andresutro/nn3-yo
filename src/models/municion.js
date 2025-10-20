'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Municion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Turno, {
        foreignKey: 'id_turno'
      });
    }
  }
  Municion.init({
    tipo: DataTypes.STRING,
    coste: DataTypes.INTEGER,
    objetivo_x: DataTypes.INTEGER,
    objetivo_y: DataTypes.INTEGER,
    orientacion: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Municion',
  });
  return Municion;
};