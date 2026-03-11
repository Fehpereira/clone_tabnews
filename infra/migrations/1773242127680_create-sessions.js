exports.up = (pgm) => {
  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    token: {
      type: "varchar(96)",
      notNull: true,
      unique: true,
    },

    user_id: {
      type: "uuid",
      notNull: true,
    },

    // Why timespamp with timezone? https://justatheory.com/2012/04/postgres-use-timestamptz/
    createdAt: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },

    expiresAt: {
      type: "timestamptz",
      notNull: true,
    },

    updatedAt: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
  });
};

exports.down = false;
