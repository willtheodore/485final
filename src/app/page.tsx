"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import "react-toggle/style.css";
import { acceptRevision, update } from "@/util";
import type Quill from "quill";
import Revisions from "./revisions";
import RevisionsContext from "@/context";

export type RevisionKey = "rephrase" | "factCheck" | "tone";

export interface Revision {
  quote: string;
  revision: string;
}

export type RevisionsState = {
  revisions: {
    [key in RevisionKey]?: Revision[];
  };
  enabled: {
    [key in RevisionKey]: boolean;
  };
  revisionAccepted: boolean;
  selectedTone: string;
  apiKey: string;
  isLoading: boolean;
  quill?: Quill;
};

export type SelectToneAction = {
  type: "selectTone";
  tone: string;
};
export type AcceptSuggestionAction = {
  type: "accept";
  key: RevisionKey;
  revision: Revision;
};
export type SetQuillAction = {
  type: "quill";
  quill: Quill | undefined;
};
export type SetRevisionsAction = {
  type: "set";
  key: RevisionKey;
  revisions: Revision[];
};
export type UpdateAction = {
  type: "update";
  dispatch: React.Dispatch<RevisionsActions>;
};
export type FinishedAction = {
  type: "finished";
};
export type UpdateKeyAction = {
  type: "updateKey";
  apiKey: string;
};
export type SetEnabledAction = {
  type: "setEnabled";
  key: RevisionKey;
  value: boolean;
};
export type RevisionsActions =
  | SetRevisionsAction
  | SetQuillAction
  | AcceptSuggestionAction
  | UpdateAction
  | FinishedAction
  | UpdateKeyAction
  | SetEnabledAction
  | SelectToneAction;

function revisionsReducer(
  state: RevisionsState,
  action: RevisionsActions,
): RevisionsState {
  switch (action.type) {
    case "set":
      return {
        ...state,
        revisions: {
          ...state.revisions,
          [action.key]: action.revisions,
        },
      };
    case "quill":
      return {
        ...state,
        quill: action.quill,
      };
    case "accept":
      if (state.quill) acceptRevision(state.quill, action.revision);
      return {
        ...state,
        revisionAccepted: true,
        revisions: {
          ...state.revisions,
          [action.key]: state.revisions[action.key]?.filter(
            (revision) => revision.quote !== action.revision.quote,
          ),
        },
      };
    case "setEnabled":
      return {
        ...state,
        enabled: {
          ...state.enabled,
          [action.key]: action.value,
        },
      };

    case "update":
      if (!state.isLoading) {
        update(state, action.dispatch);
        return {
          ...state,
          isLoading: true,
        };
      } else return state;
    case "finished":
      return {
        ...state,
        revisionAccepted: false,
        isLoading: false,
      };
    case "updateKey":
      return {
        ...state,
        apiKey: action.apiKey,
      };
    case "selectTone":
      return {
        ...state,
        selectedTone: action.tone,
      };
    default:
      return state;
  }
}

export default function HomePage() {
  const [state, dispatch] = React.useReducer<typeof revisionsReducer>(
    revisionsReducer,
    {
      isLoading: false,
      revisions: {},
      apiKey: "",
      selectedTone: "",
      revisionAccepted: false,
      enabled: {
        rephrase: true,
        factCheck: true,
        tone: true,
      },
    },
  );

  const Editor = React.useMemo(() => {
    return dynamic(() => import("@/app/editor"), {
      loading: () => <p>loading...</p>,
      ssr: false,
    });
  }, []);

  return (
    <main className="flex flex-col">
      <RevisionsContext.Provider value={{ state, dispatch }}>
        <Editor placeholder="Enter text here..." dispatch={dispatch} />
        <div className="w-full border px-4 py-2 text-sm">
          <p className="mb-2 text-lg font-bold">Instructions</p>
          <p>
            We will never store your GPT API key. All requests are sent from the
            client. Please ensure you have a secure connection before
            proceeding. <br />
            Click update to generate suggestions. Update again after accepting a
            suggestion.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Revisions keyword="rephrase" />
          <Revisions keyword="factCheck" />
          <Revisions keyword="tone" />
        </div>
      </RevisionsContext.Provider>
    </main>
  );
}
