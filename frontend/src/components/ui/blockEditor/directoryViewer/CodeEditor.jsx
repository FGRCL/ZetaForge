import { Button } from "@carbon/react";
import { Save } from "@carbon/icons-react";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { EditorCodeMirror } from "./CodeMirrorComponents";
import { useCompileComputation } from "@/hooks/useCompileSpecs";

export default function CodeEditor({ pipelineId, blockId, currentFile }) {
  // TODO check why editing is laggy
  const fileContent = trpc.block.file.byPath.get.useQuery({
    pipelineId: pipelineId,
    blockId: blockId,
    path: currentFile.relativePath,
  });
  const updateFileContent = trpc.block.file.byPath.update.useMutation();
  const [fileContentBuffer, setFileContentBuffer] = useState(fileContent.data);
  const compile = useCompileComputation();

  const saveChanges = async () => {
    await updateFileContent.mutateAsync({
      pipelineId,
      blockId: blockId,
      path: currentFile.relativePath,
      content: fileContentBuffer,
    });

    if (isComputation) {
      compile(pipelineId, blockId);
    }
  };

  const onChange = (newValue) => {
    setFileContentBuffer(newValue);
  };

  return (
    <>
      <EditorCodeMirror
        code={fileContent.data || ""} //TODO loading state
        onChange={onChange}
      />
      <div className="absolute right-8 top-2">
        <Button
          renderIcon={Save}
          iconDescription="Save code"
          tooltipPosition="left"
          hasIconOnly
          size="md"
          onClick={saveChanges}
        />
      </div>
    </>
  );
}
