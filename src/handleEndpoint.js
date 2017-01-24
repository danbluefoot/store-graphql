import axios from 'axios'
import parse from 'co-body'
import {prop, map} from 'ramda'

const defaultMerge = (bodyData, resData) => resData
const removeDomain = (cookie) => cookie.replace(/domain=.+?(;|$)/, '')

export default ({method = 'GET', url, data, headers = {}, enableCookies, merge = defaultMerge}) => {
  return {
    post: async (req, res, ctx) => {
      const body = await parse.json(req)

      const builtUrl = (typeof url === 'function') ? url(ctx.account, body.data, body.root) : url
      const builtData = (typeof data === 'function') ? data(body.data) : data
      const builtHeaders = (typeof headers === 'function') ? headers() : headers

      const config = { method, url: builtUrl, data: builtData, headers: builtHeaders }
      if (enableCookies && body.cookie) {
        config.headers.cookie = body.cookie
      }

      const vtexResponse = await axios.request(config)
      let cookie
      if (enableCookies) {
        const setCookie = prop('set-cookie', vtexResponse.headers)
        if (setCookie) {
          cookie = map(removeDomain, setCookie)
        }
      }

      res.set('Content-Type', 'application/json')
      res.status = 200
      res.body = {cookie, data: merge(body.data, vtexResponse.data)}
    }
  }
}
