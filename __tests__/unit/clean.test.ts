import {clean} from '../../src/clean'
import * as defaultAPIDoc from '../defaultAPIDoc.json'
import {cloneDeep, set} from 'lodash'
import {OpenAPIV3} from 'openapi-types'
import Document = OpenAPIV3.Document
describe('clean', () => {
    it('should run', () => {
        expect(clean(defaultAPIDoc)).toEqual(defaultAPIDoc)
    })

    it('should convert boolean enums to booleans', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const param = {
            name: 'queryParam',
            in: 'query',
            description: '',
            required: true,
            example: 'true',
            schema: {
                type: 'string',
                enum: ['true', 'false']
            }
        }
        set(doc, 'paths./resource.get.parameters[0]', param)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.parameters[0]', {
            ...param,
            example: true,
            schema: {
                type: 'boolean'
            }
        })
        expect(clean(doc)).toEqual(expected)
    })

    it('should convert boolean enums after merging params', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            query: {
                title: 'GET /resource query',
                type: 'object',
                properties: {isTest: {type: 'string', enum: ['true', 'false']}}
            }
        }
        const parameters = [
            {
                name: 'isTest',
                in: 'query',
                description: 'desc',
                example: '1',
                schema: {type: 'string', enum: ['true', 'false']}
            }
        ]

        set(doc, 'paths./resource.get.requestBody.content.application/json.schema', schema)
        set(doc, 'paths./resource.get.parameters', parameters)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.requestBody.content.application/json.schema', {})
        set(expected, 'paths./resource.get.parameters', [{...parameters[0], example: true, schema: {type: 'boolean'}}])
        expect(clean(doc)).toEqual(expected)
    })

    it('should convert boolean enums regardless of original type', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            query: {
                title: 'GET /resource query',
                type: 'object',
                properties: {isTest: {type: 'string', enum: ['true', 'false']}}
            }
        }
        const parameters = [
            {
                name: 'isTest',
                in: 'query',
                description: 'desc',
                example: '1',
                schema: {type: 'boolean'}
            }
        ]

        set(doc, 'paths./resource.get.requestBody.content.application/json.schema', schema)
        set(doc, 'paths./resource.get.parameters', parameters)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.requestBody.content.application/json.schema', {})
        set(expected, 'paths./resource.get.parameters', [{...parameters[0], example: true, schema: {type: 'boolean'}}])
        expect(clean(doc)).toEqual(expected)
    })

    it('should move requestBody schema bodies up one level', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            body: {
                title: 'Post /resource',
                properties: {
                    resourceId: {
                        type: 'string',
                        minLength: 1
                    }
                }
            }
        }

        set(doc, 'paths./resource.post.requestBody.content.application/json.schema', schema)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.post.requestBody.content.application/json.schema', schema.body)
        expect(clean(doc)).toEqual(expected)
    })

    it('should delete empty requireds from requestBody schemas', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            title: 'Post /resource',
            properties: {
                resourceId: {
                    type: 'string',
                    minLength: 1
                }
            },
            required: []
        }

        set(doc, 'paths./resource.post.requestBody.content.application/json.schema', schema)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.post.requestBody.content.application/json.schema', {
            title: schema.title,
            properties: schema.properties
        })
        expect(clean(doc)).toEqual(expected)
    })

    it('should merge requestBody params and query fields into the parameters property', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            query: {
                title: 'GET /resource query',
                type: 'object',
                properties: {
                    limit: {
                        type: 'string',
                        minLength: 1
                    }
                }
            },
            params: {
                title: 'GET /resource params',
                type: 'object',
                properties: {
                    resourceId: {
                        type: 'string',
                        minLength: 1
                    }
                },
                required: ['resourceId']
            }
        }
        const parameters = [
            {
                name: 'limit',
                in: 'query',
                description: 'desc',
                example: '1',
                schema: {
                    type: 'string'
                }
            },
            {
                name: 'resourceId',
                in: 'path',
                description: 'desc',
                required: true,
                example: '123',
                schema: {
                    type: 'string'
                }
            }
        ]

        set(doc, 'paths./resource.get.requestBody.content.application/json.schema', schema)
        set(doc, 'paths./resource.get.parameters', parameters)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.requestBody.content.application/json.schema', {})
        set(expected, 'paths./resource.get.parameters', [
            {...parameters[0], schema: schema.query.properties.limit},
            {...parameters[1], schema: schema.params.properties.resourceId}
        ])
        expect(clean(doc)).toEqual(expected)
    })

    it('should create parameters for requestBody params and query fields', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            query: {
                title: 'GET /resource query',
                type: 'object',
                properties: {limit: {type: 'string'}}
            },
            params: {
                title: 'GET /resource params',
                type: 'object',
                properties: {resourceId: {type: 'string'}}
            }
        }
        const parameters = [
            {
                name: 'limit',
                in: 'query',
                schema: {type: 'string'}
            },
            {
                name: 'resourceId',
                in: 'path',
                required: true,
                schema: {type: 'string'}
            }
        ]

        set(doc, 'paths./resource.get.requestBody.content.application/json.schema', schema)
        set(doc, 'paths./resource.get.parameters', [])

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.requestBody.content.application/json.schema', {})
        set(expected, 'paths./resource.get.parameters', parameters)
        expect(clean(doc)).toEqual(expected)
    })

    it('should delete query or params in requestBody regardless of their contents', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            query: {},
            params: {}
        }

        set(doc, 'paths./resource.get.requestBody.content.application/json.schema', schema)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.requestBody.content.application/json.schema', {})
        expect(clean(doc)).toEqual(expected)
    })
    it('should create operation parameters array if it does not exist and requestBody params exist', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            query: {
                title: 'GET /resource query',
                type: 'object',
                properties: {limit: {type: 'string'}}
            }
        }
        const parameters = [
            {
                name: 'limit',
                in: 'query',
                schema: {type: 'string'}
            }
        ]

        set(doc, 'paths./resource.get.requestBody.content.application/json.schema', schema)
        set(doc, 'paths./resource.get.parameters', undefined)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.requestBody.content.application/json.schema', {})
        set(expected, 'paths./resource.get.parameters', parameters)
        expect(clean(doc)).toEqual(expected)
    })

    it('should prefer original property values when merging parameters', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        const schema = {
            query: {
                title: 'GET /resource query',
                type: 'object',
                properties: {
                    limit: {
                        type: 'string',
                        default: '1',
                        minLength: 1
                    }
                }
            }
        }
        const parameters = [
            {
                name: 'limit',
                in: 'query',
                description: 'desc',
                example: '1',
                schema: {
                    type: 'number',
                    default: 1
                }
            }
        ]

        set(doc, 'paths./resource.get.requestBody.content.application/json.schema', schema)
        set(doc, 'paths./resource.get.parameters', parameters)

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.requestBody.content.application/json.schema', {})
        set(expected, 'paths./resource.get.parameters', [
            {...parameters[0], schema: {type: 'number', default: 1, minLength: 1}}
        ])
        expect(clean(doc)).toEqual(expected)
    })

    it('should camelCase operationIds', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        set(doc, 'paths./resource.get.operationId', 'Operation Id')

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.operationId', 'operationId')

        expect(clean(doc)).toEqual(expected)
    })

    it('should make operation ids unique', () => {
        const doc = cloneDeep(defaultAPIDoc as Document)
        set(doc, 'paths./resource.get.operationId', 'myOperation')
        set(doc, 'paths./resource.post.operationId', 'myOperation')

        const expected = cloneDeep(defaultAPIDoc as Document)
        set(expected, 'paths./resource.get.operationId', 'myOperation')
        set(expected, 'paths./resource.post.operationId', 'myOperation2')

        expect(clean(doc)).toEqual(expected)
    })
})
