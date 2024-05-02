declare module 'opml' {
    interface Head {
        title: string
        /**
         * 创建时间
         */
        dateCreated?: string
        /**
         * 创建者
         */
        generator?: string
    }
    interface Sub {
        text: string
        title?: string
        type: string // 默认 rss
        xmlUrl: string // 如果在第一层，且没有 xmlUrl，则为分类
        htmlUrl?: string
        description?: string
    }
    interface Sub2 {
        text: string
        subs: Sub[]
        xmlUrl?: string
    }
    interface Body {
        subs: Sub2[]
    }
    interface Opml {
        version: string
        head: Head
        body: Body
    }
    interface OpmlRootObject {
        opml: Opml
    }

    declare function parse(input: string, cb: (err: Error | undefined, output: OpmlRootObject) => void): void

    declare function stringify(output: OpmlRootObject): string

    declare function htmlify(output: OpmlRootObject): string
    declare function visitAll(output: OpmlRootObject)
}
