"use client";

import { useEffect, useState, type SetStateAction } from "react";
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireItemLink,
   QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
  QuestionnaireResponseRepository,
} from "assessmentis-domain";
import QuestionnaireItemForm from "./components/QuestionnaireItemForm/QuestionnaireItemForm";
import { useRuntimeContext } from "~/clientRuntime";
import { Effect } from "effect";

type IProps = {
  questionnaire: Questionnaire;
  questionnaireResponse: QuestionnaireResponse
};

const flatten = <
  K extends string,
  V extends { [k in K]?: ReadonlyArray<V> | undefined },
>(
  key: K,
  items: ReadonlyArray<V>,
): V[] => [...items, ...items.flatMap((item) => flatten(key, item[key] ?? []))];

const QuestionnaireForm = ({ questionnaire, questionnaireResponse: loadedQuestionnaireResponse }: IProps) => {
  const clientRuntime = useRuntimeContext()
  const [questionnaireResponse, setQuestionnaireResponse] 
    = useState<QuestionnaireResponse>(loadedQuestionnaireResponse)
  
  useEffect(() => {
    const submitTimeout = setTimeout(
      () => {
        if (!questionnaireResponse.id) return
        clientRuntime.runPromise(Effect.gen(function*() {
          const questionnaireResponseClient = yield* QuestionnaireResponseRepository;
          if (!questionnaireResponse.id) return
          return yield* questionnaireResponseClient.updateQuestionnaireResponse(
            questionnaireResponse
          )
        }))
        .then(res => console.log({res}))
        .catch(err => console.error({err}));
      }, 
      5000
    );
    return () => clearTimeout(submitTimeout)
  }, [questionnaireResponse])

  return (
    <>
      {questionnaire.item?.map((item) => (
        <QuestionnaireItemForm
          key={item.linkId}
          questionnaireItem={item}
          questionnaireResponseItem={questionnaireResponse.item?.find(({linkId}) => linkId == item.linkId) ?? ({linkId: item.linkId})}
          setQuestionnaireResponseItem={
            (update: SetStateAction<QuestionnaireResponseItem>) => 
              setQuestionnaireResponse(qr => ({
                ...qr, 
                item: [
                  ...qr.item?.filter(({linkId}) => linkId != item.linkId) ?? [], 
                  typeof update == 'function' 
                    ? update(qr.item?.find(({linkId}) => linkId == item.linkId) ?? {linkId: item.linkId}) 
                    : update
                ] 
              }))
          }
          uiControl={undefined}
        />
      ))}
    </>
  );
};
export default QuestionnaireForm;
