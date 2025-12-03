import { Schema, Option, Effect, ManagedRuntime } from "effect";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Questionnaire, QuestionnaireResponse, UnhandledError } from "assessmentis-domain";
import {
  QuestionnaireId,
  QuestionnaireItemLink,
} from "assessmentis-domain";
import { QuestionnaireResponseId } from "assessmentis-domain";
import { QuestionnaireResponseItemAnswer } from "assessmentis-domain";
import { QuestionnaireRepository } from "assessmentis-domain";
import { QuestionnaireResponseRepository } from "assessmentis-domain";
import { clientAppLayer } from "~/clientRuntime";
import type { Route } from "./+types/QuestionnaireResponse.$questionnaireResponseId";
import QuestionnaireForm from "~/modules/questionnaire/features/QuestionnaireForm/QuestionnaireForm";
import type { 
  Questionnaire as FhirQuestionnaire,
  QuestionnaireResponse as FhirQuestionnaireResponse
} from "fhir"

const tryDecodeQuestionnaireResponseId = Schema.decodeOption(
  QuestionnaireResponseId,
);

export const QuestionnaireResponseWithQuestionnaire = Schema.Struct({
  ...QuestionnaireResponse.fields,
  _questionnaire: Questionnaire,
});

export async function clientLoader({
  params,
}: Route.ClientLoaderArgs) {
  const runtime = ManagedRuntime.make(clientAppLayer);
  

  const questionnaireResponseIdStr = params.questionnaireResponseId;

  const questionnaireResponseIdMaybe = tryDecodeQuestionnaireResponseId(
    questionnaireResponseIdStr,
  );

  const questionnaireResponseEffect = Effect.gen(function* () {
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository;
    const questionnaireRepository = yield* QuestionnaireRepository;

    const questionnaireResponseId = yield* questionnaireResponseIdMaybe.pipe(
      Option.map((questionnaireResponseId) =>
        Effect.succeed(questionnaireResponseId),
      ),
      Option.getOrElse(() =>
        Effect.fail(
          new UnhandledError({ cause: "Questionnaire Response not found" }),
        ),
      ),
    );
    const questionnaireResponse =
      yield* questionnaireResponseRepository.getQuestionnaireResponse(
        questionnaireResponseId,
      );

    const questionnaireId = QuestionnaireId.make(
      questionnaireResponse.questionnaire?.split("/")[3] ?? questionnaireResponse.questionnaire ?? "",
    );
    const questionnaire =
      yield* questionnaireRepository.getQuestionnaire(questionnaireId);
    const enc = Schema.encode(QuestionnaireResponseWithQuestionnaire)({
      ...questionnaireResponse,
      _questionnaire: questionnaire,
    });
    return yield* enc;
  });

  const { _questionnaire, ...questionnaireResponse} = await runtime.runPromise(
    questionnaireResponseEffect,
  );

  return {
    questionnaireResponse: JSON.parse(JSON.stringify(questionnaireResponse)) as FhirQuestionnaireResponse,
    questionnaire: JSON.parse(JSON.stringify(_questionnaire)) as FhirQuestionnaire
  }
}


export default function QuestionnaireResponseDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const {questionnaire, questionnaireResponse} = loaderData;
  console.log({loaderData});
  // const handleSubmitAnswer = async (
  //   questionnaireItemLink: QuestionnaireItemLink,
  //   answer: QuestionnaireResponseItemAnswer | null,
  // ): Promise<unknown> => {
  //   const runtime = ManagedRuntime.make(clientAppLayer);
  //   return await runtime.runPromise(
  //     submitAnswer(questionnaireItemLink, answer),
  //   );
  // };
  

  // This hook builds the form based on the questionnaire
  return (
    <section style={{ maxWidth: 800, margin: "auto" }}>
      <QuestionnaireForm 
        questionnaire={questionnaire}
        questionnaireResponse={questionnaireResponse} 
      />
    </section>
  );
}
