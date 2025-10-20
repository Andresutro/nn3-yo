'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Suministro extends Model {
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
  Suministro.init({
    tipo: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Suministro',
  });
  return Suministro;
};