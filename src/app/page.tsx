"use client";

import * as React from "react";
import "react-quill/dist/quill.snow.css";
import "react-toggle/style.css";
import { acceptRevision, update } from "@/util";
import type Quill from "quill";
import Revisions from "./revisions";
import RevisionsContext from "@/context";
import Editor from "./editor";

// Key for accessing revisions from each daemon
export type RevisionKey = "rephrase" | "factCheck" | "tone";

// Schema for revisions across daemons
export interface Revision {
  quote: string;
  revision: string;
}

// State stored in a globally accessable context
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

// Action for updating the selected tone
export type SelectToneAction = {
  type: "selectTone";
  tone: string;
};
// Action for accepting a revision
export type AcceptSuggestionAction = {
  type: "accept";
  key: RevisionKey;
  revision: Revision;
};
// Action for setting the quill instance
export type SetQuillAction = {
  type: "quill";
  quill: Quill | undefined;
};
// Action for setting the revisions after an update
export type SetRevisionsAction = {
  type: "set";
  key: RevisionKey;
  revisions: Revision[];
};
// Action for triggering an update
export type UpdateAction = {
  type: "update";
  dispatch: React.Dispatch<RevisionsActions>;
};
// Action called when an update finishes
export type FinishedAction = {
  type: "finished";
};
// Action for updating the API key
export type UpdateKeyAction = {
  type: "updateKey";
  apiKey: string;
};
// Action for setting whether a daemon is enabled
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

// Function that handles any actions called to 'dispatch' and updates state
function revisionsReducer(
  state: RevisionsState,
  action: RevisionsActions,
): RevisionsState {
  switch (action.type) {
    // Add revisions under the specified keyword
    case "set":
      return {
        ...state,
        revisions: {
          ...state.revisions,
          [action.key]: action.revisions,
        },
      };
    // Add the quill instance to global state
    case "quill":
      return {
        ...state,
        quill: action.quill,
      };
    // Format the revision and mark as accepted. Remove from list.
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
    // Set whether a daemon is enabled
    case "setEnabled":
      return {
        ...state,
        enabled: {
          ...state.enabled,
          [action.key]: action.value,
        },
      };
    // Trigger an update
    case "update":
      if (!state.isLoading) {
        update(state, action.dispatch);
        return {
          ...state,
          isLoading: true,
        };
      } else return state;
    // Turn off loading state
    case "finished":
      return {
        ...state,
        revisionAccepted: false,
        isLoading: false,
      };
    // Update the API key
    case "updateKey":
      return {
        ...state,
        apiKey: action.apiKey,
      };
    // Update the selected tone
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
  // converts reducer to tracked state and dispatch function to trigger actions
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
