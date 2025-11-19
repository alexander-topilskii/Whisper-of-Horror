export type TooltipDelegate = (element: HTMLElement, tooltip?: string) => void;

export function expectElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`GameLayout expected element ${selector}`);
  }
  return element;
}
