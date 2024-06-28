import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ComputationsFileEditor from "@/components/ui/blockEditor/ComputationsFileEditor";
import { useHydrateAtoms } from "jotai/utils";
import { Provider } from "jotai";
import { blockEditorRootAtom } from "@/atoms/editorAtom";
import { trpc } from "@/utils/trpc";
import { afterEach } from "node:test";

vi.mock("@/utils/trpc", () => ({
  trpc: {
    compileComputation: {
      useMutation: vi.fn(),
    },
    saveBlockSpecs: {
      useMutation: vi.fn(),
    },
    chat: {
      history: {
        get: {
          useQuery: vi.fn(),
        },
        update: {
          useMutation: vi.fn(),
        },
      },
      index: {
        get: {
          useQuery: vi.fn(),
        },
        update: {
          useMutation: vi.fn(),
        },
      },
    },
    useUtils: () => ({
      chat: {
        history: {
          get: {
            invalidate: vi.fn(),
          },
        },
        index: {
          get: {
            invalidate: vi.fn(),
          },
        },
      },
    }),
  },
}));

function HydrateAtoms({ initialValues, children }) {
  useHydrateAtoms(initialValues);
  return children;
}

function TestProvider({ initialValues, children }) {
  return (
    <Provider>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </Provider>
  );
}

function ComputationsFileEditorProvider() {
  return (
    <TestProvider initialValues={[[blockEditorRootAtom, "path"]]}>
      <ComputationsFileEditor />
    </TestProvider>
  );
}

describe("ComputationsFileEditor", () => {
  afterEach(() => {
    vi.resetAllMocks()
  });

  test("renders", () => {
    trpc.chat.history.get.useQuery.mockReturnValue({
      isSuccess: true,
      data: [],
    })
    trpc.chat.index.get.useQuery.mockReturnValue({
      isSuccess: true,
      data: 0,
    })
    const fetchFileSystemMock = vi.fn();
    const result = render(
      <ComputationsFileEditorProvider fetchFileSystem={fetchFileSystemMock} />,
    );

    expect(result).toMatchSnapshot();
  });
});
