import {isEqual} from 'lodash'
import {OpenAPIV3} from 'openapi-types'
import ParameterObject = OpenAPIV3.ParameterObject
import ReferenceObject = OpenAPIV3.ReferenceObject
import SchemaObject = OpenAPIV3.SchemaObject

export function isPseudoBool(param: ParameterObject | ReferenceObject): boolean {
    if ('schema' in param) {
        const schema = param.schema as SchemaObject
        return isEqual(schema?.enum?.sort(), ['false', 'true'])
    }
    return false
}

export function distinguishId(map: {[x: string]: number}, id: string): string {
    if (map[id]) {
        map[id]++
        return `${id}${map[id]}`
    } else {
        // If this is the first instance of an id, there is no reason to append a number.
        map[id] = 1
        return id
    }
}
