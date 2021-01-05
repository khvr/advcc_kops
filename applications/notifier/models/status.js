'use strict';
module.exports = (sequelize, DataTypes) => {
    var Status = sequelize.define('Status', {
        id: {
            allowNull: false,
            primaryKey: true,
            unique: true,
            type: DataTypes.UUID,
        },
        Status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Status_created: {
            allowNull: false,
            type: DataTypes.STRING
        },
        Flag: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        timestamps: false,
        freezeTableName: true,
        modelName: 'singularName'
    }
    );



    return Status;
}
