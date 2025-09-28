
import { LockedData } from '@motiadev/core';
import * as fs from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import * as path from 'path';
import { generateLockedData } from './generate-locked-data';

export async function generateOpenApi(projectDir: string, title?: string, version?: string, outputFile: string = 'openapi.json') {
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
      const bodySchema = { ...step.config.bodySchema } as any;

      delete bodySchema.$schema;

      processSchema(bodySchema, openApi);

      operation.requestBody = {
        content: {
          'application/json': {
            schema: bodySchema,
          },
        },
      };
    }

    if (step.config.responseSchema) {
      for (const [statusCode, responseSchema] of Object.entries(step.config.responseSchema)) {
        const resSchema = { ...responseSchema } as any;

        delete resSchema.$schema;

        processSchema(resSchema, openApi);

        operation.responses[statusCode] = {
          description: `Response for status code ${statusCode}`,
          content: {
            'application/json': {
              schema: resSchema,
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


function isHttpMethod(method: string): method is OpenAPIV3.HttpMethods {
  return Object.values(OpenAPIV3.HttpMethods).includes(method as OpenAPIV3.HttpMethods);
}

function processSchema(schema: any, openApi: OpenAPIV3.Document) {
  if (!schema || typeof schema !== 'object') {
    return;
  }

  if (schema.$defs) {
    if (!openApi.components) {
      openApi.components = {};
    }

    if (!openApi.components.schemas) {
      openApi.components.schemas = {};
    }

    // copy all definitions to components/schemas for compatibility
    for (const defName in schema.$defs) {
      if (schema.$defs.hasOwnProperty(defName)) {
        (openApi.components.schemas as any)[defName] = schema.$defs[defName];
      }
    }

    delete schema.$defs;
  }

  if (Array.isArray(schema.anyOf)) {
    const nullIndex = schema.anyOf.findIndex((item: any) => item && item.type === 'null');

    if (nullIndex !== -1) {
      schema.anyOf.splice(nullIndex, 1);

      schema.nullable = true;

      if (schema.anyOf.length === 1) {
        // if only one schema remains, lift it up
        const remainingSchema = schema.anyOf[0];

        for (const key in remainingSchema) {
          if (remainingSchema.hasOwnProperty(key)) {
            schema[key] = remainingSchema[key];
          }
        }

        delete schema.anyOf;
      }
    }
  }

  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      if (key === '$ref' && typeof schema[key] === 'string' && schema[key].startsWith('#/$defs/')) {
        // convert $ref to OpenAPI components/schemas format
        schema[key] = schema[key].replace('#/$defs/', '#/components/schemas/');

      } else if (typeof schema[key] === 'object') {
        processSchema(schema[key], openApi);
      }
    }
  }
}