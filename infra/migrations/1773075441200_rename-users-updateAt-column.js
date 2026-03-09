exports.up = (pgm) => {
  pgm.renameColumn("users", "updateAt", "updatedAt");
};

exports.down = (pgm) => {
  pgm.renameColumn("users", "updatedAt", "updateAt");
};
