import { OpenAPIV3 } from "openapi-types";

export function isHttpMethod(method: string): method is OpenAPIV3.HttpMethods {
    return Object.values(OpenAPIV3.HttpMethods).includes(method as OpenAPIV3.HttpMethods);
}