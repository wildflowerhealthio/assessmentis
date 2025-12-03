import {onRequest} from "firebase-functions/v2/https";
import {logger, setGlobalOptions} from "firebase-functions/v2";
import type {Request} from "firebase-functions/v2/https";
import type {Response} from "express";
import fetch from "node-fetch";

setGlobalOptions({region: "northamerica-northeast2"});

export const dailyco = onRequest(
    {timeoutSeconds: 60, ingressSettings: "ALLOW_ALL"},
    async (request: Request, response: Response) => {
      const functionUrlPrefix = "/api/dailyco";
      if (!request.url.startsWith(functionUrlPrefix)) {
        response.status(400).json({
          message: "Bad Request, URL did not start with /api/dailyco",
        });
        return;
      }

      const url = `https://api.daily.co/v1${request.url.slice(functionUrlPrefix.length)}`;
      const dailyApiKey = process.env.DAILY_API_KEY;

      if (!dailyApiKey) {
        response.status(500).json({
          message: "No API Key",
        });
        return;
      }

      const {
        host: _,
        "set-cookie": __,
        ...forwardedHeaders
      } = request.headers;

      const headers = {
        ...forwardedHeaders,
        "Content-Type": "application/json",
        "Authorization": "Bearer " + dailyApiKey,
      } as const;

      const externalRes = await fetch(
          url,
          {headers, method: request.method, body: request.rawBody}
      );
      externalRes.body?.pipe(
          response.status(externalRes.status),
          {end: true},
      );
    }
);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloworld = onRequest(
    {timeoutSeconds: 60, ingressSettings: "ALLOW_ALL"},
    (request, response) => {
      logger.info("Hello logs!", {structuredData: true});
      response.status(200).send("Hello from Firebase!");
    }
);
