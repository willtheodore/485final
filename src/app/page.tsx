"use client";

import * as React from "react";
import ReactQuill from "react-quill";
// @ts-expect-error
import Toggle from "react-toggle";
import "react-quill/dist/quill.snow.css";
import "react-toggle/style.css";
import { acceptRevision, getRephrases, update } from "@/util";
import Quill from "quill";
import Revisions from "@/revisions";
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
    selectedTone?: string;
    apiKey: string;
    isLoading: boolean;
    quill?: Quill;
};


export type SelectToneAction = {
    type: "selectTone";
    tone: string;
}
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
            }
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
                <div className="w-full py-2 px-2 text-sm border">
                    <p>
                        We will never store your GPT API key. All requests are sent from the
                        client. Please ensure you have a secure connection before
                        proceeding.
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

type EditorProps = {
    placeholder: string;
    [K: string]: any;
};

type EditorState = {
    editorHtml: string;
    quillRef: React.RefObject<ReactQuill>;
    desiredTone: string;
};

class Editor extends React.Component<EditorProps, EditorState> {
    constructor(props: EditorProps) {
        super(props);
        this.state = { editorHtml: "", quillRef: React.createRef(), desiredTone: "" }; // Modify this line
        this.handleChange = this.handleChange.bind(this);
        this.handleToneChange = this.handleToneChange.bind(this);
    }

    handleChange(html: string) {
        this.setState({ editorHtml: html });
        this.props.dispatch({
            type: "quill",
            quill: this.state.quillRef.current?.editor,
        });
    }

    handleToneChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ desiredTone: e.target.value });
    }

    render() {
        return (
            <div className="text-editor">
                <Toolbar />
                <ReactQuill
                    ref={this.state.quillRef}
                    onChange={this.handleChange}
                    placeholder={this.props.placeholder}
                    modules={{
                        toolbar: {
                            container: "#toolbar",
                            handlers: {},
                        },
                    }}
                />
            </div>
        );
    }
}

function Toolbar() {
    const { state: { isLoading, apiKey, enabled, selectedTone }, dispatch } =
        React.useContext(RevisionsContext) ??
        {
            state: {
                apiKey: "",
                isLoading: false,
                enabled: {
                    rephrase: true,
                    factCheck: true,
                    tone: true,
                },
            },
            dispatch: null,
        };

    return (
        <div id="toolbar" className="!flex !items-center gap-3">
            <label className="flex flex-col gap-1 items-center">
                <p>Rephrase</p>
                <Toggle
                    defaultChecked={enabled.rephrase}
                    icons={false}
                    onChange={() => {
                        if (dispatch) {
                            dispatch({
                                type: "setEnabled",
                                key: "rephrase",
                                value: !enabled.rephrase,
                            });
                        }
                    }}
                />
            </label>

            <label className="flex flex-col gap-1 items-center">
                <p>FactCheck</p>
                <Toggle
                    defaultChecked={enabled.factCheck}
                    icons={false}
                    onChange={() => {
                        if (dispatch) {
                            dispatch({
                                type: "setEnabled",
                                key: "factCheck",
                                value: !enabled.factCheck,
                            });
                        }
                    }}
                />
            </label>

            <label className="flex flex-col gap-1 items-center">
                <p>Tone</p>
                <Toggle
                    defaultChecked={enabled.tone}
                    onChange={() => {
                        if (dispatch) {
                            dispatch({
                                type: "setEnabled",
                                key: "tone",
                                value: !enabled.tone,
                            });
                        }
                    }}
                    icons={false}
                />
            </label>

            <label>
                <input
                    type="text"
                    className="!w-[400px] !h-full !py-2 !px-3 !m-0 border border-black"
                    placeholder="Tone"
                    hidden={!enabled.tone}
                    value={selectedTone}
                    onChange={(e) => {
                        if (dispatch) {
                            dispatch({
                                type: "selectTone",
                                tone: e.target.value,
                            });
                        }
                    }}
                />
            </label>

            <button
                id="update"
                className="ql-update !w-[auto] !h-full !py-1 !px-0 !m-0"
                onClick={() => {
                    if (dispatch) {
                        dispatch({
                            type: "update",
                            dispatch,
                        });
                    }
                }}
            >
                <div className="px-2 py-1 rounded bg-teal-500 font-bold">
                    {isLoading ? "LOADING..." : "UPDATE"}
                </div>
            </button>

            <label>
                <input
                    type="text"
                    className="!w-[400px] !h-full !py-2 !px-3 !m-0 border border-black"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => {
                        if (dispatch) {
                            dispatch({
                                type: "updateKey",
                                apiKey: e.target.value,
                            });
                        }
                    }}
                />
            </label>
        </div>
    );
}

/*
 * Quill editor formats
 * See http://quilljs.com/docs/formats/
 */
(Editor as any).formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "color",
];