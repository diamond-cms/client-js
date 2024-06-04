
type QueryHeaders = {
  'Content-Type': string,
  Authorization?: string,
}
type FetchParams = {
  method: string,
  headers: QueryHeaders,
  body?: string,
}

export type DiamondOptions = {
  teamId: string,
  projectId: string,
  appId: string,
  host?: string,
  isLocal?: boolean,
}

const DEFAULT_API_HOST = 'diam.io'
const PUBLIC_HEADERS = {
  'Content-Type': 'application/json',
}

export class Diamond {
  options: DiamondOptions
  apiOrigin: string
  apiUrl: string

  private headers: QueryHeaders
  private basePath: string[]

  constructor(options: DiamondOptions, headers: QueryHeaders = PUBLIC_HEADERS, basePath: string[] = []) {
    const {
      teamId, projectId, appId,
      isLocal = false, host,
    } = options
    if (!teamId) {
      throw new Error('Diamond: Missing teamId')
    }
    if (!projectId) {
      throw new Error('Diamond: Missing projectId')
    }
    if (!appId) {
      throw new Error('Diamond: Missing appId')
    }
    this.options = options
    const apiHost = host || (isLocal ? 'localhost' : DEFAULT_API_HOST)
    this.apiOrigin = isLocal ? `http://${apiHost}/${teamId}` : `https://${teamId}.${apiHost}`
    this.apiUrl = `${this.apiOrigin}/${projectId}/${appId}/`
    this.headers = headers
    this.basePath = basePath
  }
  session(token: string): Diamond {
    return new Diamond(this.options, {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }, this.basePath)
  }
  as(path: string[]): Diamond {
    return new Diamond(this.options, this.headers, [...this.basePath, ...path])
  }
  // trigger things:
  // - volatile, ordered, "atomic"/ack required
  async query(method: string, path: string[], body = {}, otherOpts: object = {}) {
    const { headers, apiUrl, basePath } = this
    const fullPath = [...basePath, ...path]
    try {
      const fetchParams: FetchParams = { ...otherOpts, method, headers }
      const isGet: boolean = (method.toLowerCase() === 'get')
      if (!isGet) {
        fetchParams.body = JSON.stringify(body)
      }
      const url = `${apiUrl}${fullPath.join('/')}${isGet ? `?${new URLSearchParams(body)}` : ''}`
      // console.log(fetchParams, isGet, url, fetchParams)
      const response = await fetch(url, fetchParams)
      return response.json()
    } catch (cause) {
      throw new Error(`diam q: ${JSON.stringify(body)} err: ${cause} ${apiUrl} ${method} ${fullPath.join('/')}`)
    }
  }
}
