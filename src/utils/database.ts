import sqlite3, { Database } from 'sqlite3'

export function runSqliteQuery<T = any>(db: Database, query: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        db.get<T>(query, (err, row) => {
            if (err) {
                reject(err)
                return
            }
            resolve(row)
        })
    })
}

export function runSqliteCommand(db: Database, command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(command, (err) => {
            if (err) {
                reject(err)
                return
            }
            resolve()
        })
    })
}
