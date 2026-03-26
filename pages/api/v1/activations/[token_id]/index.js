import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;

  if (request.context.user.id) {
    await activation.ensureUserCanUseToken(request.context.user.id);
  }

  await activation.findOneById(activationTokenId);

  const validActivationToken =
    await activation.findOneValidById(activationTokenId);

  await activation.activeUserByUserId(validActivationToken.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  return response.status(200).json(usedActivationToken);
}
