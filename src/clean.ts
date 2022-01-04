import {OpenAPIV3} from 'openapi-types'
import {isPseudoBool, distinguishId} from './util'
import {camelCase} from 'lodash'
import Document = OpenAPIV3.Document
import SchemaObject = OpenAPIV3.SchemaObject
import HttpMethods = OpenAPIV3.HttpMethods
import OperationObject = OpenAPIV3.OperationObject
import RequestBodyObject = OpenAPIV3.RequestBodyObject
import ParameterObject = OpenAPIV3.ParameterObject

export function clean(doc: Document): Document {
    const operationIdMap: {[operationId: string]: number} = {}
    for (const path of Object.keys(doc.paths)) {
        const pathsItemObject = doc.paths[path]
        for (const method of Object.keys(pathsItemObject as {})) {
            if (!Object.values<string>(HttpMethods).includes(method)) {
                continue
            }
            const operationObject: OperationObject | undefined = pathsItemObject?.[method as HttpMethods]

            if (!operationObject) {
                continue
            }

            if (operationObject.operationId) {
                const newId = camelCase(operationObject.operationId)
                operationObject.operationId = distinguishId(operationIdMap, newId)
            }

            const requestBody = operationObject.requestBody as RequestBodyObject | undefined
            if (requestBody?.content) {
                const mediaKeys = Object.keys(requestBody.content)
                for (const media of mediaKeys) {
                    const mediaObjectSchema = requestBody.content?.[media]?.schema as {[x: string]: any}
                    for (const prop of ['query', 'params']) {
                        const requestBodyQueryParams = Object.keys(mediaObjectSchema[prop]?.properties || {})
                        if (!requestBodyQueryParams.length) {
                            continue
                        }
                        if (!operationObject.parameters) {
                            operationObject.parameters = []
                        }
                        if (mediaObjectSchema?.[prop]) {
                            const inProp = prop === 'query' ? 'query' : 'path'
                            for (const bodyParam of requestBodyQueryParams) {
                                const pIndex = (operationObject.parameters as ParameterObject[]).findIndex(
                                    p => p.in === inProp && p.name === bodyParam
                                )
                                const bodyParamSchema = mediaObjectSchema[prop]?.properties?.[bodyParam]
                                if (!bodyParamSchema) continue
                                if (pIndex === -1) {
                                    // Create the parameter if it doesn't exist.
                                    const p: ParameterObject = {in: inProp, name: bodyParam, schema: bodyParamSchema}
                                    if (inProp === 'path') {
                                        p.required = true
                                    }
                                    operationObject.parameters.push(p)
                                } else {
                                    // Merge the requestBody param with the existing parameter.
                                    ;(operationObject.parameters[pIndex] as ParameterObject).schema = {
                                        ...bodyParamSchema,
                                        ...(operationObject.parameters[pIndex] as ParameterObject).schema
                                    }
                                }
                            }
                        }
                    }
                    delete (requestBody.content[media]?.schema as any)?.query
                    delete (requestBody.content[media]?.schema as any)?.params

                    if (mediaObjectSchema?.body) {
                        requestBody.content[media].schema = mediaObjectSchema.body
                    }

                    if ((requestBody.content[media]?.schema as SchemaObject)?.required?.length === 0) {
                        delete (requestBody.content[media].schema as SchemaObject).required
                    }
                }
            }

            if (operationObject.parameters) {
                for (const parameter of operationObject.parameters) {
                    if (isPseudoBool(parameter)) {
                        if ('schema' in parameter && parameter.schema) {
                            ;(parameter.schema as SchemaObject).type = 'boolean'
                            parameter.example = true
                            delete (parameter.schema as SchemaObject).enum
                        }
                    }
                }
            }
        }
    }
    return doc
}
