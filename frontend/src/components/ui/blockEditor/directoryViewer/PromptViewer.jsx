import { Button } from "@carbon/react";
import { Copy } from "@carbon/icons-react";
import { ViewerCodeMirror } from "./CodeMirrorComponents";
import { useContext } from "react";
import { SelectedPromptContext } from "./SelectedPromptContext";
import { ChatHistoryContext } from "./ChatHistoryContext";
import { FileBufferContext } from "./FileBufferContext";
import { useAtom } from "jotai";
import { pipelineAtom } from "@/atoms/pipelineAtom";
import { blockEditorIdAtom } from "@/atoms/editorAtom";
import { FileHandleContext } from "./FileHandleContext";
import { useCompileComputation } from "@/hooks/useCompileSpecs";

export default function PromptViewer(){
  const [pipeline] = useAtom(pipelineAtom);
  const [blockId] = useAtom(blockEditorIdAtom);
  const fileBuffer = useContext(FileBufferContext);
  const selectedPrompt = useContext(SelectedPromptContext)
  const chatHistory = useContext(ChatHistoryContext);
  const fileHandle = useContext(FileHandleContext);
  const compile = useCompileComputation();

  const handleAccept = async () => {
    chatHistory.addPrompt(selectedPrompt.selectedPrompt);
    await fileBuffer.updateSave(selectedPrompt.selectedPrompt.response);
    if (fileHandle.isComputation) {
      compile(pipeline.id, blockId);
    }
    selectedPrompt.setSelectedPrompt(undefined)
  };

  return (
    <div className="relative min-h-0 flex-1">
      <ViewerCodeMirror code={selectedPrompt.selectedPrompt.response} />
      <div className="absolute right-5 top-5">
        <Button
          renderIcon={Copy}
          iconDescription="Make current"
          tooltipPosition="left"
          size="md"
          onClick={handleAccept}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}

