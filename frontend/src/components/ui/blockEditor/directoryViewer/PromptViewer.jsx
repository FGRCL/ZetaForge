import { Button } from "@carbon/react";
import { Copy } from "@carbon/icons-react";
import { ViewerCodeMirror } from "./CodeMirrorComponents";
import { useContext } from "react";
import { SelectedPromptContext } from "./SelectedPromptContext";
import { ChatHistoryContext } from "./ChatHistoryContext";

export default function PromptViewer(){
  const selectedPrompt = useContext(SelectedPromptContext)
  const chatHistory = useContext(ChatHistoryContext);

  const handleAccept = () => {
    chatHistory.addPrompt(selectedPrompt.selectedPrompt);
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
