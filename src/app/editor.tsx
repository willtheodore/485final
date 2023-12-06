"use client";

import * as React from "react";
import ReactQuill from "react-quill";
// @ts-expect-error No declaration file
import Toggle from "react-toggle";
import "react-quill/dist/quill.snow.css";
import "react-toggle/style.css";
import RevisionsContext from "@/context";

type EditorProps = {
  placeholder: string;
  [K: string]: any;
};

type EditorState = {
  editorHtml: string;
  quillRef: React.RefObject<ReactQuill>;
};

export default class Editor extends React.Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props);
    this.state = {
      editorHtml: "",
      quillRef: React.createRef(),
    }; // Modify this line
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(html: string) {
    this.setState({ editorHtml: html });
    this.props.dispatch({
      type: "quill",
      quill: this.state.quillRef.current?.editor,
    });
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
  const {
    state: { isLoading, apiKey, enabled, selectedTone },
    dispatch,
  } = React.useContext(RevisionsContext) ?? {
    state: {
      apiKey: "",
      isLoading: false,
      selectedTone: "",
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
      <label className="flex flex-col items-center gap-1">
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

      <label className="flex flex-col items-center gap-1">
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

      <label className="flex flex-col items-center gap-1">
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
          className="!m-0 !h-full !w-[400px] border border-black !px-3 !py-2"
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
        className="ql-update !m-0 !h-full !w-[auto] !px-0 !py-1"
        onClick={() => {
          if (dispatch) {
            dispatch({
              type: "update",
              dispatch,
            });
          }
        }}
      >
        <div className="rounded bg-teal-500 px-2 py-1 font-bold">
          {isLoading ? "LOADING..." : "UPDATE"}
        </div>
      </button>

      <label>
        <input
          type="password"
          className="!m-0 !h-full !w-[400px] border border-black !px-3 !py-2"
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
