'use strict';
module.exports = (sequelize, DataTypes) => {
    var Alert = sequelize.define('Alert', {
        id: {
            allowNull: false,
            primaryKey: true,
            unique: true,
            type: DataTypes.UUID,
        },
        field_type: {
            type: DataTypes.ENUM('temp', 'feels_like', 'temp_min', 'temp_max', 'pressure', 'humidity'),
            allowNull: false,
        },
        operator: {
            type: DataTypes.ENUM('gt', 'gte', 'eq', 'lt', 'lte'),
            allowNull: false,
        },
        value: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        alert_created: {
            allowNull: false,
            type: DataTypes.STRING
        },
        alert_updated: {
            allowNull: false,
            type: DataTypes.STRING
        }
    }, {
        timestamps: false,
        freezeTableName: true,
        modelName: 'singularName'
    }
    );

    return Alert;
}
