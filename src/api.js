class API {
  constructor(config) {
    this.clientHost = config.host
    this.clientEndpoint = config.endpoint
    this.isLoggedIn = config.isLoggedIn
    this.session = config.session
    this.userListeners = {}
  }

  url(actionId) {
    const endpoint = this.endpoint(actionId)
    return `${this.clientHost}${endpoint}`
  }

  endpoint(actionId) {
    return this.clientEndpoint.replace(/\[action\]/gi, actionId)
  }

  listenUserChange(id, onChange) {
    this.userListeners[id] = onChange
  }

  unlistenUserChange(id) {
    this.userListeners[id] = undefined
  }

  triggerUserChange(data) {
    for (const id in this.userListeners) {
      if (this.userListeners[id]) {
        this.userListeners[id](data)
      }
    }
  }

  checkFor401(res) {
    if (res.statusCode >= 400 && res.statusCode <= 499) {
      this.isLoggedIn = false
      this.session = null
      this.triggerUserChange(null)
    }
  }

  async getQuery(query) {
    const res = await fetch(this.url('graphql'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    this.checkFor401(res)
    const result = await res.json()
    if (result.error) {
      throw result.error
    }
    return result
  }
}

export default API
