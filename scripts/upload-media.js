import { execSync } from "child_process"
import fs from "fs"

const TRACKS_DIRECTORY = './songwriting-data/tracks'

const tracks = fs.readdirSync(TRACKS_DIRECTORY)

for (const id of tracks) {
  const files = fs.readdirSync(`${TRACKS_DIRECTORY}/${id}`)
  for (const file of files) {
    execSync(
      `wrangler r2 object put songwriting-media/tracks/${id}/audio/${file} --file ${TRACKS_DIRECTORY}/${id}/${file} --remote`
    )
  }
}
