import database from "infra/database";
import email from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "./user";
import authorization from "./authorization";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000;

function getUserId(userOrUserId) {
  if (typeof userOrUserId === "object" && userOrUserId !== null) {
    return userOrUserId.id;
  }

  return userOrUserId;
}

async function findOneByUserId(userId) {
  const normalizedUserId = getUserId(userId);
  const newToken = await runSelectQuery(normalizedUserId);
  return newToken;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = $1
        LIMIT
          1
      ;`,
      values: [userId],
    });

    return results.rows[0];
  }
}

async function findOneById(tokenId) {
  const tokenFound = await runSelectQuery(tokenId);
  return tokenFound;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
        LIMIT
          1
      ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O token de ativação utilizado não foi encontrado no sistema.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId) {
  const normalizedUserId = getUserId(userId);
  const createdAt = new Date();
  const updatedAt = createdAt;
  const expiresAt = new Date(createdAt.getTime() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(
    normalizedUserId,
    createdAt,
    updatedAt,
    expiresAt,
  );
  return newToken;

  async function runInsertQuery(userId, createdAt, updatedAt, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (
            user_id,
            "createdAt",
            "updatedAt",
            "expiresAt"
          )
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
      ;`,
      values: [userId, createdAt, updatedAt, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "FinTab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro.

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe FinTab`,
  });
}

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          "usedAt" = timezone('utc', now()),
          "updatedAt" = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [activationTokenId],
    });

    return results.rows[0];
  }
}

async function ensureUserCanUseToken(userId) {
  const normalizedUserId = getUserId(userId);
  const userToActivate = await user.findOneById(normalizedUserId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  return userToActivate;
}

async function activeUserByUserId(userId) {
  const normalizedUserId = getUserId(userId);
  await ensureUserCanUseToken(normalizedUserId);

  const activatedUser = await user.setFeatures(normalizedUserId, [
    "create:session",
    "read:session",
    "update:user",
  ]);
  return activatedUser;
}

async function findOneValidById(tokenId) {
  const validTokenFound = await runSelectQuery(tokenId);

  return validTokenFound;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
        AND
          "expiresAt" > NOW()
        AND
          "usedAt" IS NULL
        LIMIT
          1
      ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  EXPIRATION_IN_MILLISECONDS,
  findOneByUserId,
  findOneById,
  create,
  sendEmailToUser,
  markTokenAsUsed,
  ensureUserCanUseToken,
  activeUserByUserId,
  findOneValidById,
};

export default activation;
