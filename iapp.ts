import { ctor } from "Utils"

let instance: IApp

interface IApp {
    registerService(service: any): void;
    getService<T>(c: ctor<T>): T;
}

// Singleton 

export function setAppInstance(app: IApp) {
    instance = app
}

export function app(): IApp {
    return instance
}
