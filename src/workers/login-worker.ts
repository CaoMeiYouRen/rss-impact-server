import { workerData, parentPort } from 'worker_threads'
import { compare } from 'bcrypt'

async function verifyPassword() {
    const { password, hash } = workerData as { password: string, hash: string }
    const isMatch = await compare(password, hash)
    return isMatch
}

verifyPassword().then((isMatch) => {
    parentPort.postMessage(isMatch)
}).catch((err) => {
    console.error('Error in worker:', err)
    parentPort.postMessage(false)
})
