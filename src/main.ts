import * as core from '@actions/core'
import {promises as fs} from 'fs'
import yaml from 'js-yaml'
import {clean} from './clean'
import Document = OpenAPIV3.Document
import {OpenAPIV3} from 'openapi-types'

async function run(): Promise<void> {
    try {
        const filePath: string = core.getInput('file')
        const file = await fs.readFile(filePath, 'utf8')

        let doc: Document | undefined
        const ext = filePath.split('.').pop()
        if (ext === 'json') {
            try {
                doc = JSON.parse(file)
            } catch (e) {
                return core.setFailed(`Unable to parse spec file with error: ${e}`)
            }
        } else {
            try {
                doc = yaml.load(file) as Document
            } catch (e) {
                return core.setFailed(`Unable to parse spec file with error: ${e}`)
            }
        }

        if (!doc) {
            return core.setFailed('Unable to parse spec file.')
        }

        const cleanDoc = clean(doc)

        if (ext !== 'json') {
            await fs.writeFile(filePath, yaml.dump(cleanDoc, {lineWidth: -1, noRefs: true}))
        } else {
            await fs.writeFile(filePath, JSON.stringify(cleanDoc, null, 4))
        }
    } catch (error) {
        if (error instanceof Error) return core.setFailed(error.message)
        if (error instanceof String) return core.setFailed(error as string)
        core.setFailed(`Unable to perform cleanup due to unknown error: ${error}`)
    }
}

run()
