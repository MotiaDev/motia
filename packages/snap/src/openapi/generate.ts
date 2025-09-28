import { LockedData } from '@motiadev/core';
import * as fs from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import * as path from 'path';

import { generateLockedData } from '../generate-locked-data';
import { processSchema } from './process-schema';
import { isHttpMethod } from './utils';

export async function generateOpenApi(projectDir: string, title?: string, version?: string, outputFile = 'openapi.json') {
    const lockedData: LockedData = await generateLockedData(projectDir);
    const apiSteps = lockedData.apiSteps();

    // read package.json to get project name for default title & version
    if (!title || !version) {
        try {
            const packageJsonPath = path.join(projectDir, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            title = packageJson.name;
            version = packageJson.version;
        } catch (error) {
            console.warn(`Could not read package.json in ${projectDir} to determine project name. Using default.`);
        }
    }

    const openApi: OpenAPIV3.Document = {
        openapi: '3.0.0',
        info: {
            title: title ?? 'Motia Project API',
            version: version ?? '1.0.0',
        },
        paths: {},
        components: {
            schemas: {},
        },
    };

    for (const step of apiSteps) {
        const pathItem = openApi.paths[step.config.path] || {};
        const method = step.config.method.toLowerCase();

        const operation: OpenAPIV3.OperationObject = {
            summary: step.config.name,
            description: step.config.description,
            requestBody: undefined,
            responses: {},
        };

        if (step.config.queryParams) {
            operation.parameters = operation.parameters || [];

            for (const param of step.config.queryParams) {
                operation.parameters.push({
                    in: 'query',
                    name: param.name,
                    description: param.description,
                    required: false,
                    schema: {
                        type: 'string',
                    },
                });
            }
        }

        if (step.config.bodySchema) {
            const bodySchema = step.config.bodySchema as unknown as Record<string, unknown>;

            delete bodySchema.$schema;

            const processedSchema = processSchema(bodySchema, openApi);

            operation.requestBody = {
                content: {
                    'application/json': {
                        schema: processedSchema,
                    },
                },
            };
        }

        if (step.config.responseSchema) {
            for (const [statusCode, responseSchema] of Object.entries(step.config.responseSchema)) {
                const resSchema = responseSchema as unknown as Record<string, unknown>;

                delete resSchema.$schema;

                const processedSchema = processSchema(resSchema, openApi);

                operation.responses[statusCode] = {
                    description: `Response for status code ${statusCode}`,
                    content: {
                        'application/json': {
                            schema: processedSchema,
                        },
                    },
                };
            }
        }

        if (isHttpMethod(method)) {
            pathItem[method] = operation;
        }

        openApi.paths[step.config.path] = pathItem;
    }

    const openApiJson = JSON.stringify(openApi, null, 2);
    fs.writeFileSync(path.join(projectDir, outputFile), openApiJson);

    console.log(`✅ OpenAPI specification generated successfully at ${outputFile}`);
}