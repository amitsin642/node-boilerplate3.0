import { DataTypes, UUIDV4 } from "sequelize";

export default (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID, 
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      mobile_no: {
        type: DataTypes.STRING(15),
        allowNull: true,
        unique: true,
        validate: {
          len: [8, 15],
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: "1=Active, 0=Inactive",
      },

      // Audit Fields
      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      deleted_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true, // createdAt + updatedAt
      paranoid: true,   // enables soft delete via deletedAt
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      underscored: true
    }
  );

  return User;
};
