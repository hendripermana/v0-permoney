import * as React from "react"
import { createRoot, Root } from "react-dom/client"
import { act } from "react-dom/test-utils"
import {
  fireEvent,
  waitFor,
  screen,
  within,
  getQueriesForElement,
  prettyDOM,
} from "@testing-library/dom"

type RenderOptions = {
  container?: HTMLElement
  baseElement?: HTMLElement
}

interface MountedContainer {
  container: HTMLElement
  root: Root
  ownerDocument: Document
}

const mountedContainers = new Set<MountedContainer>()

export interface RenderResult extends ReturnType<typeof getQueriesForElement> {
  container: HTMLElement
  baseElement: HTMLElement
  unmount: () => void
  rerender: (ui: React.ReactElement) => void
  asFragment: () => DocumentFragment
}

export function render(
  ui: React.ReactElement,
  { container, baseElement }: RenderOptions = {},
): RenderResult {
  const ownerDocument = container?.ownerDocument ?? document
  const target = container ?? ownerDocument.createElement("div")

  if (!container) {
    ownerDocument.body.appendChild(target)
  }

  const root = createRoot(target)

  act(() => {
    root.render(ui)
  })

  const mounted: MountedContainer = { container: target, root, ownerDocument }
  mountedContainers.add(mounted)

  const queries = getQueriesForElement(baseElement ?? target)

  return {
    container: target,
    baseElement: baseElement ?? target,
    unmount: () => cleanupContainer(mounted),
    rerender: (nextUi: React.ReactElement) => {
      act(() => {
        root.render(nextUi)
      })
    },
    asFragment: () => target.cloneNode(true) as DocumentFragment,
    ...queries,
  }
}

function cleanupContainer(mounted: MountedContainer) {
  if (!mountedContainers.has(mounted)) {
    return
  }

  act(() => {
    mounted.root.unmount()
  })

  if (mounted.container.parentNode) {
    mounted.container.parentNode.removeChild(mounted.container)
  }

  mountedContainers.delete(mounted)
}

export function cleanup() {
  for (const mounted of Array.from(mountedContainers)) {
    cleanupContainer(mounted)
  }
}

type HookRenderResult<TValue> = {
  result: { current: TValue }
  rerender: (props?: unknown) => void
  unmount: () => void
}

type HookCallback<TValue, TProps> = (props?: TProps) => TValue

type RenderHookOptions<TProps> = {
  initialProps?: TProps
}

export function renderHook<TValue, TProps = void>(
  callback: HookCallback<TValue, TProps>,
  { initialProps }: RenderHookOptions<TProps> = {},
): HookRenderResult<TValue> {
  const result = { current: undefined as unknown as TValue }

  interface WrapperProps {
    hookProps?: TProps
  }

  function TestComponent({ hookProps }: WrapperProps) {
    result.current = callback(hookProps)
    return null
  }

  const { rerender, unmount } = render(
    React.createElement(TestComponent, { hookProps: initialProps }),
  )

  const rerenderWithProps = (nextProps?: TProps) => {
    rerender(React.createElement(TestComponent, { hookProps: nextProps }))
  }

  return {
    result,
    rerender: rerenderWithProps as (props?: unknown) => void,
    unmount,
  }
}

export {
  act,
  fireEvent,
  waitFor,
  screen,
  within,
  prettyDOM,
}
