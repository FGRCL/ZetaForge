import { Allotment } from "allotment";
import { allotmentSizesAtom } from "@/atoms/allotmentAtom";
import { useImmerAtom } from "jotai-immer";

export default function PersistentAllotment({ storageKey, initialSize, children, ...rest }) {
  //TODO find a way to get a generated storage key or test for uniqueness
  const [allotmentSizes, setAllotmentSizes] = useImmerAtom(allotmentSizesAtom);
  const size = allotmentSizes[storageKey] ?? initialSize;

  const setSize = (size) => {
    setAllotmentSizes((draft) => {
      draft[storageKey] = size;
    });
  };

  return (
    <Allotment defaultSizes={size} onDragEnd={setSize} {...rest}>
      {children}
    </Allotment>
  );
}
