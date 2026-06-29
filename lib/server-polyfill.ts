const isServer = typeof globalThis !== "undefined" && typeof (globalThis as any).document === "undefined"

if (isServer) {
  const globals = globalThis as any

  if (!globals.FontFace) {
    globals.FontFace = class {
      loadedName: string
      data: ArrayBuffer
      family: string
      status = "unloaded"
      loaded: Promise<any>
      constructor(family: string, data: ArrayBuffer) {
        this.family = family
        this.loadedName = family
        this.data = data
        this.loaded = Promise.resolve(this)
      }
      load() {
        this.status = "loaded"
        return this.loaded
      }
    }
  }

  if (!globals.document) {
    globals.document = {
      fonts: { add: () => undefined, delete: () => undefined },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({
        style: {} as CSSStyleDeclaration,
        setAttribute: () => undefined,
        getAttribute: () => null,
        appendChild: () => undefined,
        removeChild: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        focus: () => undefined,
        click: () => undefined,
      }),
      createTextNode: () => ({}),
      createComment: () => ({}),
      head: null,
      body: null,
      documentElement: { style: {} },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }
  }

  if (!globals.Image) {
    globals.Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      width = 0
      height = 0
      src = ""
    }
  }
}

export {}
