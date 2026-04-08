function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;

    if (user.id === resource.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}

function filterOutput(user, feature, resource) {
  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.createdAt,
      updated_at: resource.updatedAt,
    };
  }

  if (feature === "read:user:self") {
    if (user.id === resource.id)
      return {
        id: resource.id,
        username: resource.username,
        email: resource.email,
        features: resource.features,
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
      };
  }

  if (feature === "read:session") {
    if (user.id === resource.user_id)
      return {
        id: resource.id,
        token: resource.token,
        user_id: resource.user_id,
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
        expires_at: resource.expiresAt,
      };
  }

  if (feature === "read:activation_token") {
    if (
      can(user, "read:activation_token") ||
      user.id === resource.user_id
    )
      return {
        id: resource.id,
        user_id: resource.user_id,
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
        expires_at: resource.expiresAt,
        used_at: resource.usedAt,
      };
  }

  if (feature === "read:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature === "create:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature === "read:status") {
    const output = {
      updated_at: resource.updated_at,
      dependencies: {
        database: {
          max_connections: resource.dependencies.database.max_connections,
          opened_connections: resource.dependencies.database.opened_connections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      output.dependencies.database.version =
        resource.dependencies.database.version;
    }

    return output;
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
