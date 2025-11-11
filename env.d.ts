/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'bpmn-js/lib/Modeler' {
  export default class Modeler {
    constructor(options?: any)
    importXML(xml: string): Promise<any>
    saveXML(options?: any): Promise<{ xml: string }>
    saveSVG(options?: any): Promise<{ svg: string }>
    attachTo(element: HTMLElement): void
    detach(): void
    destroy(): void
    get(service: string): any
  }
}

declare module 'bpmn-js/lib/NavigatedViewer' {
  export default class NavigatedViewer {
    constructor(options?: any)
    importXML(xml: string): Promise<any>
    attachTo(element: HTMLElement): void
    detach(): void
    destroy(): void
    get(service: string): any
  }
}