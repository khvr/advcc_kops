'use strict';
module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        id: {
            allowNull: false,
            primaryKey: true,
            unique: true,
            type: DataTypes.UUID,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            allowNull: false,
            type: DataTypes.STRING
        },
        email_address: {
            allowNull: false,
            unique: true,
            type: DataTypes.STRING
        },
        account_created: {
            allowNull: false,
            unique: true,
            type: DataTypes.STRING
        },
        account_updated: {
            allowNull: false,
            unique: true,
            type: DataTypes.STRING
        }
    }, {
        timestamps: false,
        freezeTableName: true,
        modelName: 'singularName'
    }
    );
    User.associate = function (models) {
        // associations can be defined here
        User.hasMany(models.Watch, {
            onDelete: "cascade",
            foreignKey: "user_id",
        });
    };
    return User;
}

