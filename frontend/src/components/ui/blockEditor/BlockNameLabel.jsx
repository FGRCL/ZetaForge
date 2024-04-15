import { pipelineAtom } from "@/atoms/pipelineAtom";
import { TextInput } from "@carbon/react";
import { useAtom } from "jotai";
import { useMemo } from "react";

export default function BlockNameLabel(blockFolderName) {
  const [pipeline] = useAtom(pipelineAtom)

  const blockName = useMemo(() => {
    if (pipeline.data[blockFolderName]) {
      return pipeline.data[blockFolderName].information.name;
    } else {
      return "";
    }
  },
    [blockFolderName]
  )

  return (
    <TextInput className="p-4 italic" value={blockName} />
  )
}