export declare const hasWindow: () => boolean;
export declare const hasDocument: () => boolean;
export declare const onWindowEvent: <K extends keyof WindowEventMap>(key: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => void;
export declare const onDocumentEvent: <K extends keyof DocumentEventMap>(key: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => void;
