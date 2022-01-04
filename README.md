# API Document Cleanup Action
The purpose of this action is to perform a cleanup of an Open API Document so that it will properly generate a Typescript client.

## Functionality
**Converts boolean enums to booleans in operation parameters.**

Converts parameters that have  `enum: ['false', 'true']` (or reverse) to `type: boolean` and removes the enum property.

**Moves request body schemas that are under a body property up one level to the schema property.**

Changes `{ schema: { body: { title } } }` to `{ schema: { title } }`

**When the required property is empty, it is removed.**

Removes instances of `{ required: [] }` in request body schemas. 

**The schemas listed in path and query params (under the properties params and query) are merged into schemas of the same name in the parameters property.**

Here, properties `params and query` from `paths[path][method].requestBody.content[media].schema` are merged into the `paths[path][method].parameters` property, preferring the properties that already exist in the `parameters` property. These parameter values are preferred because they are more likely to be a better a representation of the types expected from an API client. 

Example input
```js
// params object in paths[path][method].requestBody.content[media].schema
{ 
    params: {
        properties: {
            resourceId: { type: 'string', minLength: 1 }
        }
    }
}
// paths[path][method].parameters
[{
    name: 'resourceId',
    in: 'path',
    schema: {
        type: 'number'
    }
}]
```
Example result 
```js
// paths[path][method].parameters
[{
    name: 'resourceId',
    in: 'path',
    schema: {
        type: 'number',
        minLength: 1
    }
}]
```

**Path and query params (under the properties params and query) are deleted out of requestBody properties**

After the `params` and `query` properties in `paths[path][method].requestBody.content[media].schema` are merged into ```paths[path][method].parameters``` they are deleted from the requestBody.

**Creates parameters if they are missing**

If parameters exist in `params` or `query` properties in `paths[path][method].requestBody.content[media].schema`, but do not exist in `paths[path][method].parameters`, they are created in `paths[path][method].parameters`.


**Operation ids are converted to camelCase.**

To create operationIds that can easily be used as function names, they are converted to camelCase. For example `My Operation - Name` becomes `myOperationName`.

**Operation ids are made unique.**

This is accomplished by appending a number to duplicate ids.

**Removes any YAML anchors in YAML files**

Some libraries generate YAML anchors automatically for any duplicate objects. These are removed to allow for proper API generation.

**Converts multi-line descriptions into single lines for YAML files**

This is accomplished by removing the default line limit in `js-yaml`. If necessary, this can be made configurable at a later date.

## Example Usage
```yaml
# .github/workflows/cleanup-action.yml
name: My Cleanup Action

env: 
  FILE_PATH: lib/openapi.yaml

jobs:
  validate_openapi_301:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Check if OpenAPI Schema Exists
        id: check_openapi_file
        uses: andstor/file-existence-action@v1
        with:
          files: "${{ env.FILE_PATH }}"
      
      - name: Clean Up OpenAPI Doc
        uses: aparrett-hbo/api-spec-cleanup-action@v1
        with:
          file: ${{ env.FILE_PATH }} 

      - name: Commit newly generated schema
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'github actions: openapi schema modified'
          file_pattern: ${{ env.FILE_PATH }}
```

## Dev
Note: this process may change if breaking changes are introduced or semantic versioning becomes necessary. **Currently, all changes are pushed to v1.**
1. Make changes to `main`
2. Run `npm run package`
3. Commit
4. Run `npm run release`
5. Push

## Test
```
npm run test
```