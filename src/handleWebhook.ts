import { Bundle, ZObject } from "zapier-platform-core";

/**
 * This processes inbound webhooks from Linear.
 * @see https://platform.zapier.com/build/cli-hook-trigger#3-write-the-perform-function
 * @see https://platform.zapier.com/build/cli-hook-trigger#perform
 */
export const getWebhookData = (z: ZObject, bundle: Bundle) => {
  const entity = {
    ...bundle.cleanedRequest.data,
    querystring: undefined,
  };

  return [entity];
};

/**
 * Deletes a webhook subscription in Linear.
 * @see https://platform.zapier.com/build/cli-hook-trigger#2-write-the-unsubscribehook-function
 * @see https://platform.zapier.com/build/cli-hook-trigger#unsubscribehook
 */
export const unsubscribeHook = (z: ZObject, bundle: Bundle) => {
  // bundle.subscribeData contains the parsed response JSON from the subscribe request.
  const hookId = bundle.subscribeData?.id;

  return z
    .request({
      url: `https://client-api.linear.app/connect/zapier/unsubscribe/${hookId}`,
      method: "DELETE",
    })
    .then(response => response.data);
};
