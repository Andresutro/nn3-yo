'use strict';
const {
  Model
} = require('sequelize');
const usuario = require('./usuario');
module.exports = (sequelize, DataTypes) => {
  class Perfil extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Usuario, {
        foreignKey: 'id_usuario',
        as: 'usuario',
        onDelete: 'CASCADE',
      });
    }
  }
  Perfil.init({
    descripcion: DataTypes.STRING,
    victorias: DataTypes.INTEGER,
    derrotas: DataTypes.INTEGER,
    tiempo_partida_rapida: DataTypes.INTEGER,
    tiempo_partida_larga: DataTypes.INTEGER,
    fecha_union: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Perfil',
  });
  return Perfil;
};