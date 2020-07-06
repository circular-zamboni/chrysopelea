import {
  expandRecordPickerAsync,
  initializeBlock,
  useBase,
  useGlobalConfig,
  useLoadable,
  useRecords,
  useSettingsButton,
  useWatchable,
  Button,
  Box,
  ConfirmationDialog,
  Dialog,
  FieldPickerSynced,
  FormField,
  Heading,
  Loader,
  ProgressBar,
  TablePickerSynced,
  Text,
  Tooltip,
  Switch,
  ViewPickerSynced
} from '@airtable/blocks/ui';
import {Controlled as CodeMirror} from 'react-codemirror2';
import 'codemirror/mode/python/python';
import {loadCSSFromString} from '@airtable/blocks/ui';
import React, {useEffect, useState, useReducer} from 'react';

const AIRTABLE_RECORDS_BATCH_SIZE = 50;

// This is way ugly, not sure the real way to do pull in this CSS within the airtable blocks build system.
const codeMirrorCss = `/* BASICS */

.CodeMirror {
  /* Set height, width, borders, and global font properties here */
  font-family: monospace;
  /* height: 300px; */
  height: auto;
  color: black;
  direction: ltr;
}

/* PADDING */

.CodeMirror-lines {
  padding: 4px 0; /* Vertical padding around content */
}
.CodeMirror pre.CodeMirror-line,
.CodeMirror pre.CodeMirror-line-like {
  padding: 0 4px; /* Horizontal padding of content */
}

.CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {
  background-color: white; /* The little square between H and V scrollbars */
}

/* GUTTER */

.CodeMirror-gutters {
  border-right: 1px solid #ddd;
  background-color: #f7f7f7;
  white-space: nowrap;
}
.CodeMirror-linenumbers {}
.CodeMirror-linenumber {
  padding: 0 3px 0 5px;
  min-width: 20px;
  text-align: right;
  color: #999;
  white-space: nowrap;
}

.CodeMirror-guttermarker { color: black; }
.CodeMirror-guttermarker-subtle { color: #999; }

/* CURSOR */

.CodeMirror-cursor {
  border-left: 1px solid black;
  border-right: none;
  width: 0;
}
/* Shown when moving in bi-directional text */
.CodeMirror div.CodeMirror-secondarycursor {
  border-left: 1px solid silver;
}
.cm-fat-cursor .CodeMirror-cursor {
  width: auto;
  border: 0 !important;
  background: #7e7;
}
.cm-fat-cursor div.CodeMirror-cursors {
  z-index: 1;
}
.cm-fat-cursor-mark {
  background-color: rgba(20, 255, 20, 0.5);
  -webkit-animation: blink 1.06s steps(1) infinite;
  -moz-animation: blink 1.06s steps(1) infinite;
  animation: blink 1.06s steps(1) infinite;
}
.cm-animate-fat-cursor {
  width: auto;
  border: 0;
  -webkit-animation: blink 1.06s steps(1) infinite;
  -moz-animation: blink 1.06s steps(1) infinite;
  animation: blink 1.06s steps(1) infinite;
  background-color: #7e7;
}
@-moz-keyframes blink {
  0% {}
  50% { background-color: transparent; }
  100% {}
}
@-webkit-keyframes blink {
  0% {}
  50% { background-color: transparent; }
  100% {}
}
@keyframes blink {
  0% {}
  50% { background-color: transparent; }
  100% {}
}

/* Can style cursor different in overwrite (non-insert) mode */
.CodeMirror-overwrite .CodeMirror-cursor {}

.cm-tab { display: inline-block; text-decoration: inherit; }

.CodeMirror-rulers {
  position: absolute;
  left: 0; right: 0; top: -50px; bottom: 0;
  overflow: hidden;
}
.CodeMirror-ruler {
  border-left: 1px solid #ccc;
  top: 0; bottom: 0;
  position: absolute;
}

/* DEFAULT THEME */

.cm-s-default .cm-header {color: blue;}
.cm-s-default .cm-quote {color: #090;}
.cm-negative {color: #d44;}
.cm-positive {color: #292;}
.cm-header, .cm-strong {font-weight: bold;}
.cm-em {font-style: italic;}
.cm-link {text-decoration: underline;}
.cm-strikethrough {text-decoration: line-through;}

.cm-s-default .cm-keyword {color: #708;}
.cm-s-default .cm-atom {color: #219;}
.cm-s-default .cm-number {color: #164;}
.cm-s-default .cm-def {color: #00f;}
.cm-s-default .cm-variable,
.cm-s-default .cm-punctuation,
.cm-s-default .cm-property,
.cm-s-default .cm-operator {}
.cm-s-default .cm-variable-2 {color: #05a;}
.cm-s-default .cm-variable-3, .cm-s-default .cm-type {color: #085;}
.cm-s-default .cm-comment {color: #a50;}
.cm-s-default .cm-string {color: #a11;}
.cm-s-default .cm-string-2 {color: #f50;}
.cm-s-default .cm-meta {color: #555;}
.cm-s-default .cm-qualifier {color: #555;}
.cm-s-default .cm-builtin {color: #30a;}
.cm-s-default .cm-bracket {color: #997;}
.cm-s-default .cm-tag {color: #170;}
.cm-s-default .cm-attribute {color: #00c;}
.cm-s-default .cm-hr {color: #999;}
.cm-s-default .cm-link {color: #00c;}

.cm-s-default .cm-error {color: #f00;}
.cm-invalidchar {color: #f00;}

.CodeMirror-composing { border-bottom: 2px solid; }

/* Default styles for common addons */

div.CodeMirror span.CodeMirror-matchingbracket {color: #0b0;}
div.CodeMirror span.CodeMirror-nonmatchingbracket {color: #a22;}
.CodeMirror-matchingtag { background: rgba(255, 150, 0, .3); }
.CodeMirror-activeline-background {background: #e8f2ff;}

/* STOP */

/* The rest of this file contains styles related to the mechanics of
   the editor. You probably shouldn't touch them. */

.CodeMirror {
  position: relative;
  overflow: hidden;
  background: white;
}

.CodeMirror-scroll {
  overflow: scroll !important; /* Things will break if this is overridden */
  /* 30px is the magic margin used to hide the element's real scrollbars */
  /* See overflow: hidden in .CodeMirror */
  margin-bottom: -30px; margin-right: -30px;
  padding-bottom: 30px;
  height: 100%;
  outline: none; /* Prevent dragging from highlighting the element */
  position: relative;
  /* overflow-y: hidden; */
  overflow-x: auto;
}
.CodeMirror-sizer {
  position: relative;
  border-right: 30px solid transparent;
}

/* The fake, visible scrollbars. Used to force redraw during scrolling
   before actual scrolling happens, thus preventing shaking and
   flickering artifacts. */
.CodeMirror-vscrollbar, .CodeMirror-hscrollbar, .CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {
  position: absolute;
  z-index: 6;
  display: none;
}
.CodeMirror-vscrollbar {
  right: 0; top: 0;
  overflow-x: hidden;
  overflow-y: scroll;
}
.CodeMirror-hscrollbar {
  bottom: 0; left: 0;
  overflow-y: hidden;
  overflow-x: scroll;
}
.CodeMirror-scrollbar-filler {
  right: 0; bottom: 0;
}
.CodeMirror-gutter-filler {
  left: 0; bottom: 0;
}

.CodeMirror-gutters {
  position: absolute; left: 0; top: 0;
  min-height: 100%;
  z-index: 3;
}
.CodeMirror-gutter {
  white-space: normal;
  height: 100%;
  display: inline-block;
  vertical-align: top;
  margin-bottom: -30px;
}
.CodeMirror-gutter-wrapper {
  position: absolute;
  z-index: 4;
  background: none !important;
  border: none !important;
}
.CodeMirror-gutter-background {
  position: absolute;
  top: 0; bottom: 0;
  z-index: 4;
}
.CodeMirror-gutter-elt {
  position: absolute;
  cursor: default;
  z-index: 4;
}
.CodeMirror-gutter-wrapper ::selection { background-color: transparent }
.CodeMirror-gutter-wrapper ::-moz-selection { background-color: transparent }

.CodeMirror-lines {
  cursor: text;
  min-height: 1px; /* prevents collapsing before first draw */
}
.CodeMirror pre.CodeMirror-line,
.CodeMirror pre.CodeMirror-line-like {
  /* Reset some styles that the rest of the page might have set */
  -moz-border-radius: 0; -webkit-border-radius: 0; border-radius: 0;
  border-width: 0;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  margin: 0;
  white-space: pre;
  word-wrap: normal;
  line-height: inherit;
  color: inherit;
  z-index: 2;
  position: relative;
  overflow: visible;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-variant-ligatures: contextual;
  font-variant-ligatures: contextual;
}
.CodeMirror-wrap pre.CodeMirror-line,
.CodeMirror-wrap pre.CodeMirror-line-like {
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: normal;
}

.CodeMirror-linebackground {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  z-index: 0;
}

.CodeMirror-linewidget {
  position: relative;
  z-index: 2;
  padding: 0.1px; /* Force widget margins to stay inside of the container */
}

.CodeMirror-widget {}

.CodeMirror-rtl pre { direction: rtl; }

.CodeMirror-code {
  outline: none;
}

/* Force content-box sizing for the elements where we expect it */
.CodeMirror-scroll,
.CodeMirror-sizer,
.CodeMirror-gutter,
.CodeMirror-gutters,
.CodeMirror-linenumber {
  -moz-box-sizing: content-box;
  box-sizing: content-box;
}

.CodeMirror-measure {
  position: absolute;
  width: 100%;
  height: 0;
  overflow: hidden;
  visibility: hidden;
}

.CodeMirror-cursor {
  position: absolute;
  pointer-events: none;
}
.CodeMirror-measure pre { position: static; }

div.CodeMirror-cursors {
  visibility: hidden;
  position: relative;
  z-index: 3;
}
div.CodeMirror-dragcursors {
  visibility: visible;
}

.CodeMirror-focused div.CodeMirror-cursors {
  visibility: visible;
}

.CodeMirror-selected { background: #d9d9d9; }
.CodeMirror-focused .CodeMirror-selected { background: #d7d4f0; }
.CodeMirror-crosshair { cursor: crosshair; }
.CodeMirror-line::selection, .CodeMirror-line > span::selection, .CodeMirror-line > span > span::selection { background: #d7d4f0; }
.CodeMirror-line::-moz-selection, .CodeMirror-line > span::-moz-selection, .CodeMirror-line > span > span::-moz-selection { background: #d7d4f0; }

.cm-searching {
  background-color: #ffa;
  background-color: rgba(255, 255, 0, .4);
}

/* Used to force a border model for a node */
.cm-force-border { padding-right: .1px; }

@media print {
  /* Hide the cursor when printing */
  .CodeMirror div.CodeMirror-cursors {
    visibility: hidden;
  }
}

/* See issue #2901 */
.cm-tab-wrap-hack:after { content: ''; }

/* Help users use markselection to safely style text background */
span.CodeMirror-selectedtext { background: none; }
`;

const codeMirrorMonokaiTheme = `/* Based on Sublime Text's Monokai theme */

.cm-s-monokai.CodeMirror { background: #272822; color: #f8f8f2; }
.cm-s-monokai div.CodeMirror-selected { background: #49483E; }
.cm-s-monokai .CodeMirror-line::selection, .cm-s-monokai .CodeMirror-line > span::selection, .cm-s-monokai .CodeMirror-line > span > span::selection { background: rgba(73, 72, 62, .99); }
.cm-s-monokai .CodeMirror-line::-moz-selection, .cm-s-monokai .CodeMirror-line > span::-moz-selection, .cm-s-monokai .CodeMirror-line > span > span::-moz-selection { background: rgba(73, 72, 62, .99); }
.cm-s-monokai .CodeMirror-gutters { background: #272822; border-right: 0px; }
.cm-s-monokai .CodeMirror-guttermarker { color: white; }
.cm-s-monokai .CodeMirror-guttermarker-subtle { color: #d0d0d0; }
.cm-s-monokai .CodeMirror-linenumber { color: #d0d0d0; }
.cm-s-monokai .CodeMirror-cursor { border-left: 1px solid #f8f8f0; }

.cm-s-monokai span.cm-comment { color: #75715e; }
.cm-s-monokai span.cm-atom { color: #ae81ff; }
.cm-s-monokai span.cm-number { color: #ae81ff; }

.cm-s-monokai span.cm-comment.cm-attribute { color: #97b757; }
.cm-s-monokai span.cm-comment.cm-def { color: #bc9262; }
.cm-s-monokai span.cm-comment.cm-tag { color: #bc6283; }
.cm-s-monokai span.cm-comment.cm-type { color: #5998a6; }

.cm-s-monokai span.cm-property, .cm-s-monokai span.cm-attribute { color: #a6e22e; }
.cm-s-monokai span.cm-keyword { color: #f92672; }
.cm-s-monokai span.cm-builtin { color: #66d9ef; }
.cm-s-monokai span.cm-string { color: #e6db74; }

.cm-s-monokai span.cm-variable { color: #f8f8f2; }
.cm-s-monokai span.cm-variable-2 { color: #9effff; }
.cm-s-monokai span.cm-variable-3, .cm-s-monokai span.cm-type { color: #66d9ef; }
.cm-s-monokai span.cm-def { color: #fd971f; }
.cm-s-monokai span.cm-bracket { color: #f8f8f2; }
.cm-s-monokai span.cm-tag { color: #f92672; }
.cm-s-monokai span.cm-header { color: #ae81ff; }
.cm-s-monokai span.cm-link { color: #ae81ff; }
.cm-s-monokai span.cm-error { background: #f92672; color: #f8f8f0; }

.cm-s-monokai .CodeMirror-activeline-background { background: #373831; }
.cm-s-monokai .CodeMirror-matchingbracket {
  text-decoration: underline;
  color: white !important;
}
`;

loadCSSFromString(codeMirrorCss);
loadCSSFromString(codeMirrorMonokaiTheme);

function initializePython(onStatusChanged, onInitializeComplete) {
  try {
    console.log('Loading language.');
    onStatusChanged('Loading language.');
    languagePluginLoader
    .then( () => {
      console.log('Language loaded.');
      onStatusChanged('Language loaded.');

      var pythonVersion = pyodide.runPython('import sys\nsys.version');
      console.log(`Python version: [${pythonVersion}]`);

      console.log('Loading libraries.');
      onStatusChanged('Loading libraries.');

      pyodide.loadPackage(['numpy', 'matplotlib'])
      .then( () => {
        var s = pyodide.runPython(
          'import numpy as np\n' +
          'a = [1, 2]\n' +
          'np.average(a)\n'
        );
        console.log(`Test script output, should be [1.5]: [${s}]`);

        console.log('Language and libraries loaded successfully');
        onStatusChanged('Language and libraries loaded successfully');
        onInitializeComplete();
      });

    });

  } catch (e) {
    console.log(`error: ${e}`);
    onStatusChanged(`error: ${e}`);
  }
}

function ChrysopeleaBlock() {

  const [isShowingSettings, setIsShowingSettings] = useState(false);

  useSettingsButton(function() {
    setIsShowingSettings(!isShowingSettings);
  });

  if (isShowingSettings) {
    return <SettingsComponent/>
  }

  return <Chrysopelea
            setIsShowingSettings={setIsShowingSettings}
  />
}

function SettingsComponent() {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const isBlockControlsEnabled = getConfigPathElse(globalConfig, "isBlockControlsEnabled", true);

  const isScriptInputVariablesEnabled = getConfigPathElse(globalConfig, "isScriptInputVariablesEnabled", true);

  const isScriptOutputVariablesEnabled = getConfigPathElse(globalConfig, "isScriptOutputVariablesEnabled", false);

  const scriptInputVariableNamesTableId
    = globalConfig.get("scriptInputVariableNamesTableId");

  const scriptInputVariableNamesViewId
    = globalConfig.get("scriptInputVariableNamesViewId");

  const scriptInputVariableNamesFieldId
    = globalConfig.get("scriptInputVariableNamesFieldId");

  const scriptOutputVariableNamesTableId
    = globalConfig.get("scriptOutputVariableNamesTableId");

  const scriptOutputVariableNamesViewId
    = globalConfig.get("scriptOutputVariableNamesViewId");

  const scriptOutputVariableNamesFieldId
    = globalConfig.get("scriptOutputVariableNamesFieldId");

  const scriptSourceCodeTableId
    = globalConfig.get("scriptSourceCodeTableId");

  const scriptInputVariableNamesTable
    = base.getTableByIdIfExists(scriptInputVariableNamesTableId);

  const scriptOutputVariableNamesTable
    = base.getTableByIdIfExists(scriptOutputVariableNamesTableId);

  const scriptInputVariableNamesView
    = scriptInputVariableNamesTable
      ? scriptInputVariableNamesTable.getViewByIdIfExists(scriptInputVariableNamesViewId)
      : null;

  const scriptInputVariableNamesField
    = scriptInputVariableNamesTable
      ? scriptInputVariableNamesTable.getFieldByIdIfExists(scriptInputVariableNamesFieldId)
      : null;

  const scriptOutputVariableNamesView
    = scriptOutputVariableNamesTable
      ? scriptOutputVariableNamesTable.getViewByIdIfExists(scriptOutputVariableNamesViewId)
      : null;

  const scriptOutputVariableNamesField
    = scriptOutputVariableNamesTable
      ? scriptOutputVariableNamesTable.getFieldByIdIfExists(scriptOutputVariableNamesFieldId)
      : null;

  const scriptSourceCodeTable
    = base.getTableByIdIfExists(scriptSourceCodeTableId);

  const scriptInputVariableRecords = useRecords(scriptInputVariableNamesView);

  const scriptOutputVariableRecords = useRecords(scriptOutputVariableNamesView);

  const [isScriptOutputVariablesWarningDialogOpen, setScriptOutputVariablesWarningDialogOpen] = useState(false);

  return (
  <Box
  display="flex"
  flexDirection="column"
  padding={2}
  border="none"
  >
    <FormField
      label="Configure Display"
    >
      <Box
        display="flex"
        flexDirection="column"
        padding={2}
        border="thick"
        backgroundColor="lightGray1"
      >
        <Tooltip
          content="This is referring to the controls at the top of the block when you are not in settings mode."
          placementX={Tooltip.placements.CENTER}
          placementY={Tooltip.placements.BOTTOM}
        >
          <Switch
            value={isBlockControlsEnabled}
            onChange={newValue => globalConfig.setAsync('isBlockControlsEnabled', newValue)}
            label="Show Block Controls"
          />
        </Tooltip>
      </Box>
    </FormField>

    <FormField
      label="Configure Script Storage"
      description="Tell this block where to get your python script(s) from."
    >
      <Box
        display="flex"
        flexDirection="row"
        padding={2}
        border="thick"
      >
        <FormField
          label="Script Source Code Table"
        >
          <Tooltip
            content="The table that contains your python script(s)."
            placementX={Tooltip.placements.CENTER}
            placementY={Tooltip.placements.BOTTOM}
          >
            <TablePickerSynced
              globalConfigKey="scriptSourceCodeTableId"
            />
          </Tooltip>
        </FormField>
        { scriptSourceCodeTable && (
          <FormField
            label="Script Source Code Field"
          >
            <Tooltip
              content="The field that contains your python script(s)."
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
            >
              <FieldPickerSynced
                table={scriptSourceCodeTable}
                globalConfigKey="scriptSourceCodeFieldId"
              />
            </Tooltip>
          </FormField>
        )}
      </Box>
    </FormField>

    <FormField
      label="Airtable Data Inputs"
    >
      <Tooltip
        content="Enable this if you want to bring data from Airtable into your script."
        placementX={Tooltip.placements.CENTER}
        placementY={Tooltip.placements.BOTTOM}
      >
        <Switch
          value={isScriptInputVariablesEnabled}
          onChange={newValue => globalConfig.setAsync('isScriptInputVariablesEnabled', newValue)}
          label="Enable Script Input Variables"
        />
      </Tooltip>

    </FormField>

    <Box
      display={isScriptInputVariablesEnabled ? "flex" : "none"}
      flexDirection="column"
      padding={2}
      border="thick"
    >
      <FormField
        label="Configure Script Input Variable Names"
        description="Tell this block what are all the python script variables that you want to define and populate with Airtable data."
      >
        <Box
          display="flex"
          flexDirection="column"
          padding={2}
          border="thick"
          backgroundColor="lightGray1"
        >
          <FormField
            label="Script Input Variable Names List Table"
          >
            <Tooltip
              content="The table that contains your list of script input variable names."
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
            >
              <TablePickerSynced
                globalConfigKey="scriptInputVariableNamesTableId" />
            </Tooltip>
          </FormField>
          { scriptInputVariableNamesTable && (
          <FormField
            label="Script Input Variable Names List View"
          >
            <Tooltip
              content="The view that contains your list of script input variable names."
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
            >
              <ViewPickerSynced
                table={scriptInputVariableNamesTable}
                globalConfigKey="scriptInputVariableNamesViewId" />
            </Tooltip>
          </FormField>
          )}
          { scriptInputVariableNamesTable && (
          <FormField
            label="Script Input Variable Names List Field"
          >
            <Tooltip
              content="The field that defines your script input variable names."
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
            >
              <FieldPickerSynced
                table={scriptInputVariableNamesTable}
                globalConfigKey="scriptInputVariableNamesFieldId" />
            </Tooltip>
          </FormField>
          )}
        </Box>
      </FormField>

      {scriptInputVariableRecords && scriptInputVariableNamesField && (
        <FormField
          label="Configure Script Input Variable Data"
          description="For each of the script input variables that you've defined, tell this block what Airtable table/view to read from to populate the variable."
        >
          <Box
            display="flex"
            flexDirection="column"
            padding={2}
            border="thick"
            backgroundColor="lightGray1"
          >
            {scriptInputVariableRecords
              .filter(scriptInputVariableRecord =>
                scriptInputVariableRecord.getCellValueAsString(scriptInputVariableNamesField) != '')
              .map(scriptInputVariableRecord => {
              return <ConfigureScriptVariable
                scriptVariableRecord={scriptInputVariableRecord}
                scriptVariableNamesField={scriptInputVariableNamesField}
                tablePickerGlobalConfigKeyPath="scriptInputVariableDataTableId"
                viewPickerGlobalConfigKeyPath="scriptInputVariableDataViewId"
                tablePickerTooltipText="The table containing the data you want to use to populate this script variable."
                viewPickerTooltipText="The view containing the data you want to use to populate this script variable."
              />;
            })}
          </Box>
        </FormField>
      )}
    </Box>


    <FormField
      label="Airtable Data Outputs"
    >
      <Tooltip
        content="Enable this if you want to write data from your script back out to Airtable."
        placementX={Tooltip.placements.CENTER}
        placementY={Tooltip.placements.BOTTOM}
      >
        <Switch
          value={isScriptOutputVariablesEnabled}
          onChange={newValue => {
            globalConfig.setAsync('isScriptOutputVariablesEnabled', newValue)
            setScriptOutputVariablesWarningDialogOpen(newValue);
          }}
          label="Enable Script Output Variables"
        />
      </Tooltip>
      {isScriptOutputVariablesWarningDialogOpen && (
        <ConfirmationDialog
          isConfirmActionDangerous={true}
          title="Script Output Variables Will Delete and Replace Data"
          body="When you run a script with output variables, the execution of your script will delete and replace data in the tables that you have configured the script output variables to write to. Use Airtable snapshots, and proceed carefully!"
          onConfirm={ () => {
            setScriptOutputVariablesWarningDialogOpen(false);
          }}
          onCancel={ () => {
            globalConfig.setAsync('isScriptOutputVariablesEnabled', false)
            setScriptOutputVariablesWarningDialogOpen(false);
          }}
        />
      )}

    </FormField>

    <Box
      display={isScriptOutputVariablesEnabled ? "flex" : "none"}
      flexDirection="column"
      padding={2}
      border="thick"
    >
      <FormField
        label="Configure Script Output Variable Names"
        description="Tell this block what are all the python script variables that you want to use to create data within your script that will be written back out to Airtable."
      >
        <Box
          display="flex"
          flexDirection="column"
          padding={2}
          border="thick"
          backgroundColor="lightGray1"
        >
          <FormField
            label="Script Output Variable Names List Table"
          >
            <Tooltip
              content="The table that contains your list of script output variable names."
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
            >
              <TablePickerSynced
                globalConfigKey="scriptOutputVariableNamesTableId" />
            </Tooltip>
          </FormField>
          { scriptOutputVariableNamesTable && (
          <FormField
            label="Script Output Variable Names List View"
          >
            <Tooltip
              content="The view that contains your list of script output variable names."
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
            >
              <ViewPickerSynced
                table={scriptOutputVariableNamesTable}
                globalConfigKey="scriptOutputVariableNamesViewId" />
            </Tooltip>
          </FormField>
          )}
          { scriptOutputVariableNamesTable && (
          <FormField
            label="Script Output Variable Names List Field"
          >
            <Tooltip
              content="The field that defines your script output variable names."
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
            >
              <FieldPickerSynced
                table={scriptOutputVariableNamesTable}
                globalConfigKey="scriptOutputVariableNamesFieldId" />
            </Tooltip>
          </FormField>
          )}
        </Box>
      </FormField>

      {scriptOutputVariableRecords && scriptOutputVariableNamesField && (
        <FormField
          label="Configure Script Output Variable Data"
          description="For each of the script output variables that you've defined, tell this block what table to write the data out to after the script executes."
        >
          <Box
            display="flex"
            flexDirection="column"
            padding={2}
            border="thick"
            backgroundColor="lightGray1"
          >
            {scriptOutputVariableRecords
              .filter(scriptOutputVariableRecord =>
                scriptOutputVariableRecord.getCellValueAsString(scriptOutputVariableNamesField) != '')
              .map(scriptOutputVariableRecord => {
              return <ConfigureScriptVariable
                scriptVariableRecord={scriptOutputVariableRecord}
                scriptVariableNamesField={scriptOutputVariableNamesField}
                tablePickerGlobalConfigKeyPath="scriptOutputVariableDataTableId"
                // TODO: remove view selection for output variable data
                viewPickerGlobalConfigKeyPath="scriptOutputVariableDataViewId"
                tablePickerTooltipText="The table to write the variable data out to after the script executes."
                // TODO: remove view selection for output variable data
                viewPickerTooltipText="TODO remove view selection for output variables."
              />;
            })}
          </Box>
        </FormField>
      )}
    </Box>


  </Box>
  );
}

function ConfigureScriptVariable({scriptVariableRecord,
                                  scriptVariableNamesField,
                                  tablePickerGlobalConfigKeyPath,
                                  viewPickerGlobalConfigKeyPath,
                                  tablePickerTooltipText,
                                  viewPickerTooltipText}) {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const scriptVariableName
    = scriptVariableRecord.getCellValueAsString(scriptVariableNamesField);

  const scriptVariableDataTableId
    = globalConfig.get([tablePickerGlobalConfigKeyPath, scriptVariableName]);

  const scriptVariableDataTable
    = base.getTableByIdIfExists(scriptVariableDataTableId);

  return (
    <FormField
      label={`Script Variable: ${scriptVariableName}`}
    >
      <Box
        display="flex"
        flexDirection="row"
        padding={2}
        border="thick"
      >
        <FormField
          label="Data Table"
        >
          <Tooltip
            content={tablePickerTooltipText}
            placementX={Tooltip.placements.CENTER}
            placementY={Tooltip.placements.BOTTOM}
          >
            <TablePickerSynced
              globalConfigKey={[tablePickerGlobalConfigKeyPath, scriptVariableName]}
            />
          </Tooltip>
        </FormField>
        { scriptVariableDataTable && (
          <FormField
            label="Data View"
          >
            <Tooltip
              content={viewPickerTooltipText}
              placementX={Tooltip.placements.CENTER}
              placementY={Tooltip.placements.BOTTOM}
            >
              <ViewPickerSynced
                table={scriptVariableDataTable}
                globalConfigKey={[viewPickerGlobalConfigKeyPath, scriptVariableName]}
              />
            </Tooltip>
          </FormField>
        )}
      </Box>
    </FormField>
  )
}

function ThereAreNoScriptsDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <React.Fragment>
      {isDialogOpen && (
        <Dialog onClose={() => setIsDialogOpen(false)} width="320px">
          <Dialog.CloseButton />
          <Heading>Dialog</Heading>
          <Text variant="paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam neque
            dui, euismod ac quam eget, pretium cursus nisl.
          </Text>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
        </Dialog>
      )}
    </React.Fragment>
  );
};

function getConfigPathElse(globalConfig, configPath, elseValue) {
  if( globalConfig.get(configPath) !== undefined ) {
    return globalConfig.get(configPath);
  }
  return elseValue;
}

function Chrysopelea({setIsShowingSettings}) {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const [scriptResult, setScriptResult] = useState("Script has not run yet.");
  const [scriptError, setScriptError] = useState("Script has not run yet.");

  const [isPyodideInitialized, setIsPyodideInitialized] = useState(false);
  const [pythonStatusMsg, setPythonStatusMsg] = useState("Idle");
  const [isHelpMode, setIsHelpMode] = useState(false);

  const isShowScriptEnabled                   = getConfigPathElse(globalConfig, 'isShowScriptEnabled', true);
  const isShowDataInputsSummaryEnabled        = getConfigPathElse(globalConfig, 'isShowDataInputsSummaryEnabled', true);
  const isShowDataInputsSummaryFieldsEnabled  = getConfigPathElse(globalConfig, 'isShowDataInputsSummaryFieldsEnabled', false);
  const isShowDataOutputsSummaryEnabled       = getConfigPathElse(globalConfig, 'isShowDataOutputsSummaryEnabled', true);
  const isShowDataOutputsSummaryFieldsEnabled = getConfigPathElse(globalConfig, 'isShowDataOutputsSummaryFieldsEnabled', false);
  const isShowScriptResultsEnabled            = getConfigPathElse(globalConfig, 'isShowScriptResultsEnabled', true);
  const isShowScriptErrorsEnabled             = getConfigPathElse(globalConfig, 'isShowScriptErrorsEnabled', true);
  const isShowPlotsEnabled                    = getConfigPathElse(globalConfig, 'isShowPlotsEnabled', true);
  const isRunAutomaticallyWhenInputsUpdated   = getConfigPathElse(globalConfig, 'isRunAutomaticallyWhenInputsUpdated', false);
  const isBlockControlsEnabled                = getConfigPathElse(globalConfig, 'isBlockControlsEnabled', true);
  const isScriptInputVariablesEnabled         = getConfigPathElse(globalConfig, "isScriptInputVariablesEnabled", true);
  const isScriptOutputVariablesEnabled        = getConfigPathElse(globalConfig, "isScriptOutputVariablesEnabled", false);

  const [isThereAreNoScriptsDialogOpen, setThereAreNoScriptsDialogOpen] = useState(false);

  const [isUserCodeDirty, setIsUserCodeDirty] = useState(false);

  const [isScriptRunning, setScriptRunning] = useState(false);
  const [isOutputDataSaving, setIsOutputDataSaving] = useState(false);
  const [numOutputRecordsToDeleteAndSave, setNumOutputRecordsToDeleteAndSave] = useState(0);
  const [numOutputRecordsDeletedAndSaved, setNumOutputRecordsDeletedAndSaved] = useState(0);
  const [liveScriptNeedsRerun, setLiveScriptNeedsRerun] = useState(true);

  // plots =
  //      [
  //        {name: "name", png: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAA…hCIAAAACGIQACAAAY5v8Bl..."},
  //        ...
  //      ]
  const [plots, setPlots] = useState([]);

  // Loading script source code.
  const scriptSourceCodeTableId = globalConfig.get("scriptSourceCodeTableId");
  const scriptSourceCodeFieldId = globalConfig.get("scriptSourceCodeFieldId");
  const scriptSourceCodeTable = base.getTableByIdIfExists(scriptSourceCodeTableId);
  const scriptSourceCodeField =   scriptSourceCodeTable
                                ? scriptSourceCodeTable.getFieldByIdIfExists(scriptSourceCodeFieldId)
                                : null;
  const scriptSourceCodeQueryResult = scriptSourceCodeTable ? scriptSourceCodeTable.selectRecords() : null;
  const scriptSourceCodeRecordsForChoosing = useRecords(scriptSourceCodeQueryResult);
  const selectedScriptSourceRecordId = globalConfig.get("selectedScriptSourceRecordId");
  const selectedScriptSourceRecord =  (scriptSourceCodeQueryResult && selectedScriptSourceRecordId)
                                    ? scriptSourceCodeQueryResult.getRecordByIdIfExists(selectedScriptSourceRecordId)
                                    : null;
  const selectedScriptSourceValue =   selectedScriptSourceRecord
                                    ? selectedScriptSourceRecord.getCellValueAsString(scriptSourceCodeField)
                                    : "Use the 'Select Script' button to select one, or 'New Script' to create a new one.";
  const selectedScriptSourceName  =   selectedScriptSourceRecord
                                    ? selectedScriptSourceRecord.name
                                    : "None loaded";

  const [userCode, setUserCode] = useState(selectedScriptSourceValue !== undefined ? selectedScriptSourceValue : "");

  // Dictionary keyed on scriptOutputVariableNAme. Value is array of data for that variable, to be written
  // or already written by script.
  //
  // {
  //   outputScriptVariableName: {
  //        outputDataTableId: zzz, outputDataArray: [ {field1: val1, field2: val2, ...}, ... ]
  //   },
  //
  //   ...
  //
  // }
  const [outputData, setOutputData] = useState({});

  // Loading script input variable names.
  const scriptInputVariableNamesTableId = globalConfig.get("scriptInputVariableNamesTableId");
  const scriptInputVariableNamesViewId = globalConfig.get("scriptInputVariableNamesViewId");
  const scriptInputVariableNamesFieldId = globalConfig.get("scriptInputVariableNamesFieldId");

  const scriptInputVariableNamesTable = base.getTableByIdIfExists(scriptInputVariableNamesTableId);
  const scriptInputVariableNamesView =
      (scriptInputVariableNamesTable && (scriptInputVariableNamesViewId !== undefined))
    ? scriptInputVariableNamesTable.getViewByIdIfExists(scriptInputVariableNamesViewId)
    : null;
  const scriptInputVariableNamesQueryResult =
      scriptInputVariableNamesView
    ? scriptInputVariableNamesView.selectRecords()
    : null;

  // Loading script output variable names.
  const scriptOutputVariableNamesTableId = globalConfig.get("scriptOutputVariableNamesTableId");
  const scriptOutputVariableNamesViewId = globalConfig.get("scriptOutputVariableNamesViewId");
  const scriptOutputVariableNamesFieldId = globalConfig.get("scriptOutputVariableNamesFieldId");

  const scriptOutputVariableNamesTable = base.getTableByIdIfExists(scriptOutputVariableNamesTableId);
  const scriptOutputVariableNamesView =
      (scriptOutputVariableNamesTable && (scriptOutputVariableNamesViewId !== undefined))
    ? scriptOutputVariableNamesTable.getViewByIdIfExists(scriptOutputVariableNamesViewId)
    : null;
  const scriptOutputVariableNamesQueryResult =
      scriptOutputVariableNamesView
    ? scriptOutputVariableNamesView.selectRecords()
    : null;


  const scriptInputVariableNamesRecords = useRecords(scriptInputVariableNamesQueryResult);

  const scriptOutputVariableNamesRecords = useRecords(scriptOutputVariableNamesQueryResult);

  // Need this 'forceUpdate' because of the weird eventing going on around running the python
  // script. Some TLC probably needed around that.
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  // Dictionary keyed on scriptInputVariableName. Value is query result with data for that variable.
  var inputDataRecords = {};

  const handleRecordsUpdated = (models, keys) => {
    setLiveScriptNeedsRerun(true);
  }

  const handlePythonStatusChanged = (status) => {
    if (status != pythonStatusMsg) {
      setPythonStatusMsg(status);
    }
  }

  // Gets called after DOM is updated; we set it up to run just once.
  useEffect( () => {
      initializePython(
        // status changed
        (status) => {
          handlePythonStatusChanged(status);
        },
        // initialization complete
        () => {
          setIsPyodideInitialized(true);
        }
      );
      setUserCode(selectedScriptSourceValue);
    },
    // Only run 'effect' once, by passing empty array as 2nd argument.
    []
  );

  var requiredSettingsAreSet = checkRequiredSettingsAreSet();

  if( requiredSettingsAreSet ) {

    if( isScriptInputVariablesEnabled ) {
      scriptInputVariableNamesRecords.forEach(scriptInputVariableNameRecord => {

        var scriptInputVariableName = scriptInputVariableNameRecord.getCellValueAsString(scriptInputVariableNamesFieldId);

        if( scriptInputVariableName != "" ) {

          var dataTableId = globalConfig.get(["scriptInputVariableDataTableId", scriptInputVariableName]);
          var dataViewId = globalConfig.get(["scriptInputVariableDataViewId", scriptInputVariableName]);
          var dataTable =
              dataTableId !== undefined
            ? base.getTableByIdIfExists(dataTableId)
            : null;
          var dataView =
              dataTable !== null
            ? dataTable.getViewByIdIfExists(dataViewId)
            : null;

          const thisVariableDataQueryResult =
              dataView !== null
            ? dataView.selectRecords()
            : null;

          const thisVariableDataRecords =
            thisVariableDataQueryResult != null
          ? useRecordsWithUseWatchableCallback(thisVariableDataQueryResult, handleRecordsUpdated)
          : null;

          inputDataRecords[scriptInputVariableName] = thisVariableDataRecords;
        }
      });
    }

    if( isScriptOutputVariablesEnabled ) {
      // Create outputData keys if they don't already exist.
      scriptOutputVariableNamesRecords.forEach(scriptOutputVariableNamesRecord => {
        var scriptOutputVariableName = scriptOutputVariableNamesRecord.getCellValueAsString(scriptOutputVariableNamesFieldId);
        if ( !(scriptOutputVariableName in outputData)) {
          outputData[scriptOutputVariableName] = {};
          outputData[scriptOutputVariableName].outputDataTableId = globalConfig.get(["scriptOutputVariableDataTableId", scriptOutputVariableName]);
          outputData[scriptOutputVariableName].dataTable =  outputData[scriptOutputVariableName].outputDataTableId !== undefined
                                                          ? base.getTableByIdIfExists(outputData[scriptOutputVariableName].outputDataTableId)
                                                          : null;
          outputData[scriptOutputVariableName].outputDataArray = new Array();
          outputData[scriptOutputVariableName].numRecordsCreated = 0;
          outputData[scriptOutputVariableName].sanitizedToUnsanitizedFieldNames = {};
          if( outputData[scriptOutputVariableName].dataTable !== null ) {
            outputData[scriptOutputVariableName].dataTable.fields.map(field => {
              var sanitizedFieldName = getSanitizedScriptIdentifier(field.name);
              // TODO: check data table fields here for duplicate sanitized names
              outputData[scriptOutputVariableName].sanitizedToUnsanitizedFieldNames[sanitizedFieldName] = field.name;
            });
          }
        }
      });
    }
  }

  const handleSelectScriptSourceRecord = async () => {
    if( scriptSourceCodeRecordsForChoosing == null || scriptSourceCodeRecordsForChoosing.length == 0) {
      setThereAreNoScriptsDialogOpen(true);
      return;
    }
    const selectedScriptSourceRecord = await expandRecordPickerAsync(scriptSourceCodeRecordsForChoosing);
    if( selectedScriptSourceRecord !== null ) {
      globalConfig.setAsync("selectedScriptSourceRecordId", selectedScriptSourceRecord.id)
      .then(() => {
        setIsUserCodeDirty(false);
      });
    }
  };

  const handleUserCodeEdited = (value) => {
    setUserCode(value);
    setIsUserCodeDirty(true);
  }

  const handleSaveScript = () => {
    scriptSourceCodeTable.updateRecordsAsync(
      [{id: selectedScriptSourceRecord.id, fields: {[scriptSourceCodeFieldId]: userCode}}]
    )
    .then(() => {
      setIsUserCodeDirty(false);
    });
  }

  const handlePythonResult = (result) => {
      setScriptResult(result);
      setScriptError("No error.");
  };

  const handlePythonError = (error) => {
    setScriptResult("Error.");
    setScriptError(error);
  }

  const handlePlotsUpdated = (plots) => {
    // plots: [ (plotName,plotPng) ]
    var plotData = Object.entries(plots).map(entry => {
      var name = entry[0];
      var png  = entry[1];
      return {name: name, png: png};
    });
    setPlots(plotData);
  }

  const handleSavingOutputData = () => {
    setIsOutputDataSaving(true);
  }

  const handleDoneSavingOutputData = (outputData, chrysopeleaOutputs) => {
    setOutputData(outputData);
    setIsOutputDataSaving(false);
    forceUpdate();
  }


  const handleRunScript = (event) => {
    runPythonAsync(isUserCodeDirty ? userCode : selectedScriptSourceValue,
      inputDataRecords,
      outputData,
      handlePythonResult,
      handlePythonError,
      handlePlotsUpdated,
      () => {setScriptRunning(true)},
      () => {setScriptRunning(false)},
      handleSavingOutputData,
      handleDoneSavingOutputData,
      setNumOutputRecordsToDeleteAndSave,
      setNumOutputRecordsDeletedAndSaved
    );
  }

  if( isHelpMode ) {
    // return <Help/>
  }

  if( !requiredSettingsAreSet ) {
    setIsShowingSettings(true);
    return null;
  }

  return (
  <Box
    display="flex"
    flexDirection="column"
    padding={2}
    border="thick"
  >
    <Box
      display={isBlockControlsEnabled ? "flex" : "none"}
      flexDirection="row"
      padding={2}
      border="default"
      justifyContent="space-around"
    >
      <Switch
        flex="1"
        flexGrow="0"
        label="Show Script"
        value={isShowScriptEnabled}
        onChange={newValue => globalConfig.setAsync('isShowScriptEnabled', newValue)}
      />
      <Switch
        flex="1"
        flexGrow="0"
        label="Show Data Inputs Summary"
        value={isShowDataInputsSummaryEnabled}
        onChange={newValue => globalConfig.setAsync('isShowDataInputsSummaryEnabled', newValue)}
      />
      <Switch
        flex="1"
        flexGrow="0"
        label="Show Data Outputs Summary"
        value={isShowDataOutputsSummaryEnabled}
        onChange={newValue => globalConfig.setAsync('isShowDataOutputsSummaryEnabled', newValue)}
      />
      <Switch
        flex="1"
        flexGrow="0"
        label="Show Script Results"
        value={isShowScriptResultsEnabled}
        onChange={newValue => globalConfig.setAsync('isShowScriptResultsEnabled', newValue)}
      />
      <Switch
        flex="1"
        flexGrow="0"
        label="Show Script Errors"
        value={isShowScriptErrorsEnabled}
        onChange={newValue => globalConfig.setAsync('isShowScriptErrorsEnabled', newValue)}
      />
      <Switch
        flex="1"
        flexGrow="0"
        label="Show Plots"
        value={isShowPlotsEnabled}
        onChange={newValue => globalConfig.setAsync('isShowPlotsEnabled', newValue)}
      />
    </Box>

    <Box
      display={isBlockControlsEnabled ? "flex" : "none"}
      flexDirection="row"
      padding={2}
      border="default"
      justifyContent="space-around"
    >
      {isThereAreNoScriptsDialogOpen && (
        <Dialog onClose={() => setThereAreNoScriptsDialogOpen(false)} width="320px">
          <Dialog.CloseButton />
          <Heading>No Rows In Script Source Table</Heading>
          <Text variant="paragraph">
            Your script source code table '{scriptSourceCodeTable.name}' doesn't have any rows in it.
            Add at least one row with a script to get started.
            Go to the block settings if you need to point to a different table for your script source code.
          </Text>
          <Button onClick={() => setThereAreNoScriptsDialogOpen(false)}>Close</Button>
        </Dialog>
      )}
      <Button
        onClick={() => handleSelectScriptSourceRecord()}
        size="small"
        icon="search"
      >
      Select Script
      </Button>
      <Button
        onClick={() => handleNewScript()}
        size="small"
        icon="plus"
      >
      New Script
      </Button>
      <Button
        disabled={!isUserCodeDirty}
        onClick={() => handleSaveScript()}
        size="small"
        icon="up"
      >
      Save Script
      </Button>
      <Box
        flexDirection="column"
        padding={0}
      >
        <Button
          onClick={() => handleRunScript()}
          size="small"
          icon="play"
          disabled={!isPyodideInitialized}
        >
          Run Script
        </Button>
        <Text
          size="small"
          display={isPyodideInitialized ? "none" : "flex"}
        >
          Script engine loading...
        </Text>
      </Box>
      <Switch
        flex="1"
        flexGrow="0"
        label="Run Automatically When Inputs Are Updated"
        value={isRunAutomaticallyWhenInputsUpdated}
        onChange={newValue => setRunAutomaticallyWhenInputsUpdated(newValue)}
      />
      <Button
        onClick={() => handleHelp()}
        size="small"
        icon="help"
      >
      Help
      </Button>
    </Box>

    <Box
      display={isShowScriptEnabled ? "flex" : "none"}
      flexDirection="column"
      padding={2}
      border="default"
    >
      <Heading>Script</Heading>
      <CodeMirror
        value={isUserCodeDirty ? userCode : selectedScriptSourceValue}
        onBeforeChange={(editor, data, value) => {
          handleUserCodeEdited(value);
        }}
        onChange={(editor, data, value) => {
        }}
        options={{lineNumbers: true, mode: "python", theme: "monokai", viewportMargin: Infinity}}
      />
    </Box>

    <Box
      display={isShowDataInputsSummaryEnabled ? "flex" : "none"}
      flexDirection="column"
      padding={2}
      border="default"
    >
      <Heading>Data Inputs Summary</Heading>
      { isScriptInputVariablesEnabled
        ?
          <DataInputsSummary
            inputDataRecords={inputDataRecords}
            isShowDataInputsSummaryFieldsEnabled={isShowDataInputsSummaryFieldsEnabled}
            setShowDataInputsSummaryFieldsEnabled={(newValue) =>
              globalConfig.setAsync('isShowDataInputsSummaryFieldsEnabled', newValue)
            }
          />
        :
          <Text>Data Inputs Are Disabled In Settings</Text>
      }
    </Box>

    <Box
      display={isShowDataOutputsSummaryEnabled ? "flex" : "none"}
      flexDirection="column"
      padding={2}
      border="default"
    >
      <Heading>Data Outputs Summary</Heading>
      {(isScriptOutputVariablesEnabled && isOutputDataSaving) ? <Loader/> : <Text/>}
      {isScriptOutputVariablesEnabled && isOutputDataSaving && (
        <Dialog>
          <Heading>Writing Script Outputs To Airtable</Heading>
          <ProgressBar
            progress={numOutputRecordsToDeleteAndSave == 0 ? 0.0 : ( numOutputRecordsDeletedAndSaved / numOutputRecordsToDeleteAndSave)}
          />
        </Dialog>
      )}
      { isScriptOutputVariablesEnabled
        ?
          <DataOutputsSummary
            outputData={outputData}
            isShowDataOutputsSummaryFieldsEnabled={isShowDataOutputsSummaryFieldsEnabled}
            setShowDataOutputsSummaryFieldsEnabled={(newValue) =>
              globalConfig.setAsync('isShowDataOutputsSummaryFieldsEnabled', newValue)
            }
          />
        :
          <Text>Data Outputs Are Disabled In Settings</Text>
      }
    </Box>

    <Box
      display={isShowScriptResultsEnabled ? "flex" : "none"}
      flexDirection="column"
      padding={2}
      border="default"
    >
      <Heading>Script Results</Heading>
      {isScriptRunning ? <Loader/> : <Text/>}
      <Text paddingLeft={2} style={{ backgroundColor: '#272822', borderColor: '#272822' }}>
        <pre style={{color: '#00CC00'}}>{scriptResult}</pre>
      </Text>
    </Box>

    <Box
      display={isShowScriptErrorsEnabled ? "flex" : "none"}
      flexDirection="column"
      padding={2}
      border="default"
    >
      <Heading>Script Errors</Heading>
      {isScriptRunning ? <Loader/> : <Text/>}
      <Text paddingLeft={2} style={{ backgroundColor: '#272822', borderColor: '#272822' }}>
        <pre style={{color: '#00CC00'}}>{scriptError}</pre>
      </Text>
    </Box>

    <Box
      display={isShowPlotsEnabled ? "flex" : "none"}
      flexDirection="column"
      padding={2}
      border="default"
    >
      <Heading>Plots</Heading>
      {isScriptRunning ? <Loader/> : <Text/>}
      <Text>Plot Count : {plots.length}</Text>
      { plots.length > 0
        ?
          <Plots
            plotData={plots}
          />
        : ""
      }
    </Box>

    <Box
      padding={2}
      border="default"
    >
      <small>Last updated at {new Date().toString()}</small>
    </Box>

  </Box>
  );

  /*
    - Script area
    - Data Inputs Summary
    - Data Outputs Summary
    - Results
    - Plots
    - Choose Script
    - New Script
    - Save Script
    - Run Script
    - Option for run when data is changed
    - Help

  */
}

function DataInputsSummary({inputDataRecords,
  isShowDataInputsSummaryFieldsEnabled,
  setShowDataInputsSummaryFieldsEnabled}) {
  return (
    <table style={{backgroundColor: '#272822',
                    color: '#F8F8F2',
                    borderCollapse: 'collapse',
                    border: '5px solid #272822'
                  }}>
      <thead>
        <tr>
          <th style={{textAlign: 'left', borderBottom: '1px solid #75715E'}}>Variable</th>
          <th style={{textAlign: 'left', borderBottom: '1px solid #75715E'}}>Access in script using...</th>
          <th style={{textAlign: 'left', borderBottom: '1px solid #75715E'}}>Number of records to be read into script.</th>
          <th style={{textAlign: 'left', borderBottom: '1px solid #75715E'}}>
            <Switch
              flex="1"
              flexGrow="0"
              marginBottom="5px"
              backgroundColor="#F8F8F2"
              value={isShowDataInputsSummaryFieldsEnabled}
              onChange={newValue => setShowDataInputsSummaryFieldsEnabled(newValue)}
              label="Show Script Input Variable Fields"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {
          Object.keys(inputDataRecords).map(variableName => {
            return (
              <tr key={variableName}>
                <td style={{borderBottom: '1px solid #75715E', wordBreak: 'break-all'}}>{variableName}</td>
                <td style={{borderBottom: '1px solid #75715E', wordBreak: 'break-all', color: '#00CC00', fontFamily: 'monospace'}}>chrysopelea.inputs.{variableName}</td>
                <td style={{borderBottom: '1px solid #75715E', wordBreak: 'break-all'}}>{inputDataRecords[variableName].length}</td>
                <td style={{borderBottom: '1px solid #75715E', width: '60%'}}>
                  { isShowDataInputsSummaryFieldsEnabled ?
                    <DataInputsFieldInfo
                      variableName={variableName}
                      dataRecord={inputDataRecords[variableName]}
                    />
                    :
                    ""
                  }
                </td>
              </tr>
            );
          })
        }
      </tbody>
    </table>
  );
}

function DataInputsFieldInfo({variableName, dataRecord}) {
  if( dataRecord.length < 1 ) {
    return ('Fields could not be determined.');
  }

  // Pulling the field info from the record
  var record = dataRecord[0];

  return (
    <table style={{backgroundColor: '#272822', color: '#F8F8F2', width: '100%'}}>
      <thead>
        <tr>
          <th style={{textAlign: 'left'}}>Field Name</th>
          <th style={{textAlign: 'left'}}>Access in script using e.g...</th>
        </tr>
      </thead>
      <tbody>
        {
          Object.keys(record.parentTable.fields).map(fieldIndex => {
            var fieldName = record.parentTable.fields[fieldIndex].name;
            var sanitizedVariableName = getSanitizedScriptIdentifier(variableName);
            var sanitizedFieldName = getSanitizedScriptIdentifier(fieldName);
            return (
              <tr key={fieldName}>
                <td style={{wordBreak: 'break-all', width: '30%'}}>{fieldName}</td>
                <td style={{wordBreak: 'break-all', color: '#00CC00', fontFamily: 'monospace'}}>{sanitizedVariableName}_{sanitizedFieldName} = [row.getCellValue("{fieldName}") for row in chrysopelea.inputs.{sanitizedVariableName}]</td>
              </tr>
            )
          })
        }
      </tbody>
    </table>
  )
}

function DataOutputsSummary({outputData,
  isShowDataOutputsSummaryFieldsEnabled,
  setShowDataOutputsSummaryFieldsEnabled,
  outputVariableStats}) {
  return (
    <table style={{backgroundColor: '#272822',
                    color: '#F8F8F2',
                    borderCollapse: 'collapse',
                    border: '5px solid #272822'
                  }}>
      <thead>
        <tr>
          <th style={{textAlign: 'left', borderBottom: '1px solid #75715E'}}>Variable</th>
          <th style={{textAlign: 'left', borderBottom: '1px solid #75715E'}}>Access in script using...</th>
          <th style={{textAlign: 'left', borderBottom: '1px solid #75715E'}}>Number of records written out from script.</th>
          <th style={{textAlign: 'left', borderBottom: '1px solid #75715E'}}>
            <Switch
              flex="1"
              flexGrow="0"
              marginBottom="5px"
              backgroundColor="#F8F8F2"
              value={isShowDataOutputsSummaryFieldsEnabled}
              onChange={newValue => setShowDataOutputsSummaryFieldsEnabled(newValue)}
              label="Show Script Output Variable Fields"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {
          Object.keys(outputData).map(variableName => {
            return (
              <tr key={variableName}>
                <td style={{borderBottom: '1px solid #75715E', wordBreak: 'break-all'}}>{variableName}</td>
                <td style={{borderBottom: '1px solid #75715E', wordBreak: 'break-all', color: '#00CC00', fontFamily: 'monospace'}}>chrysopelea.outputs.{variableName}</td>
                <td style={{borderBottom: '1px solid #75715E', wordBreak: 'break-all'}}>{outputData[variableName].numRecordsCreated}</td>
                <td style={{borderBottom: '1px solid #75715E', width: '60%'}}>
                  { isShowDataOutputsSummaryFieldsEnabled ?
                    <DataOutputsFieldInfo
                      variableName={variableName}
                      data={outputData[variableName]}
                    />
                    :
                    ""
                  }
                </td>
              </tr>
            );
          })
        }
      </tbody>
    </table>
  );
}

function DataOutputsFieldInfo({variableName, data}) {
  const base = useBase();

  var dataTable =
      data.outputDataTableId !== undefined
    ? base.getTableByIdIfExists(data.outputDataTableId)
    : null;

  return (
    <table style={{backgroundColor: '#272822', color: '#F8F8F2', width: '100%'}}>
      <thead>
        <tr>
          <th style={{textAlign: 'left'}}>Field Name</th>
          <th style={{textAlign: 'left'}}>Access in script using e.g...</th>
        </tr>
      </thead>
      <tbody>
        {
          // all_the_{fieldName.replace(/\s/g,'_')} = [row.getCellValue("{fieldName}") for row in chrysopelea.{variableName}]
          dataTable.fields.map(field => {
            var fieldName = field.name;
            var sanitizedVariableName = getSanitizedScriptIdentifier(variableName);
            var sanitizedFieldName = getSanitizedScriptIdentifier(fieldName);
            return (
              <tr key={fieldName}>
                <td style={{wordBreak: 'break-all', width: '30%'}}>{fieldName}</td>
                <td style={{wordBreak: 'break-all', color: '#00CC00', fontFamily: 'monospace'}}>chrysopelea.outputs.{sanitizedVariableName}.{sanitizedFieldName}.push(value)</td>
              </tr>
            )
          })
        }
      </tbody>
    </table>
  )
}

function Plots({plotData}) {
  return (
    <Box
      flexDirection="column"
      padding={2}
      border="default"
    >
      {
        plotData.map(plot => {
          return (
            <FormField key={plot.name} label={plot.name}>
              <div id={"chrysopelea_plot_"+plot.name}>
                <img src={plot.png}/>
              </div>
            </FormField>
          );
        })
      }
    </Box>
  );
}

initializeBlock(() => <ChrysopeleaBlock />);

// --------------------------------------------------------------------------
// TODO: move this out to another file and make it an import.
// this is copy-pasted from pyodide:
//      https://github.com/iodide-project/pyodide/blob/master/src/pyodide.js
// --------------------------------------------------------------------------
/**
 * The main bootstrap script for loading pyodide.
 */

var languagePluginLoader = new Promise((resolve, reject) => {
  // This is filled in by the Makefile to be either a local file or the
  // deployed location. TODO: This should be done in a less hacky
  // way.
  var baseURL = self.languagePluginUrl || 'https://pyodide-cdn2.iodide.io/v0.15.0/full/';
  baseURL = baseURL.substr(0, baseURL.lastIndexOf('/')) + '/';

  ////////////////////////////////////////////////////////////
  // Package loading
  let loadedPackages = {};
  var loadPackagePromise = new Promise((resolve) => resolve());
  // Regexp for validating package name and URI
  var package_name_regexp = '[a-z0-9_][a-z0-9_\-]*'
  var package_uri_regexp =
      new RegExp('^https?://.*?(' + package_name_regexp + ').js$', 'i');
  var package_name_regexp = new RegExp('^' + package_name_regexp + '$', 'i');

  let _uri_to_package_name = (package_uri) => {
    // Generate a unique package name from URI

    if (package_name_regexp.test(package_uri)) {
      return package_uri;
    } else if (package_uri_regexp.test(package_uri)) {
      let match = package_uri_regexp.exec(package_uri);
      // Get the regexp group corresponding to the package name
      return match[1];
    } else {
      return null;
    }
  };

  // clang-format off
  let preloadWasm = () => {
    // On Chrome, we have to instantiate wasm asynchronously. Since that
    // can't be done synchronously within the call to dlopen, we instantiate
    // every .so that comes our way up front, caching it in the
    // `preloadedWasm` dictionary.

    let promise = new Promise((resolve) => resolve());
    let FS = pyodide._module.FS;

    function recurseDir(rootpath) {
      let dirs;
      try {
        dirs = FS.readdir(rootpath);
      } catch {
        return;
      }
      for (let entry of dirs) {
        if (entry.startsWith('.')) {
          continue;
        }
        const path = rootpath + entry;
        if (entry.endsWith('.so')) {
          if (Module['preloadedWasm'][path] === undefined) {
            promise = promise
              .then(() => Module['loadWebAssemblyModule'](
                FS.readFile(path), {loadAsync: true}))
              .then((module) => {
                Module['preloadedWasm'][path] = module;
              });
          }
        } else if (FS.isDir(FS.lookupPath(path).node.mode)) {
          recurseDir(path + '/');
        }
      }
    }

    recurseDir('/');

    return promise;
  }
  // clang-format on

  function loadScript(url, onload, onerror) {
    if (self.document) { // browser
      const script = self.document.createElement('script');
      script.src = url;
      script.onload = (e) => { onload(); };
      script.onerror = (e) => { onerror(); };
      self.document.head.appendChild(script);
    } else if (self.importScripts) { // webworker
      try {
        self.importScripts(url);
        onload();
      } catch {
        onerror();
      }
    }
  }

  let _loadPackage = (names, messageCallback, errorCallback) => {
    if (messageCallback == undefined) {
      messageCallback = () => {};
    }
    if (errorCallback == undefined) {
      errorCallback = () => {};
    }
    let _messageCallback = (msg) => {
      console.log(msg);
      messageCallback(msg);
    };
    let _errorCallback = (errMsg) => {
      console.error(errMsg);
      errorCallback(errMsg);
    };

    // DFS to find all dependencies of the requested packages
    let packages = self.pyodide._module.packages.dependencies;
    let loadedPackages = self.pyodide.loadedPackages;
    let queue = [].concat(names || []);
    let toLoad = {};
    while (queue.length) {
      let package_uri = queue.pop();

      const pkg = _uri_to_package_name(package_uri);

      if (pkg == null) {
        _errorCallback(`Invalid package name or URI '${package_uri}'`);
        return;
      } else if (pkg == package_uri) {
        package_uri = 'default channel';
      }

      if (pkg in loadedPackages) {
        if (package_uri != loadedPackages[pkg]) {
          _errorCallback(`URI mismatch, attempting to load package ` +
                         `${pkg} from ${package_uri} while it is already ` +
                         `loaded from ${loadedPackages[pkg]}!`);
          return;
        } else {
          _messageCallback(`${pkg} already loaded from ${loadedPackages[pkg]}`)
        }
      } else if (pkg in toLoad) {
        if (package_uri != toLoad[pkg]) {
          _errorCallback(`URI mismatch, attempting to load package ` +
                         `${pkg} from ${package_uri} while it is already ` +
                         `being loaded from ${toLoad[pkg]}!`);
          return;
        }
      } else {
        console.log(
            `${pkg} to be loaded from ${package_uri}`); // debug level info.

        toLoad[pkg] = package_uri;
        if (packages.hasOwnProperty(pkg)) {
          packages[pkg].forEach((subpackage) => {
            if (!(subpackage in loadedPackages) && !(subpackage in toLoad)) {
              queue.push(subpackage);
            }
          });
        } else {
          _errorCallback(`Unknown package '${pkg}'`);
        }
      }
    }

    self.pyodide._module.locateFile = (path) => {
      // handle packages loaded from custom URLs
      let pkg = path.replace(/\.data$/, "");
      if (pkg in toLoad) {
        let package_uri = toLoad[pkg];
        if (package_uri != 'default channel') {
          return package_uri.replace(/\.js$/, ".data");
        };
      };
      return baseURL + path;
    };

    let promise = new Promise((resolve, reject) => {
      if (Object.keys(toLoad).length === 0) {
        resolve('No new packages to load');
        return;
      }

      let packageList = Array.from(Object.keys(toLoad));
      _messageCallback(`Loading ${packageList.join(', ')}`)

      // monitorRunDependencies is called at the beginning and the end of each
      // package being loaded. We know we are done when it has been called
      // exactly "toLoad * 2" times.
      var packageCounter = Object.keys(toLoad).length * 2;

      self.pyodide._module.monitorRunDependencies = () => {
        packageCounter--;
        if (packageCounter === 0) {
          for (let pkg in toLoad) {
            self.pyodide.loadedPackages[pkg] = toLoad[pkg];
          }
          delete self.pyodide._module.monitorRunDependencies;
          self.removeEventListener('error', windowErrorHandler);

          let resolveMsg = `Loaded `;
          if (packageList.length > 0) {
            resolveMsg += packageList.join(', ');
          } else {
            resolveMsg += 'no packages'
          }

          if (!isFirefox) {
            preloadWasm().then(() => {
              console.log(resolveMsg);
              resolve(resolveMsg);
            });
          } else {
            console.log(resolveMsg);
            resolve(resolveMsg);
          }
        }
      };

      // Add a handler for any exceptions that are thrown in the process of
      // loading a package
      var windowErrorHandler = (err) => {
        delete self.pyodide._module.monitorRunDependencies;
        self.removeEventListener('error', windowErrorHandler);
        // Set up a new Promise chain, since this one failed
        loadPackagePromise = new Promise((resolve) => resolve());
        reject(err.message);
      };
      self.addEventListener('error', windowErrorHandler);

      for (let pkg in toLoad) {
        let scriptSrc;
        let package_uri = toLoad[pkg];
        if (package_uri == 'default channel') {
          scriptSrc = `${baseURL}${pkg}.js`;
        } else {
          scriptSrc = `${package_uri}`;
        }
        _messageCallback(`Loading ${pkg} from ${scriptSrc}`)
        loadScript(scriptSrc, () => {}, () => {
          // If the package_uri fails to load, call monitorRunDependencies twice
          // (so packageCounter will still hit 0 and finish loading), and remove
          // the package from toLoad so we don't mark it as loaded, and remove
          // the package from packageList so we don't say that it was loaded.
          _errorCallback(`Couldn't load package from URL ${scriptSrc}`);
          delete toLoad[pkg];
          let packageListIndex = packageList.indexOf(pkg);
          if (packageListIndex !== -1) {
            packageList.splice(packageListIndex, 1);
          }
          for (let i = 0; i < 2; i++) {
            self.pyodide._module.monitorRunDependencies();
          }
        });
      }

      // We have to invalidate Python's import caches, or it won't
      // see the new files. This is done here so it happens in parallel
      // with the fetching over the network.
      self.pyodide.runPython('import importlib as _importlib\n' +
                             '_importlib.invalidate_caches()\n');
    });

    return promise;
  };

  let loadPackage = (names, messageCallback, errorCallback) => {
    /* We want to make sure that only one loadPackage invocation runs at any
     * given time, so this creates a "chain" of promises. */
    loadPackagePromise = loadPackagePromise.then(
        () => _loadPackage(names, messageCallback, errorCallback));
    return loadPackagePromise;
  };

  ////////////////////////////////////////////////////////////
  // Fix Python recursion limit
  function fixRecursionLimit(pyodide) {
    // The Javascript/Wasm call stack may be too small to handle the default
    // Python call stack limit of 1000 frames. This is generally the case on
    // Chrom(ium), but not on Firefox. Here, we determine the Javascript call
    // stack depth available, and then divide by 50 (determined heuristically)
    // to set the maximum Python call stack depth.

    let depth = 0;
    function recurse() {
      depth += 1;
      recurse();
    }
    try {
      recurse();
    } catch (err) {
      ;
    }

    let recursionLimit = depth / 50;
    if (recursionLimit > 1000) {
      recursionLimit = 1000;
    }
    pyodide.runPython(
        `import sys; sys.setrecursionlimit(int(${recursionLimit}))`);
  };

  ////////////////////////////////////////////////////////////
  // Rearrange namespace for public API
  let PUBLIC_API = [
    'globals',
    'loadPackage',
    'loadedPackages',
    'pyimport',
    'repr',
    'runPython',
    'runPythonAsync',
    'checkABI',
    'version',
    'autocomplete',
  ];

  function makePublicAPI(module, public_api) {
    var namespace = {_module : module};
    for (let name of public_api) {
      namespace[name] = module[name];
    }
    return namespace;
  }

  ////////////////////////////////////////////////////////////
  // Loading Pyodide
  let wasmURL = `${baseURL}pyodide.asm.wasm`;
  let Module = {};
  self.Module = Module;

  Module.noImageDecoding = true;
  Module.noAudioDecoding = true;
  Module.noWasmDecoding = true;
  Module.preloadedWasm = {};
  let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  let wasm_promise, wasm_fetch = fetch(wasmURL);
  const compileBuffer = () =>
      wasm_fetch.then(response => response.arrayBuffer())
          .then(bytes => WebAssembly.compile(bytes));
  if (WebAssembly.compileStreaming === undefined) {
    wasm_promise = compileBuffer();
  } else {
    wasm_promise = WebAssembly.compileStreaming(wasm_fetch);
    wasm_promise = wasm_promise.catch(e => {
      if (e instanceof TypeError) {
        console.error("pyodide streaming compilation failed:", e,
                      "- falling back to buffered compilation");
        return compileBuffer()
      }
      throw e;
    });
  }

  Module.instantiateWasm = (info, receiveInstance) => {
    wasm_promise.then(module => WebAssembly.instantiate(module, info))
        .then(instance => receiveInstance(instance));
    return {};
  };

  Module.checkABI = function(ABI_number) {
    if (ABI_number !== parseInt('1')) {
      var ABI_mismatch_exception =
          `ABI numbers differ. Expected 1, got ${ABI_number}`;
      console.error(ABI_mismatch_exception);
      throw ABI_mismatch_exception;
    }
    return true;
  };

  Module.autocomplete =
      function(path) {
    var pyodide_module = Module.pyimport("pyodide");
    return pyodide_module.get_completions(path);
  }

      Module.locateFile = (path) => baseURL + path;
  var postRunPromise = new Promise((resolve, reject) => {
    Module.postRun = () => {
      delete self.Module;
      fetch(`${baseURL}packages.json`)
          .then((response) => response.json())
          .then((json) => {
            fixRecursionLimit(self.pyodide);
            self.pyodide.globals =
                self.pyodide.runPython('import sys\nsys.modules["__main__"]');
            self.pyodide = makePublicAPI(self.pyodide, PUBLIC_API);
            self.pyodide._module.packages = json;
            if (self.iodide !== undefined) {
              // Perform some completions immediately so there isn't a delay on
              // the first call to autocomplete
              self.pyodide.runPython('import pyodide');
              self.pyodide.runPython('pyodide.get_completions("")');
            }
            resolve();
          });
    };
  });

  var dataLoadPromise = new Promise((resolve, reject) => {
    Module.monitorRunDependencies =
        (n) => {
          if (n === 0) {
            delete Module.monitorRunDependencies;
            resolve();
          }
        }
  });

  Promise.all([ postRunPromise, dataLoadPromise ]).then(() => resolve());

  const data_script_src = `${baseURL}pyodide.asm.data.js`;
  loadScript(data_script_src, () => {
    const scriptSrc = `${baseURL}pyodide.asm.js`;
    loadScript(scriptSrc, () => {
      // The emscripten module needs to be at this location for the core
      // filesystem to install itself. Once that's complete, it will be replaced
      // by the call to `makePublicAPI` with a more limited public API.
      self.pyodide = pyodide(Module);
      self.pyodide.loadedPackages = {};
      self.pyodide.loadPackage = loadPackage;
    }, () => {});
  }, () => {});

  ////////////////////////////////////////////////////////////
  // Iodide-specific functionality, that doesn't make sense
  // if not using with Iodide.
  if (self.iodide !== undefined) {
    // Load the custom CSS for Pyodide
    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = `${baseURL}renderedhtml.css`;
    document.getElementsByTagName('head')[0].appendChild(link);

    // Add a custom output handler for Python objects
    self.iodide.addOutputRenderer({
      shouldRender : (val) => {
        return (typeof val === 'function' &&
                pyodide._module.PyProxy.isPyProxy(val));
      },

      render : (val) => {
        let div = document.createElement('div');
        div.className = 'rendered_html';
        var element;
        if (val._repr_html_ !== undefined) {
          let result = val._repr_html_();
          if (typeof result === 'string') {
            div.appendChild(new DOMParser()
                                .parseFromString(result, 'text/html')
                                .body.firstChild);
            element = div;
          } else {
            element = result;
          }
        } else {
          let pre = document.createElement('pre');
          pre.textContent = val.toString();
          div.appendChild(pre);
          element = div;
        }
        return element.outerHTML;
      }
    });
  }
});

function getSanitizedScriptIdentifier(identifier) {
  return identifier.replace(/\s/g,'_');
}

function runPython(userCode, inputDataRecords, outputData, onResult, onError, onPlots, onSavingOutputData, onDoneSavingOutputData,
                    setNumOutputRecordsToDeleteAndSave, setNumOutputRecordsDeletedAndSaved) {
  // TODO: need to to something here with respect to multiple script output variables resolving
  // to the same sanitized output variable name, i.e. two that are the same except for whitespace.

  // This object will be accessible in python using 'from js import chrysopelea'.
  window.chrysopelea = {};
  window.chrysopelea.inputs  = {};
  window.chrysopelea.outputs = {};
  window.chrysopelea.plots   = {};
  Object.keys(inputDataRecords).map(inputVariableName => {
    window.chrysopelea.inputs[getSanitizedScriptIdentifier(inputVariableName)] = inputDataRecords[inputVariableName];
  });
  Object.keys(outputData).map(outputVariableName => {
    var sanitizedOutputVariableName = getSanitizedScriptIdentifier(outputVariableName);
    window.chrysopelea.outputs[sanitizedOutputVariableName] = {};
    if( outputData[outputVariableName].dataTable !== null ) {
      outputData[outputVariableName].dataTable.fields.map(field => {
        var sanitizedFieldName = getSanitizedScriptIdentifier(field.name);
        window.chrysopelea.outputs[sanitizedOutputVariableName][sanitizedFieldName] = [];
      });
    }
  });
  try {
    const codeToRun = addCodeMagic(userCode);
    let result = pyodide.runPython(codeToRun);
    console.debug('script result: ' + result);
    onPlots(window.chrysopelea.plots);
    onResult(result);
    onSavingOutputData();
    writeOutputDataToAirtable(outputData, window.chrysopelea.outputs, setNumOutputRecordsToDeleteAndSave, setNumOutputRecordsDeletedAndSaved)
    .then( () => {
      onDoneSavingOutputData(outputData, window.chrysopelea.outputs);
    });

  } catch (e) {
    console.error(`error: ${e}`);
    onError(e.message);
  }
}

async function writeOutputDataToAirtable(outputData, chrysopeleaOutputs, setNumOutputRecordsToDeleteAndSave, setNumOutputRecordsDeletedAndSaved) {
  return new Promise( (resolve, reject) => {
    Object.keys(outputData).map(outputVariableName => {
      var sanitizedOutputVariableName = getSanitizedScriptIdentifier(outputVariableName);
      let dataTable = outputData[outputVariableName].dataTable;
      if( dataTable !== null ) {

        let recordDefs = [];
        Object.keys(chrysopeleaOutputs[sanitizedOutputVariableName]).map(sanitizedFieldName => {
          let fieldRowIndex = 0;
          chrysopeleaOutputs[sanitizedOutputVariableName][sanitizedFieldName].map(fieldValue => {
            if( recordDefs.length < fieldRowIndex + 1 ) {
              recordDefs[fieldRowIndex] = {};
              recordDefs[fieldRowIndex].fields = {};
            }
            let unsanitizedFieldName = outputData[outputVariableName].sanitizedToUnsanitizedFieldNames[sanitizedFieldName];
            recordDefs[fieldRowIndex].fields[unsanitizedFieldName] = fieldValue;
            fieldRowIndex++;
          });
        });

        const queryResult = dataTable.selectRecords();
        queryResult.loadDataAsync().then( () => {

          setNumOutputRecordsToDeleteAndSave(queryResult.recordIds.length + recordDefs.length);
          setNumOutputRecordsDeletedAndSaved(0);

          deleteRecords(dataTable, queryResult.recordIds, setNumOutputRecordsDeletedAndSaved)
          .then( (numDeleted) => {
            //console.debug('Script outputs for ['+outputVariableName+']');
            //console.debug(JSON.stringify(recordDefs));
            createRecords(dataTable, recordDefs, numDeleted, setNumOutputRecordsDeletedAndSaved)
            .then( (createdRecordIds) => {
              outputData[outputVariableName].numRecordsCreated = createdRecordIds.length;
              resolve();
            })
          });
        });
      }
    });

  });
}

function each(arr, work) {
  function loop(arr, i) {
    return new Promise(function(resolve, reject) {
      if (i >= arr.length) {resolve();}
      else try {
        Promise.resolve(work(arr[i], i)).then(function() {
          resolve(loop(arr, i+1))
        }).catch(reject);
      } catch(e) {reject(e);}
    });
  }
  return loop(arr, 0);
}

function deleteRecords(table, records, setNumOutputRecordsDeletedAndSaved) {
  // Couldn't get this function to be an async function, something going on in transpiling, even if
  // it was marked as async.
  // So all this pure ugly instead.
  return new Promise ( (resolve, reject) => {
    let i = 0;
    let recordBatches = [];
    while (i < records.length) {
      const recordBatch = records.slice(i, i + AIRTABLE_RECORDS_BATCH_SIZE);
      recordBatches.push(recordBatch);
      i += AIRTABLE_RECORDS_BATCH_SIZE;
    }
    let numDeleted = 0;
    each(recordBatches, function(recordBatch, idx) {
      return new Promise( function(batchResolve, batchReject) {
          table.deleteRecordsAsync(recordBatch)
          .then( () => {
            numDeleted += recordBatch.length;
            setNumOutputRecordsDeletedAndSaved(numDeleted);
            batchResolve();
          })
      });
    }).then ( () => {
      resolve(numDeleted);
    })
  });
}

function createRecords(table, recordDefs, numDeleted, setNumOutputRecordsDeletedAndSaved) {
  // Couldn't get this function to be an async function, something going on in transpiling, even if
  // it was marked as async.
  // So all this pure ugly instead.
  return new Promise ( (resolve, reject) => {
    let i = 0;
    let recordBatches = [];
    while (i < recordDefs.length) {
      const recordBatch = recordDefs.slice(i, i + AIRTABLE_RECORDS_BATCH_SIZE);
      recordBatches.push(recordBatch);
      i += AIRTABLE_RECORDS_BATCH_SIZE;
    }
    let createdRecordIds = [];
    each(recordBatches, function(recordBatch, idx) {
      return new Promise(function(batchResolve) {
          table.createRecordsAsync(recordBatch)
          .then( (batchCreatedRecordIds) => {
            createdRecordIds.push(batchCreatedRecordIds);
            setNumOutputRecordsDeletedAndSaved(numDeleted + createdRecordIds.flat().length);
            batchResolve(createdRecordIds);
          })
      })
    })
    .then( () => {
      resolve(createdRecordIds.flat());
    })

  });
}

function addCodeMagic(userCode) {
  // TODO: line numbers are off in script error messages because of this code.
  var magic = `
def saveAirplot(self, fig, name):
  import io, base64
  buf = io.BytesIO()
  fig.savefig(buf, format='png')
  buf.seek(0)
  imgStr = 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')
  self.plots[name] = imgStr

from js import chrysopelea
import types
chrysopelea.saveAirplot = types.MethodType(saveAirplot, chrysopelea)

`;
  // TODO: add method for saving outputs to chrysopelea ?
  return magic + userCode;
}

function runPythonAsync(code,
  inputDataRecords,
  outputData,
  onResult,
  onError,
  onPlots,
  onBeforeStart,
  onAfterDone,
  onSavingOutputData,
  onDoneSavingOutputData,
  setNumOutputRecordsToDeleteAndSave,
  setNumOutputRecordsDeletedAndSaved) {

  onBeforeStart();

  setTimeout( () => {
    runPython(code,
      inputDataRecords,
      outputData,
      (result) => {
        onAfterDone();
        onResult(result);
      },
      (error) => {
        onAfterDone();
        onError(error);
      },
      onPlots,
      onSavingOutputData,
      onDoneSavingOutputData,
      setNumOutputRecordsToDeleteAndSave,
      setNumOutputRecordsDeletedAndSaved);
  }, 100);

}

function checkRequiredSettingsAreSet() {
  // TODO: this method is so ugly.
  const globalConfig = useGlobalConfig();
  const base = useBase();

  const isScriptInputVariablesEnabled = getConfigPathElse(globalConfig, "isScriptInputVariablesEnabled", true);
  const isScriptOutputVariablesEnabled = getConfigPathElse(globalConfig, "isScriptOutputVariablesEnabled", false);

  // Checking on core settings for script source code and script variable names.
  var sourceCodeSettingsAreSet = (
        globalConfig.get('scriptSourceCodeTableId') !== undefined
    &&  globalConfig.get('scriptSourceCodeFieldId') !== undefined
  );

  var scriptInputVariableNamesSettingsAreSet = (
        globalConfig.get('scriptInputVariableNamesTableId') !== undefined
    &&  globalConfig.get('scriptInputVariableNamesViewId') !== undefined
    &&  globalConfig.get('scriptInputVariableNamesFieldId') !== undefined
  );

  var scriptOutputVariableNamesSettingsAreSet = (
        globalConfig.get('scriptOutputVariableNamesTableId') !== undefined
    &&  globalConfig.get('scriptOutputVariableNamesViewId') !== undefined
    &&  globalConfig.get('scriptOutputVariableNamesFieldId') !== undefined
  )

  const scriptInputVariableNamesTableId = globalConfig.get("scriptInputVariableNamesTableId");
  const scriptInputVariableNamesViewId = globalConfig.get("scriptInputVariableNamesViewId");
  const scriptInputVariableNamesFieldId = globalConfig.get("scriptInputVariableNamesFieldId");

  const scriptInputVariableNamesTable = base.getTableByIdIfExists(scriptInputVariableNamesTableId);

  const scriptInputVariableNamesView =
      (scriptInputVariableNamesTable && (scriptInputVariableNamesViewId !== undefined))
    ? scriptInputVariableNamesTable.getViewByIdIfExists(scriptInputVariableNamesViewId)
    : null;

  const scriptInputVariableNamesQueryResult =
      scriptInputVariableNamesView
    ? scriptInputVariableNamesView.selectRecords()
    : null;

  const scriptInputVariableNamesRecords = useRecords(scriptInputVariableNamesQueryResult);

  const scriptOutputVariableNamesTableId = globalConfig.get("scriptOutputVariableNamesTableId");
  const scriptOutputVariableNamesViewId = globalConfig.get("scriptOutputVariableNamesViewId");
  const scriptOutputVariableNamesFieldId = globalConfig.get("scriptOutputVariableNamesFieldId");

  const scriptOutputVariableNamesTable = base.getTableByIdIfExists(scriptOutputVariableNamesTableId);

  const scriptOutputVariableNamesView =
      (scriptOutputVariableNamesTable && (scriptOutputVariableNamesViewId !== undefined))
    ? scriptOutputVariableNamesTable.getViewByIdIfExists(scriptOutputVariableNamesViewId)
    : null;

  const scriptOutputVariableNamesQueryResult =
      scriptOutputVariableNamesView
    ? scriptOutputVariableNamesView.selectRecords()
    : null;

  const scriptOutputVariableNamesRecords = useRecords(scriptOutputVariableNamesQueryResult);

  if( !sourceCodeSettingsAreSet ) {
    return false;
  }

  // All done checking if we aren't doing any script variables.
  if( !isScriptInputVariablesEnabled && !isScriptOutputVariablesEnabled ) {
    return true;
  }

  if( isScriptInputVariablesEnabled ) {

    if( !scriptInputVariableNamesSettingsAreSet ) {
      return false;
    }

    // Checking that each of the script input variables is configured with a data source (table, view).
    var result = true;
    scriptInputVariableNamesRecords.forEach(record => {
      var variableName = record.getCellValueAsString(scriptInputVariableNamesFieldId);
      if (variableName != "") {
        if ( globalConfig.get(["scriptInputVariableDataTableId",variableName]) === undefined ) {
          result = false;
        }
        if ( globalConfig.get(["scriptInputVariableDataViewId", variableName]) === undefined ) {
          result = false;
        }
      }
    });

    if( !result ) {
      return false;
    }
  }

  if( isScriptOutputVariablesEnabled ) {

    if( !scriptOutputVariableNamesSettingsAreSet ) {
      return false;
    }

    // Checking that each of the script output variables is configured with a data destination (table).
    var result = true;
    scriptOutputVariableNamesRecords.forEach(record => {
      var variableName = record.getCellValueAsString(scriptOutputVariableNamesFieldId);
      if (variableName != "") {
        if ( globalConfig.get(["scriptOutputVariableDataTableId",variableName]) === undefined ) {
          result = false;
        }
      }
    });

    if( !result ) {
      return false;
    }
  }

  return true;
}

function useRecordsWithUseWatchableCallback (queryResult, callback) {
  if( queryResult == undefined ) {
    return null;
  }
  useLoadable(queryResult);
  useWatchable(queryResult, ['records', 'cellValues', 'recordColors'],
      (model, keys) => {
          callback(model, keys);
      }
  );
  return queryResult ? queryResult.records : null;
}
