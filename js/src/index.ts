
type QueryHeaders = {
  'Content-Type': string,
  Authorization?: string,
}
type FetchParams = {
  method: string,
  headers: QueryHeaders,
  body?: string,
}

export type DiamondOptions = Partial<{
  projectId: string,
  appId: string,
  host: string,
  isLocal: boolean,
  accessToken: string,
}>

const DEFAULT_API_HOST = 'diam.io'
export class Diamond<SessionType = any> {
  appId: string
  projectId: string
  apiOrigin: string
  apiUrl: string

  private headers: QueryHeaders
  session?: SessionType

  constructor(options: DiamondOptions) {
    const {
      projectId, appId,
      isLocal = false,
      accessToken,
    } = options
    if (!projectId && !isLocal) {
      throw new Error('Diamond: Missing projectId')
    }
    if (!appId) {
      throw new Error('Diamond: Missing appId')
    }
    this.appId = appId
    this.projectId = projectId || 'localhost'
    const apiHost = options.host || (isLocal ? 'localhost' : DEFAULT_API_HOST)
    this.apiOrigin = isLocal ? `http://${apiHost}` : `https://${projectId}.${apiHost}`
    this.apiUrl = `${this.apiOrigin}/api/${appId}`
    this.headers = {
      'Content-Type': 'application/json',
    }
    if (accessToken) {
      this.setToken(accessToken)
    }
  }
  setToken(token: string | undefined) {
    if (token) {
      this.headers.Authorization = `Bearer ${token}`
    } else {
      delete this.headers.Authorization
    }
  }
  // trigger things:
  // - volatile, ordered, "atomic"/ack required
  async query(endpoint: string, method: string = 'POST', body = {}, otherOpts: object = {}) {
    const { headers, apiUrl } = this
    try {
      const fetchParams: FetchParams = { ...otherOpts, method, headers }
      const isGet: boolean = (method.toLowerCase() === 'get')
      if (!isGet) {
        fetchParams.body = JSON.stringify(body)
      }
      const url = `${apiUrl}${endpoint}${isGet ? `?${new URLSearchParams(body)}` : ''}`
      // console.log(fetchParams, isGet, url, fetchParams)
      const response = await fetch(url, fetchParams)
      return response.json()
    } catch (cause) {
      throw new Error(`diam q: ${body} err: ${cause}`)
    }
  }
}
